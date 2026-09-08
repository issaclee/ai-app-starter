import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getActiveSession: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
  updateChats: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/app-session", () => ({ getActiveSession: mocks.getActiveSession }));
vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: mocks.transaction,
  },
}));

import { PATCH } from "@/app/api/profile/route";

describe("profile route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (callback) => callback({
      user: { findUnique: mocks.findUnique, update: mocks.update },
      chat: { updateMany: mocks.updateChats },
    }));
  });

  it("allows an active user to update their own profile", async () => {
    mocks.getActiveSession.mockResolvedValue({ user: { localUserId: "user-1" } });
    mocks.findUnique.mockResolvedValue({ id: "user-1", email: "old@example.com", status: "ACTIVE" });
    mocks.update.mockResolvedValue({ name: "New Name", email: "new@example.com" });

    const response = await PATCH(new Request("http://localhost/api/profile", {
      method: "PATCH",
      body: JSON.stringify({ name: "  New Name ", email: " NEW@EXAMPLE.COM " }),
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ profile: { name: "New Name", email: "new@example.com" } });
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { name: "New Name", email: "new@example.com" },
      select: { name: true, email: true },
    });
    expect(mocks.updateChats).toHaveBeenCalledWith({
      where: { ownerEmail: "old@example.com" },
      data: { ownerEmail: "new@example.com" },
    });
  });

  it("rejects unauthenticated and invalid updates", async () => {
    mocks.getActiveSession.mockResolvedValueOnce(null);
    const unauthorized = await PATCH(new Request("http://localhost/api/profile", {
      method: "PATCH",
      body: JSON.stringify({ name: "Name", email: "name@example.com" }),
    }));
    expect(unauthorized.status).toBe(401);

    mocks.getActiveSession.mockResolvedValueOnce({ user: { localUserId: "user-1" } });
    const invalid = await PATCH(new Request("http://localhost/api/profile", {
      method: "PATCH",
      body: JSON.stringify({ name: "", email: "not-an-email" }),
    }));
    expect(invalid.status).toBe(400);
    expect((await invalid.json()).fieldErrors).toEqual(expect.objectContaining({ name: expect.any(Array), email: expect.any(Array) }));
  });
});
