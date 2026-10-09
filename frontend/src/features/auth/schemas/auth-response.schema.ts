import { z } from "zod";

export const authResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.object({
    // accessToken: z.string().min(1),
    // refreshToken: z.string().min(1),
    // tokenType: z.literal("bearer"),
    // expiresIn: z.number().int().positive(),
    recruiter: z.object({
      id: z.string().uuid(),
      email: z.string().email(),
      companyId: z.string().uuid(),
    }),
  }),
});

export type AuthResponse = z.infer<typeof authResponseSchema>;
