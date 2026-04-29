"use client";

import { useState, useTransition } from "react";
import { UserPlus, X, Loader } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addCollaborator, removeCollaborator } from "@/actions/collaborators";
import type { CollaboratorRole } from "@/db/schema";

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
      <h4 className="font-medium text-gray-900 flex items-center gap-2 text-sm">
        <UserPlus className="h-4 w-4" />
        Collaborators
      </h4>

      {/* Add collaborator form */}
      <div className="space-y-2">
        <Input
          aria-label="Add collaborator email"
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="h-9 text-sm rounded-lg"
          disabled={isPending}
        />
        <div className="flex gap-2">
          <Select
            value={role}
            onValueChange={(v) => setRole(v as CollaboratorRole)}
            disabled={isPending}
          >
            <SelectTrigger className="h-9 text-sm rounded-lg flex-1">
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
            className="h-9 px-3 rounded-lg bg-black hover:bg-gray-800 text-white"
          >
            {isPending && !removingId ? (
              <Loader className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "Add"
            )}
          </Button>
        </div>
      </div>

      {/* Collaborator list */}
      {collaborators.length > 0 && (
        <>
          <Separator />
          <ul className="space-y-2">
            {collaborators.map((c) => (
              <li key={c.id} className="flex items-center gap-2 group">
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-700 shrink-0">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">
                    {c.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{c.email}</p>
                </div>
                <Badge
                  variant="secondary"
                  className="text-xs shrink-0 px-1.5 py-0"
                >
                  {c.role === "EDITOR" ? "Editor" : "Viewer"}
                </Badge>
                <button
                  onClick={() => handleRemove(c.id)}
                  disabled={isPending}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 shrink-0"
                  title="Remove collaborator"
                >
                  {removingId === c.id ? (
                    <Loader className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <X className="h-3.5 w-3.5" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {collaborators.length === 0 && (
        <p className="text-xs text-gray-400">No collaborators yet.</p>
      )}
    </div>
  );
}
