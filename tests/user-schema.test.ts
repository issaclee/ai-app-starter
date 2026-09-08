import { describe, expect, it } from "vitest";
import { createUserSchema, updateProfileSchema, updateUserSchema } from "@/lib/user-schema";

describe("user management validation", () => {
  it("normalizes valid new users", () => {
    expect(createUserSchema.parse({
      name: "  Ada Lovelace  ",
      email: "  ADA@EXAMPLE.COM  ",
      role: "ADMIN",
      status: "ACTIVE",
      password: "password123",
    })).toEqual({
      name: "Ada Lovelace",
      email: "ada@example.com",
      role: "ADMIN",
      status: "ACTIVE",
      password: "password123",
    });
  });

  it("requires a strong-enough password when creating a user", () => {
    const result = createUserSchema.safeParse({ name: "A", email: "a@example.com", role: "USER", status: "ACTIVE", password: "short" });
    expect(result.success).toBe(false);
  });

  it("allows a blank password when editing a user", () => {
    expect(updateUserSchema.safeParse({ name: "A", email: "a@example.com", role: "USER", status: "DISABLED", password: "" }).success).toBe(true);
  });

  it("normalizes a self-service profile update", () => {
    expect(updateProfileSchema.parse({ name: "  Grace Hopper  ", email: "  GRACE@EXAMPLE.COM " })).toEqual({
      name: "Grace Hopper",
      email: "grace@example.com",
    });
  });
});
