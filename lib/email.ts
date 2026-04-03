import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL ?? "noreply@scriptflow.app";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${APP_URL}/verify-email?token=${token}`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Verify your ScriptFlow account",
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
        <h2 style="font-size:24px;font-weight:700;color:#111;margin-bottom:8px;">Verify your email</h2>
        <p style="color:#555;margin-bottom:24px;">Thanks for signing up for ScriptFlow! Click the button below to verify your email address and activate your account.</p>
        <a href="${verifyUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px;">Verify email</a>
        <p style="color:#888;font-size:13px;margin-top:24px;">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
        <p style="color:#aaa;font-size:12px;">ScriptFlow &mdash; Task Management Platform</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Reset your ScriptFlow password",
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
        <h2 style="font-size:24px;font-weight:700;color:#111;margin-bottom:8px;">Reset your password</h2>
        <p style="color:#555;margin-bottom:24px;">We received a request to reset your ScriptFlow password. Click the button below to choose a new password.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px;">Reset password</a>
        <p style="color:#888;font-size:13px;margin-top:24px;">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
        <p style="color:#aaa;font-size:12px;">ScriptFlow &mdash; Task Management Platform</p>
      </div>
    `,
  });
}
