"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  History,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Loader,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { revertToVersion } from "@/actions/versions";
import type { ScriptVersion } from "@/db/schema";

interface Props {
  scriptId: string;
  versions: ScriptVersion[];
  canEdit: boolean;
}

export function VersionHistoryPanel({ scriptId, versions, canEdit }: Props) {
  const [expanded, setExpanded] = useState(false);
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
        router.refresh();
      }
      setRevertingId(null);
    });
  };

  return (
    <div className="space-y-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full group"
      >
        <h4 className="font-medium text-gray-900 flex items-center gap-2 text-sm">
          <History className="h-4 w-4" />
          Version History
          <span className="text-xs text-gray-400 font-normal">
            ({versions.length})
          </span>
        </h4>
        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
        )}
      </button>

      {expanded && (
        <>
          {versions.length === 0 ? (
            <p className="text-xs text-gray-400">No versions saved yet.</p>
          ) : (
            <ul className="space-y-2 max-h-72 overflow-y-auto">
              {versions.map((v) => (
                <li
                  key={v.id}
                  className="group/item flex items-start justify-between gap-2 p-2 rounded-lg hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">
                      {v.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(v.createdAt), "MMM d, yyyy · h:mm a")}
                    </p>
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => handleRevert(v.id)}
                      disabled={isPending}
                      className="opacity-0 group-hover/item:opacity-100 transition-opacity text-gray-400 hover:text-black shrink-0 mt-0.5"
                      title="Revert to this version"
                    >
                      {revertingId === v.id ? (
                        <Loader className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
