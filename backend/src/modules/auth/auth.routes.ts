import { Router } from "express";

import { authenticate } from "@/middleware/authenticate.js";
import { loginController } from "./auth.controller.js";

const router = Router();

router.post("/login", loginController);

router.get("/me", authenticate, (req, res) => {
  if (!req.recruiter) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
      code: "UNAUTHORIZED",
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: "Recruiter fetched successfully",
    data: {
      id: req.recruiter.id,
      email: req.recruiter.email,
      companyId: req.recruiter.companyId,
    },
  });
});

export default router;
