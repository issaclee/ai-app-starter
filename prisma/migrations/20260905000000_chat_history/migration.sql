CREATE TABLE "Chat" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "ownerEmail" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "ChatMessage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "chatId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChatMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Chat_ownerEmail_updatedAt_idx" ON "Chat"("ownerEmail", "updatedAt");
CREATE UNIQUE INDEX "ChatMessage_chatId_position_key" ON "ChatMessage"("chatId", "position");
CREATE INDEX "ChatMessage_chatId_idx" ON "ChatMessage"("chatId");
