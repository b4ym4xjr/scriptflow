"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db/drizzle";
import { scriptCollaborators, scripts, users } from "@/db/schema";
import type { CollaboratorRole } from "@/db/schema";
import { sendCollaboratorAddedEmail } from "@/lib/email";
import { createNotification } from "@/actions/notifications";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

async function requireOwner(scriptId: string, userId: string) {
  const script = await db
    .select({ userId: scripts.userId })
    .from(scripts)
    .where(eq(scripts.id, scriptId))
    .limit(1);

  return !(script.length === 0 || script[0].userId !== userId);
}

export async function addCollaborator(
  scriptId: string,
  email: string,
  role: CollaboratorRole,
) {
  const currentUserId = await requireAuth();

  if (!(await requireOwner(scriptId, currentUserId))) {
    return { error: "Only the script owner can add collaborators." };
  }

  // Find the user by email (case-insensitive)
  const targetUser = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(sql`lower(${users.email}) = ${email.trim().toLowerCase()}`)
    .limit(1);

  if (targetUser.length === 0) {
    return { error: "No user found with that email address." };
  }

  if (targetUser[0].id === currentUserId) {
    return { error: "You cannot add yourself as a collaborator." };
  }

  // Check if already a collaborator
  const existing = await db
    .select({ id: scriptCollaborators.id })
    .from(scriptCollaborators)
    .where(
      and(
        eq(scriptCollaborators.scriptId, scriptId),
        eq(scriptCollaborators.userId, targetUser[0].id),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    return { error: "This user is already a collaborator." };
  }

  await db.insert(scriptCollaborators).values({
    scriptId,
    userId: targetUser[0].id,
    role,
  });

  // Send notification email
  const [script, owner] = await Promise.all([
    db
      .select({ title: scripts.title })
      .from(scripts)
      .where(eq(scripts.id, scriptId))
      .limit(1),
    db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, currentUserId))
      .limit(1),
  ]);
  try {
    await sendCollaboratorAddedEmail(
      targetUser[0].email,
      targetUser[0].email,
      owner[0]?.name ?? "Someone",
      script[0]?.title ?? "a script",
      role,
      scriptId,
    );
  } catch {}

  await createNotification(
    targetUser[0].id,
    "COLLABORATOR_ADDED",
    `${owner[0]?.name ?? "Someone"} added you as a collaborator on "${script[0]?.title ?? "a script"}"`,
    scriptId,
  );

  revalidatePath("/");
  revalidatePath(`/scripts/${scriptId}`);
  return {
    success: true,
    collaborator: {
      id: targetUser[0].id,
      name: targetUser[0].name,
      email: targetUser[0].email,
      role,
    },
  };
}

export async function removeCollaborator(
  scriptId: string,
  collaboratorUserId: string,
) {
  const currentUserId = await requireAuth();

  if (!(await requireOwner(scriptId, currentUserId))) {
    return { error: "Only the script owner can remove collaborators." };
  }

  await db
    .delete(scriptCollaborators)
    .where(
      and(
        eq(scriptCollaborators.scriptId, scriptId),
        eq(scriptCollaborators.userId, collaboratorUserId),
      ),
    );

  revalidatePath("/");
  revalidatePath(`/scripts/${scriptId}`);
  return { success: true };
}

export async function getScriptCollaborators(scriptId: string) {
  const currentUserId = await requireAuth();

  if (!(await requireOwner(scriptId, currentUserId))) {
    return [];
  }

  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: scriptCollaborators.role,
    })
    .from(scriptCollaborators)
    .innerJoin(users, eq(scriptCollaborators.userId, users.id))
    .where(eq(scriptCollaborators.scriptId, scriptId));
}

export async function getMyCollaborations() {
  const userId = await requireAuth();

  return db
    .select({
      script: scripts,
      role: scriptCollaborators.role,
    })
    .from(scriptCollaborators)
    .innerJoin(scripts, eq(scriptCollaborators.scriptId, scripts.id))
    .where(eq(scriptCollaborators.userId, userId));
}
