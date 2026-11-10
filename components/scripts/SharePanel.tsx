"use client";

import { useState, useTransition } from "react";
import { Link2, Link2Off, Copy, Check, Loader, Globe } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateShareLink, revokeShareLink } from "@/actions/share";
import { PanelTitle } from "./PanelTitle";

interface Props {
  scriptId: string;
  initialToken: string | null;
}

export function SharePanel({ scriptId, initialToken }: Props) {
  const [token, setToken] = useState<string | null>(initialToken);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
  const shareUrl = token ? `${appUrl}/s/${token}` : null;

  const handleGenerate = () => {
    startTransition(async () => {
      const result = await generateShareLink(scriptId);
      if ("token" in result && result.token) {
        setToken(result.token);
        toast.success("Share link created.");
      } else {
        toast.error("Failed to create share link.");
      }
    });
  };

  const handleRevoke = () => {
    startTransition(async () => {
      await revokeShareLink(scriptId);
      setToken(null);
      toast.success("Share link revoked.");
    });
  };

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <PanelTitle icon={Link2}>Public Share Link</PanelTitle>

      <AnimatePresence mode="wait" initial={false}>
        {shareUrl ? (
          <motion.div
            key="on"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-2"
          >
            <p className="flex items-center gap-1.5 text-xs text-primary">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Live — anyone with the link can read
            </p>
            <div className="flex gap-1.5">
              <Input
                aria-label="Share link"
                readOnly
                value={shareUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="h-8 flex-1 rounded-lg text-xs"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-lg px-2"
                onClick={handleCopy}
                aria-label="Copy link"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
            <button
              onClick={handleRevoke}
              disabled={isPending}
              className="flex items-center gap-1 text-xs text-destructive transition-opacity hover:opacity-70"
            >
              {isPending ? (
                <Loader className="h-3 w-3 animate-spin" />
              ) : (
                <Link2Off className="h-3 w-3" />
              )}
              Revoke link
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="off"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-2"
          >
            <p className="text-xs text-muted-foreground">
              Create a read-only link — no account needed to view.
            </p>
            <Button
              size="sm"
              onClick={handleGenerate}
              disabled={isPending}
              className="h-8 gap-1.5 rounded-lg bg-primary px-3 text-xs text-primary-foreground hover:opacity-90"
            >
              {isPending ? (
                <Loader className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <Globe className="h-3.5 w-3.5" />
                  Create share link
                </>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
