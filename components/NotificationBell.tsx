"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Bell, BellOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getNotifications, markAllAsRead } from "@/actions/notifications";
import type { Notification } from "@/db/schema";

export function NotificationBell() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    getNotifications()
      .then(setNotifs)
      .catch(() => {
        /* signed out / offline – the bell simply stays empty */
      });
  }, []);

  const unreadCount = notifs.filter((n) => !n.read).length;

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && unreadCount > 0) {
      startTransition(async () => {
        await markAllAsRead();
        setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
      });
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="notifications"
          variant="outline"
          size="icon"
          className="relative"
        >
          <motion.span
            key={unreadCount}
            animate={
              unreadCount > 0
                ? { rotate: [0, -14, 12, -8, 6, 0] }
                : { rotate: 0 }
            }
            transition={{ duration: 0.7, delay: 0.3 }}
            style={{ originY: 0 }}
            className="flex"
          >
            <Bell className="h-4 w-4" />
          </motion.span>
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center animate-pop">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[calc(100vw-2rem)] sm:w-96 max-w-96 p-0"
      >
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <p className="text-sm font-semibold">Notifications</p>
          {notifs.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {notifs.length} total
            </span>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <BellOff className="h-6 w-6" />
              <p className="text-sm">You&apos;re all caught up</p>
            </div>
          ) : (
            notifs.map((n, i) => {
              const body = (
                <>
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      n.read ? "bg-transparent" : "bg-primary"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm leading-snug">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(n.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </>
              );
              const cls =
                "flex gap-3 px-4 py-3 border-b last:border-0 transition-colors hover:bg-muted/60 animate-fade-up";
              return n.scriptId ? (
                <Link
                  key={n.id}
                  href={`/scripts/${n.scriptId}`}
                  className={cls}
                  style={{ animationDelay: `${i * 35}ms` }}
                  onClick={() => setOpen(false)}
                >
                  {body}
                </Link>
              ) : (
                <div
                  key={n.id}
                  className={cls}
                  style={{ animationDelay: `${i * 35}ms` }}
                >
                  {body}
                </div>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
