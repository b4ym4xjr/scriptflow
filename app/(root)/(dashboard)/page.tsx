import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getScripts } from "@/actions/scripts";
import { getMyCollaborations } from "@/actions/collaborators";
import { Header } from "@/components/Header";
import { Dashboard } from "@/components/dashboard/Dashboard";

interface HomePageProps {
  searchParams: Promise<{ q?: string; status?: string; type?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const { q, status, type } = await searchParams;

  // Fetch everything once; filtering, sorting and counts happen instantly on the client.
  const [scripts, collaborations] = await Promise.all([
    getScripts(),
    getMyCollaborations(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header name={session.user.name ?? "User"} />
      <Dashboard
        name={session.user.name ?? "there"}
        scripts={scripts}
        collaborations={collaborations}
        initialQuery={q ?? ""}
        initialStatus={status ?? ""}
        initialType={type ?? ""}
      />
    </div>
  );
}
