import { compare } from "bcryptjs";

export async function verifyPassword(password: string, passwordHash: string) {
  return compare(password, passwordHash);
}
