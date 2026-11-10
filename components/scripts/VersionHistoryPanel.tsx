"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { History, RotateCcw, ChevronDown, Loader } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { revertToVersion } from "@/actions/versions";
import type { ScriptVersion } from "@/db/schema";
import { PanelTitle } from "./PanelTitle";

interface Props {
  scriptId: string;
  versions: ScriptVersion[];
  canEdit: boolean;
}

export function VersionHistoryPanel({ scriptId, versions, canEdit }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [revertingId, setRevertingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleRevert = (versionId: string) => {
    setRevertingId(versionId);
    startTransition(async () => {
      const result = await revertToVersion(scriptId, versionId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Reverted to this version.");
        setConfirmId(null);
        router.refresh();
      }
      setRevertingId(null);
    });
  };

  return (
    <div className="space-y-3">
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between"
      >
        <PanelTitle icon={History} count={versions.length}>
          Version History
        </PanelTitle>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            {versions.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Every save snapshots the previous version — nothing yet.
              </p>
            ) : (
              <ol className="relative max-h-72 space-y-1 overflow-y-auto border-l pl-4 ml-2">
                {versions.map((v, i) => (
                  <li key={v.id} className="group/item relative">
                    <span className="absolute -left-[21px] top-3 h-2 w-2 rounded-full bg-border ring-4 ring-background transition-colors group-hover/item:bg-primary" />
                    <div className="flex items-start justify-between gap-2 rounded-lg p-2 transition-colors hover:bg-muted/60">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium">{v.title}</p>
                        <p
                          className="text-[11px] text-muted-foreground"
                          title={format(new Date(v.createdAt), "MMM d, yyyy · h:mm a")}
                        >
                          {i === 0 ? "Latest · " : ""}
                          {formatDistanceToNow(new Date(v.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      {canEdit &&
                        (confirmId === v.id ? (
                          <div className="flex shrink-0 items-center gap-1 text-[11px]">
                            <button
                              onClick={() => handleRevert(v.id)}
                              disabled={isPending}
                              className="rounded bg-primary px-1.5 py-0.5 font-medium text-primary-foreground"
                            >
                              {revertingId === v.id ? (
                                <Loader className="h-3 w-3 animate-spin" />
                              ) : (
                                "Restore"
                              )}
                            </button>
                            <button
                              onClick={() => setConfirmId(null)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmId(v.id)}
                            disabled={isPending}
                            className="mt-0.5 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-primary focus-visible:opacity-100 group-hover/item:opacity-100"
                            title="Revert to this version"
                            aria-label="Revert to this version"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        ))}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
