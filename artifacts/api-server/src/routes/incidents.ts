import { Router, type IRouter } from "express";
import { db, incidentReportsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/incidents", async (req, res): Promise<void> => {
  const residentId = req.query.residentId ? parseInt(req.query.residentId as string, 10) : undefined;
  const severity = req.query.severity as string | undefined;

  const conditions = [];
  if (residentId) conditions.push(eq(incidentReportsTable.residentId, residentId));
  if (severity) conditions.push(eq(incidentReportsTable.severity, severity));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const incidents = await db.select().from(incidentReportsTable).where(where).orderBy(incidentReportsTable.incidentDate);
  const result = incidents.map((i) => ({ ...i, resolved: i.resolved === "true" }));
  res.json(result);
});

router.post("/incidents", async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const [incident] = await db.insert(incidentReportsTable).values({
    residentId: (body.residentId as number) ?? null,
    safehouseId: (body.safehouseId as number) ?? null,
    incidentDate: body.incidentDate as string,
    incidentType: (body.incidentType as string) ?? null,
    severity: (body.severity as string) ?? "low",
    description: (body.description as string) ?? null,
    actionsTaken: (body.actionsTaken as string) ?? null,
    reportedBy: (body.reportedBy as string) ?? null,
    resolved: (body.resolved as boolean) ? "true" : "false",
  }).returning();
  res.status(201).json({ ...incident, resolved: incident.resolved === "true" });
});

router.patch("/incidents/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const body = req.body as Record<string, unknown>;
  const updates: Record<string, unknown> = {};
  for (const f of ["incidentType", "severity", "description", "actionsTaken", "reportedBy"]) {
    if (body[f] !== undefined) updates[f] = body[f];
  }
  if (body.resolved !== undefined) updates.resolved = (body.resolved as boolean) ? "true" : "false";
  const [i] = await db.update(incidentReportsTable).set(updates).where(eq(incidentReportsTable.id, id)).returning();
  if (!i) { res.status(404).json({ error: "Incident not found" }); return; }
  res.json({ ...i, resolved: i.resolved === "true" });
});

export default router;
