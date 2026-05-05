export class DatabaseError extends Error {
  override cause: unknown;

  constructor(message: string, cause: unknown) {
    super(
      cause instanceof Error && cause.message
        ? `${message}: ${cause.message}`
        : message
    );
    this.cause = cause;
    this.name = "DatabaseError";
  }
}
