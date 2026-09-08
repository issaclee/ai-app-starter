import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), findUser: vi.fn(), findSession: vi.fn(), createSession: vi.fn(), updateSession: vi.fn(), headers: vi.fn() }));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("@/lib/db", () => ({ prisma: { user: { findUnique: mocks.findUser }, connectionSession: { findUnique: mocks.findSession, create: mocks.createSession, update: mocks.updateSession } } }));

import { getActiveSession } from "@/lib/app-session";

describe("active application sessions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("revokes an existing local session after the user is disabled", async () => {
    mocks.auth.mockResolvedValue({ user: { localUserId: "u1", name: "User", email: "user@example.com" }, sessionId: "s1" });
    mocks.findSession.mockResolvedValue({ id: "s1", userId: "u1", revokedAt: null, expiresAt: new Date(Date.now() + 10000), lastActiveAt: new Date(), user: { name: "User", email: "user@example.com", role: "USER", status: "DISABLED" } });
    await expect(getActiveSession()).resolves.toBeNull();
  });

  it("rejects legacy OAuth sessions without a persisted local identity", async () => {
    const session = { user: { name: "OAuth User", email: "oauth@example.com" } };
    mocks.auth.mockResolvedValue(session);
    await expect(getActiveSession()).resolves.toBeNull();
    expect(mocks.findSession).not.toHaveBeenCalled();
  });
});
