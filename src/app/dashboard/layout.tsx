import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getModels } from "@/lib/actions/models";
import { getFolders } from "@/lib/actions/folders";
import { getTags } from "@/lib/actions/tags";
import { getPrompts } from "@/lib/actions/prompts";
import DashboardShell from "@/components/dashboard/DashboardShell";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard — Super Prompts",
  description: "Manage your AI prompts with Super Prompts",
};

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch reference data for sidebar
  const [models, folders, tags, prompts] = await Promise.all([
    getModels(),
    getFolders(),
    getTags(),
    getPrompts(),
  ]);

  const initialPromptIndex = prompts.map((prompt) => ({
    id: prompt.id,
    isFavorite: prompt.is_favorite,
    modelSlug: prompt.ai_model?.slug || null,
    folderIds: prompt.folder_ids || (prompt.folder_id ? [prompt.folder_id] : []),
  }));

  return (
    <DashboardShell
      userEmail={user.email || ""}
      models={models}
      folders={folders}
      tags={tags}
      initialPromptIndex={initialPromptIndex}
    >
      {children}
    </DashboardShell>
  );
}
