import { Router } from "express";

import { authenticate } from "@/middleware/authenticate.js";

import {
  addCandidateController,
  createShortlistController,
  deleteShortlistController,
  getShortlistDetailsController,
  getShortlistsController,
  removeCandidateController,
} from "./shortlist.controller.js";

const router = Router();

router.use(authenticate);

router.post("/", createShortlistController);
router.get("/", getShortlistsController);
router.get("/:id", getShortlistDetailsController);
router.post("/:id/candidates", addCandidateController);
router.delete("/:id/candidates/:candidateId", removeCandidateController);
router.delete("/:id", deleteShortlistController);

export default router;

