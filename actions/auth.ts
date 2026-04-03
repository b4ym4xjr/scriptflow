"use server";

import { hashSync } from "bcryptjs";
import { eq } from "drizzle-orm";
import { signIn } from "@/auth";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { AuthCredentials } from "@/types";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/email";
import { generateToken } from "@/lib/tokens";

export const signInWithCredentials = async (
  params: Pick<AuthCredentials, "email" | "password">,
) => {
  const { email, password } = params;

  try {
    const result = await signIn("credentials", {
      email: email.trim(),
      password,
      redirect: false,
    });
    if (result?.error) {
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("EMAIL_NOT_VERIFIED")) {
      return {
        success: false,
        error: "Please verify your email before signing in.",
      };
    }
    console.log("SignIn Error: ", error);
    return {
      success: false,
      error: "Please check your credentials and try again.",
    };
  }
};

export const signUp = async (params: AuthCredentials) => {
  const { name, email, password } = params;

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email.trim()))
    .limit(1);

  if (existingUser.length > 0) {
    return {
      success: false,
      error: "User already exists",
    };
  }

  const hashedPassword = hashSync(password, 10);
  const verificationToken = generateToken();
  const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  try {
    await db.insert(users).values({
      name,
      email: email.trim(),
      password: hashedPassword,
      verificationToken,
      verificationTokenExpiry,
    });

    await sendVerificationEmail(email.trim(), verificationToken);

    return { success: true };
  } catch (error) {
    console.log("SignUp Error: ", error);
    return { success: false, error: "Failed to create an account." };
  }
};

export const verifyEmail = async (token: string) => {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.verificationToken, token))
    .limit(1);

  if (user.length === 0) {
    return { success: false, error: "Invalid or expired verification link." };
  }

  const { verificationTokenExpiry } = user[0];
  if (!verificationTokenExpiry || verificationTokenExpiry < new Date()) {
    return { success: false, error: "Verification link has expired." };
  }

  await db
    .update(users)
    .set({
      emailVerified: new Date(),
      verificationToken: null,
      verificationTokenExpiry: null,
    })
    .where(eq(users.id, user[0].id));

  return { success: true };
};

export const forgotPassword = async (email: string) => {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email.trim()))
    .limit(1);

  // Always return success to avoid revealing whether an email is registered
  if (user.length === 0) {
    return { success: true };
  }

  const passwordResetToken = generateToken();
  const passwordResetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db
    .update(users)
    .set({ passwordResetToken, passwordResetTokenExpiry })
    .where(eq(users.id, user[0].id));

  try {
    await sendPasswordResetEmail(email.trim(), passwordResetToken);
  } catch (error) {
    console.log("ForgotPassword email error: ", error);
  }

  return { success: true };
};

export const resetPassword = async (token: string, newPassword: string) => {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.passwordResetToken, token))
    .limit(1);

  if (user.length === 0) {
    return { success: false, error: "Invalid or expired reset link." };
  }

  const { passwordResetTokenExpiry } = user[0];
  if (!passwordResetTokenExpiry || passwordResetTokenExpiry < new Date()) {
    return { success: false, error: "Password reset link has expired." };
  }

  const hashedPassword = hashSync(newPassword, 10);

  await db
    .update(users)
    .set({
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetTokenExpiry: null,
    })
    .where(eq(users.id, user[0].id));

  return { success: true };
};
