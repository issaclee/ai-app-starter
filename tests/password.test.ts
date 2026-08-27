import { hash } from "bcryptjs";
import { describe, expect, it } from "vitest";
import { verifyPassword } from "@/lib/password";

describe("verifyPassword", () => {
  it("accepts the matching password and rejects another", async () => {
    const passwordHash = await hash("correct", 4);
    await expect(verifyPassword("correct", passwordHash)).resolves.toBe(true);
    await expect(verifyPassword("wrong", passwordHash)).resolves.toBe(false);
  });
});
