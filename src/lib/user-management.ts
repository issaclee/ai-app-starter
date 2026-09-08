import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getActiveSession } from "@/lib/app-session";
import { OAUTH_ONLY_PASSWORD_HASH } from "@/lib/oauth-identity";
import { createUserSchema, updateUserSchema } from "@/lib/user-schema";

export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  status: "ACTIVE" | "DISABLED";
  authProviders: string[];
  createdAt: string;
  updatedAt: string;
};

export type UserApiError = {
  status: number;
  error: string;
  fieldErrors?: Record<string, string[]>;
};

function toManagedUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  passwordHash: string;
  externalIdentities?: { provider: string }[];
  createdAt: Date;
  updatedAt: Date;
}): ManagedUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role === "ADMIN" ? "ADMIN" : "USER",
    status: user.status === "DISABLED" ? "DISABLED" : "ACTIVE",
    authProviders: [
      ...(user.passwordHash === OAUTH_ONLY_PASSWORD_HASH ? [] : ["credentials"]),
      ...(user.externalIdentities?.map(({ provider }) => provider) ?? []),
    ].filter((provider, index, providers) => providers.indexOf(provider) === index),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function requireAdmin(): Promise<{ userId: string; sessionId: string } | UserApiError> {
  const session = await getActiveSession();
  if (!session?.user) return { status: 401, error: "Unauthorized" };
  if (!session.user.localUserId) return { status: 403, error: "Administrator access is required." };

  const user = await prisma.user.findUnique({
    where: { id: session.user.localUserId },
    select: { id: true, role: true, status: true },
  });
  if (!user || user.status !== "ACTIVE") return { status: 401, error: "Unauthorized" };
  if (user.role !== "ADMIN") return { status: 403, error: "Administrator access is required." };
  return { userId: user.id, sessionId: session.sessionId! };
}

export async function getSettingsBootstrap(localUserId?: string) {
  const viewer = localUserId
    ? await prisma.user.findUnique({
        where: { id: localUserId },
        select: { id: true, role: true, status: true },
      })
    : null;
  const isAdmin = viewer?.role === "ADMIN" && viewer.status === "ACTIVE";
  const users = isAdmin
    ? await prisma.user.findMany({ include: { externalIdentities: { select: { provider: true } } }, orderBy: [{ name: "asc" }, { email: "asc" }] })
    : [];
  return { isAdmin, users: users.map(toManagedUser) };
}

export async function listManagedUsers() {
  const users = await prisma.user.findMany({ include: { externalIdentities: { select: { provider: true } } }, orderBy: [{ name: "asc" }, { email: "asc" }] });
  return users.map(toManagedUser);
}

export async function createManagedUser(input: unknown): Promise<ManagedUser | UserApiError> {
  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    return { status: 400, error: "Check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    const { password, ...data } = parsed.data;
    const user = await prisma.user.create({
      data: { ...data, passwordHash: await hash(password, 12) },
    });
    return toManagedUser(user);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { status: 409, error: "A user with this email already exists.", fieldErrors: { email: ["Email is already in use."] } };
    }
    throw error;
  }
}

export async function updateManagedUser(userId: string, input: unknown, actorUserId: string): Promise<ManagedUser | UserApiError> {
  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) {
    return { status: 400, error: "Check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const current = await tx.user.findUnique({ where: { id: userId } });
      if (!current) return { status: 404, error: "User not found." } satisfies UserApiError;

      if (userId === actorUserId && parsed.data.status === "DISABLED") {
        return { status: 409, error: "You cannot disable your own account." } satisfies UserApiError;
      }

      const removesActiveAdmin = current.role === "ADMIN" && current.status === "ACTIVE"
        && (parsed.data.role !== "ADMIN" || parsed.data.status !== "ACTIVE");
      if (removesActiveAdmin) {
        const activeAdmins = await tx.user.count({ where: { role: "ADMIN", status: "ACTIVE" } });
        if (activeAdmins <= 1) {
          return { status: 409, error: "The final active administrator cannot be disabled or changed to a user." } satisfies UserApiError;
        }
      }

      const { password, ...data } = parsed.data;
      const user = await tx.user.update({
        where: { id: userId },
        data: { ...data, ...(password ? { passwordHash: await hash(password, 12) } : {}) },
        include: { externalIdentities: { select: { provider: true } } },
      });
      if (user.status === "DISABLED") {
        await tx.connectionSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
      }
      return toManagedUser(user);
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { status: 409, error: "A user with this email already exists.", fieldErrors: { email: ["Email is already in use."] } };
    }
    throw error;
  }
}

export async function deleteManagedUser(userId: string, actorUserId: string): Promise<{ id: string } | UserApiError> {
  if (userId === actorUserId) {
    return { status: 409, error: "You cannot delete your own account." };
  }

  return prisma.$transaction(async (tx) => {
    const current = await tx.user.findUnique({ where: { id: userId } });
    if (!current) return { status: 404, error: "User not found." } satisfies UserApiError;

    if (current.role === "ADMIN" && current.status === "ACTIVE") {
      const activeAdmins = await tx.user.count({ where: { role: "ADMIN", status: "ACTIVE" } });
      if (activeAdmins <= 1) {
        return { status: 409, error: "The final active administrator cannot be deleted." } satisfies UserApiError;
      }
    }

    await tx.chat.deleteMany({ where: { ownerEmail: current.email } });
    await tx.user.delete({ where: { id: userId } });
    return { id: userId };
  });
}
