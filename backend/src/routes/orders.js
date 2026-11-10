import { Router } from "express";
import {
  cancelOrder,
  createOrder,
  getOrderDetail,
  myOrders,
  orderTickets,
  uploadPayment,
} from "../controllers/orderController.js";
import { createOrderRules } from "../validators/orderValidator.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { uploadImage } from "../middleware/upload.js";

const router = Router();

router.use(requireAuth);

router.post("/", createOrderRules, validate, createOrder);
router.get("/my", myOrders);
router.get("/:id", getOrderDetail);
router.post("/:id/payment", uploadImage.single("payment_proof"), uploadPayment);
router.post("/:id/cancel", cancelOrder);
router.get("/:id/tickets", orderTickets);

export default router;
