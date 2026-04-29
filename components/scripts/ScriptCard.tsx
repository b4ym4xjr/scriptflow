"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Pencil } from "lucide-react";
import type { Script, ScriptStatus } from "@/db/schema";
import { DeleteScriptButton } from "./DeleteScriptButton";

interface ScriptCardProps {
  script: Script;
  isShared?: boolean;
}

function getStatusColor(status: ScriptStatus) {
  switch (status) {
    case "DRAFT":
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    case "WRITING":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200";
    case "REVIEW":
      return "bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200";
    case "READY_TO_FILM":
      return "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200";
    case "FILMING":
      return "bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border-indigo-200";
    case "EDITING":
      return "bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200";
    case "READY_TO_PUBLISH":
      return "bg-teal-100 text-teal-800 hover:bg-teal-200 border-teal-200";
    case "PUBLISHED":
      return "bg-green-100 text-green-800 hover:bg-green-200 border-green-200";
    case "ARCHIVED":
      return "bg-gray-100 text-gray-500 hover:bg-gray-200 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
  }
}

function getStatusLabel(status: ScriptStatus) {
  switch (status) {
    case "READY_TO_FILM":
      return "Ready to Film";
    case "READY_TO_PUBLISH":
      return "Ready to Publish";
    default:
      return (
        status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ")
      );
  }
}

export function ScriptCard({ script, isShared = false }: ScriptCardProps) {
  // Helper to strip HTML tags for preview using a simple regex for safety/simplicity
  const getPreviewText = (html: string) => {
    if (!html) return "No content";
    const text = html.replace(/<[^>]*>/g, " ");
    return text.length > 100 ? text.slice(0, 100) + "..." : text;
  };

  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow bg-white">
      <CardHeader className="p-5 pb-2">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-base font-semibold leading-tight text-gray-900 line-clamp-2">
            {script.title}
          </CardTitle>
          <Badge
            variant="outline"
            className={`shrink-0 font-normal px-2.5 py-0.5 ${getStatusColor(script.status)}`}
          >
            {getStatusLabel(script.status)}
          </Badge>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {/* Date placeholder if needed, or other metadata */}
          {script.estimatedDuration
            ? `${script.estimatedDuration} min`
            : "No duration"}
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-2 flex-1">
        <p className="text-sm text-gray-500 line-clamp-3">
          {script.description || getPreviewText(script.content)}
        </p>
      </CardContent>
      <CardFooter className="p-5 pt-0 flex gap-2">
        <Link href={`/scripts/${script.id}`} className="flex-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 text-gray-700"
          >
            <Eye className="h-4 w-4" />
            View
          </Button>
        </Link>
        <Link href={`/scripts/${script.id}/edit`} className="flex-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 text-gray-700"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </Link>
        {!isShared && (
          <div className="flex-1">
            <DeleteScriptButton taskId={script.id} />
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
