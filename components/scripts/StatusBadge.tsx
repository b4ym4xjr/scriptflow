import type { ScriptStatus } from "@/db/schema";
import { PIPELINE, STATUS_BY_VALUE } from "@/lib/script-meta";
import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
  className,
  showIcon = true,
}: {
  status: ScriptStatus;
  className?: string;
  showIcon?: boolean;
}) {
  const meta = STATUS_BY_VALUE[status];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap",
        meta.chip,
        className,
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {meta.label}
    </span>
  );
}

/** Segmented bar showing how far a script is through the production pipeline. */
export function PipelineStepper({
  status,
  className,
}: {
  status: ScriptStatus;
  className?: string;
}) {
  const idx = PIPELINE.indexOf(status);
  const meta = STATUS_BY_VALUE[status];
  return (
    <div
      className={cn("flex items-center gap-1", className)}
      role="img"
      aria-label={`Pipeline stage: ${meta.label}`}
    >
      {PIPELINE.map((s, i) => {
        const filled = idx >= 0 && i <= idx;
        return (
          <span
            key={s}
            title={STATUS_BY_VALUE[s].label}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-all duration-500",
              filled ? "bg-linear-to-r " + meta.bar : "bg-muted",
            )}
            style={{ transitionDelay: `${i * 40}ms` }}
          />
        );
      })}
    </div>
  );
}
