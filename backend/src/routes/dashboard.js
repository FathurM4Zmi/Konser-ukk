import { Router } from "express";
import { getAnalytics, getDashboard, streamDashboard } from "../controllers/dashboardController.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, requireAdmin, getDashboard);
router.get("/analytics", requireAuth, requireAdmin, getAnalytics);
router.get("/stream", requireAuth, requireAdmin, streamDashboard);

export default router;
