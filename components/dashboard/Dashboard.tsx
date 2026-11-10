"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpDown,
  Clapperboard,
  Kanban,
  LayoutGrid,
  List,
  Plus,
  Search,
  SearchX,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { toast } from "sonner";
import { updateScriptStatus } from "@/actions/scripts";
import { CommandPalette, type DashboardView } from "@/components/CommandPalette";
import { Confetti } from "@/components/Confetti";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScriptCard, ScriptRow } from "@/components/scripts/ScriptCard";
import type { CollaboratorRole, Script, ScriptStatus } from "@/db/schema";
import {
  SORT_OPTIONS,
  STATUS_META,
  TYPE_META,
  getStatusLabel,
  type SortKey,
} from "@/lib/script-meta";
import { useClientValue, useLocalStorage } from "@/lib/use-local-storage";
import { cn } from "@/lib/utils";
import { BoardView } from "./BoardView";
import { StatsStrip } from "./StatsStrip";

interface Collaboration {
  script: Script;
  role: CollaboratorRole;
}

interface DashboardProps {
  name: string;
  scripts: Script[];
  collaborations: Collaboration[];
  initialQuery?: string;
  initialStatus?: string;
  initialType?: string;
}

const VIEWS: { value: DashboardView; label: string; icon: typeof LayoutGrid }[] =
  [
    { value: "grid", label: "Grid", icon: LayoutGrid },
    { value: "list", label: "List", icon: List },
    { value: "board", label: "Board", icon: Kanban },
  ];

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Burning the midnight oil";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function sortScripts(list: Script[], sort: SortKey) {
  const copy = [...list];
  switch (sort) {
    case "title":
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    case "created":
      return copy.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    case "due":
      return copy.sort((a, b) => {
        const da = a.targetPublishDate
          ? new Date(a.targetPublishDate).getTime()
          : Infinity;
        const db = b.targetPublishDate
          ? new Date(b.targetPublishDate).getTime()
          : Infinity;
        return da - db;
      });
    case "updated":
    default:
      return copy.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
  }
}

