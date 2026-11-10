"use client";

import Link from "next/link";
import { useCallback, type MouseEvent } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Check,
  ChevronDown,
  Clock,
  FileText,
  Pencil,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Script, ScriptStatus } from "@/db/schema";
import {
  DUE_CHIP,
  STATUS_BY_VALUE,
  STATUS_META,
  TYPE_BY_VALUE,
  getDueInfo,
  previewText,
} from "@/lib/script-meta";
import { cn } from "@/lib/utils";
import { useMounted } from "@/lib/use-local-storage";
import { DeleteScriptButton } from "./DeleteScriptButton";
import { PipelineStepper, StatusBadge } from "./StatusBadge";

const NO_DUE = { state: "none", days: null, label: "" } as const;

export interface ScriptItemProps {
  script: Script;
  isShared?: boolean;
  /** Whether the viewer may change status (owner or editor). */
  canChangeStatus?: boolean;
  onStatusChange?: (id: string, status: ScriptStatus) => void;
}

/** Tracks the cursor so `.spotlight-card` can paint a radial glow under it. */
export function useSpotlight() {
  return useCallback((e: MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }, []);
}

export function StatusMenu({
  script,
  onStatusChange,
  children,
}: {
  script: Script;
  onStatusChange: (id: string, status: ScriptStatus) => void;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Move to stage
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {STATUS_META.map((s) => {
          const Icon = s.icon;
          return (
            <DropdownMenuItem
              key={s.value}
              onClick={() => onStatusChange(script.id, s.value)}
              className="gap-2"
            >
              <span className={cn("h-2 w-2 rounded-full", s.dot)} />
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              {s.label}
              {script.status === s.value && (
                <Check className="ml-auto h-3.5 w-3.5 text-primary" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function StatusControl({
  script,
  canChangeStatus,
  onStatusChange,
}: Pick<ScriptItemProps, "script" | "canChangeStatus" | "onStatusChange">) {
  if (!canChangeStatus || !onStatusChange) {
    return <StatusBadge status={script.status} />;
  }
  return (
    <StatusMenu script={script} onStatusChange={onStatusChange}>
      <button
        type="button"
        aria-label={`Status: ${STATUS_BY_VALUE[script.status].label}. Change status`}
        className="group/status relative z-10 inline-flex rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <StatusBadge
          status={script.status}
          className="cursor-pointer transition-transform group-hover/status:scale-[1.04]"
        />
        <ChevronDown className="absolute -right-1 -bottom-1 h-3 w-3 rounded-full bg-card p-px text-muted-foreground opacity-0 ring-1 ring-border transition-opacity group-hover/status:opacity-100" />
      </button>
    </StatusMenu>
  );
}

export function ScriptCard({
  script,
  isShared = false,
  canChangeStatus = !isShared,
  onStatusChange,
}: ScriptItemProps) {
  const onMove = useSpotlight();
  const mounted = useMounted();
  const due = mounted
    ? getDueInfo(script.targetPublishDate, script.status)
    : NO_DUE;
  const type = script.scriptType ? TYPE_BY_VALUE[script.scriptType] : null;
  const TypeIcon = type?.icon ?? FileText;
  const preview = script.description || previewText(script.content);
  const meta = STATUS_BY_VALUE[script.status];

  return (
    <div
      onMouseMove={onMove}
      className="spotlight-card group/card flex h-full flex-col overflow-hidden rounded-2xl border bg-card"
    >
      <div
        className={cn("h-1 w-full bg-linear-to-r opacity-80", meta.bar)}
        aria-hidden
      />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-2">
          <StatusControl
            script={script}
            canChangeStatus={canChangeStatus}
            onStatusChange={onStatusChange}
          />
          {isShared && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary">
              <Users className="h-3.5 w-3.5" />
              Shared
            </span>
          )}
        </div>
        <h3 className="font-display text-lg font-semibold leading-snug tracking-tight line-clamp-2">
          <Link
            href={`/scripts/${script.id}`}
            className="outline-none after:absolute after:inset-0 after:z-0 after:content-[''] focus-visible:after:ring-3 focus-visible:after:ring-ring/50 focus-visible:after:rounded-2xl"
          >
            {script.title}
          </Link>
        </h3>

        <p className="text-sm text-muted-foreground line-clamp-3 min-h-[3.75rem]">
          {preview || "No content yet — open to start writing."}
        </p>

        <PipelineStepper status={script.status} className="mt-auto" />

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <TypeIcon className="h-3.5 w-3.5" />
            {type?.label ?? "Script"}
          </span>
          {script.wordCount ? (
            <span className="tabular-nums">
              {script.wordCount.toLocaleString()} words
            </span>
          ) : null}
          {script.estimatedDuration ? (
            <span className="inline-flex items-center gap-1 tabular-nums">
              <Clock className="h-3.5 w-3.5" />
              {script.estimatedDuration} min
            </span>
          ) : null}
        </div>
      </div>

      <div className="relative z-10 flex min-h-12 items-center justify-between gap-2 border-t bg-muted/30 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          {due.state !== "none" && (
            <span
              className={cn(
                "inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset animate-fade-in",
                DUE_CHIP[due.state],
                due.state === "overdue" && "animate-pulse",
              )}
            >
              {due.label}
            </span>
          )}
          {mounted && (
            <span className="truncate text-[11px] text-muted-foreground animate-fade-in">
              Updated{" "}
              {formatDistanceToNow(new Date(script.updatedAt), {
                addSuffix: true,
              })}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-0.5 sm:opacity-0 transition-opacity group-hover/card:opacity-100 group-focus-within/card:opacity-100">
          <Link href={`/scripts/${script.id}/edit`}>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Edit script"
              className="text-muted-foreground hover:text-foreground"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          {!isShared && <DeleteScriptButton taskId={script.id} iconOnly />}
        </div>
      </div>
    </div>
  );
}

/** Dense one-line variant used by the "list" view. */
export function ScriptRow({
  script,
  isShared = false,
  canChangeStatus = !isShared,
  onStatusChange,
}: ScriptItemProps) {
  const onMove = useSpotlight();
  const mounted = useMounted();
  const due = mounted
    ? getDueInfo(script.targetPublishDate, script.status)
    : NO_DUE;
  const type = script.scriptType ? TYPE_BY_VALUE[script.scriptType] : null;
  const TypeIcon = type?.icon ?? FileText;
  const meta = STATUS_BY_VALUE[script.status];

  return (
    <div
      onMouseMove={onMove}
      className="spotlight-card group/card flex items-center gap-4 overflow-hidden rounded-xl border bg-card py-3 pl-0 pr-3"
    >
      <span
        className={cn("h-10 w-1 shrink-0 rounded-r-full bg-linear-to-b", meta.bar)}
        aria-hidden
      />
      <TypeIcon className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-display text-base font-semibold tracking-tight">
          <Link
            href={`/scripts/${script.id}`}
            className="outline-none after:absolute after:inset-0 after:content-['']"
          >
            {script.title}
          </Link>
        </h3>
        <p className="truncate text-xs text-muted-foreground">
          {script.description || previewText(script.content) || "No content yet"}
        </p>
      </div>
      <div className="hidden w-32 lg:block">
        <PipelineStepper status={script.status} />
      </div>
      {due.state !== "none" && (
        <span
          className={cn(
            "hidden whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset md:inline-flex",
            DUE_CHIP[due.state],
          )}
        >
          {due.label}
        </span>
      )}
      <span className="hidden w-24 text-right text-xs tabular-nums text-muted-foreground xl:block">
        {script.wordCount ? `${script.wordCount.toLocaleString()} words` : "—"}
      </span>
      <StatusControl
        script={script}
        canChangeStatus={canChangeStatus}
        onStatusChange={onStatusChange}
      />
      <div className="relative z-10 flex items-center">
        <Link href={`/scripts/${script.id}/edit`}>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Edit script"
            className="text-muted-foreground hover:text-foreground"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </Link>
        {!isShared && <DeleteScriptButton taskId={script.id} iconOnly />}
      </div>
    </div>
  );
}
