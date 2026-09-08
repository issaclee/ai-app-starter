import "./load-env.mjs";
import { hash } from "bcryptjs";

const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim() || "Administrator";
const provider = process.env.DATABASE_PROVIDER?.trim().toLowerCase() || "sqlite";

if (provider !== "sqlite" && provider !== "postgresql") {
  throw new Error("DATABASE_PROVIDER must be either sqlite or postgresql.");
}

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error("BOOTSTRAP_ADMIN_EMAIL must be a valid email address.");
}
if (!password || password.length < 12 || password.length > 256) {
  throw new Error("BOOTSTRAP_ADMIN_PASSWORD must contain 12 to 256 characters.");
}
if (name.length > 100) {
  throw new Error("BOOTSTRAP_ADMIN_NAME must not exceed 100 characters.");
}

const { PrismaClient } = await import(
  provider === "postgresql"
    ? "./generated/postgresql-client/index.js"
    : "./generated/sqlite-client/index.js"
);
const prisma = new PrismaClient();
try {
  const passwordHash = await hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    create: { email, name, passwordHash, role: "ADMIN", status: "ACTIVE" },
    update: { name, passwordHash, role: "ADMIN", status: "ACTIVE" },
  });
  console.log(`Provisioned active administrator ${email}.`);
} finally {
  await prisma.$disconnect();
}
