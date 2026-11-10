"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CornerDownLeft,
  FileText,
  Kanban,
  LayoutGrid,
  List,
  Moon,
  Plus,
  Search,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useTheme } from "@/components/ThemeProvider";
import type { Script } from "@/db/schema";
import { STATUS_BY_VALUE } from "@/lib/script-meta";
import { cn } from "@/lib/utils";

export const OPEN_PALETTE_EVENT = "scriptflow:open-palette";

export type DashboardView = "grid" | "list" | "board";

interface PaletteItem {
  id: string;
  group: "Actions" | "Scripts";
  label: string;
  hint?: string;
  icon: LucideIcon;
  dot?: string;
  run: () => void;
}

interface CommandPaletteProps {
  scripts: Pick<Script, "id" | "title" | "status">[];
  onViewChange?: (view: DashboardView) => void;
}

export function CommandPalette({ scripts, onViewChange }: CommandPaletteProps) {
  const router = useRouter();
  const { resolved, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_PALETTE_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_PALETTE_EVENT, onOpen);
    };
  }, []);

  const close = () => setOpen(false);

  const items = useMemo<PaletteItem[]>(() => {
    const go = (href: string) => () => {
      setOpen(false);
      router.push(href);
    };
    const actions: PaletteItem[] = [
      {
        id: "new",
        group: "Actions",
        label: "Create new script",
        hint: "N",
        icon: Plus,
        run: go("/scripts/new"),
      },
      ...(onViewChange
        ? ([
            ["grid", "Switch to grid view", LayoutGrid],
            ["list", "Switch to list view", List],
            ["board", "Switch to board view", Kanban],
          ] as const).map(
            ([v, label, icon]): PaletteItem => ({
              id: `view-${v}`,
              group: "Actions",
              label,
              icon,
              run: () => {
                setOpen(false);
                onViewChange(v);
              },
            }),
          )
        : []),
      {
        id: "theme",
        group: "Actions",
        label: resolved === "dark" ? "Switch to light theme" : "Switch to dark theme",
        icon: resolved === "dark" ? Sun : Moon,
        run: () => {
          setOpen(false);
          setTheme(resolved === "dark" ? "light" : "dark");
        },
      },
    ];
    const scriptItems: PaletteItem[] = scripts.map((s) => ({
      id: s.id,
      group: "Scripts",
      label: s.title,
      hint: STATUS_BY_VALUE[s.status].label,
      icon: FileText,
      dot: STATUS_BY_VALUE[s.status].dot,
      run: go(`/scripts/${s.id}`),
    }));
    return [...actions, ...scriptItems];
  }, [scripts, router, resolved, setTheme, onViewChange]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 12);
    return items.filter((i) => i.label.toLowerCase().includes(q)).slice(0, 20);
  }, [items, query]);

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (filtered.length ? (a + 1) % filtered.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) =>
        filtered.length ? (a - 1 + filtered.length) % filtered.length : 0,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      filtered[active]?.run();
    }
  };

  let lastGroup = "";

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setQuery("");
          setActive(0);
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="top-[20%] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl"
        onKeyDown={onKeyDown}
      >
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <div className="flex items-center gap-3 border-b px-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            placeholder="Search scripts or run a command…"
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No results for &ldquo;{query}&rdquo;
            </p>
          )}
          {filtered.map((item, i) => {
            const showHeader = item.group !== lastGroup;
            lastGroup = item.group;
            const Icon = item.icon;
            return (
              <div key={item.id}>
                {showHeader && (
                  <p className="px-2 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {item.group}
                  </p>
                )}
                <button
                  type="button"
                  data-index={i}
                  onMouseMove={() => setActive(i)}
                  onClick={item.run}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                    i === active ? "bg-accent text-accent-foreground" : "",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.dot && (
                    <span className={cn("h-2 w-2 rounded-full", item.dot)} />
                  )}
                  {item.hint && (
                    <span className="text-xs text-muted-foreground">
                      {item.hint}
                    </span>
                  )}
                  {i === active && (
                    <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-4 border-t bg-muted/40 px-4 py-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="rounded border bg-background px-1">↑</kbd>
            <kbd className="rounded border bg-background px-1">↓</kbd> navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border bg-background px-1">↵</kbd> open
          </span>
          <button
            type="button"
            onClick={close}
            className="ml-auto hover:text-foreground"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
