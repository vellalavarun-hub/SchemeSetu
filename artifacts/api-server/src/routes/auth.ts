import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { LoginBody, RegisterBody } from "@workspace/api-zod";
import {
  createSessionToken,
  requireAuth,
  SESSION_COOKIE,
} from "../middlewares/auth";

const router: IRouter = Router();
const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/api",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function userResponse(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    created_at: user.createdAt.toISOString(),
  };
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const input = RegisterBody.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: input.error.message });
    return;
  }

  const email = input.data.email.trim().toLowerCase();
  const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(input.data.password, 12);
  try {
    const [user] = await db
      .insert(usersTable)
      .values({ name: input.data.name.trim(), email, passwordHash })
      .returning();
    if (!user) {
      res.status(500).json({ error: "Account could not be created" });
      return;
    }

    res.cookie(SESSION_COOKIE, createSessionToken(user.id), cookieOptions);
    res.status(201).json({ user: userResponse(user) });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }
    throw error;
  }
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const input = LoginBody.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: input.error.message });
    return;
  }

  const email = input.data.email.trim().toLowerCase();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user || !(await bcrypt.compare(input.data.password, user.passwordHash))) {
    res.status(401).json({ error: "Email or password is incorrect" });
    return;
  }

  res.cookie(SESSION_COOKIE, createSessionToken(user.id), cookieOptions);
  res.json({ user: userResponse(user) });
});

router.post("/auth/logout", (_req, res): void => {
  res.clearCookie(SESSION_COOKIE, { ...cookieOptions, maxAge: undefined });
  res.json({ success: true });
});

router.get("/auth/me", requireAuth, async (_req, res): Promise<void> => {
  const userId = res.locals.userId as number;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Account no longer exists" });
    return;
  }
  res.json(userResponse(user));
});

export default router;
