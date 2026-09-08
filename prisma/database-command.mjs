import "./load-env.mjs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const action = process.argv[2];
const provider = process.env.DATABASE_PROVIDER?.trim().toLowerCase() || "sqlite";

if (!new Set(["sqlite", "postgresql"]).has(provider)) {
  console.error("DATABASE_PROVIDER must be either sqlite or postgresql.");
  process.exit(1);
}

if (action === "generate") {
  const prismaCli = path.join("node_modules", "prisma", "build", "index.js");
  for (const [schema, databaseUrl] of [
    ["prisma/schema.prisma", "file:./generation-placeholder.db"],
    ["prisma/postgresql/schema.prisma", "postgresql://generate:generate@127.0.0.1:5432/generate"],
  ]) {
    const result = spawnSync(
      process.execPath,
      [prismaCli, "generate", "--schema", schema],
      { stdio: "inherit", env: { ...process.env, DATABASE_URL: databaseUrl } },
    );
    if (result.status !== 0) process.exit(result.status ?? 1);
  }
  process.exit(0);
}

if (action === "migrate") {
  await import(provider === "postgresql" ? "./migrate-postgresql.mjs" : "./migrate-sqlite.mjs");
} else {
  console.error("Expected a database command: generate or migrate.");
  process.exit(1);
}
