import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import profileRouter from "./profile";
import schemesRouter from "./schemes";
import trackerRouter from "./tracker";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(profileRouter);
router.use(schemesRouter);
router.use(trackerRouter);
router.use(dashboardRouter);

export default router;
