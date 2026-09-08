import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUnique: vi.fn(),
  findMany: vi.fn(),
  create: vi.fn(),
  count: vi.fn(),
  update: vi.fn(),
  deleteUser: vi.fn(),
  deleteChats: vi.fn(),
  transaction: vi.fn(),
  revokeSessions: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/app-session", () => ({ getActiveSession: async () => { const session = await mocks.auth(); return session?.user ? { ...session, sessionId: "session-current" } : null; } }));
vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: mocks.findUnique,
      findMany: mocks.findMany,
      create: mocks.create,
      count: mocks.count,
      update: mocks.update,
      delete: mocks.deleteUser,
    },
    chat: { deleteMany: mocks.deleteChats },
    $transaction: mocks.transaction,
  },
}));

import { GET, POST } from "@/app/api/settings/users/route";
import { DELETE, PATCH } from "@/app/api/settings/users/[userId]/route";

const admin = {
  id: "admin-1",
  name: "Admin",
  email: "admin@example.com",
  role: "ADMIN",
  status: "ACTIVE",
  passwordHash: "hidden",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-02"),
};

describe("user management routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (callback) => callback({
      user: { findUnique: mocks.findUnique, count: mocks.count, update: mocks.update, delete: mocks.deleteUser },
      chat: { deleteMany: mocks.deleteChats },
      connectionSession: { updateMany: mocks.revokeSessions },
    }));
  });

  it("rejects unauthenticated and non-admin user lists", async () => {
    mocks.auth.mockResolvedValueOnce(null);
    expect((await GET()).status).toBe(401);

    mocks.auth.mockResolvedValueOnce({ user: { localUserId: "user-1", email: "user@example.com" } });
    mocks.findUnique.mockResolvedValueOnce({ id: "user-1", role: "USER", status: "ACTIVE" });
    expect((await GET()).status).toBe(403);
  });

  it("lists local and OAuth users with their sign-in methods", async () => {
    mocks.auth.mockResolvedValue({ user: { localUserId: admin.id, email: admin.email } });
    mocks.findUnique.mockResolvedValue({ id: admin.id, role: "ADMIN", status: "ACTIVE" });
    mocks.findMany.mockResolvedValue([
      { ...admin, externalIdentities: [] },
      { ...admin, id: "oauth-1", email: "oauth@example.com", passwordHash: "!oauth-only", externalIdentities: [{ provider: "google" }] },
    ]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.users).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: admin.id, authProviders: ["credentials"] }),
      expect.objectContaining({ id: "oauth-1", authProviders: ["google"] }),
    ]));
    expect(body.users[0]).not.toHaveProperty("passwordHash");
  });

  it("creates a user without returning or forwarding password material", async () => {
    mocks.auth.mockResolvedValue({ user: { localUserId: admin.id, email: admin.email } });
    mocks.findUnique.mockResolvedValue({ id: admin.id, role: "ADMIN", status: "ACTIVE" });
    mocks.create.mockImplementation(async ({ data }) => ({ ...admin, id: "user-2", name: data.name, email: data.email, role: data.role, status: data.status, passwordHash: data.passwordHash }));

    const response = await POST(new Request("http://localhost/api/settings/users", {
      method: "POST",
      body: JSON.stringify({ name: "New User", email: "NEW@EXAMPLE.COM", role: "USER", status: "ACTIVE", password: "password123" }),
    }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.user.email).toBe("new@example.com");
    expect(body.user.authProviders).toEqual(["credentials"]);
    expect(body.user).not.toHaveProperty("passwordHash");
    expect(mocks.create.mock.calls[0][0].data).not.toHaveProperty("password");
    expect(mocks.create.mock.calls[0][0].data.passwordHash).not.toBe("password123");
  });

  it("rejects self-disabling even when another administrator exists", async () => {
    mocks.auth.mockResolvedValue({ user: { localUserId: admin.id, email: admin.email } });
    mocks.findUnique.mockResolvedValue({ ...admin });
    mocks.count.mockResolvedValue(2);

    const response = await PATCH(new Request("http://localhost/api/settings/users/admin-1", {
      method: "PATCH",
      body: JSON.stringify({ name: "Admin", email: admin.email, role: "ADMIN", status: "DISABLED", password: "" }),
    }), { params: Promise.resolve({ userId: admin.id }) });

    expect(response.status).toBe(409);
    expect((await response.json()).error).toContain("cannot disable your own account");
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it.each([
    { id: "admin-2", role: "ADMIN" },
    { id: "user-2", role: "USER" },
  ])("allows an administrator to disable another $role account", async ({ id, role }) => {
    const target = { ...admin, id, email: `${id}@example.com`, role };
    const disabledTarget = { ...target, status: "DISABLED", updatedAt: new Date("2026-01-03") };
    mocks.auth.mockResolvedValue({ user: { localUserId: admin.id, email: admin.email } });
    mocks.findUnique.mockResolvedValueOnce({ id: admin.id, role: "ADMIN", status: "ACTIVE" }).mockResolvedValueOnce(target);
    mocks.count.mockResolvedValue(2);
    mocks.update.mockResolvedValue(disabledTarget);

    const response = await PATCH(new Request(`http://localhost/api/settings/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name: target.name, email: target.email, role, status: "DISABLED", password: "" }),
    }), { params: Promise.resolve({ userId: id }) });

    expect(response.status).toBe(200);
    expect((await response.json()).user.status).toBe("DISABLED");
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id } }));
    expect(mocks.revokeSessions).toHaveBeenCalledWith({ where: { userId: id, revokedAt: null }, data: { revokedAt: expect.any(Date) } });
  });

  it("deletes a user and their chats in one transaction", async () => {
    const target = { ...admin, id: "user-2", email: "person@example.com", role: "USER" };
    mocks.auth.mockResolvedValue({ user: { localUserId: admin.id, email: admin.email } });
    mocks.findUnique.mockResolvedValueOnce({ id: admin.id, role: "ADMIN", status: "ACTIVE" }).mockResolvedValueOnce(target);

    const response = await DELETE(new Request("http://localhost/api/settings/users/user-2", { method: "DELETE" }), { params: Promise.resolve({ userId: target.id }) });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: target.id });
    expect(mocks.deleteChats).toHaveBeenCalledWith({ where: { ownerEmail: target.email } });
    expect(mocks.deleteUser).toHaveBeenCalledWith({ where: { id: target.id } });
    expect(mocks.transaction).toHaveBeenCalledOnce();
  });

  it("rejects self-deletion", async () => {
    mocks.auth.mockResolvedValue({ user: { localUserId: admin.id, email: admin.email } });
    mocks.findUnique.mockResolvedValue({ id: admin.id, role: "ADMIN", status: "ACTIVE" });

    const response = await DELETE(new Request("http://localhost/api/settings/users/admin-1", { method: "DELETE" }), { params: Promise.resolve({ userId: admin.id }) });

    expect(response.status).toBe(409);
    expect((await response.json()).error).toContain("own account");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("allows deletion of another administrator when the actor remains active", async () => {
    const target = { ...admin, id: "admin-2", email: "other-admin@example.com" };
    mocks.auth.mockResolvedValue({ user: { localUserId: admin.id, email: admin.email } });
    mocks.findUnique.mockResolvedValueOnce({ id: admin.id, role: "ADMIN", status: "ACTIVE" }).mockResolvedValueOnce(target);
    mocks.count.mockResolvedValue(2);

    const response = await DELETE(new Request("http://localhost/api/settings/users/admin-2", { method: "DELETE" }), { params: Promise.resolve({ userId: target.id }) });

    expect(response.status).toBe(200);
    expect(mocks.deleteUser).toHaveBeenCalledWith({ where: { id: target.id } });
  });

  it("rejects deletion of the final active administrator", async () => {
    const target = { ...admin, id: "admin-2", email: "other-admin@example.com" };
    mocks.auth.mockResolvedValue({ user: { localUserId: admin.id, email: admin.email } });
    mocks.findUnique.mockResolvedValueOnce({ id: admin.id, role: "ADMIN", status: "ACTIVE" }).mockResolvedValueOnce(target);
    mocks.count.mockResolvedValue(1);

    const response = await DELETE(new Request("http://localhost/api/settings/users/admin-2", { method: "DELETE" }), { params: Promise.resolve({ userId: target.id }) });

    expect(response.status).toBe(409);
    expect((await response.json()).error).toContain("final active administrator");
    expect(mocks.deleteChats).not.toHaveBeenCalled();
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });
});
