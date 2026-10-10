import { Router } from "express";

import { authenticate } from "@/middleware/authenticate.js";
import { createSearchController } from "./search.controller.js";

const router = Router();

router.use(authenticate);

router.post("/", createSearchController);

export default router;
