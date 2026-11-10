import { z } from "zod";

/* ------------------------------------------------------------------ */
/* Limits shared by client forms AND server actions                    */
/* ------------------------------------------------------------------ */

export const LIMITS = {
  email: 254,
  name: 100,
  /** bcrypt only uses the first 72 bytes, so longer passwords add nothing. */
  password: 72,
  title: 200,
  description: 2_000,
  tags: 500,
  thumbnailNotes: 2_000,
  /** Rich-text HTML for one script. */
  content: 500_000,
  comment: 5_000,
} as const;

export const emailSchema = z
  .email({ error: "Please enter a valid email address" })
  .max(LIMITS.email, { error: "Email is too long" });

export const passwordSchema = z
  .string()
  .min(8, { error: "Password must be at least 8 characters" })
  .max(LIMITS.password, {
    error: `Password must be at most ${LIMITS.password} characters`,
  })
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain at least one uppercase letter, one lowercase letter, and one number",
  );

export const signInSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters" })
    .max(LIMITS.password, { error: "Password is too long" }),
});

export const signUpSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, { error: "Name is required" })
      .max(LIMITS.name, { error: "Name is too long" }),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

/** Server-side only: what the sign-up action actually needs. */
export const signUpServerSchema = z.object({
  name: signUpSchema.shape.name,
  email: emailSchema,
  password: passwordSchema,
});
