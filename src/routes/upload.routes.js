import { Router } from "express";
import { uploadImage } from "../controllers/upload.controller.js";

const router = Router();
router.route("/").post(uploadImage);

export default router;