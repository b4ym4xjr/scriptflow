import { z } from "zod";

export const signInSchema = z.object({
  email: z.email({ error: "Please enter a valid email address" }),
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters" }),
});

export const signUpSchema = z
  .object({
    name: z.string().min(3, { error: "Name is required" }),
    email: z.email({ error: "Invalid email address" }),
    password: z
      .string()
      .min(8, { error: "Password must be at least 8 characters" })
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
