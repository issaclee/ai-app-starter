import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { checkRateLimit } from "@/lib/rate-limit";
import { OAUTH_ONLY_PASSWORD_HASH } from "@/lib/oauth-identity";

const credentialsSchema = z.object({
  email: z.string().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(256),
});

export async function authorizeCredentials(rawCredentials: unknown) {
  const parsed = credentialsSchema.safeParse(rawCredentials);
  if (!parsed.success) return null;
  const rate = checkRateLimit(`login:${parsed.data.email}`, 8, 60_000);
  if (!rate.allowed) return null;
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || user.status !== "ACTIVE" || user.passwordHash === OAUTH_ONLY_PASSWORD_HASH || !(await verifyPassword(parsed.data.password, user.passwordHash))) return null;
  return { id: user.id, email: user.email, name: user.name };
}
