ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'USER';
ALTER TABLE "User" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE';

UPDATE "User"
SET "role" = 'ADMIN', "status" = 'ACTIVE'
WHERE "email" = 'admin@mptwork.local';
