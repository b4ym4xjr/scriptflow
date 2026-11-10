import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Calendar, Clock, Eye, FileText } from "lucide-react";
import type { Metadata } from "next";
import { getScriptByShareToken } from "@/actions/share";
import { Editor } from "@/components/ui/editor";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ReadingProgress } from "@/components/ReadingProgress";
import { StatusBadge } from "@/components/scripts/StatusBadge";
import { Button } from "@/components/ui/button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const script = await getScriptByShareToken(token);
  return {
    title: script ? script.title : "Shared script",
    robots: { index: false, follow: false },
  };
}

export default async function PublicScriptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const script = await getScriptByShareToken(token);
  if (!script) notFound();

  return (
    <div className="relative min-h-screen">
      <header className="glass sticky top-0 z-20 border-x-0 border-t-0">
        <div className="relative mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="ScriptFlow">
            <Logo className="scale-90 origin-left" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border bg-card/70 px-2.5 py-1 text-xs text-muted-foreground sm:inline-flex">
              <Eye className="h-3 w-3" /> Read only
            </span>
            <ThemeToggle />
          </div>
          <ReadingProgress />
        </div>
      </header>

      <main className="relative mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="mb-8 animate-fade-up space-y-4">
          <StatusBadge status={script.status} />
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
            {script.title}
          </h1>
          {script.description && (
            <p className="max-w-2xl text-lg text-muted-foreground">
              {script.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
            {script.wordCount ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1">
                <FileText className="h-3 w-3" />
                {script.wordCount.toLocaleString()} words
              </span>
            ) : null}
            {script.estimatedDuration ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1">
                <Clock className="h-3 w-3" />~{script.estimatedDuration} min
              </span>
            ) : null}
            {script.targetPublishDate && (
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1">
                <Calendar className="h-3 w-3" />
                Target {format(new Date(script.targetPublishDate), "MMM d, yyyy")}
              </span>
            )}
          </div>
        </div>

        <Editor
          content={script.content}
          editable={false}
          className="min-h-[60vh]"
        />

        <footer className="mt-12 flex flex-col items-center gap-3 border-t pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Shared via ScriptFlow — write, review and ship video scripts with
            your team.
          </p>
          <Button
            asChild
            className="bg-primary text-primary-foreground hover:opacity-90"
          >
            <Link href="/sign-up">Try ScriptFlow free</Link>
          </Button>
        </footer>
      </main>
    </div>
  );
}
