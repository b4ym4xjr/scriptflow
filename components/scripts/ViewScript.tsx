"use client";

import { Button } from "@/components/ui/button";
import { Editor } from "@/components/ui/editor";
import { ArrowLeft, Video, Calendar, Tag, Image } from "lucide-react";
import { DeleteScriptButton } from "./DeleteScriptButton";
import { CollaboratorsPanel } from "./CollaboratorsPanel";
import { CommentsPanel } from "./CommentsPanel";
import { SharePanel } from "./SharePanel";
import { format } from "date-fns";
import Link from "next/link";
import { ScriptEditorLayout } from "./ScriptEditorLayout";
import { Badge } from "@/components/ui/badge";
import type {
  Script,
  ScriptStatus,
  CollaboratorRole,
  ScriptVersion,
} from "@/db/schema";
import { Separator } from "@/components/ui/separator";
import { Pencil } from "lucide-react";

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

function getStatusLabel(status: ScriptStatus) {
  if (status === "READY_TO_FILM") return "Ready to Film";
  if (status === "READY_TO_PUBLISH") return "Ready to Publish";
  return status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ");
}

export default function ViewScript({
  script,
  role,
  collaborators = [],
  versions = [],
  comments = [],
  currentUserId,
}: ViewScriptProps) {
  const canEdit = role === "owner" || role === "editor";

  const Sidebar = (
    <div className="space-y-6 text-sm">
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Status</h4>
        <div className="flex flex-col gap-2">
          <Badge variant="outline" className="w-fit">
            {getStatusLabel(script.status)}
          </Badge>
          <span className="text-xs text-gray-500">
            Created {format(new Date(script.createdAt), "MMM d, yyyy")}
          </span>
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <Tag className="h-4 w-4" /> Type
        </h4>
        <p className="text-gray-600">{script.scriptType || "Not specified"}</p>
      </div>

      <Separator />

      <div className="space-y-3">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <Video className="h-4 w-4" />
          Title
        </h4>
        <p className="text-gray-600">{script.title || "Not specified"}</p>
      </div>

      <Separator />

      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Description</h4>
        <p className="text-gray-600 whitespace-pre-wrap">
          {script.description || "No description"}
        </p>
      </div>

      <Separator />

      <div className="space-y-3">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <Tag className="h-4 w-4" /> Tags
        </h4>
        <div className="flex flex-wrap gap-2">
          {script.tags ? (
            script.tags.split(",").map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="px-1.5 py-0 text-xs"
              >
                {tag.trim()}
              </Badge>
            ))
          ) : (
            <span className="text-gray-500">No tags</span>
          )}
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <Image className="h-4 w-4" /> Thumbnail Idea
        </h4>
        <p className="text-gray-600 whitespace-pre-wrap">
          {script.thumbnailNotes || "No notes"}
        </p>
      </div>

      <Separator />

      <div className="space-y-3">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <Calendar className="h-4 w-4" /> Target Date
        </h4>
        <p className="text-gray-600">
          {script.targetPublishDate
            ? format(new Date(script.targetPublishDate), "MMM d, yyyy")
            : "Not set"}
        </p>
      </div>

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

      {/*TODO: Fix versioning*/}
      {/*<Separator />*/}
      {/*<VersionHistoryPanel*/}
      {/*  scriptId={script.id}*/}
      {/*  versions={versions}*/}
      {/*  canEdit={canEdit}*/}
      {/*/>*/}

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
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button aria-label="back" variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-gray-900 truncate max-w-100">
          {script.title}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        {canEdit && (
          <Link href={`/scripts/${script.id}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
        )}
        {role === "owner" && <DeleteScriptButton taskId={script.id} />}
      </div>
    </div>
  );

  return (
    <ScriptEditorLayout header={HeaderArea} sidebar={Sidebar}>
      <div className="mb-4 flex items-center gap-4 text-xs text-gray-500 font-mono">
        {script.wordCount && <span>{script.wordCount} words</span>}
        {script.estimatedDuration && (
          <span>~{script.estimatedDuration} min read</span>
        )}
      </div>
      <Editor
        content={script.content}
        onChange={() => {}}
        editable={false}
        className="min-h-[calc(100vh-250px)]"
      />
    </ScriptEditorLayout>
  );
}
