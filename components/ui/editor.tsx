"use client";

import {
  useEditor,
  useEditorState,
  EditorContent,
  type Editor as TiptapEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EditorProps {
  content: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  /** Show the live words / read-time footer (defaults to true when editable). */
  showStats?: boolean;
}

/** Average spoken pace used for the "on-camera time" estimate. */
export const WORDS_PER_MINUTE = 150;

export function formatMinutes(words: number) {
  if (words === 0) return "0 min";
  const totalSeconds = Math.round((words / WORDS_PER_MINUTE) * 60);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return s ? `${m}m ${s}s` : `${m} min`;
}

interface ToolbarButtonProps {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function ToolbarButton({
  label,
  icon: Icon,
  active,
  disabled,
  onClick,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground active:scale-90 disabled:pointer-events-none disabled:opacity-35",
        active && "bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary",
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-border" />;
}

function Toolbar({ editor }: { editor: TiptapEditor }) {
  const s = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      underline: editor.isActive("underline"),
      strike: editor.isActive("strike"),
      code: editor.isActive("code"),
      h1: editor.isActive("heading", { level: 1 }),
      h2: editor.isActive("heading", { level: 2 }),
      h3: editor.isActive("heading", { level: 3 }),
      bullet: editor.isActive("bulletList"),
      ordered: editor.isActive("orderedList"),
      quote: editor.isActive("blockquote"),
      canUndo: editor.can().undo(),
      canRedo: editor.can().redo(),
    }),
  });
  const chain = () => editor.chain().focus();

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 rounded-t-2xl border-b bg-card/85 p-1.5 backdrop-blur-md"
    >
      <ToolbarButton label="Bold (⌘B)" icon={Bold} active={s.bold} onClick={() => chain().toggleBold().run()} />
      <ToolbarButton label="Italic (⌘I)" icon={Italic} active={s.italic} onClick={() => chain().toggleItalic().run()} />
      <ToolbarButton label="Underline (⌘U)" icon={UnderlineIcon} active={s.underline} onClick={() => chain().toggleUnderline().run()} />
      <ToolbarButton label="Strikethrough" icon={Strikethrough} active={s.strike} onClick={() => chain().toggleStrike().run()} />
      <ToolbarButton label="Inline code" icon={Code} active={s.code} onClick={() => chain().toggleCode().run()} />
      <Divider />
      <ToolbarButton label="Heading 1" icon={Heading1} active={s.h1} onClick={() => chain().toggleHeading({ level: 1 }).run()} />
      <ToolbarButton label="Heading 2" icon={Heading2} active={s.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()} />
      <ToolbarButton label="Heading 3" icon={Heading3} active={s.h3} onClick={() => chain().toggleHeading({ level: 3 }).run()} />
      <Divider />
      <ToolbarButton label="Bullet list" icon={List} active={s.bullet} onClick={() => chain().toggleBulletList().run()} />
      <ToolbarButton label="Numbered list" icon={ListOrdered} active={s.ordered} onClick={() => chain().toggleOrderedList().run()} />
      <ToolbarButton label="Quote / on-screen note" icon={Quote} active={s.quote} onClick={() => chain().toggleBlockquote().run()} />
      <ToolbarButton label="Scene break" icon={Minus} onClick={() => chain().setHorizontalRule().run()} />
      <Divider />
      <ToolbarButton label="Undo (⌘Z)" icon={Undo2} disabled={!s.canUndo} onClick={() => chain().undo().run()} />
      <ToolbarButton label="Redo (⌘⇧Z)" icon={Redo2} disabled={!s.canRedo} onClick={() => chain().redo().run()} />
    </div>
  );
}

function StatsBar({ editor }: { editor: TiptapEditor }) {
  const { words, chars } = useEditorState({
    editor,
    selector: ({ editor }) => {
      const text = editor.getText();
      const trimmed = text.trim();
      return {
        words: trimmed ? trimmed.split(/\s+/).length : 0,
        chars: text.length,
      };
    },
  });

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-b-2xl border-t bg-muted/40 px-4 py-2 font-mono text-[11px] text-muted-foreground">
      <span className="tabular-nums">
        <strong className="font-semibold text-foreground">{words.toLocaleString()}</strong> words
      </span>
      <span className="tabular-nums">{chars.toLocaleString()} chars</span>
      <span className="ml-auto flex items-center gap-1.5 tabular-nums">
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        ~{formatMinutes(words)} on camera
      </span>
    </div>
  );
}

export function Editor({
  content,
  onChange,
  placeholder = "Start writing...",
  editable = true,
  className,
  showStats,
}: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    editable,
    immediatelyRender: false,
    onUpdate: onChange
      ? ({ editor }) => {
          onChange(editor.getHTML());
        }
      : undefined,
    editorProps: {
      attributes: {
        class: cn(
          "script-prose max-w-none focus:outline-none min-h-[200px] px-5 py-5 sm:px-8",
          className,
        ),
      },
    },
  });

  if (!editor) {
    return (
      <div className="rounded-2xl border bg-card p-6 space-y-3" aria-busy>
        <div className="skeleton h-6 w-2/3" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-5/6" />
        <div className="skeleton h-4 w-3/4" />
      </div>
    );
  }

  const stats = showStats ?? editable;

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card shadow-sm transition-shadow",
        editable && "focus-within:border-primary/40 focus-within:ring-3 focus-within:ring-primary/10",
      )}
    >
      {editable && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
      {stats && <StatsBar editor={editor} />}
    </div>
  );
}
