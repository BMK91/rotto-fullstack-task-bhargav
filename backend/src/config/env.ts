import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required"),

  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must contain at least 32 characters"),

  LLM_API_KEY: z.string().optional(),

  LLM_MODEL: z.string().optional(),

  STRIPE_WEBHOOK_SECRET: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment configuration:");

  console.error(
    z.prettifyError(parsedEnv.error),
  );

  process.exit(1);
}

export const env = parsedEnv.data;