import { Router } from "express";
import { login, me, register } from "../controllers/authController.js";
import { loginRules, registerRules } from "../validators/authValidator.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/register", registerRules, validate, register);
router.post("/login", loginRules, validate, login);
router.get("/me", requireAuth, me);

export default router;
