import { Router, type IRouter } from "express";
import {
  db,
  residentsTable,
  safehousesTable,
  processRecordingsTable,
  homeVisitationsTable,
  healthWellbeingRecordsTable,
  educationRecordsTable,
  interventionPlansTable,
} from "@workspace/db";
import { eq, ilike, sql, and, count, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/residents", async (req, res): Promise<void> => {
  const page = parseInt((req.query.page as string) ?? "1", 10);
  const limit = parseInt((req.query.limit as string) ?? "20", 10);
  const status = req.query.status as string | undefined;
  const safehouseId = req.query.safehouseId ? parseInt(req.query.safehouseId as string, 10) : undefined;
  const riskLevel = req.query.riskLevel as string | undefined;
  const search = req.query.search as string | undefined;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (status) conditions.push(eq(residentsTable.status, status));
  if (safehouseId) conditions.push(eq(residentsTable.safehouseId, safehouseId));
  if (riskLevel) conditions.push(eq(residentsTable.riskLevel, riskLevel));
  if (search) conditions.push(ilike(residentsTable.caseCode, `%${search}%`));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalResult, rows] = await Promise.all([
    db.select({ count: count() }).from(residentsTable).where(where),
    db.select({
      id: residentsTable.id,
      caseCode: residentsTable.caseCode,
      safehouseId: residentsTable.safehouseId,
      safehouseName: safehousesTable.name,
      age: residentsTable.age,
      admissionDate: residentsTable.admissionDate,
      status: residentsTable.status,
      riskLevel: residentsTable.riskLevel,
      caseCategory: residentsTable.caseCategory,
      referralSource: residentsTable.referralSource,
      reintegrationProgress: residentsTable.reintegrationProgress,
      notes: residentsTable.notes,
      createdAt: residentsTable.createdAt,
      updatedAt: residentsTable.updatedAt,
    })
      .from(residentsTable)
      .leftJoin(safehousesTable, eq(residentsTable.safehouseId, safehousesTable.id))
      .where(where)
      .orderBy(desc(residentsTable.createdAt))
      .limit(limit)
      .offset(offset),
  ]);

  const total = Number(totalResult[0]?.count ?? 0);
  res.json({ data: rows, total, page, limit, totalPages: Math.ceil(total / limit) });
});

router.post("/residents", async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const [resident] = await db.insert(residentsTable).values({
    caseCode: body.caseCode as string,
    safehouseId: (body.safehouseId as number) ?? null,
    age: (body.age as number) ?? null,
    admissionDate: (body.admissionDate as string) ?? null,
    status: (body.status as string) ?? "active",
    riskLevel: (body.riskLevel as string) ?? "medium",
    caseCategory: (body.caseCategory as string) ?? null,
    referralSource: (body.referralSource as string) ?? null,
    reintegrationProgress: (body.reintegrationProgress as number) ?? 0,
    notes: (body.notes as string) ?? null,
  }).returning();
  res.status(201).json({ ...resident, safehouseName: null });
});

router.get("/residents/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [resident] = await db
    .select({
      id: residentsTable.id,
      caseCode: residentsTable.caseCode,
      safehouseId: residentsTable.safehouseId,
      safehouseName: safehousesTable.name,
      age: residentsTable.age,
      admissionDate: residentsTable.admissionDate,
      status: residentsTable.status,
      riskLevel: residentsTable.riskLevel,
      caseCategory: residentsTable.caseCategory,
      referralSource: residentsTable.referralSource,
      reintegrationProgress: residentsTable.reintegrationProgress,
      notes: residentsTable.notes,
      createdAt: residentsTable.createdAt,
      updatedAt: residentsTable.updatedAt,
    })
    .from(residentsTable)
    .leftJoin(safehousesTable, eq(residentsTable.safehouseId, safehousesTable.id))
    .where(eq(residentsTable.id, id));

  if (!resident) { res.status(404).json({ error: "Resident not found" }); return; }
  res.json(resident);
});

router.patch("/residents/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const body = req.body as Record<string, unknown>;
  const updates: Record<string, unknown> = {};
  const fields = ["safehouseId", "age", "admissionDate", "status", "riskLevel", "caseCategory", "referralSource", "reintegrationProgress", "notes"];
  for (const f of fields) {
    if (body[f] !== undefined) updates[f] = body[f];
  }
  const [resident] = await db.update(residentsTable).set(updates).where(eq(residentsTable.id, id)).returning();
  if (!resident) { res.status(404).json({ error: "Resident not found" }); return; }
  res.json({ ...resident, safehouseName: null });
});

router.delete("/residents/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [r] = await db.delete(residentsTable).where(eq(residentsTable.id, id)).returning();
  if (!r) { res.status(404).json({ error: "Resident not found" }); return; }
  res.sendStatus(204);
});

