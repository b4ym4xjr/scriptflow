"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { motion } from "motion/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

interface ScriptEditorLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
  header: ReactNode;
}

export function ScriptEditorLayout({
  children,
  sidebar,
  header,
}: ScriptEditorLayoutProps) {
  const [activeTab, setActiveTab] = useState<"content" | "details">("content");
  const [focus, setFocus] = useState(false);

  // ⌘⇧F toggles focus mode, Esc leaves it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setFocus((f) => !f);
      } else if (e.key === "Escape") {
        setFocus(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex h-screen flex-col bg-background">
      <header
        className={cn(
          "glass z-20 shrink-0 border-x-0 border-t-0 px-4 py-3 transition-opacity duration-500 sm:px-6 lg:px-8",
          focus && "opacity-25 hover:opacity-100 focus-within:opacity-100",
        )}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">{header}</div>
          <ThemeToggle />
        </div>
      </header>

      {/* Mobile tabs */}
      <div className="relative flex shrink-0 border-b md:hidden">
        {(["content", "details"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "relative flex-1 py-2.5 text-sm font-medium capitalize transition-colors",
              activeTab === tab ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {tab}
            {activeTab === tab && (
              <motion.span
                layoutId="mobile-tab"
                className="absolute inset-x-6 bottom-0 h-0.5 rounded-full bg-primary"
              />
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <main
          className={cn(
            "relative min-w-0 flex-1 flex-col",
            activeTab === "details" ? "hidden md:flex" : "flex",
          )}
        >
          <ScrollArea className="relative h-full flex-1">
            <div
              className={cn(
                "mx-auto px-4 py-8 transition-[max-width] duration-500 sm:px-6",
                focus ? "max-w-4xl" : "max-w-3xl",
              )}
            >
              {children}
            </div>
          </ScrollArea>

          <button
            type="button"
            onClick={() => setFocus((f) => !f)}
            title={focus ? "Exit focus mode (Esc)" : "Focus mode (⌘⇧F)"}
            aria-label={focus ? "Exit focus mode" : "Enter focus mode"}
            className="absolute bottom-4 right-4 z-10 hidden h-10 w-10 items-center justify-center rounded-full border bg-card text-muted-foreground shadow-sm transition-colors hover:text-primary md:flex"
          >
            {focus ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </main>

        <aside
          className={cn(
            "shrink-0 flex-col overflow-hidden border-l bg-card/50 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            "w-full md:w-72 lg:w-87.5",
            activeTab === "content" ? "hidden md:flex" : "flex",
            focus && "md:w-0 md:border-l-0 md:opacity-0",
          )}
        >
          <div className="flex h-full w-full flex-col md:w-72 lg:w-87.5">
            <div className="hidden border-b px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:block">
              Video Details
            </div>
            <ScrollArea className="flex-1 overflow-auto">
              <div className="space-y-4 p-4 md:space-y-6">{sidebar}</div>
            </ScrollArea>
          </div>
        </aside>
      </div>
    </div>
  );
}
