import "./load-env.mjs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const sqliteUrl = process.env.SQLITE_DATABASE_URL;
const postgresqlUrl = process.env.DATABASE_URL;
if (!sqliteUrl?.startsWith("file:")) {
  throw new Error("SQLITE_DATABASE_URL must be a file: URL.");
}
if (!postgresqlUrl?.startsWith("postgres")) {
  throw new Error("DATABASE_URL must be the target postgresql:// URL.");
}

const prismaCli = path.join("node_modules", "prisma", "build", "index.js");
for (const [schema, databaseUrl] of [
  ["prisma/schema.prisma", "file:./import-generation-placeholder.db"],
  ["prisma/postgresql/schema.prisma", postgresqlUrl],
]) {
  const result = spawnSync(process.execPath, [prismaCli, "generate", "--schema", schema], {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

await import("./import-sqlite-to-postgresql.mjs");