router.get("/residents/:id/risk-indicators", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [resident] = await db.select().from(residentsTable).where(eq(residentsTable.id, id));
  if (!resident) { res.status(404).json({ error: "Resident not found" }); return; }

  const sessions = await db.select().from(processRecordingsTable).where(eq(processRecordingsTable.residentId, id));
  const daysSinceLastSession = sessions.length > 0
    ? Math.floor((Date.now() - new Date(sessions[sessions.length - 1].sessionDate).getTime()) / 86400000)
    : 99;

  const riskScoreMap: Record<string, number> = { low: 25, medium: 50, high: 75, critical: 95 };
  const riskScore = riskScoreMap[resident.riskLevel] ?? 50;

  const positive: string[] = [];
  const concerns: string[] = [];
  const actions: string[] = [];

  if (resident.reintegrationProgress && resident.reintegrationProgress > 60) positive.push("Strong reintegration progress");
  if (sessions.length > 3) positive.push("Consistent counseling attendance");
  if (resident.status === "reintegrated") positive.push("Successfully reintegrated");

  if (resident.riskLevel === "high" || resident.riskLevel === "critical") concerns.push("Elevated risk level");
  if (daysSinceLastSession > 14) concerns.push(`No counseling session in ${daysSinceLastSession} days`);
  if (!resident.reintegrationProgress || resident.reintegrationProgress < 30) concerns.push("Low reintegration progress");

  if (concerns.includes("Elevated risk level")) actions.push("Schedule immediate welfare check");
  if (daysSinceLastSession > 14) actions.push("Schedule counseling session this week");
  if (!resident.reintegrationProgress || resident.reintegrationProgress < 30) actions.push("Review and update intervention plan");

  res.json({
    residentId: id,
    riskScore,
    riskLevel: resident.riskLevel,
    regressionRisk: riskScore > 70 ? "High" : riskScore > 40 ? "Moderate" : "Low",
    reintegrationReadiness: resident.reintegrationProgress && resident.reintegrationProgress > 70 ? "Ready" : "In Progress",
    positiveIndicators: positive,
    concernIndicators: concerns,
    recommendedActions: actions,
  });
});

// Sessions
router.get("/residents/:residentId/sessions", async (req, res): Promise<void> => {
  const residentId = parseInt(Array.isArray(req.params.residentId) ? req.params.residentId[0] : req.params.residentId, 10);
  const sessions = await db.select().from(processRecordingsTable).where(eq(processRecordingsTable.residentId, residentId)).orderBy(desc(processRecordingsTable.sessionDate));
  res.json(sessions);
});

router.post("/residents/:residentId/sessions", async (req, res): Promise<void> => {
  const residentId = parseInt(Array.isArray(req.params.residentId) ? req.params.residentId[0] : req.params.residentId, 10);
  const body = req.body as Record<string, unknown>;
  const [session] = await db.insert(processRecordingsTable).values({
    residentId,
    sessionDate: body.sessionDate as string,
    counselorName: (body.counselorName as string) ?? null,
    sessionType: (body.sessionType as string) ?? null,
    emotionalState: (body.emotionalState as string) ?? null,
    notes: (body.notes as string) ?? null,
    interventionNotes: (body.interventionNotes as string) ?? null,
    followUpActions: (body.followUpActions as string) ?? null,
  }).returning();
  res.status(201).json(session);
});

router.patch("/sessions/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const body = req.body as Record<string, unknown>;
  const updates: Record<string, unknown> = {};
  for (const f of ["sessionDate", "counselorName", "sessionType", "emotionalState", "notes", "interventionNotes", "followUpActions"]) {
    if (body[f] !== undefined) updates[f] = body[f];
  }
  const [s] = await db.update(processRecordingsTable).set(updates).where(eq(processRecordingsTable.id, id)).returning();
  if (!s) { res.status(404).json({ error: "Session not found" }); return; }
  res.json(s);
});

router.delete("/sessions/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [s] = await db.delete(processRecordingsTable).where(eq(processRecordingsTable.id, id)).returning();
  if (!s) { res.status(404).json({ error: "Session not found" }); return; }
  res.sendStatus(204);
});

// Visitations
router.get("/residents/:residentId/visitations", async (req, res): Promise<void> => {
  const residentId = parseInt(Array.isArray(req.params.residentId) ? req.params.residentId[0] : req.params.residentId, 10);
  const visits = await db.select().from(homeVisitationsTable).where(eq(homeVisitationsTable.residentId, residentId)).orderBy(desc(homeVisitationsTable.visitDate));
  res.json(visits);
});

