import { Router, type IRouter } from "express";
import healthRouter from "./health";
import bookingsRouter from "./bookings";
import portfolioRouter from "./portfolio";
import reviewsRouter from "./reviews";
import quotesRouter from "./quotes";
import analyticsRouter from "./analytics";
import jobsRouter from "./jobs";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/bookings", bookingsRouter);
router.use("/portfolio", portfolioRouter);
router.use("/reviews", reviewsRouter);
router.use("/quotes", quotesRouter);
router.use("/analytics", analyticsRouter);
router.use("/jobs", jobsRouter);

export default router;
