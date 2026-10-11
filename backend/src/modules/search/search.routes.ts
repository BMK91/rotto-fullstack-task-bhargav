import { Router } from "express";

import { authenticate } from "@/middleware/authenticate.js";
import {
  createSearchController,
  getSearchPageController,
} from "./search.controller.js";

const router = Router();

router.use(authenticate);

router.post("/", createSearchController);
router.get("/:search_id", getSearchPageController);

export default router;
