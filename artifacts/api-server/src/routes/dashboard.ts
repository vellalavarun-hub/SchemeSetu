import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, profilesTable, savedSchemesTable, schemesTable } from "@workspace/db";
import { GetDashboardSummaryResponse } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import { matchScheme } from "../lib/scheme-matching";
import { serializeSavedScheme } from "../lib/scheme-data";

const router: IRouter = Router();

router.get("/dashboard/summary", requireAuth, async (_req, res): Promise<void> => {
  const userId = res.locals.userId as number;
  const [profile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.userId, userId))
    .limit(1);
  const savedRows = await db
    .select({ saved: savedSchemesTable, scheme: schemesTable })
    .from(savedSchemesTable)
    .innerJoin(schemesTable, eq(savedSchemesTable.schemeId, schemesTable.id))
    .where(eq(savedSchemesTable.userId, userId))
    .orderBy(desc(savedSchemesTable.updatedAt));
  const schemes = profile ? await db.select().from(schemesTable) : [];
  const matchCount = profile
    ? schemes.filter((scheme) => matchScheme(profile, scheme) !== null).length
    : 0;

  res.json(
    GetDashboardSummaryResponse.parse({
      profile_complete: Boolean(profile),
      total_matches: matchCount,
      saved: savedRows.filter(({ saved }) => saved.status === "saved").length,
      applied: savedRows.filter(({ saved }) => saved.status === "applied").length,
      approved: savedRows.filter(({ saved }) => saved.status === "approved").length,
      rejected: savedRows.filter(({ saved }) => saved.status === "rejected").length,
      recent_saved: savedRows
        .slice(0, 5)
        .map(({ saved, scheme }) => serializeSavedScheme(saved, scheme)),
    }),
  );
});

export default router;
