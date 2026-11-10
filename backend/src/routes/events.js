import { Router } from "express";
import {
  createEvent,
  deleteEvent,
  getEventAdmin,
  getEventPublic,
  listEventsAdmin,
  listEventsPublic,
  setSalesStatus,
  updateEvent,
} from "../controllers/eventController.js";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "../controllers/categoryController.js";
import { eventRules, salesStatusRules } from "../validators/eventValidator.js";
import { categoryRules } from "../validators/categoryValidator.js";
import { validate } from "../middleware/validate.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";

const router = Router();

// --- publik (dipakai aplikasi mobile) ---
router.get("/", listEventsPublic);
router.get("/:id", getEventPublic);

// --- admin (web) ---
router.get("/admin/all", requireAuth, requireAdmin, listEventsAdmin);
router.get("/admin/:id", requireAuth, requireAdmin, getEventAdmin);
router.post("/admin", requireAuth, requireAdmin, eventRules, validate, createEvent);
router.put("/admin/:id", requireAuth, requireAdmin, eventRules, validate, updateEvent);
router.delete("/admin/:id", requireAuth, requireAdmin, deleteEvent);
router.patch("/admin/:id/sales-status", requireAuth, requireAdmin, salesStatusRules, validate, setSalesStatus);

// --- kategori tiket per konser (admin) ---
router.get("/:eventId/categories", requireAuth, requireAdmin, listCategories);
router.post("/:eventId/categories", requireAuth, requireAdmin, categoryRules, validate, createCategory);
router.put("/categories/:id", requireAuth, requireAdmin, categoryRules, validate, updateCategory);
router.delete("/categories/:id", requireAuth, requireAdmin, deleteCategory);

export default router;