router.post("/residents/:residentId/visitations", async (req, res): Promise<void> => {
  const residentId = parseInt(Array.isArray(req.params.residentId) ? req.params.residentId[0] : req.params.residentId, 10);
  const body = req.body as Record<string, unknown>;
  const [visit] = await db.insert(homeVisitationsTable).values({
    residentId,
    visitDate: body.visitDate as string,
    visitorName: (body.visitorName as string) ?? null,
    visitType: (body.visitType as string) ?? null,
    observations: (body.observations as string) ?? null,
    safetyConcerns: (body.safetyConcerns as string) ?? null,
    followUpActions: (body.followUpActions as string) ?? null,
    nextVisitDate: (body.nextVisitDate as string) ?? null,
  }).returning();
  res.status(201).json(visit);
});

router.patch("/visitations/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const body = req.body as Record<string, unknown>;
  const updates: Record<string, unknown> = {};
  for (const f of ["visitDate", "visitorName", "visitType", "observations", "safetyConcerns", "followUpActions", "nextVisitDate"]) {
    if (body[f] !== undefined) updates[f] = body[f];
  }
  const [v] = await db.update(homeVisitationsTable).set(updates).where(eq(homeVisitationsTable.id, id)).returning();
  if (!v) { res.status(404).json({ error: "Visitation not found" }); return; }
  res.json(v);
});

// Health records
router.get("/residents/:residentId/health-records", async (req, res): Promise<void> => {
  const residentId = parseInt(Array.isArray(req.params.residentId) ? req.params.residentId[0] : req.params.residentId, 10);
  const records = await db.select().from(healthWellbeingRecordsTable).where(eq(healthWellbeingRecordsTable.residentId, residentId)).orderBy(desc(healthWellbeingRecordsTable.recordDate));
  res.json(records);
});

router.post("/residents/:residentId/health-records", async (req, res): Promise<void> => {
  const residentId = parseInt(Array.isArray(req.params.residentId) ? req.params.residentId[0] : req.params.residentId, 10);
  const body = req.body as Record<string, unknown>;
  const [record] = await db.insert(healthWellbeingRecordsTable).values({
    residentId,
    recordDate: body.recordDate as string,
    physicalHealthStatus: (body.physicalHealthStatus as string) ?? null,
    mentalHealthStatus: (body.mentalHealthStatus as string) ?? null,
    traumaScore: (body.traumaScore as number) ?? null,
    wellbeingScore: (body.wellbeingScore as number) ?? null,
    medicalNotes: (body.medicalNotes as string) ?? null,
    counselorNotes: (body.counselorNotes as string) ?? null,
  }).returning();
  res.status(201).json(record);
});

// Education records
router.get("/residents/:residentId/education-records", async (req, res): Promise<void> => {
  const residentId = parseInt(Array.isArray(req.params.residentId) ? req.params.residentId[0] : req.params.residentId, 10);
  const records = await db.select().from(educationRecordsTable).where(eq(educationRecordsTable.residentId, residentId));
  res.json(records);
});

router.post("/residents/:residentId/education-records", async (req, res): Promise<void> => {
  const residentId = parseInt(Array.isArray(req.params.residentId) ? req.params.residentId[0] : req.params.residentId, 10);
  const body = req.body as Record<string, unknown>;
  const [record] = await db.insert(educationRecordsTable).values({
    residentId,
    programType: (body.programType as string) ?? null,
    institution: (body.institution as string) ?? null,
    enrollmentDate: (body.enrollmentDate as string) ?? null,
    status: (body.status as string) ?? null,
    progressNotes: (body.progressNotes as string) ?? null,
    completionDate: (body.completionDate as string) ?? null,
  }).returning();
  res.status(201).json(record);
});

// Intervention plans
router.get("/residents/:residentId/interventions", async (req, res): Promise<void> => {
  const residentId = parseInt(Array.isArray(req.params.residentId) ? req.params.residentId[0] : req.params.residentId, 10);
  const plans = await db.select().from(interventionPlansTable).where(eq(interventionPlansTable.residentId, residentId)).orderBy(desc(interventionPlansTable.planDate));
  res.json(plans);
});

router.post("/residents/:residentId/interventions", async (req, res): Promise<void> => {
  const residentId = parseInt(Array.isArray(req.params.residentId) ? req.params.residentId[0] : req.params.residentId, 10);
  const body = req.body as Record<string, unknown>;
  const [plan] = await db.insert(interventionPlansTable).values({
    residentId,
    planDate: body.planDate as string,
    interventionType: (body.interventionType as string) ?? null,
    goals: (body.goals as string) ?? null,
    strategies: (body.strategies as string) ?? null,
    timeline: (body.timeline as string) ?? null,
    status: (body.status as string) ?? null,
    outcome: (body.outcome as string) ?? null,
  }).returning();
  res.status(201).json(plan);
});

export default router;
