import { prisma } from "@/lib/db";
import { isPrismaErrorCode } from "@/lib/prisma-error";

export const OAUTH_ONLY_PASSWORD_HASH = "!oauth-only";

type OAuthIdentityInput = {
  provider: string;
  providerAccountId: string;
  email?: string | null;
  name?: string | null;
};

type OAuthIdentityResult = {
  allowed: boolean;
  userId?: string;
};

function resultFor(user?: { id: string; status: string } | null): OAuthIdentityResult {
  if (!user || user.status !== "ACTIVE") return { allowed: false };
  return { allowed: true, userId: user.id };
}

export async function linkOAuthIdentity(input: OAuthIdentityInput): Promise<OAuthIdentityResult> {
  const provider = input.provider.trim().toLowerCase();
  const providerAccountId = input.providerAccountId.trim();
  if (!provider || !providerAccountId) return { allowed: false };

  const identityKey = { provider, providerAccountId };
  const linked = await prisma.externalIdentity.findUnique({
    where: { provider_providerAccountId: identityKey },
    include: { user: { select: { id: true, status: true } } },
  });
  if (linked) return resultFor(linked.user);

  const email = input.email?.trim().toLowerCase();
  if (!email) return { allowed: false };
  const name = input.name?.trim() || email.split("@")[0] || "OAuth user";

  try {
    return await prisma.$transaction(async (tx) => {
      const existingIdentity = await tx.externalIdentity.findUnique({
        where: { provider_providerAccountId: identityKey },
        include: { user: { select: { id: true, status: true } } },
      });
      if (existingIdentity) return resultFor(existingIdentity.user);

      const existingEmail = await tx.user.findUnique({ where: { email }, select: { id: true } });
      if (existingEmail) return { allowed: false };

      const user = await tx.user.create({
        data: {
          email,
          name,
          passwordHash: OAUTH_ONLY_PASSWORD_HASH,
          role: "USER",
          status: "ACTIVE",
        },
        select: { id: true, status: true },
      });
      if (user.status !== "ACTIVE") return { allowed: false };

      await tx.externalIdentity.create({
        data: { userId: user.id, provider, providerAccountId },
      });
      return { allowed: true, userId: user.id };
    });
  } catch (error) {
    if (isPrismaErrorCode(error, "P2002")) {
      const racedIdentity = await prisma.externalIdentity.findUnique({
        where: { provider_providerAccountId: identityKey },
        include: { user: { select: { id: true, status: true } } },
      });
      return resultFor(racedIdentity?.user);
    }
    throw error;
  }
}
