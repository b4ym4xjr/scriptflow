"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import {
  ArrowLeft,
  CalendarIcon,
  Check,
  CloudOff,
  Loader2,
  Save,
  X,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Script } from "@/db/schema";
import { STATUS_META, TYPE_META } from "@/lib/script-meta";
import { ScriptEditorLayout } from "./ScriptEditorLayout";
import { CollaboratorsPanel } from "./CollaboratorsPanel";
import { StatusBadge } from "./StatusBadge";

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

/**
 * Keep the full timestamp. Truncating to YYYY-MM-DD and re-parsing as UTC
 * shifted the date by a day for users west of UTC on every save.
 */
function formatDateForInput(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toISOString();
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

interface Draft {
  content: string;
  fields: Pick<
    ScriptFormData,
    "title" | "description" | "tags" | "thumbnailNotes"
  >;
  savedAt: number;
}

export function ScriptForm({
  task,
  role,
  collaborators = [],
}: ScriptFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [content, setContent] = useState(task?.content || "");
  const [editorKey, setEditorKey] = useState(0);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const draftKey = `scriptflow-draft-${task?.id ?? "new"}`;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
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
  const title = watch("title");
  const description = watch("description");
  const tags = watch("tags");
  const thumbnailNotes = watch("thumbnailNotes");

  const isContentDirty = content !== (task?.content || "");
  const hasChanges = isDirty || isContentDirty;

  /* ---------- Local draft autosave + restore ---------- */
  useEffect(() => {
    if (!hasChanges) return;
    const t = setTimeout(() => {
      const draft: Draft = {
        content,
        fields: {
          title: title ?? "",
          description: description ?? "",
          tags: tags ?? "",
          thumbnailNotes: thumbnailNotes ?? "",
        },
        savedAt: Date.now(),
      };
      try {
        localStorage.setItem(draftKey, JSON.stringify(draft));
        setDraftSavedAt(draft.savedAt);
      } catch {
        /* storage full / disabled – ignore */
      }
    }, 900);
    return () => clearTimeout(t);
  }, [content, title, description, tags, thumbnailNotes, hasChanges, draftKey]);

  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const draft = JSON.parse(raw) as Draft;
      const differs =
        draft.content !== (task?.content || "") ||
        draft.fields.title !== (task?.title || "");
      if (!differs) {
        localStorage.removeItem(draftKey);
        return;
      }
      // Deferred: on first mount this effect can run before <Toaster/>
      // has subscribed, and sonner drops toasts published before that.
      // (Intentionally not cancelled – restoredRef guards a second run.)
      setTimeout(() => {
        toast("Unsaved draft found", {
          description: `From ${format(new Date(draft.savedAt), "MMM d, h:mm a")}`,
          duration: 12000,
          action: {
            label: "Restore",
            onClick: () => {
              setContent(draft.content);
              setEditorKey((k) => k + 1);
              (Object.keys(draft.fields) as (keyof Draft["fields"])[]).forEach(
                (k) =>
                  setValue(k, draft.fields[k] ?? "", { shouldDirty: true }),
              );
            },
          },
          cancel: {
            label: "Discard",
            onClick: () => localStorage.removeItem(draftKey),
          },
        });
      }, 500);
    } catch {
      /* corrupt draft – ignore */
    }
  }, [draftKey, task, setValue]);

  /* ---------- Warn before leaving with unsaved changes ---------- */
  useEffect(() => {
    if (!hasChanges) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasChanges]);

  const onSubmit = useCallback(
    async (data: ScriptFormData) => {
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

        const result = task
          ? await updateScript(task.id, formData)
          : await createScript(formData);

        if (result.success) {
          localStorage.removeItem(draftKey);
          setDraftSavedAt(null);
          toast.success(task ? "Script updated" : "Script created");
          if (!task) {
            router.push("/");
          } else {
            reset(data);
            setJustSaved(true);
            setTimeout(() => setJustSaved(false), 2200);
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
    },
    [content, task, draftKey, router, reset],
  );

  const submit = handleSubmit(onSubmit, (errs) => {
    console.error("Form validation errors:", errs);
    toast.error("Please check the form for errors");
  });

  // ⌘S / Ctrl+S saves.
  const submitRef = useRef(submit);
  const canSaveRef = useRef(false);
  useEffect(() => {
    submitRef.current = submit;
    canSaveRef.current = !isSubmitting && hasChanges;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (canSaveRef.current) submitRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const Sidebar = (
    <div className="space-y-5 md:space-y-6">
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
          <SelectTrigger id="status" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="p-2">
            {STATUS_META.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                <span className={cn("h-2 w-2 rounded-full", s.dot)} />
                {s.label}
              </SelectItem>
            ))}
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
          <SelectTrigger id="scriptType" className="w-full">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent className="p-2">
            {TYPE_META.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                <t.icon className="h-3.5 w-3.5 text-muted-foreground" />
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          aria-label="Video Description"
          id="description"
          {...register("description")}
          placeholder="What is this video about?"
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
        {tags && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
              .map((t) => (
                <span
                  key={t}
                  className="animate-pop rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
                >
                  #{t}
                </span>
              ))}
          </div>
        )}
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

      <div className="flex flex-col space-y-2">
        <Label htmlFor="targetPublishDate">Target Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-9 w-full pl-3 text-left font-normal",
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
                // Noon local keeps the calendar day stable in every timezone.
                const noon = date
                  ? new Date(
                      date.getFullYear(),
                      date.getMonth(),
                      date.getDate(),
                      12,
                    )
                  : null;
                setValue("targetPublishDate", noon ? noon.toISOString() : "", {
                  shouldDirty: true,
                });
              }}
              disabled={(date) => date < new Date("1900-01-01")}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {targetPublishDate && (
          <button
            type="button"
            onClick={() =>
              setValue("targetPublishDate", "", { shouldDirty: true })
            }
            className="inline-flex items-center gap-1 self-start text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" /> Clear date
          </button>
        )}
      </div>

      {task && role === "owner" && (
        <div className="border-t pt-6">
          <CollaboratorsPanel scriptId={task.id} collaborators={collaborators} />
        </div>
      )}
    </div>
  );

  const saveState = isSubmitting
    ? "saving"
    : justSaved
      ? "saved"
      : hasChanges
        ? "dirty"
        : "clean";

  const HeaderArea = (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <Link href={task ? `/scripts/${task.id}` : "/"}>
          <Button aria-label="back" variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex min-w-0 flex-col">
          <h1 className="max-w-[180px] truncate font-display text-base font-semibold sm:max-w-xs md:max-w-sm lg:max-w-md">
            {title || "Untitled Script"}
          </h1>
          <div className="h-4 text-[11px] text-muted-foreground">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={saveState}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1"
              >
                {saveState === "saving" && "Saving…"}
                {saveState === "saved" && (
                  <>
                    <Check className="h-3 w-3 text-primary" /> All changes saved
                  </>
                )}
                {saveState === "dirty" && (
                  <>
                    <CloudOff className="h-3 w-3 text-muted-foreground" />
                    Unsaved changes
                    {draftSavedAt &&
                      ` · draft kept locally ${format(draftSavedAt, "h:mm:ss a")}`}
                  </>
                )}
                {saveState === "clean" && (task ? "Up to date" : "New script")}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
        <StatusBadge status={status} className="hidden sm:inline-flex" />
      </div>
      <Button
        onClick={submit}
        disabled={isSubmitting || !hasChanges}
        className={cn(
          "gap-2 transition-all",
          hasChanges &&
            "bg-primary text-primary-foreground",
        )}
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">Save</span>
        <kbd className="hidden rounded bg-primary-foreground/20 px-1 text-[10px] lg:inline">
          ⌘S
        </kbd>
      </Button>
    </div>
  );

  return (
    <ScriptEditorLayout header={HeaderArea} sidebar={Sidebar}>
      <div className="mb-5 animate-fade-up">
        <textarea
          aria-label="Title"
          id="title"
          rows={1}
          {...register("title")}
          onKeyDown={(e) => {
            // Titles are single-line; Enter shouldn't insert a newline.
            if (e.key === "Enter") e.preventDefault();
          }}
          placeholder="Untitled script"
          className={cn(
            "field-sizing-content block w-full resize-none bg-transparent font-display text-3xl font-bold leading-tight tracking-tight outline-none placeholder:text-muted-foreground/40 sm:text-4xl",
            errors.title && "text-destructive",
          )}
        />
        {errors.title && (
          <span className="text-xs text-destructive">{errors.title.message}</span>
        )}
      </div>
      <Editor
        key={editorKey}
        content={content}
        onChange={setContent}
        placeholder="Start writing your script… use headings for scenes and quotes for on-screen notes."
        editable={!isSubmitting}
        className="min-h-[300px] sm:min-h-[400px] md:min-h-[calc(100vh-380px)]"
      />
    </ScriptEditorLayout>
  );
}
