"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Image as ImageIcon,
  Pencil,
  Presentation,
  Tag,
  Video,
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Editor } from "@/components/ui/editor";
import { DeleteScriptButton } from "./DeleteScriptButton";
import { CollaboratorsPanel } from "./CollaboratorsPanel";
import { CommentsPanel } from "./CommentsPanel";
import { SharePanel } from "./SharePanel";
import { VersionHistoryPanel } from "./VersionHistoryPanel";
import { ScriptEditorLayout } from "./ScriptEditorLayout";
import { PipelineStepper, StatusBadge } from "./StatusBadge";
import { Teleprompter } from "./Teleprompter";
import { Separator } from "@/components/ui/separator";
import type { Script, CollaboratorRole, ScriptVersion } from "@/db/schema";
import { DUE_CHIP, TYPE_BY_VALUE, getDueInfo } from "@/lib/script-meta";
import { cn } from "@/lib/utils";
import { useMounted } from "@/lib/use-local-storage";

interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: CollaboratorRole;
}

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  userId: string;
  userName: string;
}

interface ViewScriptProps {
  script: Script;
  userName: string;
  role: "owner" | "editor" | "viewer";
  collaborators?: Collaborator[];
  versions?: ScriptVersion[];
  comments?: Comment[];
  currentUserId: string;
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon?: typeof Tag;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </h4>
      <div className="text-sm">{children}</div>
    </div>
  );
}

export default function ViewScript({
  script,
  role,
  collaborators = [],
  versions = [],
  comments = [],
  currentUserId,
}: ViewScriptProps) {
  const [prompting, setPrompting] = useState(false);
  const canEdit = role === "owner" || role === "editor";
  const mounted = useMounted();
  const due = mounted
    ? getDueInfo(script.targetPublishDate, script.status)
    : ({ state: "none", days: null, label: "" } as const);
  const type = script.scriptType ? TYPE_BY_VALUE[script.scriptType] : null;

  const Sidebar = (
    <div className="space-y-5 md:space-y-6 text-sm">
      <div className="space-y-3">
        <PipelineStepper status={script.status} />
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={script.status} />
          <span className="text-xs text-muted-foreground">
            Created {format(new Date(script.createdAt), "MMM d, yyyy")}
          </span>
        </div>
      </div>

      <Separator />

      <Field icon={Video} label="Type">
        <p className="break-words text-foreground/90">
          {type?.label || "Not specified"}
        </p>
      </Field>

      <Field label="Description">
        <p className="overflow-hidden whitespace-pre-wrap break-words text-foreground/90">
          {script.description || (
            <span className="text-muted-foreground">No description</span>
          )}
        </p>
      </Field>

      <Field icon={Tag} label="Tags">
        <div className="flex flex-wrap gap-1.5">
          {script.tags ? (
            script.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
              .map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
                >
                  #{tag}
                </span>
              ))
          ) : (
            <span className="text-muted-foreground">No tags</span>
          )}
        </div>
      </Field>

      <Field icon={ImageIcon} label="Thumbnail Idea">
        <p className="overflow-hidden whitespace-pre-wrap break-words text-foreground/90">
          {script.thumbnailNotes || (
            <span className="text-muted-foreground">No notes</span>
          )}
        </p>
      </Field>

      <Field icon={Calendar} label="Target Date">
        {script.targetPublishDate ? (
          <div className="flex flex-wrap items-center gap-2">
            <span>{format(new Date(script.targetPublishDate), "MMM d, yyyy")}</span>
            {due.state !== "none" && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                  DUE_CHIP[due.state],
                )}
              >
                {due.label}
              </span>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">Not set</span>
        )}
      </Field>

      {role === "owner" && (
        <>
          <Separator />
          <SharePanel
            scriptId={script.id}
            initialToken={script.shareToken ?? null}
          />
          <Separator />
          <CollaboratorsPanel
            scriptId={script.id}
            collaborators={collaborators}
          />
        </>
      )}

      <Separator />
      <VersionHistoryPanel
        scriptId={script.id}
        versions={versions}
        canEdit={canEdit}
      />

      <Separator />
      <CommentsPanel
        scriptId={script.id}
        initialComments={comments}
        currentUserId={currentUserId}
        isOwner={role === "owner"}
      />
    </div>
  );

  const HeaderArea = (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <Link href="/">
          <Button aria-label="back" variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="max-w-[160px] truncate font-display text-base font-semibold sm:max-w-xs sm:text-lg md:max-w-sm lg:max-w-md">
          {script.title}
        </h1>
        <StatusBadge status={script.status} className="hidden sm:inline-flex" />
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPrompting(true)}
          className="gap-2 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
        >
          <Presentation className="h-4 w-4" />
          <span className="hidden sm:inline">Teleprompter</span>
        </Button>
        {canEdit && (
          <Link href={`/scripts/${script.id}/edit`}>
            <Button
              size="sm"
              className="gap-2 bg-primary text-primary-foreground hover:opacity-90"
            >
              <Pencil className="h-4 w-4" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
          </Link>
        )}
        {role === "owner" && <DeleteScriptButton taskId={script.id} />}
      </div>
    </div>
  );

  return (
    <>
      <ScriptEditorLayout header={HeaderArea} sidebar={Sidebar}>
        <div className="mb-6 animate-fade-up space-y-3">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {script.title}
          </h2>
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
            {script.wordCount ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1">
                <FileText className="h-3 w-3" />
                {script.wordCount.toLocaleString()} words
              </span>
            ) : null}
            {script.estimatedDuration ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1">
                <Clock className="h-3 w-3" />~{script.estimatedDuration} min on camera
              </span>
            ) : null}
            <span>
              Updated {format(new Date(script.updatedAt), "MMM d, h:mm a")}
            </span>
          </div>
        </div>
        <Editor
          // Remount on every save/revert so the read-only view never goes stale.
          key={new Date(script.updatedAt).getTime()}
          content={script.content}
          onChange={() => {}}
          editable={false}
          className="min-h-[300px] sm:min-h-[400px] md:min-h-[calc(100vh-320px)]"
        />
      </ScriptEditorLayout>

      <AnimatePresence>
        {prompting && (
          <Teleprompter
            title={script.title}
            html={script.content}
            onClose={() => setPrompting(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
