import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getScriptById } from "@/actions/scripts";
import ViewScript from "@/components/scripts/ViewScript";

export default async function ViewScriptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const { id } = await params;
  const result = await getScriptById(id);
  if (!result) redirect("/");

  return (
    <ViewScript
      script={result.script}
      userName={session.user.name || "User"}
      currentUserId={session.user.id!}
    />
  );
}
