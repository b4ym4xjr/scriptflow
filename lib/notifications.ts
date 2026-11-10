import { db } from "@/db/drizzle";
import { notifications } from "@/db/schema";
import type { Notification } from "@/db/schema";

/**
 * Internal helper — deliberately NOT in a "use server" file.
 *
 * Every export of a "use server" module is a public HTTP endpoint callable by
 * anyone, and this function takes an arbitrary `userId`. It must only ever be
 * called from other server code that has already authorised the caller.
 */
export async function createNotification(
  userId: string,
  type: Notification["type"],
  message: string,
  scriptId?: string,
) {
  await db
    .insert(notifications)
    .values({ userId, type, message: message.slice(0, 500), scriptId: scriptId ?? null });
}
