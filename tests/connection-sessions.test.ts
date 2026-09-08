import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findUser: vi.fn(), findMany: vi.fn(), updateMany: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { user: { findUnique: mocks.findUser }, connectionSession: { findMany: mocks.findMany, updateMany: mocks.updateMany } } }));

import { listConnectionSessions, terminateConnectionSession } from "@/lib/connection-sessions";

describe("connection session management", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists active sessions with safe client metadata and marks the current session", async () => {
    mocks.findUser.mockResolvedValue({ id: "u1" });
    mocks.findMany.mockResolvedValue([{ id: "s1", provider: "google", userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36", ipAddress: "203.0.113.4", createdAt: new Date("2026-01-01"), lastActiveAt: new Date("2026-01-02"), expiresAt: new Date("2026-02-01") }]);
    const result = await listConnectionSessions("u1", "s1");
    expect(result).toEqual([expect.objectContaining({ id: "s1", provider: "google", client: "Chrome on macOS", ipAddress: "203.0.113.4", isCurrent: true })]);
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ userId: "u1", revokedAt: null }) }));
  });

  it("protects the current session", async () => {
    await expect(terminateConnectionSession("u1", "s1", "s1")).resolves.toEqual(expect.objectContaining({ status: 409 }));
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it("revokes another active session belonging to the selected user", async () => {
    mocks.updateMany.mockResolvedValue({ count: 1 });
    await expect(terminateConnectionSession("u1", "s2", "s1")).resolves.toEqual({ id: "s2" });
    expect(mocks.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: "s2", userId: "u1", revokedAt: null }) }));
  });
});
