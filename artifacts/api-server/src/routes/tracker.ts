import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, savedSchemesTable, schemesTable } from "@workspace/db";
import {
  ListSavedSchemesResponse,
  SaveSchemeBody,
  SaveSchemeResponse,
  UpdateSavedSchemeBody,
  UpdateSavedSchemeParams,
  UpdateSavedSchemeResponse,
  DeleteSavedSchemeParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import { serializeSavedScheme } from "../lib/scheme-data";

const router: IRouter = Router();

router.get("/saved-schemes", requireAuth, async (_req, res): Promise<void> => {
  const userId = res.locals.userId as number;
  const rows = await db
    .select({ saved: savedSchemesTable, scheme: schemesTable })
    .from(savedSchemesTable)
    .innerJoin(schemesTable, eq(savedSchemesTable.schemeId, schemesTable.id))
    .where(eq(savedSchemesTable.userId, userId))
    .orderBy(desc(savedSchemesTable.updatedAt));
  res.json(
    ListSavedSchemesResponse.parse(
      rows.map(({ saved, scheme }) => serializeSavedScheme(saved, scheme)),
    ),
  );
});

router.post("/saved-schemes", requireAuth, async (req, res): Promise<void> => {
  const input = SaveSchemeBody.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: input.error.message });
    return;
  }
  const userId = res.locals.userId as number;
  const [scheme] = await db
    .select()
    .from(schemesTable)
    .where(eq(schemesTable.id, input.data.scheme_id))
    .limit(1);
  if (!scheme) {
    res.status(404).json({ error: "Scheme not found" });
    return;
  }

  try {
    const [saved] = await db
      .insert(savedSchemesTable)
      .values({
        userId,
        schemeId: scheme.id,
        status: input.data.status ?? "saved",
        notes: input.data.notes?.trim() || null,
      })
      .returning();
    if (!saved) {
      res.status(500).json({ error: "Scheme could not be saved" });
      return;
    }
    res.status(201).json(SaveSchemeResponse.parse(serializeSavedScheme(saved, scheme)));
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      res.status(409).json({ error: "This scheme is already in your tracker" });
      return;
    }
    throw error;
  }
});

router.patch(
  "/saved-schemes/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = UpdateSavedSchemeParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const input = UpdateSavedSchemeBody.safeParse(req.body);
    if (!input.success) {
      res.status(400).json({ error: input.error.message });
      return;
    }
    if (input.data.status === undefined && input.data.notes === undefined) {
      res.status(400).json({ error: "Provide a status or notes update" });
      return;
    }

    const userId = res.locals.userId as number;
    const [saved] = await db
      .update(savedSchemesTable)
      .set({
        ...(input.data.status !== undefined ? { status: input.data.status } : {}),
        ...(input.data.notes !== undefined ? { notes: input.data.notes.trim() || null } : {}),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(savedSchemesTable.id, params.data.id),
          eq(savedSchemesTable.userId, userId),
        ),
      )
      .returning();
    if (!saved) {
      res.status(404).json({ error: "Tracker item not found" });
      return;
    }
    const [scheme] = await db
      .select()
      .from(schemesTable)
      .where(eq(schemesTable.id, saved.schemeId))
      .limit(1);
    if (!scheme) {
      res.status(404).json({ error: "Scheme no longer exists" });
      return;
    }
    res.json(
      UpdateSavedSchemeResponse.parse(serializeSavedScheme(saved, scheme)),
    );
  },
);

router.delete(
  "/saved-schemes/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = DeleteSavedSchemeParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const userId = res.locals.userId as number;
    const [deleted] = await db
      .delete(savedSchemesTable)
      .where(
        and(
          eq(savedSchemesTable.id, params.data.id),
          eq(savedSchemesTable.userId, userId),
        ),
      )
      .returning({ id: savedSchemesTable.id });
    if (!deleted) {
      res.status(404).json({ error: "Tracker item not found" });
      return;
    }
    res.sendStatus(204);
  },
);

export default router;
