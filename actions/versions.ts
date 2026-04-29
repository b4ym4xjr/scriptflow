"use server";

import { desc, eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db/drizzle";
import { scriptVersions, scripts, scriptCollaborators } from "@/db/schema";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

export async function saveVersion(
  scriptId: string,
  title: string,
  content: string,
) {
  const userId = await requireAuth();

  // Verify user is owner or EDITOR collaborator
  const script = await db
    .select({ userId: scripts.userId })
    .from(scripts)
    .where(eq(scripts.id, scriptId))
    .limit(1);
  if (script.length === 0) return { error: "Script not found." };

  if (script[0].userId !== userId) {
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
    if (collab.length === 0 || collab[0].role !== "EDITOR") {
      return { error: "Permission denied." };
    }
  }

  await db
    .insert(scriptVersions)
    .values({ scriptId, savedBy: userId, title, content });
  return { success: true };
}

export async function getScriptVersions(scriptId: string) {
  const userId = await requireAuth();

  // Must be owner or collaborator
  const script = await db
    .select({ userId: scripts.userId })
    .from(scripts)
    .where(eq(scripts.id, scriptId))
    .limit(1);
  if (script.length === 0) return [];

  if (script[0].userId !== userId) {
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
    if (collab.length === 0) return [];
  }

  return db
    .select()
    .from(scriptVersions)
    .where(eq(scriptVersions.scriptId, scriptId))
    .orderBy(desc(scriptVersions.createdAt))
    .limit(50);
}

export async function revertToVersion(scriptId: string, versionId: string) {
  const userId = await requireAuth();

  const script = await db
    .select({ userId: scripts.userId })
    .from(scripts)
    .where(eq(scripts.id, scriptId))
    .limit(1);
  if (script.length === 0) return { error: "Script not found." };
  if (script[0].userId !== userId) {
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
    if (collab.length === 0 || collab[0].role !== "EDITOR")
      return { error: "Permission denied." };
  }

  const version = await db
    .select()
    .from(scriptVersions)
    .where(
      and(
        eq(scriptVersions.id, versionId),
        eq(scriptVersions.scriptId, scriptId),
      ),
    )
    .limit(1);
  if (version.length === 0) return { error: "Version not found." };

  await db
    .update(scripts)
    .set({
      title: version[0].title,
      content: version[0].content,
      updatedAt: new Date(),
    })
    .where(eq(scripts.id, scriptId));

  revalidatePath(`/scripts/${scriptId}`);
  revalidatePath(`/scripts/${scriptId}/edit`);
  return { success: true };
}
