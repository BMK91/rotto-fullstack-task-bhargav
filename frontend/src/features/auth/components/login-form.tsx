"use client";

import { useState } from "react";
import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  loginSchema,
  type LoginFormValues,
} from "@/features/auth/schemas/login.schema";

interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => Promise<void>;
  serverError?: string | null;
  isSubmitting?: boolean;
}

export function LoginForm({
  onSubmit,
  serverError,
  isSubmitting = false,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: formIsSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "recruiter@acme.test",
      password: "rotto-assessment",
    },
    mode: "onBlur",
  });

  const busy = isSubmitting || formIsSubmitting;

  const inputBaseClass =
    "min-h-12 w-full rounded-xl border bg-background py-3 pl-11 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60";

  const errorInputClass =
    "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/25 dark:border-red-400";

  const normalInputClass =
    "border-input focus-visible:border-primary focus-visible:ring-ring";

  const errorTextClass =
    "mt-1.5 flex items-start gap-1.5 text-sm font-medium text-red-600 dark:text-red-400";

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {/* Email */}
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-foreground"
        >
          Work email
        </label>

        <div className="relative">
          <Mail
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />

          <input
            id="email"
            type="email"
            autoComplete="username"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="you@company.com"
            disabled={busy}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
            className={`${inputBaseClass} ${
              errors.email ? errorInputClass : normalInputClass
            }`}
          />
        </div>

        {errors.email?.message && (
          <p id="email-error" role="alert" className={errorTextClass}>
            <span>{errors.email.message}</span>
          </p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-foreground"
          >
            Password
          </label>
        </div>

        <div className="relative">
          <LockKeyhole
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />

          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            disabled={busy}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
            className={`${inputBaseClass} ${
              errors.password ? errorInputClass : normalInputClass
            } pr-12`}
          />

          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            disabled={busy}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            {showPassword ? (
              <EyeOff size={18} aria-hidden="true" />
            ) : (
              <Eye size={18} aria-hidden="true" />
            )}
          </button>
        </div>

        {errors.password?.message && (
          <p id="password-error" role="alert" className={errorTextClass}>
            <span>{errors.password.message}</span>
          </p>
        )}
      </div>

      {/* Backend authentication error */}
      {serverError && (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
        >
          <span
            aria-hidden="true"
            className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold text-red-700 dark:bg-red-900/70 dark:text-red-200"
          >
            !
          </span>

          <p className="min-w-0 leading-5">{serverError}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={busy}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
      >
        {busy && (
          <LoaderCircle size={18} aria-hidden="true" className="animate-spin" />
        )}

        <span>{busy ? "Signing in..." : "Sign in"}</span>
      </button>
    </form>
  );
}
