"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createScript, updateScript } from "@/actions/scripts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Editor } from "@/components/ui/editor";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Save, CalendarIcon } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Script } from "@/db/schema";
import { ScriptEditorLayout } from "./ScriptEditorLayout";
import { CollaboratorsPanel } from "./CollaboratorsPanel";

const scriptSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().optional(),
  status: z.enum([
    "DRAFT",
    "WRITING",
    "REVIEW",
    "READY_TO_FILM",
    "FILMING",
    "EDITING",
    "READY_TO_PUBLISH",
    "PUBLISHED",
    "ARCHIVED",
  ]),
  scriptType: z
    .enum([
      "TUTORIAL",
      "REVIEW",
      "VLOG",
      "EDUCATIONAL",
      "ENTERTAINMENT",
      "OTHER",
    ])
    .optional(),
  description: z.string().optional(),
  tags: z.string().optional(),
  targetPublishDate: z.string().optional(),
  thumbnailNotes: z.string().optional(),
});

type ScriptFormData = z.infer<typeof scriptSchema>;

function formatDateForInput(date: Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().split("T")[0];
}

interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: "VIEWER" | "EDITOR";
}

interface ScriptFormProps {
  task?: Script;
  role?: "owner" | "editor";
  collaborators?: Collaborator[];
}

export function ScriptForm({
  task,
  role,
  collaborators = [],
}: ScriptFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [content, setContent] = useState(task?.content || "");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ScriptFormData>({
    resolver: zodResolver(scriptSchema),
    defaultValues: {
      title: task?.title || "",
      content: task?.content || "",
      status: task?.status || "DRAFT",
      scriptType: task?.scriptType || undefined,
      description: task?.description || "",
      tags: task?.tags || "",
      targetPublishDate: formatDateForInput(task?.targetPublishDate),
      thumbnailNotes: task?.thumbnailNotes || "",
    },
  });

  const status = watch("status");
  const scriptType = watch("scriptType");
  const targetPublishDate = watch("targetPublishDate");

  const isContentDirty = content !== (task?.content || "");

  const onSubmit = async (data: ScriptFormData) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("content", content);
      formData.append("status", data.status);
      if (data.scriptType) formData.append("scriptType", data.scriptType);
      if (data.description) formData.append("description", data.description);
      if (data.tags) formData.append("tags", data.tags);
      if (data.targetPublishDate)
        formData.append("targetPublishDate", data.targetPublishDate);
      if (data.thumbnailNotes)
        formData.append("thumbnailNotes", data.thumbnailNotes);

      let result;
      if (task) {
        result = await updateScript(task.id, formData);
      } else {
        result = await createScript(formData);
      }

      if (result.success) {
        toast.success(task ? "Script updated" : "Script created");
        if (!task) {
          router.push("/");
        } else {
          router.refresh();
        }
      } else {
        toast.error(result.error || "Failed to save script");
      }
    } catch (error) {
      console.error("Error saving script: ", error);
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const Sidebar = (
    <div className="space-y-4 md:space-y-6">
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={status}
          onValueChange={(value) =>
            setValue("status", value as ScriptFormData["status"], {
              shouldDirty: true,
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="p-2">
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="WRITING">Writing</SelectItem>
            <SelectItem value="REVIEW">Review</SelectItem>
            <SelectItem value="READY_TO_FILM">Ready to Film</SelectItem>
            <SelectItem value="FILMING">Filming</SelectItem>
            <SelectItem value="EDITING">Editing</SelectItem>
            <SelectItem value="READY_TO_PUBLISH">Ready to Publish</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="scriptType">Type</Label>
        <Select
          value={scriptType}
          onValueChange={(value) =>
            setValue("scriptType", value as ScriptFormData["scriptType"], {
              shouldDirty: true,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TUTORIAL">Tutorial</SelectItem>
            <SelectItem value="REVIEW">Review</SelectItem>
            <SelectItem value="VLOG">Vlog</SelectItem>
            <SelectItem value="EDUCATIONAL">Educational</SelectItem>
            <SelectItem value="ENTERTAINMENT">Entertainment</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          aria-label="Title"
          id="title"
          {...register("title")}
          className={
            errors.title ? "border-red-500 focus-visible:ring-red-500" : ""
          }
          placeholder="Enter video title"
        />
        {errors.title && (
          <span className="text-xs text-red-500">{errors.title.message}</span>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          aria-label="Video Description"
          id="description"
          {...register("description")}
          placeholder="Video description"
          className="min-h-24"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <Input
          aria-label="Tags"
          id="tags"
          {...register("tags")}
          placeholder="comma, separated, tags"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="thumbnailNotes">Thumbnail Idea</Label>
        <Textarea
          aria-label="Thumbnail Idea"
          id="thumbnailNotes"
          {...register("thumbnailNotes")}
          placeholder="Thumbnail concept"
        />
      </div>

      <div className="space-y-2 flex flex-col">
        <Label htmlFor="targetPublishDate">Target Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full pl-3 text-left font-normal",
                !targetPublishDate && "text-muted-foreground",
              )}
            >
              {targetPublishDate ? (
                format(new Date(targetPublishDate), "PPP")
              ) : (
                <span>Pick a date</span>
              )}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
            <Calendar
              mode="single"
              selected={
                targetPublishDate ? new Date(targetPublishDate) : undefined
              }
              onSelect={(date) => {
                setValue("targetPublishDate", date ? date.toISOString() : "", {
                  shouldDirty: true,
                });
              }}
              disabled={(date) => date < new Date("1900-01-01")}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {task && role === "owner" && (
        <>
          <div className="border-t pt-6">
            <CollaboratorsPanel
              scriptId={task.id}
              collaborators={collaborators}
            />
          </div>
        </>
      )}
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
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold text-gray-900 truncate max-w-[200px] sm:max-w-xs md:max-w-sm lg:max-w-md">
            {watch("title") || "Untitled Script"}
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          onClick={handleSubmit(onSubmit, (errors) => {
            console.error("Form validation errors:", errors);
            toast.error("Please check the form for errors");
          })}
          disabled={isSubmitting || (!isDirty && !isContentDirty)}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save
            </>
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <ScriptEditorLayout header={HeaderArea} sidebar={Sidebar}>
      <Editor
        content={content}
        onChange={setContent}
        placeholder="Start writing your script..."
        editable={!isSubmitting}
        className="min-h-[300px] sm:min-h-[400px] md:min-h-[calc(100vh-200px)]"
      />
    </ScriptEditorLayout>
  );
}
