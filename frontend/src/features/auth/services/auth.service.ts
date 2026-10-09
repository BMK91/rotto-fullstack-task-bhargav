import { z } from "zod";

import {
  authResponseSchema,
  type AuthResponse,
} from "@/features/auth/schemas/auth-response.schema";
import {
  loginSchema,
  type LoginFormValues,
} from "@/features/auth/schemas/login.schema";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

const apiErrorSchema = z.object({
  message: z.string().optional(),
  error: z
    .object({
      message: z.string().optional(),
      code: z.string().optional(),
    })
    .optional(),
});

export class AuthServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "AuthServiceError";
  }
}

export const authService = {
  async login(input: LoginFormValues): Promise<AuthResponse> {
    const credentials = loginSchema.parse(input);

    if (!apiBaseUrl) {
      throw new AuthServiceError(
        "The authentication service is not configured.",
      );
    }

    let response: Response;

    try {
      response = await fetch(`/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(credentials),
        cache: "no-store",
        // credentials: "include",
      });
    } catch {
      throw new AuthServiceError(
        "Unable to connect to the server. Please try again.",
      );
    }

    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const parsedError = apiErrorSchema.safeParse(payload);

      const message = parsedError.success
        ? (parsedError.data.message ??
          parsedError.data.error?.message ??
          "Unable to sign in. Check your credentials and try again.")
        : "Unable to sign in. Check your credentials and try again.";

      const code = parsedError.success
        ? parsedError.data.error?.code
        : undefined;

      throw new AuthServiceError(message, response.status, code);
    }

    const parsedResponse = authResponseSchema.safeParse(payload);

    if (!parsedResponse.success) {
      throw new AuthServiceError(
        "The server returned an invalid authentication response.",
        response.status,
      );
    }

    if (!parsedResponse.data.success) {
      throw new AuthServiceError("Login failed.", response.status);
    }

    return parsedResponse.data;
  },
};
