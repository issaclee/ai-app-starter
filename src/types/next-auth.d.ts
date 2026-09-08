import "next-auth";
import "@auth/core/jwt";

declare module "next-auth" {
  interface Session {
    sessionId?: string;
    authProvider?: string;
    user: {
      localUserId?: string;
      role?: "ADMIN" | "USER";
    } & NonNullable<import("next-auth").DefaultSession["user"]>;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    localUserId?: string;
    sessionId?: string;
    authProvider?: string;
  }
}
