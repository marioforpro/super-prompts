import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getModels } from "@/lib/actions/models";
import { getFolders } from "@/lib/actions/folders";
import { getTags } from "@/lib/actions/tags";
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
  const [models, folders, tags] = await Promise.all([
    getModels(),
    getFolders(),
    getTags(),
  ]);

  return (
    <DashboardShell
      userEmail={user.email || ""}
      models={models}
      folders={folders}
      tags={tags}
    >
      {children}
    </DashboardShell>
  );
}
