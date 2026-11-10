"use client";

import Link from "next/link";
import { useState } from "react";
import { GripVertical, Inbox } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { Script, ScriptStatus } from "@/db/schema";
import {
  DUE_CHIP,
  STATUS_META,
  TYPE_BY_VALUE,
  getDueInfo,
} from "@/lib/script-meta";
import { cn } from "@/lib/utils";
import { useMounted } from "@/lib/use-local-storage";

interface BoardViewProps {
  scripts: Script[];
  onStatusChange: (id: string, status: ScriptStatus) => void;
  showArchived?: boolean;
}

export function BoardView({
  scripts,
  onStatusChange,
  showArchived = false,
}: BoardViewProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<ScriptStatus | null>(null);

  const columns = STATUS_META.filter(
    (s) => showArchived || s.value !== "ARCHIVED",
  );

  const handleDrop = (status: ScriptStatus) => {
    if (draggingId) {
      const script = scripts.find((s) => s.id === draggingId);
      if (script && script.status !== status) onStatusChange(draggingId, status);
    }
    setDraggingId(null);
    setOverColumn(null);
  };

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
      <div className="flex min-w-max gap-3 snap-x">
        {columns.map((col, ci) => {
          const items = scripts.filter((s) => s.status === col.value);
          const isOver = overColumn === col.value && draggingId !== null;
          const Icon = col.icon;
          return (
            <section
              key={col.value}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (overColumn !== col.value) setOverColumn(col.value);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node))
                  setOverColumn(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(col.value);
              }}
              style={{ animationDelay: `${ci * 45}ms` }}
              className={cn(
                "flex w-72 shrink-0 snap-start flex-col rounded-2xl border bg-muted/40 p-2 transition-all duration-200 animate-fade-up",
                isOver &&
                  "border-primary/60 bg-primary/5 shadow-[0_0_0_3px_var(--glow)]",
              )}
            >
              <header className="flex items-center justify-between px-2 pb-2 pt-1">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2.5 w-2.5 rounded-full", col.dot)} />
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">{col.label}</h3>
                </div>
                <motion.span
                  key={items.length}
                  initial={{ scale: 1.4 }}
                  animate={{ scale: 1 }}
                  className="rounded-full bg-background px-2 py-0.5 text-xs tabular-nums text-muted-foreground ring-1 ring-border"
                >
                  {items.length}
                </motion.span>
              </header>

              <div className="flex min-h-24 flex-1 flex-col gap-2">
                <AnimatePresence initial={false} mode="popLayout">
                  {items.map((script) => (
                    <BoardCard
                      key={script.id}
                      script={script}
                      dragging={draggingId === script.id}
                      onDragStart={() => setDraggingId(script.id)}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setOverColumn(null);
                      }}
                    />
                  ))}
                </AnimatePresence>
                {items.length === 0 && (
                  <div
                    className={cn(
                      "flex flex-1 flex-col items-center justify-center gap-1 rounded-xl border border-dashed py-6 text-xs text-muted-foreground transition-colors",
                      isOver && "border-primary/60 text-primary",
                    )}
                  >
                    <Inbox className="h-4 w-4" />
                    {isOver ? "Drop here" : "Nothing here"}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function BoardCard({
  script,
  dragging,
  onDragStart,
  onDragEnd,
}: {
  script: Script;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const mounted = useMounted();
  const due = mounted
    ? getDueInfo(script.targetPublishDate, script.status)
    : ({ state: "none", days: null, label: "" } as const);
  const type = script.scriptType ? TYPE_BY_VALUE[script.scriptType] : null;
  const TypeIcon = type?.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: dragging ? 0.45 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ type: "spring", stiffness: 420, damping: 34 }}
    >
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", script.id);
          onDragStart();
        }}
        onDragEnd={onDragEnd}
        className="group cursor-grab rounded-xl border bg-card p-3 shadow-xs transition-all hover:border-primary/40 active:cursor-grabbing"
      >
        <div className="flex items-start gap-1.5">
          <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <Link
              href={`/scripts/${script.id}`}
              draggable={false}
              className="line-clamp-2 font-display text-sm font-semibold leading-snug hover:text-primary"
            >
              {script.title}
            </Link>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
              {TypeIcon && (
                <span className="inline-flex items-center gap-1">
                  <TypeIcon className="h-3 w-3" />
                  {type?.label}
                </span>
              )}
              {script.wordCount ? (
                <span className="tabular-nums">{script.wordCount}w</span>
              ) : null}
              {due.state !== "none" && (
                <span
                  className={cn(
                    "whitespace-nowrap rounded-full px-1.5 py-px font-medium ring-1 ring-inset",
                    DUE_CHIP[due.state],
                  )}
                >
                  {due.label}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
