"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/db/drizzle";
import { notifications } from "@/db/schema";
import type { Notification } from "@/db/schema";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

export async function createNotification(
  userId: string,
  type: Notification["type"],
  message: string,
  scriptId?: string,
) {
  await db.insert(notifications).values({ userId, type, message, scriptId: scriptId ?? null });
}

export async function getNotifications() {
  const userId = await requireAuth();
  return await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
}

export async function markAsRead(notificationId: string) {
  const userId = await requireAuth();
  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
  revalidatePath("/");
}

export async function markAllAsRead() {
  const userId = await requireAuth();
  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
  revalidatePath("/");
}
