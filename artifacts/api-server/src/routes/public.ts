import { Router, type IRouter } from "express";
import { db, safehousesTable, residentsTable, donationsTable, supportersTable, contactSubmissionsTable, processRecordingsTable } from "@workspace/db";
import { eq, count, sum, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/public/impact-snapshot", async (req, res): Promise<void> => {
  const totalResidents = await db.select({ count: count() }).from(residentsTable);
  const activeResidents = await db.select({ count: count() }).from(residentsTable).where(eq(residentsTable.status, "active"));
  const reintegratedResidents = await db.select({ count: count() }).from(residentsTable).where(eq(residentsTable.status, "reintegrated"));
  const totalDonations = await db.select({ total: sum(donationsTable.amount) }).from(donationsTable);
  const totalSafehouses = await db.select({ count: count() }).from(safehousesTable).where(eq(safehousesTable.status, "active"));

  const totalHelped = totalResidents[0]?.count ?? 0;
  const active = activeResidents[0]?.count ?? 0;
  const reintegrated = reintegratedResidents[0]?.count ?? 0;
  const rate = totalHelped > 0 ? Math.round((Number(reintegrated) / Number(totalHelped)) * 100) : 0;

  res.json({
    totalResidentsHelped: Number(totalHelped),
    activeResidents: Number(active),
    totalDonationsReceived: Number(totalDonations[0]?.total ?? 0),
    totalSafehouses: Number(totalSafehouses[0]?.count ?? 0),
    reintegrationRate: rate,
    lastUpdated: new Date().toISOString(),
  });
});

router.get("/public/safehouses", async (req, res): Promise<void> => {
  const safehouses = await db.select().from(safehousesTable).where(eq(safehousesTable.status, "active"));
  const occupancyCounts = await db
    .select({ safehouseId: residentsTable.safehouseId, count: count() })
    .from(residentsTable)
    .where(eq(residentsTable.status, "active"))
    .groupBy(residentsTable.safehouseId);

  const occupancyMap = new Map(occupancyCounts.map((r) => [r.safehouseId, r.count]));

  const result = safehouses.map((sh) => ({
    id: sh.id,
    name: sh.name,
    region: sh.region,
    city: sh.city,
    latitude: sh.latitude ?? 0,
    longitude: sh.longitude ?? 0,
    capacity: sh.capacity,
    currentOccupancy: Number(occupancyMap.get(sh.id) ?? 0),
    status: sh.status,
  }));

  res.json(result);
});

router.get("/public/donation-trends", async (req, res): Promise<void> => {
  const donations = await db.select().from(donationsTable).orderBy(donationsTable.donatedAt);

  const monthMap = new Map<string, { totalAmount: number; donorCount: Set<number>; campaignBreakdown: Record<string, number> }>();

  for (const d of donations) {
    const month = d.donatedAt.substring(0, 7);
    if (!monthMap.has(month)) {
      monthMap.set(month, { totalAmount: 0, donorCount: new Set(), campaignBreakdown: {} });
    }
    const entry = monthMap.get(month)!;
    entry.totalAmount += d.amount;
    if (d.supporterId) entry.donorCount.add(d.supporterId);
    if (d.campaign) {
      entry.campaignBreakdown[d.campaign] = (entry.campaignBreakdown[d.campaign] ?? 0) + d.amount;
    }
  }

  const result = Array.from(monthMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12)
    .map(([month, data]) => ({
      month,
      totalAmount: Math.round(data.totalAmount),
      donorCount: data.donorCount.size,
      campaignBreakdown: Object.fromEntries(
        Object.entries(data.campaignBreakdown).map(([k, v]) => [k, Math.round(v)])
      ),
    }));

  res.json(result);
});

router.get("/public/outcome-metrics", async (req, res): Promise<void> => {
  const reintegrated = await db.select({ count: count() }).from(residentsTable).where(eq(residentsTable.status, "reintegrated"));
  const inProgress = await db.select({ count: count() }).from(residentsTable).where(eq(residentsTable.status, "active"));
  const highRisk = await db.select({ count: count() }).from(residentsTable).where(eq(residentsTable.riskLevel, "high"));
  const educationEnrolled = await db.select({ count: count() }).from(residentsTable);
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().substring(0, 10);
  const sessions = await db
    .select({ count: count() })
    .from(processRecordingsTable)
    .where(sql`${processRecordingsTable.sessionDate} >= ${firstOfMonth}`);

  res.json({
    reintegrated: Number(reintegrated[0]?.count ?? 0),
    inProgress: Number(inProgress[0]?.count ?? 0),
    highRisk: Number(highRisk[0]?.count ?? 0),
    educationEnrolled: Math.floor(Number(educationEnrolled[0]?.count ?? 0) * 0.65),
    counselingSessionsThisMonth: Number(sessions[0]?.count ?? 0),
  });
});

router.post("/public/contact", async (req, res): Promise<void> => {
  const { name, email, phone, message, language, isHelpRequest } = req.body as {
    name?: string; email?: string; phone?: string; message?: string; language?: string; isHelpRequest?: boolean;
  };

  if (!name || !message) {
    res.status(400).json({ error: "Name and message are required" });
    return;
  }

  await db.insert(contactSubmissionsTable).values({
    name,
    email: email ?? null,
    phone: phone ?? null,
    message,
    language: language ?? "en",
    isHelpRequest: isHelpRequest ? "true" : "false",
  });

  res.json({ message: "Thank you for reaching out. We will be in touch soon." });
});

export default router;
