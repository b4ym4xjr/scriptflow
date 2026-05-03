"use client";

import { useState, useTransition } from "react";
import { MessageSquare, Trash2, Loader, Send } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addComment, deleteComment } from "@/actions/comments";

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  userId: string;
  userName: string;
}

interface Props {
  scriptId: string;
  initialComments: Comment[];
  currentUserId: string;
  isOwner: boolean;
}

export function CommentsPanel({
  scriptId,
  initialComments,
  currentUserId,
  isOwner,
}: Props) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = () => {
    if (!text.trim()) return;
    startTransition(async () => {
      const result = await addComment(scriptId, text.trim());
      if ("error" in result) {
        toast.error(result.error);
      } else {
        setComments((prev) => [...prev, result.comment]);
        setText("");
        toast.success("Comment added.");
      }
    });
  };

  const handleDelete = (commentId: string) => {
    setDeletingId(commentId);
    startTransition(async () => {
      const result = await deleteComment(commentId);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
      setDeletingId(null);
    });
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900 flex items-center gap-2 text-sm">
        <MessageSquare className="h-4 w-4" />
        Comments
        {comments.length > 0 && (
          <span className="text-xs text-gray-400 font-normal">
            ({comments.length})
          </span>
        )}
      </h4>

      {/* Comment list */}
      {comments.length > 0 && (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="group">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-700 shrink-0 mt-0.5">
                  {c.userName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-900">
                      {c.userName}
                    </span>
                    <span className="text-xs text-gray-400">
                      {format(new Date(c.createdAt), "MMM d")}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-700 mt-0.5 whitespace-pre-wrap break-words overflow-hidden">
                    {c.content}
                  </p>
                </div>
                {(c.userId === currentUserId || isOwner) && (
                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={isPending}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-500 shrink-0"
                  >
                    {deletingId === c.id ? (
                      <Loader className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Add comment */}
      <div className="space-y-2">
        <Textarea
          aria-label="Add comment"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment..."
          className="text-sm resize-none min-h-[72px] sm:min-h-16 rounded-lg"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAdd();
          }}
          disabled={isPending}
        />
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={isPending || !text.trim()}
          className="h-9 sm:h-8 px-3 bg-black hover:bg-gray-800 text-white rounded-lg"
        >
          {isPending && !deletingId ? (
            <Loader className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <>
              <Send className="h-3.5 w-3.5 mr-1.5" />
              Comment
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
