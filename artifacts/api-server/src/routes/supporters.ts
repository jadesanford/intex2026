import { Router, type IRouter } from "express";
import { db, supportersTable, donationsTable } from "@workspace/db";
import { eq, ilike, and, sum, count, max, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/supporters", async (req, res): Promise<void> => {
  const page = parseInt((req.query.page as string) ?? "1", 10);
  const limit = parseInt((req.query.limit as string) ?? "20", 10);
  const type = req.query.type as string | undefined;
  const search = req.query.search as string | undefined;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (type) conditions.push(eq(supportersTable.type, type));
  if (search) conditions.push(ilike(supportersTable.name, `%${search}%`));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalResult, rows] = await Promise.all([
    db.select({ count: count() }).from(supportersTable).where(where),
    db.select().from(supportersTable).where(where).orderBy(desc(supportersTable.createdAt)).limit(limit).offset(offset),
  ]);

  const ids = rows.map((r) => r.id);
  const donationStats = ids.length > 0
    ? await db
        .select({
          supporterId: donationsTable.supporterId,
          totalDonated: sum(donationsTable.amount),
          donationCount: count(),
          lastDonationDate: max(donationsTable.donatedAt),
        })
        .from(donationsTable)
        .where(
          ids.length === 1
            ? eq(donationsTable.supporterId, ids[0])
            : and(...ids.map((id) => eq(donationsTable.supporterId, id)))
        )
        .groupBy(donationsTable.supporterId)
    : [];

  const statsMap = new Map(donationStats.map((d) => [d.supporterId, d]));

  const enriched = rows.map((s) => {
    const stats = statsMap.get(s.id);
    return {
      ...s,
      totalDonated: Number(stats?.totalDonated ?? 0),
      donationCount: Number(stats?.donationCount ?? 0),
      lastDonationDate: stats?.lastDonationDate ?? null,
    };
  });

  const total = Number(totalResult[0]?.count ?? 0);
  res.json({ data: enriched, total, page, limit, totalPages: Math.ceil(total / limit) });
});

router.post("/supporters", async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const [supporter] = await db.insert(supportersTable).values({
    name: body.name as string,
    email: (body.email as string) ?? null,
    phone: (body.phone as string) ?? null,
    type: (body.type as string) ?? "individual",
    country: (body.country as string) ?? null,
    city: (body.city as string) ?? null,
    isRecurring: (body.isRecurring as boolean) ?? false,
    notes: (body.notes as string) ?? null,
  }).returning();
  res.status(201).json({ ...supporter, totalDonated: 0, donationCount: 0, lastDonationDate: null });
});

router.get("/supporters/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [s] = await db.select().from(supportersTable).where(eq(supportersTable.id, id));
  if (!s) { res.status(404).json({ error: "Supporter not found" }); return; }

  const [stats] = await db
    .select({ totalDonated: sum(donationsTable.amount), donationCount: count(), lastDonationDate: max(donationsTable.donatedAt) })
    .from(donationsTable)
    .where(eq(donationsTable.supporterId, id));

  res.json({ ...s, totalDonated: Number(stats?.totalDonated ?? 0), donationCount: Number(stats?.donationCount ?? 0), lastDonationDate: stats?.lastDonationDate ?? null });
});

router.patch("/supporters/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const body = req.body as Record<string, unknown>;
  const updates: Record<string, unknown> = {};
  for (const f of ["name", "email", "phone", "type", "country", "city", "isRecurring", "notes"]) {
    if (body[f] !== undefined) updates[f] = body[f];
  }
  const [s] = await db.update(supportersTable).set(updates).where(eq(supportersTable.id, id)).returning();
  if (!s) { res.status(404).json({ error: "Supporter not found" }); return; }
  res.json({ ...s, totalDonated: 0, donationCount: 0, lastDonationDate: null });
});

router.delete("/supporters/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [s] = await db.delete(supportersTable).where(eq(supportersTable.id, id)).returning();
  if (!s) { res.status(404).json({ error: "Supporter not found" }); return; }
  res.sendStatus(204);
});

router.get("/supporters/:id/lapse-risk", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [supporter] = await db.select().from(supportersTable).where(eq(supportersTable.id, id));
  if (!supporter) { res.status(404).json({ error: "Supporter not found" }); return; }

  const donations = await db.select().from(donationsTable).where(eq(donationsTable.supporterId, id)).orderBy(donationsTable.donatedAt);

  let daysSinceLastDonation: number | null = null;
  let averageDonationGap: number | null = null;

  if (donations.length > 0) {
    const lastDonation = donations[donations.length - 1];
    daysSinceLastDonation = Math.floor((Date.now() - new Date(lastDonation.donatedAt).getTime()) / 86400000);

    if (donations.length > 1) {
      const gaps: number[] = [];
      for (let i = 1; i < donations.length; i++) {
        const gap = Math.floor((new Date(donations[i].donatedAt).getTime() - new Date(donations[i - 1].donatedAt).getTime()) / 86400000);
        gaps.push(gap);
      }
      averageDonationGap = Math.floor(gaps.reduce((a, b) => a + b, 0) / gaps.length);
    }
  }

  let riskLevel: "low" | "medium" | "high" = "low";
  if (daysSinceLastDonation === null || daysSinceLastDonation > 365) riskLevel = "high";
  else if (daysSinceLastDonation > 180) riskLevel = "medium";

  const totalDonated = donations.reduce((sum, d) => sum + d.amount, 0);
  const upsellPotential = totalDonated > 1000000 ? "High — consider major gift conversation" : totalDonated > 250000 ? "Medium — invite to fundraising event" : "Low — send appreciation update";

  res.json({
    supporterId: id,
    riskLevel,
    daysSinceLastDonation,
    averageDonationGap,
    recommendation: riskLevel === "high" ? "Send personalized outreach immediately" : riskLevel === "medium" ? "Send impact update with giving link" : "Maintain regular stewardship cadence",
    upsellPotential,
  });
});

export default router;
