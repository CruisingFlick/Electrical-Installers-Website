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
import {
  threadsPublicRouter,
  threadsAdminRouter,
  clickSendWebhookRouter,
} from "./threads";
import { calendarPublicRouter, calendarAdminRouter } from "./calendar";
import { publicFaqsRouter, adminFaqsRouter } from "./faqs";
import { publicPricingRouter, adminPricingRouter } from "./pricing";
import { publicServicePagesRouter, adminServicePagesRouter } from "./service-pages";
import { publicSuburbPagesRouter, adminSuburbPagesRouter } from "./suburb-pages";
import googleReviewsRouter from "./google-reviews";

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
router.use("/webhooks/clicksend", clickSendWebhookRouter);
router.use("/threads", threadsPublicRouter);
router.use("/admin/threads", threadsAdminRouter);
router.use("/analytics", analyticsRouter);
router.use("/jobs", jobsRouter);
router.use("/openai", openaiRouter);
router.use("/blog", publicBlogRouter);
router.use("/admin/blog", adminBlogRouter);
router.use("/calendar", calendarPublicRouter);
router.use("/admin/calendar", calendarAdminRouter);
router.use("/faqs", publicFaqsRouter);
router.use("/admin/faqs", adminFaqsRouter);
router.use("/pricing", publicPricingRouter);
router.use("/admin/pricing", adminPricingRouter);
router.use("/service-pages", publicServicePagesRouter);
router.use("/admin/service-pages", adminServicePagesRouter);
router.use("/suburb-pages", publicSuburbPagesRouter);
router.use("/admin/suburb-pages", adminSuburbPagesRouter);
router.use("/google-reviews", googleReviewsRouter);

export default router;
