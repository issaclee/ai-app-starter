import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { authorizeCredentials } from "@/lib/credential-auth";
import { linkOAuthIdentity } from "@/lib/oauth-identity";
import { prisma } from "@/lib/db";

const microsoftTenantId = process.env.MICROSOFT_ENTRA_ID_TENANT_ID;

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    MicrosoftEntraID({
      id: "microsoft",
      clientId: process.env.MICROSOFT_ENTRA_ID_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_ENTRA_ID_CLIENT_SECRET,
      issuer: microsoftTenantId
        ? `https://login.microsoftonline.com/${microsoftTenantId}/v2.0`
        : undefined,
    }),
    Credentials({
      name: "Username and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: authorizeCredentials,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!account || account.provider === "credentials") return true;
      const linked = await linkOAuthIdentity({
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        email: user.email,
        name: user.name,
      });
      if (!linked.allowed || !linked.userId) return false;
      user.id = linked.userId;
      return true;
    },
    jwt({ token, user, account }) {
      if (user && account) {
        token.localUserId = user.id;
        token.sessionId = crypto.randomUUID();
        token.authProvider = account.provider;
      } else if (token.localUserId && !token.sessionId) {
        token.sessionId = typeof token.jti === "string" ? token.jti : crypto.randomUUID();
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && typeof token.localUserId === "string") {
        session.user.localUserId = token.localUserId;
      }
      if (typeof token.sessionId === "string") session.sessionId = token.sessionId;
      if (typeof token.authProvider === "string") session.authProvider = token.authProvider;
      return session;
    },
    redirect({ url, baseUrl }) {
      if (url.startsWith("/") && !url.startsWith("//")) return `${baseUrl}${url}`;
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {}
      return `${baseUrl}/chat`;
    },
  },
  events: {
    async signOut(message) {
      const token = "token" in message ? message.token : null;
      if (typeof token?.sessionId === "string") {
        await prisma.connectionSession.updateMany({
          where: { id: token.sessionId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
    },
  },
});
