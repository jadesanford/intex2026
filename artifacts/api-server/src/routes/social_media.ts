import { Router, type IRouter } from "express";
import { db, socialMediaPostsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/social-media", async (req, res): Promise<void> => {
  const posts = await db.select().from(socialMediaPostsTable).orderBy(socialMediaPostsTable.postDate);
  res.json(posts);
});

router.post("/social-media", async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const [post] = await db.insert(socialMediaPostsTable).values({
    platform: body.platform as string,
    postDate: body.postDate as string,
    contentType: (body.contentType as string) ?? null,
    caption: (body.caption as string) ?? null,
    reach: (body.reach as number) ?? null,
    likes: (body.likes as number) ?? null,
    shares: (body.shares as number) ?? null,
    donationsLinked: (body.donationsLinked as number) ?? null,
    donationAmountLinked: (body.donationAmountLinked as number) ?? null,
    campaignTag: (body.campaignTag as string) ?? null,
  }).returning();
  res.status(201).json(post);
});

router.patch("/social-media/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const body = req.body as Record<string, unknown>;
  const updates: Record<string, unknown> = {};
  for (const f of ["reach", "likes", "shares", "donationsLinked", "donationAmountLinked", "campaignTag", "caption"]) {
    if (body[f] !== undefined) updates[f] = body[f];
  }
  const [p] = await db.update(socialMediaPostsTable).set(updates).where(eq(socialMediaPostsTable.id, id)).returning();
  if (!p) { res.status(404).json({ error: "Post not found" }); return; }
  res.json(p);
});

export default router;
