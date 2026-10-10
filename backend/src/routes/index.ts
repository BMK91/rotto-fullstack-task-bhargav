import { Router } from "express";

import authRoutes from "@/modules/auth/auth.routes.js";
import searchRoutes from "@/modules/search/search.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/search", searchRoutes);

export default router;
