import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground",
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden
      >
        {/* A page whose lines flow into a play triangle */}
        <path d="M5 6h6" />
        <path d="M5 10h4" />
        <path d="M5 14h3" />
        <path d="M12 9.5v7l6-3.5-6-3.5z" fill="currentColor" stroke="none" />
      </svg>
      <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/25" />
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="font-display text-xl font-bold tracking-tight">
        Script<span className="text-primary">Flow</span>
      </span>
    </span>
  );
}
