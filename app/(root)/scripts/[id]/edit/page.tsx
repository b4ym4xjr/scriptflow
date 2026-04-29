import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getScriptById } from "@/actions/scripts";
import { getScriptCollaborators } from "@/actions/collaborators";
import { ScriptForm } from "@/components/scripts/ScriptForm";

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const { id } = await params;
  const result = await getScriptById(id);

  if (!result || result.role === "viewer") {
    redirect(`/scripts/${id}`);
  }

  const collaborators = result.role === "owner" ? await getScriptCollaborators(id) : [];

  return <ScriptForm task={result.script} role={result.role} collaborators={collaborators} />;
}
