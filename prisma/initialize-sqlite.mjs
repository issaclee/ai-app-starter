import "./load-env.mjs";

if ((process.env.DATABASE_PROVIDER || "").toLowerCase() !== "sqlite") {
  throw new Error("SQLite initialization requires DATABASE_PROVIDER=sqlite.");
}
if (!process.env.DATABASE_URL?.startsWith("file:")) {
  throw new Error("SQLite initialization requires a file: DATABASE_URL.");
}

await import("./migrate-sqlite.mjs");
await import("./seed.mjs");
