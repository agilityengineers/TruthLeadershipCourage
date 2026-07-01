import type { Request, Response, NextFunction, RequestHandler } from "express";

/** An error carrying an HTTP status code. Thrown by controllers/services. */
export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const badRequest = (m = "Bad request") => new HttpError(400, m);
export const unauthorized = (m = "Not authenticated") => new HttpError(401, m);
export const forbidden = (m = "Forbidden") => new HttpError(403, m);
export const notFound = (m = "Not found") => new HttpError(404, m);

/** Wrap an async handler so rejected promises reach the error middleware. */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/** Terminal error middleware: maps HttpError → status, everything else → 500. */
export function errorMiddleware(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  // Zod validation errors expose an `issues` array.
  if (err && typeof err === "object" && "issues" in err) {
    const first = (err as { issues?: Array<{ message?: string }> }).issues?.[0]?.message;
    res.status(400).json({ error: first ?? "Invalid request" });
    return;
  }
  req.log?.error({ err }, "Unhandled error");
  res.status(500).json({ error: "Internal server error" });
}
