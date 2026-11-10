import { Router } from "express";
import {
  createArtist,
  deleteArtist,
  getArtist,
  listArtists,
  updateArtist,
} from "../controllers/artistController.js";
import { artistRules } from "../validators/artistValidator.js";
import { validate } from "../middleware/validate.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/", listArtists);
router.get("/:id", getArtist);
router.post("/", artistRules, validate, createArtist);
router.put("/:id", artistRules, validate, updateArtist);
router.delete("/:id", deleteArtist);

export default router;
