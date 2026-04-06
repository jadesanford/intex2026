import { Router, type IRouter } from "express";
import { db, safehousesTable, safehouseMonthlyMetricsTable, residentsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";

const router: IRouter = Router();

router.get("/safehouses", async (req, res): Promise<void> => {
  const safehouses = await db.select().from(safehousesTable).orderBy(safehousesTable.name);
  const occupancyCounts = await db
    .select({ safehouseId: residentsTable.safehouseId, count: count() })
    .from(residentsTable)
    .where(eq(residentsTable.status, "active"))
    .groupBy(residentsTable.safehouseId);
  const occMap = new Map(occupancyCounts.map((r) => [r.safehouseId, r.count]));

  const result = safehouses.map((sh) => ({
    ...sh,
    currentOccupancy: Number(occMap.get(sh.id) ?? 0),
  }));
  res.json(result);
});

router.post("/safehouses", async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const [sh] = await db.insert(safehousesTable).values({
    name: body.name as string,
    region: body.region as string,
    city: body.city as string,
    address: (body.address as string) ?? null,
    capacity: (body.capacity as number) ?? 20,
    status: (body.status as string) ?? "active",
    latitude: (body.latitude as number) ?? null,
    longitude: (body.longitude as number) ?? null,
    contactPerson: (body.contactPerson as string) ?? null,
    contactPhone: (body.contactPhone as string) ?? null,
  }).returning();
  res.status(201).json(sh);
});

router.get("/safehouses/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [sh] = await db.select().from(safehousesTable).where(eq(safehousesTable.id, id));
  if (!sh) { res.status(404).json({ error: "Safehouse not found" }); return; }
  res.json(sh);
});

router.patch("/safehouses/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const body = req.body as Record<string, unknown>;
  const updates: Record<string, unknown> = {};
  if (body.name != null) updates.name = body.name;
  if (body.region != null) updates.region = body.region;
  if (body.city != null) updates.city = body.city;
  if (body.address !== undefined) updates.address = body.address;
  if (body.capacity != null) updates.capacity = body.capacity;
  if (body.status != null) updates.status = body.status;
  if (body.latitude !== undefined) updates.latitude = body.latitude;
  if (body.longitude !== undefined) updates.longitude = body.longitude;
  if (body.contactPerson !== undefined) updates.contactPerson = body.contactPerson;
  if (body.contactPhone !== undefined) updates.contactPhone = body.contactPhone;

  const [sh] = await db.update(safehousesTable).set(updates).where(eq(safehousesTable.id, id)).returning();
  if (!sh) { res.status(404).json({ error: "Safehouse not found" }); return; }
  res.json(sh);
});

router.get("/safehouses/:id/metrics", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const metrics = await db
    .select()
    .from(safehouseMonthlyMetricsTable)
    .where(eq(safehouseMonthlyMetricsTable.safehouseId, id))
    .orderBy(safehouseMonthlyMetricsTable.month);
  res.json(metrics);
});

export default router;
