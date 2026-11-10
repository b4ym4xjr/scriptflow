import {
  PenLine,
  Pencil,
  Eye,
  Clapperboard,
  Video,
  Scissors,
  Rocket,
  CircleCheckBig,
  Archive,
  GraduationCap,
  Star,
  Camera,
  Lightbulb,
  Popcorn,
  Shapes,
  type LucideIcon,
} from "lucide-react";
import type { ScriptStatus, ScriptType } from "@/db/schema";

export interface StatusMeta {
  value: ScriptStatus;
  label: string;
  icon: LucideIcon;
  /** Chip classes. One palette: secondary tint, primary for "done". */
  chip: string;
  /** Solid dot — a single-hue ramp: the later the stage, the stronger the primary. */
  dot: string;
  /** Progress bar gradient stops (same ramp as `dot`). */
  bar: string;
}

/** Ordered pipeline (ARCHIVED sits outside the pipeline progress). */
export const STATUS_META: StatusMeta[] = [
  {
    value: "DRAFT",
    label: "Draft",
    icon: Pencil,
    chip: "bg-muted text-muted-foreground ring-border",
    dot: "bg-muted-foreground/40",
    bar: "from-muted-foreground/40 to-muted-foreground/40",
  },
  {
    value: "WRITING",
    label: "Writing",
    icon: PenLine,
    chip: "bg-secondary text-secondary-foreground ring-border",
    dot: "bg-primary/25",
    bar: "from-primary/25 to-primary/25",
  },
  {
    value: "REVIEW",
    label: "Review",
    icon: Eye,
    chip: "bg-secondary text-secondary-foreground ring-border",
    dot: "bg-primary/40",
    bar: "from-primary/40 to-primary/40",
  },
  {
    value: "READY_TO_FILM",
    label: "Ready to Film",
    icon: Clapperboard,
    chip: "bg-secondary text-secondary-foreground ring-border",
    dot: "bg-primary/55",
    bar: "from-primary/55 to-primary/55",
  },
  {
    value: "FILMING",
    label: "Filming",
    icon: Video,
    chip: "bg-secondary text-secondary-foreground ring-border",
    dot: "bg-primary/70",
    bar: "from-primary/70 to-primary/70",
  },
  {
    value: "EDITING",
    label: "Editing",
    icon: Scissors,
    chip: "bg-secondary text-secondary-foreground ring-border",
    dot: "bg-primary/80",
    bar: "from-primary/80 to-primary/80",
  },
  {
    value: "READY_TO_PUBLISH",
    label: "Ready to Publish",
    icon: Rocket,
    chip: "bg-secondary text-secondary-foreground ring-border",
    dot: "bg-primary/90",
    bar: "from-primary/90 to-primary/90",
  },
  {
    value: "PUBLISHED",
    label: "Published",
    icon: CircleCheckBig,
    chip: "bg-primary text-primary-foreground ring-primary",
    dot: "bg-primary",
    bar: "from-primary to-primary",
  },
  {
    value: "ARCHIVED",
    label: "Archived",
    icon: Archive,
    chip: "bg-muted text-muted-foreground/70 ring-border",
    dot: "bg-muted-foreground/30",
    bar: "from-muted-foreground/30 to-muted-foreground/30",
  },
];

export const STATUS_BY_VALUE = Object.fromEntries(
  STATUS_META.map((s) => [s.value, s]),
) as Record<ScriptStatus, StatusMeta>;

/** Statuses that make up the production pipeline (excludes ARCHIVED). */
export const PIPELINE: ScriptStatus[] = STATUS_META.filter(
  (s) => s.value !== "ARCHIVED",
).map((s) => s.value);

export function getStatusLabel(status: ScriptStatus) {
  return STATUS_BY_VALUE[status]?.label ?? status;
}

/** 0..1 progress through the pipeline. */
export function getPipelineProgress(status: ScriptStatus) {
  const idx = PIPELINE.indexOf(status);
  if (idx < 0) return 0;
  return (idx + 1) / PIPELINE.length;
}

export interface TypeMeta {
  value: ScriptType;
  label: string;
  icon: LucideIcon;
}

export const TYPE_META: TypeMeta[] = [
  { value: "TUTORIAL", label: "Tutorial", icon: GraduationCap },
  { value: "REVIEW", label: "Review", icon: Star },
  { value: "VLOG", label: "Vlog", icon: Camera },
  { value: "EDUCATIONAL", label: "Educational", icon: Lightbulb },
  { value: "ENTERTAINMENT", label: "Entertainment", icon: Popcorn },
  { value: "OTHER", label: "Other", icon: Shapes },
];

export const TYPE_BY_VALUE = Object.fromEntries(
  TYPE_META.map((t) => [t.value, t]),
) as Record<ScriptType, TypeMeta>;

export type DueState = "overdue" | "soon" | "later" | "none";

export interface DueInfo {
  state: DueState;
  days: number | null;
  label: string;
}

const DAY = 24 * 60 * 60 * 1000;

/** Describes how close a target publish date is. Published/archived never count as overdue. */
export function getDueInfo(
  date: Date | string | null | undefined,
  status?: ScriptStatus,
): DueInfo {
  if (!date) return { state: "none", days: null, label: "No date" };
  const target = new Date(date);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const t = new Date(target);
  t.setHours(0, 0, 0, 0);
  const days = Math.round((t.getTime() - start.getTime()) / DAY);

  if (status === "PUBLISHED" || status === "ARCHIVED") {
    return { state: "later", days, label: "Done" };
  }
  if (days < 0)
    return {
      state: "overdue",
      days,
      label: `${Math.abs(days)}d overdue`,
    };
  if (days === 0) return { state: "soon", days, label: "Due today" };
  if (days === 1) return { state: "soon", days, label: "Due tomorrow" };
  if (days <= 7) return { state: "soon", days, label: `Due in ${days}d` };
  return { state: "later", days, label: `Due in ${days}d` };
}

export const DUE_CHIP: Record<DueState, string> = {
  overdue: "bg-foreground text-background ring-foreground",
  soon: "bg-primary/10 text-primary ring-primary/25",
  later: "bg-muted text-muted-foreground ring-border",
  none: "bg-muted text-muted-foreground ring-border",
};

export function stripHtml(html: string | null | undefined) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/** Card preview: spoken lines only — skips headings and on-screen-note quotes. */
export function previewText(html: string | null | undefined, max = 140) {
  if (!html) return "";
  const body = html
    .replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi, " ")
    .replace(/<blockquote[^>]*>[\s\S]*?<\/blockquote>/gi, " ");
  const text = stripHtml(body) || stripHtml(html);
  return text.length > max ? text.slice(0, max).trimEnd() + "…" : text;
}

export const SORT_OPTIONS = [
  { value: "updated", label: "Recently updated" },
  { value: "created", label: "Newest first" },
  { value: "title", label: "Title A–Z" },
  { value: "due", label: "Due date" },
] as const;

export type SortKey = (typeof SORT_OPTIONS)[number]["value"];
