"use client";

import { useEffect, useRef, useState } from "react";
import {
  CalendarClock,
  CircleCheckBig,
  Flame,
  Layers,
  type LucideIcon,
} from "lucide-react";
import { animate } from "motion/react";
import type { Script } from "@/db/schema";
import { getDueInfo } from "@/lib/script-meta";

function CountUp({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const controls = animate(prev.current, value, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value]);

  return <span className="tabular-nums">{display}</span>;
}

interface Stat {
  label: string;
  value: number;
  hint: string;
  icon: LucideIcon;
}

export function StatsStrip({ scripts }: { scripts: Script[] }) {
  const active = scripts.filter(
    (s) => s.status !== "PUBLISHED" && s.status !== "ARCHIVED",
  );
  const inProduction = scripts.filter((s) =>
    ["READY_TO_FILM", "FILMING", "EDITING", "READY_TO_PUBLISH"].includes(
      s.status,
    ),
  ).length;
  const dueSoon = active.filter((s) => {
    const d = getDueInfo(s.targetPublishDate, s.status);
    return d.state === "soon" || d.state === "overdue";
  }).length;
  const published = scripts.filter((s) => s.status === "PUBLISHED").length;

  const stats: Stat[] = [
    {
      label: "Total scripts",
      value: scripts.length,
      hint: `${active.length} active`,
      icon: Layers,
    },
    {
      label: "In production",
      value: inProduction,
      hint: "filming → publish",
      icon: Flame,
    },
    {
      label: "Due this week",
      value: dueSoon,
      hint: "incl. overdue",
      icon: CalendarClock,
    },
    {
      label: "Published",
      value: published,
      hint: "shipped to audience",
      icon: CircleCheckBig,
    },
  ];

  return (
    <div className="stagger grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((s, i) => {
        const Icon = s.icon;
        return (
          <div
            key={s.label}
            style={{ "--i": i } as React.CSSProperties}
            className="group relative overflow-hidden rounded-2xl border bg-card p-4 transition-all duration-300"
          >
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {s.label}
                </p>
                <p className="mt-1 font-display text-3xl font-bold tracking-tight">
                  <CountUp value={s.value} />
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {s.hint}
                </p>
              </div>
              <span
                className="rounded-xl bg-secondary p-2 text-primary transition-colors"
              >
                <Icon className="h-4 w-4" />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
