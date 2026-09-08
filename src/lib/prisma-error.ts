export function isPrismaErrorCode(error: unknown, code: string): error is Error & { code: string } {
  return error instanceof Error && "code" in error && error.code === code;
}
