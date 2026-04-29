"use client";

import { useState, useTransition } from "react";
import { Link2, Link2Off, Copy, Check, Loader } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateShareLink, revokeShareLink } from "@/actions/share";

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
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-gray-900 flex items-center gap-2 text-sm">
        <Link2 className="h-4 w-4" />
        Public Share Link
      </h4>

      {shareUrl ? (
        <div className="space-y-2">
          <div className="flex gap-1.5">
            <Input
              aria-label="Share link"
              readOnly
              value={shareUrl}
              className="h-8 text-xs rounded-lg flex-1"
            />
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2 rounded-lg"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
          <button
            onClick={handleRevoke}
            disabled={isPending}
            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
          >
            {isPending ? (
              <Loader className="h-3 w-3 animate-spin" />
            ) : (
              <Link2Off className="h-3 w-3" />
            )}
            Revoke link
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          <p className="text-xs text-gray-400">
            Anyone with the link can view this script.
          </p>
          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={isPending}
            className="h-8 px-3 bg-black hover:bg-gray-800 text-white rounded-lg text-xs"
          >
            {isPending ? (
              <Loader className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "Create share link"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
