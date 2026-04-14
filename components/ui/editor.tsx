"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { cn } from "@/lib/utils";

interface EditorProps {
  content: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
}

export function Editor({
  content,
  onChange,
  placeholder = "Start writing...",
  editable = true,
  className,
}: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
          HTMLAttributes: {
            class: "list-disc",
          },
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
          HTMLAttributes: {
            class: "list-decimal",
          },
        },
        listItem: {
          HTMLAttributes: {
            class: "ml-4",
          },
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
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
          "prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl max-w-none focus:outline-none min-h-[200px] p-4",
          className,
        ),
      },
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-lg focus-within:ring-2 focus-within:ring-black focus-within:border-black h-200 flex flex-col overflow-hidden">
      {editable && (
        <div className="border-b bg-gray-50 p-2 flex gap-1 flex-wrap sticky top-0 z-10 shrink-0">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded hover:bg-gray-200 transition-colors",
              editor.isActive("bold") && "bg-gray-200",
            )}
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded hover:bg-gray-200 transition-colors",
              editor.isActive("italic") && "bg-gray-200",
            )}
          >
            <em>I</em>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={!editor.can().chain().focus().toggleStrike().run()}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded hover:bg-gray-200 transition-colors",
              editor.isActive("strike") && "bg-gray-200",
            )}
          >
            <s>S</s>
          </button>
          <div className="w-px bg-gray-300 mx-1" />
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded hover:bg-gray-200 transition-colors",
              editor.isActive("heading", { level: 1 }) && "bg-gray-200",
            )}
          >
            H1
          </button>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded hover:bg-gray-200 transition-colors",
              editor.isActive("heading", { level: 2 }) && "bg-gray-200",
            )}
          >
            H2
          </button>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded hover:bg-gray-200 transition-colors",
              editor.isActive("heading", { level: 3 }) && "bg-gray-200",
            )}
          >
            H3
          </button>
          <div className="w-px bg-gray-300 mx-1" />
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded hover:bg-gray-200 transition-colors",
              editor.isActive("bulletList") && "bg-gray-200",
            )}
          >
            •
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded hover:bg-gray-200 transition-colors",
              editor.isActive("orderedList") && "bg-gray-200",
            )}
          >
            1.
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded hover:bg-gray-200 transition-colors",
              editor.isActive("blockquote") && "bg-gray-200",
            )}
          >
            &#34;
          </button>
          <div className="w-px bg-gray-300 mx-1" />
          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="px-3 py-1.5 text-sm font-medium rounded hover:bg-gray-200 transition-colors"
          >
            ─
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            className="px-3 py-1.5 text-sm font-medium rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            ↶
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            className="px-3 py-1.5 text-sm font-medium rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            ↷
          </button>
        </div>
      )}
      <div className="flex-1 overflow-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
