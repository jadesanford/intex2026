import { Router, type IRouter } from "express";
import { db, donationsTable, supportersTable } from "@workspace/db";
import { eq, and, sum, count, max, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/donations", async (req, res): Promise<void> => {
  const page = parseInt((req.query.page as string) ?? "1", 10);
  const limit = parseInt((req.query.limit as string) ?? "20", 10);
  const supporterId = req.query.supporterId ? parseInt(req.query.supporterId as string, 10) : undefined;
  const campaign = req.query.campaign as string | undefined;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (supporterId) conditions.push(eq(donationsTable.supporterId, supporterId));
  if (campaign) conditions.push(eq(donationsTable.campaign, campaign));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalResult, rows] = await Promise.all([
    db.select({ count: count() }).from(donationsTable).where(where),
    db.select({
      id: donationsTable.id,
      supporterId: donationsTable.supporterId,
      supporterName: supportersTable.name,
      amount: donationsTable.amount,
      currency: donationsTable.currency,
      donationType: donationsTable.donationType,
      campaign: donationsTable.campaign,
      channel: donationsTable.channel,
      donatedAt: donationsTable.donatedAt,
      receiptIssued: donationsTable.receiptIssued,
      notes: donationsTable.notes,
      createdAt: donationsTable.createdAt,
    })
      .from(donationsTable)
      .leftJoin(supportersTable, eq(donationsTable.supporterId, supportersTable.id))
      .where(where)
      .orderBy(desc(donationsTable.donatedAt))
      .limit(limit)
      .offset(offset),
  ]);

  const total = Number(totalResult[0]?.count ?? 0);
  res.json({ data: rows, total, page, limit, totalPages: Math.ceil(total / limit) });
});

router.post("/donations", async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const [donation] = await db.insert(donationsTable).values({
    supporterId: (body.supporterId as number) ?? null,
    amount: body.amount as number,
    currency: (body.currency as string) ?? "IDR",
    donationType: (body.donationType as string) ?? "cash",
    campaign: (body.campaign as string) ?? null,
    channel: (body.channel as string) ?? null,
    donatedAt: body.donatedAt as string,
    receiptIssued: (body.receiptIssued as boolean) ?? false,
    notes: (body.notes as string) ?? null,
  }).returning();
  res.status(201).json({ ...donation, supporterName: null });
});

router.get("/donations/summary", async (req, res): Promise<void> => {
  const all = await db.select().from(donationsTable).orderBy(donationsTable.donatedAt);

  const totalAmount = all.reduce((s, d) => s + d.amount, 0);
  const uniqueDonors = new Set(all.map((d) => d.supporterId).filter(Boolean)).size;
  const avgDonation = all.length > 0 ? totalAmount / all.length : 0;

  const recurringResult = await db.select({ count: count() }).from(supportersTable).where(eq(supportersTable.isRecurring, true));
  const recurringDonors = Number(recurringResult[0]?.count ?? 0);

  const campaignMap = new Map<string, number>();
  for (const d of all) {
    if (d.campaign) {
      campaignMap.set(d.campaign, (campaignMap.get(d.campaign) ?? 0) + d.amount);
    }
  }
  const topCampaigns = Array.from(campaignMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([campaign, total]) => ({ campaign, total: Math.round(total) }));

  const channelMap = new Map<string, number>();
  for (const d of all) {
    const ch = d.channel ?? "unknown";
    channelMap.set(ch, (channelMap.get(ch) ?? 0) + d.amount);
  }
  const channelBreakdown = Object.fromEntries(
    Array.from(channelMap.entries()).map(([k, v]) => [k, Math.round(v)])
  );

  res.json({ totalAmount: Math.round(totalAmount), totalDonors: uniqueDonors, averageDonation: Math.round(avgDonation), recurringDonors, topCampaigns, channelBreakdown });
});

router.get("/donations/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [donation] = await db
    .select({
      id: donationsTable.id,
      supporterId: donationsTable.supporterId,
      supporterName: supportersTable.name,
      amount: donationsTable.amount,
      currency: donationsTable.currency,
      donationType: donationsTable.donationType,
      campaign: donationsTable.campaign,
      channel: donationsTable.channel,
      donatedAt: donationsTable.donatedAt,
      receiptIssued: donationsTable.receiptIssued,
      notes: donationsTable.notes,
      createdAt: donationsTable.createdAt,
    })
    .from(donationsTable)
    .leftJoin(supportersTable, eq(donationsTable.supporterId, supportersTable.id))
    .where(eq(donationsTable.id, id));
  if (!donation) { res.status(404).json({ error: "Donation not found" }); return; }
  res.json(donation);
});

router.patch("/donations/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const body = req.body as Record<string, unknown>;
  const updates: Record<string, unknown> = {};
  for (const f of ["amount", "campaign", "channel", "receiptIssued", "notes"]) {
    if (body[f] !== undefined) updates[f] = body[f];
  }
  const [d] = await db.update(donationsTable).set(updates).where(eq(donationsTable.id, id)).returning();
  if (!d) { res.status(404).json({ error: "Donation not found" }); return; }
  res.json({ ...d, supporterName: null });
});

export default router;
