"use server";

import { z } from "zod";
import { db } from "@/db/drizzle";
import { scripts, ScriptStatus, ScriptType } from "@/db/schema";
import { and, desc, eq, ilike } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

// Helper function to calculate word count from HTML content
function calculateWordCount(html: string): number {
  if (!html) return 0;
  // Remove HTML tags and get text content
  const text = html.replace(/<[^>]*>/g, " ");
  // Split by whitespace and filter out empty strings
  const words = text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
  return words.length;
}

// Helper function to estimate video duration (average 150 words per minute)
function estimateDuration(wordCount: number): number {
  return Math.ceil(wordCount / 150);
}

const scriptSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().optional(),
  status: z.enum([
    "DRAFT",
    "WRITING",
    "REVIEW",
    "READY_TO_FILM",
    "FILMING",
    "EDITING",
    "READY_TO_PUBLISH",
    "PUBLISHED",
    "ARCHIVED",
  ]),
  scriptType: z
    .enum([
      "TUTORIAL",
      "REVIEW",
      "VLOG",
      "EDUCATIONAL",
      "ENTERTAINMENT",
      "OTHER",
    ])
    .optional(),
  videoTitle: z.string().optional(),
  description: z.string().optional(),
  tags: z.string().optional(),
  estimatedDuration: z.coerce.number().optional(),
  targetPublishDate: z.string().optional(),
  thumbnailNotes: z.string().optional(),
});

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

export async function getScripts(params?: {
  q?: string;
  status?: ScriptStatus;
  scriptType?: ScriptType;
}) {
  const userId = await requireAuth();

  const conditions = [eq(scripts.userId, userId)];
  if (params?.q) conditions.push(ilike(scripts.title, `%${params.q}%`));
  if (params?.status) conditions.push(eq(scripts.status, params.status));
  if (params?.scriptType)
    conditions.push(eq(scripts.scriptType, params.scriptType));

  return db
    .select()
    .from(scripts)
    .where(and(...conditions))
    .orderBy(desc(scripts.createdAt));
}

export async function getScriptById(scriptId: string) {
  const userId = await requireAuth();

  const script = await db
    .select()
    .from(scripts)
    .where(and(eq(scripts.id, scriptId), eq(scripts.userId, userId)))
    .limit(1);

  if (script.length === 0) return null;

  return { script: script[0] };
}

export async function createScript(formData: FormData) {
  try {
    const userId = await requireAuth();

    const content = (formData.get("content") as string) || "";
    const wordCount = calculateWordCount(content);
    const estimatedDuration = estimateDuration(wordCount);

    const data = {
      title: formData.get("title") as string,
      content: content,
      status: formData.get("status") as ScriptStatus,
      scriptType: (formData.get("scriptType") as ScriptType) || undefined,
      videoTitle:
        (formData.get("videoTitle") as string) ||
        (formData.get("title") as string) ||
        undefined,
      description: (formData.get("description") as string) || undefined,
      tags: (formData.get("tags") as string) || undefined,
      targetPublishDate:
        (formData.get("targetPublishDate") as string) || undefined,
      thumbnailNotes: (formData.get("thumbnailNotes") as string) || undefined,
    };

    const result = scriptSchema.safeParse(data);

    if (!result.success) {
      return { error: result.error.issues[0].message };
    }

    await db.insert(scripts).values({
      userId,
      title: result.data.title,
      content: result.data.content || "",
      status: result.data.status,
      scriptType: result.data.scriptType || null,
      videoTitle: result.data.videoTitle || null,
      description: result.data.description || null,
      tags: result.data.tags || null,
      estimatedDuration: estimatedDuration || null,
      targetPublishDate: result.data.targetPublishDate
        ? new Date(result.data.targetPublishDate)
        : null,
      thumbnailNotes: result.data.thumbnailNotes || null,
      wordCount: wordCount,
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.log("Failed to create script: ", error);
    return { error: "Failed to create script" };
  }
}

export async function updateScript(scriptId: string, formData: FormData) {
  try {
    const userId = await requireAuth();

    const scriptRow = await db
      .select({ userId: scripts.userId })
      .from(scripts)
      .where(eq(scripts.id, scriptId))
      .limit(1);
    if (scriptRow.length === 0) return { error: "Script not found." };
    if (scriptRow[0].userId !== userId) return { error: "Unauthorized." };

    const content = (formData.get("content") as string) || "";
    const wordCount = calculateWordCount(content);
    const estimatedDuration = estimateDuration(wordCount);

    const data = {
      title: formData.get("title") as string,
      content: content,
      status: formData.get("status") as ScriptStatus,
      scriptType: (formData.get("scriptType") as ScriptType) || undefined,
      videoTitle: (formData.get("title") as string) || undefined,
      description: (formData.get("description") as string) || undefined,
      tags: (formData.get("tags") as string) || undefined,
      targetPublishDate:
        (formData.get("targetPublishDate") as string) || undefined,
      thumbnailNotes: (formData.get("thumbnailNotes") as string) || undefined,
    };

    const result = scriptSchema.safeParse(data);

    if (!result.success) {
      return { error: result.error.issues[0].message };
    }

    await db
      .update(scripts)
      .set({
        title: result.data.title,
        content: result.data.content || "",
        status: result.data.status,
        scriptType: result.data.scriptType || null,
        videoTitle: result.data.videoTitle || null,
        description: result.data.description || null,
        tags: result.data.tags || null,
        estimatedDuration: estimatedDuration || null,
        targetPublishDate: result.data.targetPublishDate
          ? new Date(result.data.targetPublishDate)
          : null,
        thumbnailNotes: result.data.thumbnailNotes || null,
        wordCount: wordCount,
        updatedAt: new Date(),
      })
      .where(and(eq(scripts.id, scriptId), eq(scripts.userId, userId)));

    revalidatePath("/");
    revalidatePath(`/scripts/${scriptId}`);
    return { success: true };
  } catch (error) {
    console.log("Failed to update script: ", error);
    return { error: "Failed to update script" };
  }
}

export async function deleteScript(scriptId: string) {
  try {
    const userId = await requireAuth();

    const result = await db
      .delete(scripts)
      .where(and(eq(scripts.id, scriptId), eq(scripts.userId, userId)))
      .returning();

    if (result.length === 0) {
      return {
        error: "Script not found or you don't have permission to delete it",
      };
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.log("Failed to delete script: ", error);
    return { error: "Failed to delete script" };
  }
}

export async function updateScriptStatus(
  scriptId: string,
  status: ScriptStatus,
) {
  try {
    const userId = await requireAuth();

    const scriptRow = await db
      .select({ userId: scripts.userId })
      .from(scripts)
      .where(eq(scripts.id, scriptId))
      .limit(1);
    if (scriptRow.length === 0) return { error: "Script not found" };
    if (scriptRow[0].userId !== userId) return { error: "Unauthorized" };

    await db
      .update(scripts)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(scripts.id, scriptId), eq(scripts.userId, userId)));

    revalidatePath("/");
    revalidatePath(`/scripts/${scriptId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to update script status:", error);
    return { error: "Failed to update status" };
  }
}
