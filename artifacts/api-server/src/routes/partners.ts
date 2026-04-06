import { Router, type IRouter } from "express";
import { db, partnersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/partners", async (req, res): Promise<void> => {
  const partners = await db.select().from(partnersTable).orderBy(partnersTable.name);
  res.json(partners);
});

router.post("/partners", async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const [partner] = await db.insert(partnersTable).values({
    name: body.name as string,
    type: (body.type as string) ?? null,
    country: (body.country as string) ?? null,
    contactPerson: (body.contactPerson as string) ?? null,
    contactEmail: (body.contactEmail as string) ?? null,
    website: (body.website as string) ?? null,
    activeStatus: (body.activeStatus as boolean) ?? true,
    notes: (body.notes as string) ?? null,
  }).returning();
  res.status(201).json(partner);
});

router.get("/partners/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [partner] = await db.select().from(partnersTable).where(eq(partnersTable.id, id));
  if (!partner) { res.status(404).json({ error: "Partner not found" }); return; }
  res.json(partner);
});

router.patch("/partners/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const body = req.body as Record<string, unknown>;
  const updates: Record<string, unknown> = {};
  for (const f of ["name", "type", "country", "contactPerson", "contactEmail", "website", "activeStatus", "notes"]) {
    if (body[f] !== undefined) updates[f] = body[f];
  }
  const [p] = await db.update(partnersTable).set(updates).where(eq(partnersTable.id, id)).returning();
  if (!p) { res.status(404).json({ error: "Partner not found" }); return; }
  res.json(p);
});

export default router;
