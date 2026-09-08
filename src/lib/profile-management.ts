import { Prisma } from "@prisma/client";
import { getActiveSession } from "@/lib/app-session";
import { prisma } from "@/lib/db";
import { updateProfileSchema } from "@/lib/user-schema";

export type UserProfile = {
  name: string;
  email: string;
};

export type ProfileApiError = {
  status: number;
  error: string;
  fieldErrors?: Record<string, string[]>;
};

export async function updateCurrentProfile(input: unknown): Promise<UserProfile | ProfileApiError> {
  const session = await getActiveSession();
  if (!session?.user?.localUserId) return { status: 401, error: "Unauthorized" };

  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: 400,
      error: "Check the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const current = await tx.user.findUnique({
        where: { id: session.user.localUserId },
        select: { id: true, email: true, status: true },
      });
      if (!current || current.status !== "ACTIVE") return { status: 401, error: "Unauthorized" } satisfies ProfileApiError;

      const updated = await tx.user.update({
        where: { id: current.id },
        data: parsed.data,
        select: { name: true, email: true },
      });
      if (updated.email !== current.email) {
        await tx.chat.updateMany({ where: { ownerEmail: current.email }, data: { ownerEmail: updated.email } });
      }
      return updated;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        status: 409,
        error: "A user with this email already exists.",
        fieldErrors: { email: ["Email is already in use."] },
      };
    }
    throw error;
  }
}
