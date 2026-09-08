import "./load-env.mjs";
import { PrismaClient as PostgreSQLClient } from "./generated/postgresql-client/index.js";
import { PrismaClient as SQLiteClient } from "./generated/sqlite-client/index.js";

const sqliteUrl = process.env.SQLITE_DATABASE_URL;
const postgresqlUrl = process.env.DATABASE_URL;
if (!sqliteUrl?.startsWith("file:") || !postgresqlUrl?.startsWith("postgres")) {
  throw new Error("Set SQLITE_DATABASE_URL to a file: URL and DATABASE_URL to a postgresql:// URL.");
}

const source = new SQLiteClient({ datasources: { db: { url: sqliteUrl } } });
const target = new PostgreSQLClient({ datasources: { db: { url: postgresqlUrl } } });

try {
  const targetCounts = await Promise.all([
    target.user.count(),
    target.externalIdentity.count(),
    target.connectionSession.count(),
    target.chat.count(),
    target.chatMessage.count(),
  ]);
  if (targetCounts.some((count) => count !== 0)) {
    throw new Error("The PostgreSQL target contains application data; import was refused.");
  }

  const [users, identities, sessions, chats, messages] = await Promise.all([
    source.user.findMany(),
    source.externalIdentity.findMany(),
    source.connectionSession.findMany(),
    source.chat.findMany(),
    source.chatMessage.findMany(),
  ]);

  await target.$transaction(async (transaction) => {
    if (users.length) await transaction.user.createMany({ data: users });
    if (identities.length) await transaction.externalIdentity.createMany({ data: identities });
    if (sessions.length) await transaction.connectionSession.createMany({ data: sessions });
    if (chats.length) await transaction.chat.createMany({ data: chats });
    if (messages.length) await transaction.chatMessage.createMany({ data: messages });
  }, { maxWait: 10_000, timeout: 300_000 });

  console.log(`Imported ${users.length} users, ${identities.length} identities, ${sessions.length} sessions, ${chats.length} chats, and ${messages.length} messages.`);
} finally {
  await Promise.all([source.$disconnect(), target.$disconnect()]);
}