export function Dashboard({
  name,
  scripts,
  collaborations,
  initialQuery = "",
  initialStatus = "",
  initialType = "",
}: DashboardProps) {
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);

  const [view, setView] = useLocalStorage<DashboardView>(
    "scriptflow-view",
    "grid",
  );
  const [q, setQ] = useState(initialQuery);
  const [status, setStatus] = useState<string>(initialStatus);
  const [type, setType] = useState<string>(initialType);
  const [sort, setSort] = useState<SortKey>("updated");
  const [overrides, setOverrides] = useState<Record<string, ScriptStatus>>({});
  const [confettiKey, setConfettiKey] = useState<number | null>(null);

  const greet = useClientValue(greeting, "Welcome back");
  const firstName = name.split(/\s+/)[0];

  // Keep the URL shareable without triggering a server round-trip.
  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (type) params.set("type", type);
    const qs = params.toString();
    window.history.replaceState(
      null,
      "",
      qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
    );
  }, [q, status, type]);

  // Keyboard shortcuts: "/" focuses search, "n" creates a script.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing =
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.isContentEditable);
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        router.push("/scripts/new");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  const withOverrides = useCallback(
    (list: Script[]) =>
      list.map((s) =>
        overrides[s.id] ? { ...s, status: overrides[s.id] } : s,
      ),
    [overrides],
  );

  const ownScripts = useMemo(
    () => withOverrides(scripts),
    [scripts, withOverrides],
  );
  const sharedScripts = useMemo(
    () => withOverrides(collaborations.map((c) => c.script)),
    [collaborations, withOverrides],
  );
  const roleByScript = useMemo(
    () => new Map(collaborations.map((c) => [c.script.id, c.role])),
    [collaborations],
  );

  const matches = useCallback(
    (s: Script, ignoreStatus = false) => {
      if (!ignoreStatus && status && s.status !== status) return false;
      if (type && s.scriptType !== type) return false;
      if (q) {
        const hay = `${s.title} ${s.description ?? ""} ${s.tags ?? ""}`.toLowerCase();
        if (!hay.includes(q.trim().toLowerCase())) return false;
      }
      return true;
    },
    [q, status, type],
  );

  const visibleOwn = useMemo(
    () => sortScripts(ownScripts.filter((s) => matches(s)), sort),
    [ownScripts, matches, sort],
  );
  const visibleShared = useMemo(
    () => sortScripts(sharedScripts.filter((s) => matches(s)), sort),
    [sharedScripts, matches, sort],
  );

  const statusCounts = useMemo(() => {
    const counts: Partial<Record<ScriptStatus, number>> = {};
    for (const s of [...ownScripts, ...sharedScripts]) {
      if (!matches(s, true)) continue;
      counts[s.status] = (counts[s.status] ?? 0) + 1;
    }
    return counts;
  }, [ownScripts, sharedScripts, matches]);
  const totalForChips = Object.values(statusCounts).reduce(
    (a, b) => a + (b ?? 0),
    0,
  );

  const handleStatusChange = useCallback(
    async (id: string, next: ScriptStatus) => {
      const all = [...scripts, ...collaborations.map((c) => c.script)];
      const current = overrides[id] ?? all.find((s) => s.id === id)?.status;
      if (!current || current === next) return;

      setOverrides((o) => ({ ...o, [id]: next }));
      const result = await updateScriptStatus(id, next);
      if (result && "error" in result && result.error) {
        setOverrides((o) => ({ ...o, [id]: current }));
        toast.error(result.error);
        return;
      }
      toast.success(`Moved to ${getStatusLabel(next)}`);
      if (next === "PUBLISHED") setConfettiKey(Date.now());
      router.refresh();
    },
    [scripts, collaborations, overrides, router],
  );

  const hasFilters = Boolean(q || status || type);
  const clearFilters = () => {
    setQ("");
    setStatus("");
    setType("");
  };
  const nothingAtAll = scripts.length === 0 && collaborations.length === 0;
  const noMatches =
    !nothingAtAll && visibleOwn.length === 0 && visibleShared.length === 0;

  const itemView: "grid" | "list" = view === "list" ? "list" : "grid";
  const showBoard = view === "board" && ownScripts.length > 0;
  const gridClass =
    "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  const renderItems = (list: Script[], shared: boolean) => (
    <LayoutGroup>
      <div className={itemView === "grid" ? gridClass : "flex flex-col gap-2"}>
        <AnimatePresence mode="popLayout" initial>
          {list.map((script, i) => {
            const canChange = shared
              ? roleByScript.get(script.id) === "EDITOR"
              : true;
            const props = {
              script,
              isShared: shared,
              canChangeStatus: canChange,
              onStatusChange: handleStatusChange,
            };
            return (
              <motion.div
                key={script.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 32,
                  delay: Math.min(i, 10) * 0.035,
                }}
                className="relative"
              >
                {itemView === "grid" ? (
                  <ScriptCard {...props} />
                ) : (
                  <ScriptRow {...props} />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );

  return (
    <div className="relative flex-1">
      <CommandPalette
        scripts={[...ownScripts, ...sharedScripts]}
        onViewChange={setView}
      />
      {confettiKey && (
        <Confetti key={confettiKey} onDone={() => setConfettiKey(null)} />
      )}

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between animate-fade-up">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Your production pipeline
            </p>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {greet}, <span className="text-primary">{firstName}</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {nothingAtAll
                ? "Let's get your first script on the board."
                : `${scripts.length} script${scripts.length === 1 ? "" : "s"} in flow${
                    collaborations.length
                      ? ` · ${collaborations.length} shared with you`
                      : ""
                  }`}
            </p>
          </div>
          <Link href="/scripts/new">
            <Button
              size="lg"
              className="group h-10 gap-2 bg-primary px-4 text-primary-foreground transition-all"
            >
              <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
              New Script
              <kbd className="ml-1 hidden rounded bg-primary-foreground/20 px-1.5 text-[10px] sm:inline">
                N
              </kbd>
            </Button>
          </Link>
        </div>

        {!nothingAtAll && <StatsStrip scripts={ownScripts} />}

        {/* Toolbar */}
        {!nothingAtAll && (
          <div className="flex flex-col gap-3 animate-fade-up [animation-delay:120ms]">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:flex-1 sm:min-w-56">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={searchRef}
                  aria-label="search scripts"
                  placeholder="Search title, description, tags…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="h-10 rounded-xl bg-card pl-9 pr-16 text-sm"
                />
                {q ? (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setQ("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    /
                  </kbd>
                )}
              </div>

              <Select
                value={type || "ALL"}
                onValueChange={(v) => setType(v === "ALL" ? "" : v)}
              >
                <SelectTrigger className="h-10 flex-1 rounded-xl bg-card sm:w-40 sm:flex-none">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent className="p-2">
                  <SelectItem value="ALL">All types</SelectItem>
                  {TYPE_META.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                <SelectTrigger className="h-10 flex-1 gap-2 rounded-xl bg-card sm:w-48 sm:flex-none">
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="p-2">
                  {SORT_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div
                role="tablist"
                aria-label="View mode"
                className="relative flex h-10 items-center rounded-xl border bg-card p-1"
              >
                {VIEWS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    role="tab"
                    aria-selected={view === value}
                    aria-label={`${label} view`}
                    title={`${label} view`}
                    onClick={() => setView(value)}
                    className={cn(
                      "relative z-10 flex h-8 w-9 items-center justify-center rounded-lg transition-colors",
                      view === value
                        ? "text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {view === value && (
                      <motion.span
                        layoutId="view-pill"
                        className="absolute inset-0 -z-10 rounded-lg bg-primary"
                        transition={{ type: "spring", stiffness: 500, damping: 36 }}
                      />
                    )}
                    <Icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>

            {/* Status chips */}
            <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
              <StatusChip
                active={!status}
                onClick={() => setStatus("")}
                label="All"
                count={totalForChips}
              />
              {STATUS_META.map((s) => (
                <StatusChip
                  key={s.value}
                  active={status === s.value}
                  onClick={() => setStatus(status === s.value ? "" : s.value)}
                  label={s.label}
                  dot={s.dot}
                  count={statusCounts[s.value] ?? 0}
                />
              ))}
              <AnimatePresence>
                {hasFilters && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={clearFilters}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                    Clear filters
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Content */}
        {nothingAtAll ? (
          <EmptyState />
        ) : noMatches ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-20 text-center animate-fade-up">
            <div className="rounded-full bg-muted p-4">
              <SearchX className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold">
                No scripts match
              </h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Try a different search, or clear your filters to see everything.
              </p>
            </div>
            <Button variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {showBoard ? (
              <BoardView
                scripts={visibleOwn}
                onStatusChange={handleStatusChange}
                showArchived={status === "ARCHIVED"}
              />
            ) : (
              visibleOwn.length > 0 && renderItems(visibleOwn, false)
            )}

            {visibleShared.length > 0 && (
              <section className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-primary/10 p-1.5 text-primary">
                    <Users className="h-4 w-4" />
                  </span>
                  <h2 className="font-display text-lg font-semibold tracking-tight">
                    Shared with me
                  </h2>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                    {visibleShared.length}
                  </span>
                </div>
                {renderItems(visibleShared, true)}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusChip({
  active,
  onClick,
  label,
  count,
  dot,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  dot?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "relative inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-transparent text-primary-foreground"
          : "bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
        !active && count === 0 && "opacity-50",
      )}
    >
      {active && (
        <motion.span
          layoutId="chip-pill"
          className="absolute inset-0 rounded-full bg-primary"
          transition={{ type: "spring", stiffness: 500, damping: 38 }}
        />
      )}
      <span className="relative flex items-center gap-1.5">
        {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />}
        {label}
        <span
          className={cn(
            "tabular-nums",
            active ? "text-primary-foreground/80" : "text-muted-foreground/70",
          )}
        >
          {count}
        </span>
      </span>
    </button>
  );
}

function EmptyState() {
  return (
    <div className="relative flex flex-col items-center gap-6 overflow-hidden rounded-3xl border border-dashed bg-card px-6 py-20 text-center animate-fade-up">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-primary">
        <Clapperboard className="h-7 w-7" />
      </div>
      <div className="relative max-w-md">
        <h2 className="font-display text-2xl font-bold tracking-tight">
          Roll camera on your first script
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Write it, move it through the pipeline from Draft to Published, and
          bring your team along with comments, versions and share links.
        </p>
      </div>
      <Link href="/scripts/new" className="relative">
        <Button
          size="lg"
          className="h-11 gap-2 bg-primary px-6 text-primary-foreground"
        >
          <Plus className="h-4 w-4" />
          Create your first script
        </Button>
      </Link>
    </div>
  );
}
