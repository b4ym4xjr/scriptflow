import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ScriptForm } from "@/components/scripts/ScriptForm";

export default async function NewScriptPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  return <ScriptForm />;
}
