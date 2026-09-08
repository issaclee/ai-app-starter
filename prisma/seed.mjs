import { PrismaClient } from "./generated/sqlite-client/index.js";
import { hash } from "bcryptjs";

if ((process.env.DATABASE_PROVIDER || "sqlite").toLowerCase() !== "sqlite") {
  throw new Error("The development seed is SQLite-only. Use npm run db:bootstrap-admin for PostgreSQL.");
}

const prisma = new PrismaClient();
const email = "admin@mptwork.local";

try {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    await prisma.user.create({
      data: {
        email,
        name: "Administrator",
        passwordHash: await hash("admin", 12),
        role: "ADMIN",
        status: "ACTIVE",
      },
    });
    console.log("Created the development bootstrap administrator.");
  } else {
    await prisma.user.update({
      where: { email },
      data: { role: "ADMIN", status: "ACTIVE" },
    });
    console.log("Bootstrap administrator already exists; access restored and password unchanged.");
  }
} finally {
  await prisma.$disconnect();
}
