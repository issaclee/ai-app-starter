import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

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
      },
    });
    console.log("Created the development bootstrap administrator.");
  } else {
    console.log("Bootstrap administrator already exists; password unchanged.");
  }
} finally {
  await prisma.$disconnect();
}
