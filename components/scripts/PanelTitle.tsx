import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function PanelTitle({
  icon: Icon,
  children,
  count,
}: {
  icon: LucideIcon;
  children: ReactNode;
  count?: number;
}) {
  return (
    <h4 className="flex items-center gap-2 text-sm font-semibold">
      <span className="rounded-md bg-primary/10 p-1 text-primary">
        <Icon className="h-3.5 w-3.5" />
      </span>
      {children}
      {typeof count === "number" && count > 0 && (
        <span className="rounded-full bg-muted px-1.5 text-[11px] font-normal tabular-nums text-muted-foreground">
          {count}
        </span>
      )}
    </h4>
  );
}

export function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  return (
    <span
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground"
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
