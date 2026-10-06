import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, profilesTable } from "@workspace/db";
import { GetProfileResponse, SaveProfileBody, SaveProfileResponse } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import { serializeProfile } from "../lib/scheme-data";

const router: IRouter = Router();

router.get("/profile", requireAuth, async (_req, res): Promise<void> => {
  const userId = res.locals.userId as number;
  const [profile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.userId, userId))
    .limit(1);

  res.json(
    GetProfileResponse.parse({
      profile: profile ? serializeProfile(profile) : null,
    }),
  );
});

router.put("/profile", requireAuth, async (req, res): Promise<void> => {
  const input = SaveProfileBody.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: input.error.message });
    return;
  }

  const userId = res.locals.userId as number;
  const data = {
    userId,
    age: input.data.age,
    gender: input.data.gender.trim(),
    state: input.data.state.trim(),
    annualIncome: input.data.annual_income,
    category: input.data.category.trim(),
    occupation: input.data.occupation.trim(),
    isStudent: input.data.is_student,
    isFarmer: input.data.is_farmer,
    hasDisability: input.data.has_disability,
    updatedAt: new Date(),
  };

  const [profile] = await db
    .insert(profilesTable)
    .values(data)
    .onConflictDoUpdate({
      target: profilesTable.userId,
      set: data,
    })
    .returning();

  if (!profile) {
    res.status(500).json({ error: "Profile could not be saved" });
    return;
  }
  res.json(SaveProfileResponse.parse(serializeProfile(profile)));
});

export default router;
