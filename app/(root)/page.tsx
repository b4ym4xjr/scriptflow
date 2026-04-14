import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getScripts } from "@/actions/scripts";
import { Header } from "@/components/Header";
import { ScriptCard } from "@/components/scripts/ScriptCard";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import type { ScriptStatus, ScriptType } from "@/db/schema";

interface HomePageProps {
  searchParams: Promise<{ q?: string; status?: string; type?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const { q, status, type } = await searchParams;

  const [scripts] = await Promise.all([
    getScripts({
      q: q || undefined,
      status: status as ScriptStatus | undefined,
      scriptType: type as ScriptType | undefined,
    }),
  ]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <Header name={session.user.name ?? "User"} />

      <main className="flex-1 flex flex-col min-h-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-4 shrink-0 w-full">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                Script Dashboard
              </h2>
              <p className="text-sm text-gray-500">
                Manage your content pipeline
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/scripts/new">
                <Button className="gap-2 shadow-sm">
                  <Plus className="h-4 w-4" />
                  New Script
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
            {scripts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="bg-gray-100 p-4 rounded-full">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {q || status || type
                      ? "No scripts match your filters"
                      : "No scripts yet"}
                  </h3>
                  <p className="text-gray-500 max-w-sm mt-1">
                    {q || status || type
                      ? "Try adjusting your search or filters."
                      : "Create your first script to start managing your content pipeline."}
                  </p>
                </div>
                {!q && !status && !type && (
                  <Link href="/scripts/new">
                    <Button>Create Script</Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-10">
                {scripts.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {scripts.map((script) => (
                      <ScriptCard key={script.id} script={script} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
