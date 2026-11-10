"use client";

import { useState, useTransition } from "react";
import { MessageSquare, Trash2, Loader, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addComment, deleteComment } from "@/actions/comments";
import { Avatar, PanelTitle } from "./PanelTitle";

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
      <PanelTitle icon={MessageSquare} count={comments.length}>
        Comments
      </PanelTitle>

      <ul className="space-y-3">
        <AnimatePresence initial={false}>
          {comments.map((c) => (
            <motion.li
              key={c.id}
              layout
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20 }}
              className="group"
            >
              <div className="flex items-start gap-2.5">
                <Avatar name={c.userName} size={26} />
                <div className="min-w-0 flex-1 rounded-xl rounded-tl-sm bg-muted/60 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">{c.userName}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(c.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                    {(c.userId === currentUserId || isOwner) && (
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={isPending}
                        aria-label="Delete comment"
                        className="ml-auto shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                      >
                        {deletingId === c.id ? (
                          <Loader className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                  <p className="mt-0.5 overflow-hidden whitespace-pre-wrap break-words text-xs sm:text-sm">
                    {c.content}
                  </p>
                </div>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {comments.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No comments yet — start the conversation.
        </p>
      )}

      <div className="space-y-2">
        <Textarea
          aria-label="Add comment"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment…"
          className="min-h-[72px] resize-none rounded-xl text-sm sm:min-h-16"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAdd();
          }}
          disabled={isPending}
        />
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">⌘↵ to send</span>
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={isPending || !text.trim()}
            className="h-8 gap-1.5 rounded-lg bg-primary px-3 text-primary-foreground hover:opacity-90"
          >
            {isPending && !deletingId ? (
              <Loader className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                Comment
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
