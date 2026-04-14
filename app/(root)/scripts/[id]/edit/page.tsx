import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getScriptById } from "@/actions/scripts";
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

  if (!result) {
    redirect(`/scripts/${id}`);
  }

  return <ScriptForm task={result.script} />;
}
