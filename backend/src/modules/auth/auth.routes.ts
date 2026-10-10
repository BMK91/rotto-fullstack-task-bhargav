import { Router } from "express";

import { authenticate } from "@/middleware/authenticate.js";
import { getMeController, loginController } from "./auth.controller.js";

const router = Router();

router.post("/login", loginController);
router.get("/me", authenticate, getMeController);

export default router;
