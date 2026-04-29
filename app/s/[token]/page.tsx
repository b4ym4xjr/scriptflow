import { notFound } from "next/navigation";
import { getScriptByShareToken } from "@/actions/share";
import { Editor } from "@/components/ui/editor";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default async function PublicScriptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const script = await getScriptByShareToken(token);
  if (!script) notFound();

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b bg-white px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{script.title}</h1>
            <p className="text-xs text-gray-500">
              Shared via ScriptFlow &mdash; read only
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            {script.status.replace(/_/g, " ")}
          </Badge>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 text-xs text-gray-400 font-mono mb-6">
          {script.wordCount && <span>{script.wordCount} words</span>}
          {script.estimatedDuration && <span>~{script.estimatedDuration} min</span>}
          {script.targetPublishDate && (
            <span>Target: {format(new Date(script.targetPublishDate), "MMM d, yyyy")}</span>
          )}
        </div>
        <Editor
          content={script.content}
          editable={false}
          className="min-h-screen"
        />
      </main>
    </div>
  );
}
