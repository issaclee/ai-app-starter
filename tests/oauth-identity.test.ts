import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findIdentity: vi.fn(),
  findIdentityInTransaction: vi.fn(),
  findUser: vi.fn(),
  createUser: vi.fn(),
  createIdentity: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    externalIdentity: { findUnique: mocks.findIdentity },
    $transaction: mocks.transaction,
  },
}));

import { linkOAuthIdentity, OAUTH_ONLY_PASSWORD_HASH } from "@/lib/oauth-identity";

describe("OAuth identity persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (callback) => callback({
      externalIdentity: {
        findUnique: mocks.findIdentityInTransaction,
        create: mocks.createIdentity,
      },
      user: { findUnique: mocks.findUser, create: mocks.createUser },
    }));
  });

  it("creates and links a first-time OAuth user", async () => {
    mocks.findIdentity.mockResolvedValue(null);
    mocks.findIdentityInTransaction.mockResolvedValue(null);
    mocks.findUser.mockResolvedValue(null);
    mocks.createUser.mockResolvedValue({ id: "oauth-user", status: "ACTIVE" });
    mocks.createIdentity.mockResolvedValue({ id: "identity-1" });

    await expect(linkOAuthIdentity({
      provider: "google",
      providerAccountId: "google-account-1",
      email: " Person@Example.com ",
      name: "Person",
    })).resolves.toEqual({ allowed: true, userId: "oauth-user" });

    expect(mocks.createUser).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ email: "person@example.com", passwordHash: OAUTH_ONLY_PASSWORD_HASH, role: "USER", status: "ACTIVE" }),
    }));
    expect(mocks.createIdentity).toHaveBeenCalledWith({
      data: { userId: "oauth-user", provider: "google", providerAccountId: "google-account-1" },
    });
  });

  it("reuses a linked OAuth identity without creating another record", async () => {
    mocks.findIdentity.mockResolvedValue({ user: { id: "oauth-user", status: "ACTIVE" } });

    await expect(linkOAuthIdentity({
      provider: "microsoft",
      providerAccountId: "entra-account-1",
    })).resolves.toEqual({ allowed: true, userId: "oauth-user" });

    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("rejects a disabled OAuth user", async () => {
    mocks.findIdentity.mockResolvedValue({ user: { id: "oauth-user", status: "DISABLED" } });

    await expect(linkOAuthIdentity({
      provider: "google",
      providerAccountId: "google-account-1",
    })).resolves.toEqual({ allowed: false });
  });

  it("does not automatically link an unrecognized OAuth account to an existing email", async () => {
    mocks.findIdentity.mockResolvedValue(null);
    mocks.findIdentityInTransaction.mockResolvedValue(null);
    mocks.findUser.mockResolvedValue({ id: "local-user" });

    await expect(linkOAuthIdentity({
      provider: "google",
      providerAccountId: "unlinked-google-account",
      email: "local@example.com",
    })).resolves.toEqual({ allowed: false });

    expect(mocks.createUser).not.toHaveBeenCalled();
    expect(mocks.createIdentity).not.toHaveBeenCalled();
  });
});
