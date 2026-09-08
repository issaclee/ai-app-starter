CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'USER',
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
-- statement-breakpoint
CREATE TABLE "ExternalIdentity" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExternalIdentity_pkey" PRIMARY KEY ("id")
);
-- statement-breakpoint
CREATE TABLE "ConnectionSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "userAgent" TEXT,
  "ipAddress" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  CONSTRAINT "ConnectionSession_pkey" PRIMARY KEY ("id")
);
-- statement-breakpoint
CREATE TABLE "Chat" (
  "id" TEXT NOT NULL,
  "ownerEmail" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);
-- statement-breakpoint
CREATE TABLE "ChatMessage" (
  "id" TEXT NOT NULL,
  "chatId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);
-- statement-breakpoint
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
-- statement-breakpoint
CREATE UNIQUE INDEX "ExternalIdentity_provider_providerAccountId_key" ON "ExternalIdentity"("provider", "providerAccountId");
-- statement-breakpoint
CREATE INDEX "ExternalIdentity_userId_idx" ON "ExternalIdentity"("userId");
-- statement-breakpoint
CREATE INDEX "ConnectionSession_userId_revokedAt_expiresAt_idx" ON "ConnectionSession"("userId", "revokedAt", "expiresAt");
-- statement-breakpoint
CREATE INDEX "Chat_ownerEmail_updatedAt_idx" ON "Chat"("ownerEmail", "updatedAt");
-- statement-breakpoint
CREATE UNIQUE INDEX "ChatMessage_chatId_position_key" ON "ChatMessage"("chatId", "position");
-- statement-breakpoint
CREATE INDEX "ChatMessage_chatId_idx" ON "ChatMessage"("chatId");
-- statement-breakpoint
ALTER TABLE "ExternalIdentity" ADD CONSTRAINT "ExternalIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- statement-breakpoint
ALTER TABLE "ConnectionSession" ADD CONSTRAINT "ConnectionSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- statement-breakpoint
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
