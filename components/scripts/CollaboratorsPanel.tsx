"use client";

import { useState, useTransition } from "react";
import { UserPlus, X, Loader } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addCollaborator, removeCollaborator } from "@/actions/collaborators";
import type { CollaboratorRole } from "@/db/schema";
import { cn } from "@/lib/utils";
import { Avatar, PanelTitle } from "./PanelTitle";

interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: CollaboratorRole;
}

interface CollaboratorsPanelProps {
  scriptId: string;
  collaborators: Collaborator[];
}

export function CollaboratorsPanel({
  scriptId,
  collaborators: initial,
}: CollaboratorsPanelProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>(initial);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CollaboratorRole>("VIEWER");
  const [isPending, startTransition] = useTransition();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleAdd = () => {
    if (!email.trim()) return;
    startTransition(async () => {
      const result = await addCollaborator(scriptId, email.trim(), role);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        setCollaborators((prev) => [...prev, result.collaborator]);
        setEmail("");
        toast.success("Collaborator added.");
      }
    });
  };

  const handleRemove = (userId: string) => {
    setRemovingId(userId);
    startTransition(async () => {
      const result = await removeCollaborator(scriptId, userId);
      if (result.error) {
        toast.error(result.error);
      } else {
        setCollaborators((prev) => prev.filter((c) => c.id !== userId));
        toast.success("Collaborator removed.");
      }
      setRemovingId(null);
    });
  };

  return (
    <div className="space-y-4">
      <PanelTitle icon={UserPlus} count={collaborators.length}>
        Collaborators
      </PanelTitle>

      <div className="space-y-2">
        <Input
          aria-label="Add collaborator email"
          type="email"
          placeholder="teammate@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="h-9 rounded-lg text-sm"
          disabled={isPending}
        />
        <div className="flex gap-2">
          <Select
            value={role}
            onValueChange={(v) => setRole(v as CollaboratorRole)}
            disabled={isPending}
          >
            <SelectTrigger className="h-9 flex-1 rounded-lg text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="p-2">
              <SelectItem value="VIEWER">Viewer</SelectItem>
              <SelectItem value="EDITOR">Editor</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={isPending || !email.trim()}
            className="h-9 rounded-lg bg-primary px-4 text-primary-foreground hover:opacity-90"
          >
            {isPending && !removingId ? (
              <Loader className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "Invite"
            )}
          </Button>
        </div>
      </div>

      <ul className="space-y-1">
        <AnimatePresence initial={false}>
          {collaborators.map((c) => (
            <motion.li
              key={c.id}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="group overflow-hidden"
            >
              <div className="flex items-center gap-2.5 rounded-lg p-1.5 transition-colors hover:bg-muted/60">
                <Avatar name={c.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{c.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {c.email}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-1.5 py-px text-[10px] font-medium ring-1 ring-inset",
                    c.role === "EDITOR"
                      ? "bg-primary/10 text-primary ring-primary/25"
                      : "bg-muted text-muted-foreground ring-border",
                  )}
                >
                  {c.role === "EDITOR" ? "Editor" : "Viewer"}
                </span>
                <button
                  onClick={() => handleRemove(c.id)}
                  disabled={isPending}
                  className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                  title="Remove collaborator"
                  aria-label={`Remove ${c.name}`}
                >
                  {removingId === c.id ? (
                    <Loader className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <X className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {collaborators.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Invite a teammate to review or co-write this script.
        </p>
      )}
    </div>
  );
}
