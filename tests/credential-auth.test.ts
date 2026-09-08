import { hash } from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findUnique: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { user: { findUnique: mocks.findUnique } } }));

import { authorizeCredentials } from "@/lib/credential-auth";
import { OAUTH_ONLY_PASSWORD_HASH } from "@/lib/oauth-identity";

describe("credential account status", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects disabled users even when their password matches", async () => {
    mocks.findUnique.mockResolvedValue({ id: "u1", name: "User", email: "user@example.com", status: "DISABLED", passwordHash: await hash("password123", 4) });
    await expect(authorizeCredentials({ email: "user@example.com", password: "password123" })).resolves.toBeNull();
  });

  it("accepts active users and returns only session identity", async () => {
    mocks.findUnique.mockResolvedValue({ id: "u1", name: "User", email: "user@example.com", status: "ACTIVE", passwordHash: await hash("password123", 4) });
    await expect(authorizeCredentials({ email: "USER@EXAMPLE.COM", password: "password123" })).resolves.toEqual({ id: "u1", name: "User", email: "user@example.com" });
  });

  it("does not allow an OAuth-only identity to use credential login", async () => {
    mocks.findUnique.mockResolvedValue({ id: "u1", name: "OAuth User", email: "oauth@example.com", status: "ACTIVE", passwordHash: OAUTH_ONLY_PASSWORD_HASH });
    await expect(authorizeCredentials({ email: "oauth@example.com", password: "password123" })).resolves.toBeNull();
  });
});
