import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getScriptById } from "@/actions/scripts";
import { getScriptCollaborators } from "@/actions/collaborators";
import { getScriptVersions } from "@/actions/versions";
import { getComments } from "@/actions/comments";
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

  const [collaborators, versions, comments] = await Promise.all([
    result.role === "owner" ? getScriptCollaborators(id) : [],
    getScriptVersions(id),
    getComments(id),
  ]);

  return (
    <ViewScript
      script={result.script}
      userName={session.user.name || "User"}
      role={result.role}
      collaborators={collaborators}
      versions={versions}
      comments={comments}
      currentUserId={session.user.id!}
    />
  );
}
