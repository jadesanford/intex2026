import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import publicRouter from "./public";
import safehousesRouter from "./safehouses";
import residentsRouter from "./residents";
import supportersRouter from "./supporters";
import donationsRouter from "./donations";
import partnersRouter from "./partners";
import incidentsRouter from "./incidents";
import analyticsRouter from "./analytics";
import socialMediaRouter from "./social_media";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(publicRouter);
router.use(safehousesRouter);
router.use(residentsRouter);
router.use(supportersRouter);
router.use(donationsRouter);
router.use(partnersRouter);
router.use(incidentsRouter);
router.use(analyticsRouter);
router.use(socialMediaRouter);

export default router;
