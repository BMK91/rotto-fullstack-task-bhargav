"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { LoginForm } from "@/features/auth/components/login-form";
import type { LoginFormValues } from "@/features/auth/schemas/login.schema";
import {
  authService,
  AuthServiceError,
} from "@/features/auth/services/auth.service";
import { toast } from "@/lib/toast";

export function LoginFormContainer() {
  const router = useRouter();

  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: LoginFormValues): Promise<void> => {
    setServerError(null);
    setIsSubmitting(true);

    try {
      const auth = await authService.login(values);

      toast.success("Logged in successfully.");
      router.replace("/dashboard");
      router.refresh();
    } catch (error: unknown) {
      const message =
        error instanceof AuthServiceError
          ? error.statusCode === 401
            ? "Invalid email or password. Please try again."
            : error.message
          : "Unable to sign in. Please try again.";

      setServerError(null);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LoginForm
      onSubmit={handleSubmit}
      serverError={serverError}
      isSubmitting={isSubmitting}
    />
  );
}
