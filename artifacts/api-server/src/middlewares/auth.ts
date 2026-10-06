import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";

export const SESSION_COOKIE = "scheme_setu_session";

function signingSecret(): string {
  const secret = process.env.JWT_SECRET ?? process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET or SESSION_SECRET must be set");
  }
  return secret;
}

export function createSessionToken(userId: number): string {
  return jwt.sign({ sub: String(userId) }, signingSecret(), {
    expiresIn: "7d",
  });
}

export const requireAuth: RequestHandler = (req, res, next) => {
  const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    const payload = jwt.verify(token, signingSecret());
    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string" ||
      !/^\d+$/.test(payload.sub)
    ) {
      res.status(401).json({ error: "Invalid session" });
      return;
    }

    res.locals.userId = Number(payload.sub);
    next();
  } catch {
    res.status(401).json({ error: "Session expired or invalid" });
  }
};
