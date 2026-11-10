"use server";

import { hash } from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { after } from "next/server";
import { signIn } from "@/auth";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { AuthCredentials } from "@/types";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/email";
import { generateToken, hashToken, isTokenFormat } from "@/lib/tokens";
import {
  getClientIp,
  rateLimit,
  tooManyRequests,
} from "@/lib/rate-limit";
import {
  emailSchema,
  passwordSchema,
  signUpServerSchema,
} from "@/lib/validations";

const BCRYPT_COST = 12;
const HOUR = 60 * 60 * 1000;

const normalizeEmail = (email: string) => email.trim().toLowerCase();

/** Case-insensitive lookup (legacy rows may have mixed-case emails). */
async function findUserByEmail(email: string) {
  const rows = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = ${normalizeEmail(email)}`)
    .limit(1);
  return rows[0];
}

/** Auth.js wraps errors thrown from `authorize`; look at the cause as well. */
function errorText(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const cause = (error as { cause?: { err?: unknown } }).cause?.err;
  return `${error.message} ${cause instanceof Error ? cause.message : ""}`;
}

export const signInWithCredentials = async (
  params: Pick<AuthCredentials, "email" | "password">,
) => {
  const email = typeof params?.email === "string" ? params.email : "";
  const password = typeof params?.password === "string" ? params.password : "";

  try {
    const result = await signIn("credentials", {
      email: email.trim(),
      password,
      redirect: false,
    });
    if (result?.error) {
      return { success: false, error: "Please check your credentials and try again." };
    }
    return { success: true };
  } catch (error: unknown) {
    const text = errorText(error);
    if (text.includes("EMAIL_NOT_VERIFIED")) {
      return {
        success: false,
        error: "Please verify your email before signing in.",
      };
    }
    if (text.includes("RATE_LIMITED")) {
      return {
        success: false,
        error: "Too many sign-in attempts. Please wait a few minutes and try again.",
      };
    }
    console.error("SignIn failed:", error instanceof Error ? error.name : "unknown");
    return {
      success: false,
      error: "Please check your credentials and try again.",
    };
  }
};

export const signUp = async (params: AuthCredentials) => {
  // The client form validates too, but server actions are public endpoints:
  // never trust that the browser ran those checks.
  const parsed = signUpServerSchema.safeParse(params);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  const { name } = parsed.data;
  const email = normalizeEmail(parsed.data.email);
  const { password } = parsed.data;

  const ip = await getClientIp();
  const byIp = rateLimit(`signup:ip:${ip}`, 8, HOUR);
  const byEmail = rateLimit(`signup:email:${email}`, 4, HOUR);
  if (!byIp.ok || !byEmail.ok) {
    return {
      success: false,
      error: tooManyRequests(Math.max(byIp.retryAfter, byEmail.retryAfter)),
    };
  }

  const existingUser = await findUserByEmail(email);

  if (existingUser?.emailVerified) {
    return { success: false, error: "User already exists" };
  }

  const hashedPassword = await hash(password, BCRYPT_COST);
  const verificationToken = generateToken();
  const verificationTokenExpiry = new Date(Date.now() + 24 * HOUR);

  try {
    if (existingUser) {
      // An *unverified* account for this address already exists. Whoever
      // registered it never proved they own the mailbox, so the latest
      // registration wins. This stops an attacker from pre-registering a
      // victim's email with a password they know and waiting for the victim
      // to click a verification link.
      await db
        .update(users)
        .set({
          name,
          password: hashedPassword,
          verificationToken: hashToken(verificationToken),
          verificationTokenExpiry,
          passwordResetToken: null,
          passwordResetTokenExpiry: null,
        })
        .where(eq(users.id, existingUser.id));
    } else {
      await db.insert(users).values({
        name,
        email,
        password: hashedPassword,
        verificationToken: hashToken(verificationToken),
        verificationTokenExpiry,
      });
    }

    await sendVerificationEmail(email, verificationToken);

    return { success: true };
  } catch (error) {
    console.error("SignUp failed:", error instanceof Error ? error.name : "unknown");
    return { success: false, error: "Failed to create an account." };
  }
};

export const verifyEmail = async (token: string) => {
  const ip = await getClientIp();
  if (!rateLimit(`verify:ip:${ip}`, 30, HOUR).ok) {
    return { success: false, error: "Too many attempts. Please try again later." };
  }
  if (!isTokenFormat(token)) {
    return { success: false, error: "Invalid or expired verification link." };
  }

  const user = await db
    .select()
    .from(users)
    .where(eq(users.verificationToken, hashToken(token)))
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
  // Same response and (roughly) same work whether or not the address exists,
  // so neither the reply nor its timing reveals who has an account.
  const parsed = emailSchema.safeParse(typeof email === "string" ? email.trim() : "");
  if (!parsed.success) return { success: true };
  const address = normalizeEmail(parsed.data);

  const ip = await getClientIp();
  const byIp = rateLimit(`forgot:ip:${ip}`, 10, HOUR);
  const byEmail = rateLimit(`forgot:email:${address}`, 3, HOUR);
  if (!byIp.ok || !byEmail.ok) {
    // Silently drop: also prevents using this form to mail-bomb someone.
    return { success: true };
  }

  const user = await findUserByEmail(address);
  if (!user) return { success: true };

  const passwordResetToken = generateToken();
  const passwordResetTokenExpiry = new Date(Date.now() + HOUR);

  await db
    .update(users)
    .set({
      passwordResetToken: hashToken(passwordResetToken),
      passwordResetTokenExpiry,
    })
    .where(eq(users.id, user.id));

  // Send after the response so email latency isn't observable by the caller.
  after(async () => {
    try {
      await sendPasswordResetEmail(user.email, passwordResetToken);
    } catch (error) {
      console.error("ForgotPassword email failed:", error instanceof Error ? error.name : "unknown");
    }
  });

  return { success: true };
};

export const resetPassword = async (token: string, newPassword: string) => {
  const ip = await getClientIp();
  if (!rateLimit(`reset:ip:${ip}`, 10, HOUR).ok) {
    return { success: false, error: "Too many attempts. Please try again later." };
  }
  if (!isTokenFormat(token)) {
    return { success: false, error: "Invalid or expired reset link." };
  }

  // Server-side password policy (the form's checks are not a security control).
  const policy = passwordSchema.safeParse(newPassword);
  if (!policy.success) {
    return { success: false, error: policy.error.issues[0].message };
  }

  const user = await db
    .select()
    .from(users)
    .where(eq(users.passwordResetToken, hashToken(token)))
    .limit(1);

  if (user.length === 0) {
    return { success: false, error: "Invalid or expired reset link." };
  }

  const { passwordResetTokenExpiry } = user[0];
  if (!passwordResetTokenExpiry || passwordResetTokenExpiry < new Date()) {
    return { success: false, error: "Password reset link has expired." };
  }

  const hashedPassword = await hash(policy.data, BCRYPT_COST);

  await db
    .update(users)
    .set({
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetTokenExpiry: null,
      // Receiving the reset email proves control of the mailbox, which also
      // settles any pending verification (and voids a pre-registered password).
      emailVerified: user[0].emailVerified ?? new Date(),
      verificationToken: null,
      verificationTokenExpiry: null,
    })
    .where(eq(users.id, user[0].id));

  return { success: true };
};
