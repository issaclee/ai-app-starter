import { PrismaClient as SQLiteClient } from "../../prisma/generated/sqlite-client";
import { PrismaClient as PostgreSQLClient } from "../../prisma/generated/postgresql-client";

type DatabaseClient = SQLiteClient;
const globalForPrisma = globalThis as unknown as { prisma?: DatabaseClient };
const provider = process.env.DATABASE_PROVIDER?.trim().toLowerCase() || "sqlite";

if (provider !== "sqlite" && provider !== "postgresql") {
  throw new Error("DATABASE_PROVIDER must be either sqlite or postgresql.");
}

const createClient = (): DatabaseClient => provider === "postgresql"
  ? new PostgreSQLClient() as unknown as DatabaseClient
  : new SQLiteClient();

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
