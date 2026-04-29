"use server";

import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db/drizzle";
import {
  scriptComments,
  scripts,
  scriptCollaborators,
  users,
} from "@/db/schema";
import { sendCommentNotificationEmail } from "@/lib/email";
import { createNotification } from "@/actions/notifications";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

async function hasAccess(scriptId: string, userId: string) {
  const script = await db
    .select({ userId: scripts.userId })
    .from(scripts)
    .where(eq(scripts.id, scriptId))
    .limit(1);
  if (script.length === 0) return false;
  if (script[0].userId === userId) return true;
  const collab = await db
    .select({ id: scriptCollaborators.id })
    .from(scriptCollaborators)
    .where(
      and(
        eq(scriptCollaborators.scriptId, scriptId),
        eq(scriptCollaborators.userId, userId),
      ),
    )
    .limit(1);
  return collab.length > 0;
}

// Check if user can comment (owner or EDITOR only, not VIEWER)
async function canComment(scriptId: string, userId: string) {
  const script = await db
    .select({ userId: scripts.userId })
    .from(scripts)
    .where(eq(scripts.id, scriptId))
    .limit(1);
  if (script.length === 0) return false;
  if (script[0].userId === userId) return true;
  const collab = await db
    .select({ role: scriptCollaborators.role })
    .from(scriptCollaborators)
    .where(
      and(
        eq(scriptCollaborators.scriptId, scriptId),
        eq(scriptCollaborators.userId, userId),
      ),
    )
    .limit(1);
  return collab.length > 0 && collab[0].role === "EDITOR";
}

export async function addComment(scriptId: string, content: string) {
  const userId = await requireAuth();
  if (!(await canComment(scriptId, userId)))
    return { error: "Permission denied." };
  if (!content.trim()) return { error: "Comment cannot be empty." };

  const [inserted] = await db
    .insert(scriptComments)
    .values({ scriptId, userId, content: content.trim() })
    .returning();

  // Fetch commenter info and script info in parallel
  const [commenterUser, script] = await Promise.all([
    db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),
    db
      .select({ userId: scripts.userId, title: scripts.title })
      .from(scripts)
      .where(eq(scripts.id, scriptId))
      .limit(1),
  ]);

  if (script.length > 0 && script[0].userId !== userId) {
    const owner = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, script[0].userId))
      .limit(1);
    const commenterName = commenterUser[0]?.name ?? "Someone";
    if (owner.length > 0) {
      try {
        await sendCommentNotificationEmail(
          owner[0].email,
          owner[0].name,
          commenterName,
          script[0].title,
          content.trim(),
          scriptId,
        );
      } catch {}
      await createNotification(
        script[0].userId,
        "COMMENT_ADDED",
        `${commenterName} commented on "${script[0].title}"`,
        scriptId,
      );
    }
  }

  revalidatePath(`/scripts/${scriptId}`);
  return {
    success: true,
    comment: {
      id: inserted.id,
      content: inserted.content,
      createdAt: inserted.createdAt,
      userId,
      userName: commenterUser[0]?.name ?? "User",
    },
  };
}

export async function getComments(scriptId: string) {
  const userId = await requireAuth();
  if (!(await hasAccess(scriptId, userId))) return [];

  return db
    .select({
      id: scriptComments.id,
      content: scriptComments.content,
      createdAt: scriptComments.createdAt,
      userId: scriptComments.userId,
      userName: users.name,
    })
    .from(scriptComments)
    .innerJoin(users, eq(scriptComments.userId, users.id))
    .where(eq(scriptComments.scriptId, scriptId))
    .orderBy(asc(scriptComments.createdAt));
}

export async function deleteComment(commentId: string) {
  const userId = await requireAuth();

  const comment = await db
    .select({
      userId: scriptComments.userId,
      scriptId: scriptComments.scriptId,
    })
    .from(scriptComments)
    .where(eq(scriptComments.id, commentId))
    .limit(1);
  if (comment.length === 0) return { error: "Comment not found." };

  // Allow deleter if they own the comment or own the script
  const script = await db
    .select({ userId: scripts.userId })
    .from(scripts)
    .where(eq(scripts.id, comment[0].scriptId))
    .limit(1);

  if (comment[0].userId !== userId && script[0]?.userId !== userId) {
    return { error: "Permission denied." };
  }

  await db.delete(scriptComments).where(eq(scriptComments.id, commentId));
  revalidatePath(`/scripts/${comment[0].scriptId}`);
  return { success: true };
}
