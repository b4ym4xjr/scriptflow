"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell } from "lucide-react";
import { format } from "date-fns";
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
    getNotifications().then(setNotifs);
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
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[calc(100vw-2rem)] sm:w-80 max-w-80 p-0"
      >
        <div className="px-4 py-3 border-b">
          <p className="text-sm font-semibold text-gray-900">Notifications</p>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              No notifications
            </p>
          ) : (
            notifs.map((n) => (
              <div
                key={n.id}
                className={`px-4 py-3 border-b last:border-0 ${!n.read ? "bg-blue-50" : ""}`}
              >
                <p className="text-sm text-gray-800">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {format(new Date(n.createdAt), "MMM d, h:mm a")}
                </p>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
