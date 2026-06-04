import { Router, type IRouter } from "express";
import healthRouter from "./health";
import bookingsRouter from "./bookings";
import portfolioRouter from "./portfolio";
import reviewsRouter from "./reviews";
import quotesRouter from "./quotes";
import analyticsRouter from "./analytics";
import jobsRouter from "./jobs";
import adminLoginRouter from "./admin-login";
import openaiRouter from "./openai";
import aiSettingsRouter from "./ai-settings";
import mediaRouter from "./media";
import customersRouter from "./customers";
import { publicBlogRouter, adminBlogRouter } from "./blog";
import settingsRouter from "./settings";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/admin", adminLoginRouter);
router.use("/admin", aiSettingsRouter);
router.use("/admin/media", mediaRouter);
router.use("/admin/customers", customersRouter);
router.use("/admin/settings", settingsRouter);
router.use("/bookings", bookingsRouter);
router.use("/portfolio", portfolioRouter);
router.use("/reviews", reviewsRouter);
router.use("/quotes", quotesRouter);
router.use("/analytics", analyticsRouter);
router.use("/jobs", jobsRouter);
router.use("/openai", openaiRouter);
router.use("/blog", publicBlogRouter);
router.use("/admin/blog", adminBlogRouter);

export default router;
