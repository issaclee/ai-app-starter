import { z } from "zod";

export const userRoleSchema = z.enum(["ADMIN", "USER"]);
export const userStatusSchema = z.enum(["ACTIVE", "DISABLED"]);

const name = z.string().trim().min(1, "Enter a name.").max(100, "Name must be 100 characters or fewer.");
const email = z.string().trim().toLowerCase().email("Enter a valid email address.").max(254, "Email must be 254 characters or fewer.");
const password = z.string().min(8, "Password must be at least 8 characters.").max(128, "Password must be 128 characters or fewer.");

export const createUserSchema = z.object({
  name,
  email,
  role: userRoleSchema,
  status: userStatusSchema,
  password,
});

export const updateUserSchema = z.object({
  name,
  email,
  role: userRoleSchema,
  status: userStatusSchema,
  password: z.union([z.literal(""), password]).optional(),
});

export const updateProfileSchema = z.object({ name, email });

export type UserRole = z.infer<typeof userRoleSchema>;
export type UserStatus = z.infer<typeof userStatusSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
