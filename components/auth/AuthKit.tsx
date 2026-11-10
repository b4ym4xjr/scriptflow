"use client";

import { useEffect, useState, type ComponentProps, type ReactNode } from "react";
import { Check, Eye, EyeOff, Loader, type LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PIPELINE, STATUS_BY_VALUE } from "@/lib/script-meta";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Card                                                                */
/* ------------------------------------------------------------------ */

export function AuthCard({
  icon: Icon,
  title,
  subtitle,
  tone = "brand",
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: ReactNode;
  tone?: "brand" | "success" | "danger";
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-md animate-fade-up",
        className,
      )}
    >
      <Card className="relative overflow-hidden border bg-card py-0 shadow-sm">
        <CardHeader className="relative z-10 space-y-1 px-6 pb-4 pt-8">
          <div className="mb-4 flex justify-center">
            <motion.div
              initial={{ scale: 0.5, rotate: -12, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-2xl",
                tone === "brand" && "bg-primary text-primary-foreground",
                tone === "success" && "bg-secondary text-primary",
                tone === "danger" && "bg-destructive/10 text-destructive",
              )}
            >
              <Icon className="h-8 w-8" />
            </motion.div>
          </div>
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </CardHeader>
        {children && (
          <CardContent className="relative z-10 space-y-5 px-6 pb-8">
            {children}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Inputs                                                              */
/* ------------------------------------------------------------------ */

export function AuthInput({
  label,
  icon: Icon,
  error,
  password,
  className,
  id,
  ...props
}: Omit<ComponentProps<"input">, "type"> & {
  label: string;
  icon: LucideIcon;
  error?: string;
  /** Renders a show/hide toggle and uses a password input. */
  password?: boolean;
  type?: string;
}) {
  const [show, setShow] = useState(false);
  const type = password ? (show ? "text" : "password") : (props.type ?? "text");

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <div className="group relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
        <Input
          {...props}
          id={id}
          type={type}
          aria-invalid={!!error}
          className={cn(
            "h-12 rounded-xl bg-background/60 pl-10 text-base transition-shadow md:text-sm",
            password && "pr-11",
            className,
          )}
        />
        {password && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden text-sm text-destructive"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SubmitButton({
  loading,
  loadingText,
  children,
}: {
  loading: boolean;
  loadingText: string;
  children: ReactNode;
}) {
  return (
    <Button
      type="submit"
      disabled={loading}
      className="h-12 w-full rounded-xl bg-primary text-base font-medium text-primary-foreground transition-all active:scale-[0.99]"
    >
      {loading ? (
        <>
          <Loader className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

/* ------------------------------------------------------------------ */
/* Password strength                                                   */
/* ------------------------------------------------------------------ */

export function PasswordStrength({ password }: { password?: string }) {
  const value = password ?? "";
  const rules = [
    { label: "8+ characters", met: value.length >= 8 },
    { label: "Uppercase", met: /[A-Z]/.test(value) },
    { label: "Lowercase", met: /[a-z]/.test(value) },
    { label: "Number", met: /\d/.test(value) },
  ];
  const score = rules.filter((r) => r.met).length;
  const labels = ["Too weak", "Weak", "Okay", "Good", "Strong"];
  const colors = [
    "bg-muted",
    "bg-primary/30",
    "bg-primary/50",
    "bg-primary/75",
    "bg-primary",
  ];

  return (
    <AnimatePresence initial={false}>
      {value && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="space-y-2.5 rounded-xl border bg-muted/40 p-3">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-colors duration-300",
                    i <= score ? colors[score] : "bg-muted",
                  )}
                />
              ))}
              <span className="ml-2 w-16 text-right text-xs font-medium text-muted-foreground">
                {labels[score]}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              {rules.map((r) => (
                <span
                  key={r.label}
                  className={cn(
                    "flex items-center gap-1.5 text-xs transition-colors",
                    r.met
                      ? "text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-3.5 w-3.5 items-center justify-center rounded-full border transition-all",
                      r.met
                        ? "scale-110 border-primary bg-primary text-primary-foreground"
                        : "border-border",
                    )}
                  >
                    {r.met && <Check className="h-2.5 w-2.5" />}
                  </span>
                  {r.label}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/* Hero panel                                                          */
/* ------------------------------------------------------------------ */

const DEMO_SCRIPTS = [
  { title: "10 VS Code tricks you're not using", at: 1 },
  { title: "I tried the viral productivity method", at: 3 },
  { title: "Behind the scenes: studio tour", at: 5 },
];

/** Marketing panel with a live-looking pipeline that keeps moving. */
export function AuthHero({
  badge,
  title,
  accent,
  text,
}: {
  badge: string;
  title: string;
  accent: string;
  text: string;
}) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="hidden animate-fade-up flex-col justify-center space-y-8 lg:flex">
      <div className="space-y-5">
        <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          {badge}
        </div>
        <h2 className="font-display text-5xl font-bold leading-[1.05] tracking-tight">
          {title}{" "}
          <span className="text-primary">{accent}</span>
        </h2>
        <p className="max-w-md text-lg leading-relaxed text-muted-foreground">
          {text}
        </p>
      </div>

      {/* Live pipeline preview */}
      <div className="relative max-w-md space-y-3">
        {DEMO_SCRIPTS.map((s, i) => {
          const idx = (s.at + tick) % PIPELINE.length;
          const meta = STATUS_BY_VALUE[PIPELINE[idx]];
          const Icon = meta.icon;
          return (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.12, type: "spring", stiffness: 200, damping: 22 }}
              className="rounded-2xl border bg-card p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-semibold">{s.title}</p>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={meta.value}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                      meta.chip,
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {meta.label}
                  </motion.span>
                </AnimatePresence>
              </div>
              <div className="mt-3 flex gap-1">
                {PIPELINE.map((p, pi) => (
                  <span
                    key={p}
                    className={cn(
                      "h-1.5 flex-1 rounded-full transition-all duration-700",
                      pi <= idx ? "bg-linear-to-r " + meta.bar : "bg-muted",
                    )}
                  />
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
