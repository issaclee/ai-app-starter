import "./load-env.mjs";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "./generated/postgresql-client/index.js";

const migrationsDirectory = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "postgresql",
  "migrations",
);
const retryCount = Number.parseInt(process.env.DATABASE_MIGRATION_RETRIES || "30", 10);
const retryDelayMs = Number.parseInt(process.env.DATABASE_MIGRATION_RETRY_DELAY_MS || "2000", 10);
const prisma = new PrismaClient();
let locked = false;

function wait(delay) {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

async function connectWithRetry() {
  let lastError;
  for (let attempt = 1; attempt <= Math.max(1, retryCount); attempt += 1) {
    try {
      await prisma.$connect();
      return;
    } catch (error) {
      lastError = error;
      if (attempt < retryCount) await wait(retryDelayMs);
    }
  }
  throw lastError;
}

try {
  if (!process.env.DATABASE_URL?.startsWith("postgres")) {
    throw new Error("PostgreSQL migrations require a postgresql:// DATABASE_URL.");
  }
  await connectWithRetry();
  while (!locked) {
    const result = await prisma.$queryRawUnsafe(
      "SELECT pg_try_advisory_lock(hashtext('agentic-erp-migrations')) AS locked",
    );
    locked = result[0]?.locked === true;
    if (!locked) await wait(1_000);
  }
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AppMigration" (
      "name" TEXT NOT NULL PRIMARY KEY,
      "checksum" TEXT NOT NULL,
      "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const entries = (await readdir(migrationsDirectory, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const name of entries) {
    const sql = await readFile(path.join(migrationsDirectory, name, "migration.sql"), "utf8");
    const checksum = createHash("sha256").update(sql).digest("hex");
    const applied = await prisma.$queryRawUnsafe(
      `SELECT "checksum" FROM "AppMigration" WHERE "name" = $1`,
      name,
    );
    if (applied.length > 0) {
      if (applied[0].checksum !== checksum) {
        throw new Error(`Applied migration ${name} has been modified.`);
      }
      continue;
    }

    const statements = sql
      .split(/^\s*-- statement-breakpoint\s*$/m)
      .map((statement) => statement.trim())
      .filter(Boolean);
    await prisma.$transaction(async (transaction) => {
      for (const statement of statements) {
        await transaction.$executeRawUnsafe(statement);
      }
      await transaction.$executeRawUnsafe(
        `INSERT INTO "AppMigration" ("name", "checksum") VALUES ($1, $2)`,
        name,
        checksum,
      );
    }, { maxWait: 10_000, timeout: 120_000 });
    console.log(`Applied PostgreSQL migration ${name}.`);
  }
  console.log("PostgreSQL migrations are current.");
} finally {
  if (locked) {
    await prisma.$queryRawUnsafe("SELECT pg_advisory_unlock(hashtext('agentic-erp-migrations')) AS unlocked").catch(() => {});
  }
  await prisma.$disconnect();
}
