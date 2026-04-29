"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db/drizzle";
import { scripts } from "@/db/schema";
import { generateToken } from "@/lib/tokens";

async function requireOwner(scriptId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id;

  const script = await db.select({ userId: scripts.userId, shareToken: scripts.shareToken })
    .from(scripts).where(eq(scripts.id, scriptId)).limit(1);
  if (script.length === 0 || script[0].userId !== userId) throw new Error("Not found.");
  return script[0];
}

export async function generateShareLink(scriptId: string) {
  const existing = await requireOwner(scriptId);
  if (existing.shareToken) return { success: true, token: existing.shareToken };

  const token = generateToken();
  await db.update(scripts).set({ shareToken: token }).where(eq(scripts.id, scriptId));
  revalidatePath(`/scripts/${scriptId}`);
  return { success: true, token };
}

export async function revokeShareLink(scriptId: string) {
  await requireOwner(scriptId);
  await db.update(scripts).set({ shareToken: null }).where(eq(scripts.id, scriptId));
  revalidatePath(`/scripts/${scriptId}`);
  return { success: true };
}

export async function getScriptByShareToken(token: string) {
  const result = await db.select().from(scripts).where(eq(scripts.shareToken, token)).limit(1);
  return result[0] ?? null;
}
