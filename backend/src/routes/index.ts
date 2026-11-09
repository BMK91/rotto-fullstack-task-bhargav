import { Router } from "express";

import authRoutes from "@/modules/auth/auth.routes.js";
import searchRoutes from "@/modules/search/search.routes.js";
import shortlistRoutes from "@/modules/shortlist/shortlist.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/search", searchRoutes);
router.use("/shortlists", shortlistRoutes);

export default router;
