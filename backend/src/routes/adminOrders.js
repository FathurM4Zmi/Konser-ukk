import { Router } from "express";
import { listOrdersAdmin, verifyOrder } from "../controllers/orderController.js";
import { verifyOrderRules } from "../validators/orderValidator.js";
import { validate } from "../middleware/validate.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/", listOrdersAdmin);
router.patch("/:id/verify", verifyOrderRules, validate, verifyOrder);

export default router;
