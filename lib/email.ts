import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL ?? "noreply@scriptflow.app";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Escape HTML to prevent XSS/injection in email templates
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

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

export async function sendCollaboratorAddedEmail(
  email: string,
  recipientName: string,
  ownerName: string,
  scriptTitle: string,
  role: string,
  scriptId: string,
) {
  const scriptUrl = `${APP_URL}/scripts/${scriptId}`;
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `You've been added as a collaborator on "${scriptTitle}"`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
        <h2 style="font-size:24px;font-weight:700;color:#111;margin-bottom:8px;">You're now a collaborator</h2>
        <p style="color:#555;margin-bottom:24px;">Hi ${escapeHtml(recipientName)}, <strong>${escapeHtml(ownerName)}</strong> added you as a <strong>${escapeHtml(role.toLowerCase())}</strong> on the script "<strong>${escapeHtml(scriptTitle)}</strong>".</p>
        <a href="${scriptUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px;">View script</a>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
        <p style="color:#aaa;font-size:12px;">ScriptFlow &mdash; Task Management Platform</p>
      </div>
    `,
  });
}

export async function sendStatusChangeEmail(
  email: string,
  recipientName: string,
  scriptTitle: string,
  newStatus: string,
  scriptId: string,
) {
  const scriptUrl = `${APP_URL}/scripts/${scriptId}`;
  const label = newStatus
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Script status updated: "${scriptTitle}"`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
        <h2 style="font-size:24px;font-weight:700;color:#111;margin-bottom:8px;">Script status updated</h2>
        <p style="color:#555;margin-bottom:24px;">Hi ${escapeHtml(recipientName)}, the script "<strong>${escapeHtml(scriptTitle)}</strong>" has been moved to <strong>${escapeHtml(label)}</strong>.</p>
        <a href="${scriptUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px;">View script</a>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
        <p style="color:#aaa;font-size:12px;">ScriptFlow &mdash; Task Management Platform</p>
      </div>
    `,
  });
}

export async function sendCommentNotificationEmail(
  email: string,
  recipientName: string,
  commenterName: string,
  scriptTitle: string,
  commentContent: string,
  scriptId: string,
) {
  const scriptUrl = `${APP_URL}/scripts/${scriptId}`;
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `New comment on "${scriptTitle}"`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
        <h2 style="font-size:24px;font-weight:700;color:#111;margin-bottom:8px;">New comment</h2>
        <p style="color:#555;margin-bottom:8px;">Hi ${escapeHtml(recipientName)}, <strong>${escapeHtml(commenterName)}</strong> commented on "<strong>${escapeHtml(scriptTitle)}</strong>":</p>
        <blockquote style="border-left:3px solid #ddd;margin:0 0 24px;padding:8px 16px;color:#444;">${escapeHtml(commentContent)}</blockquote>
        <a href="${scriptUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px;">View script</a>
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
