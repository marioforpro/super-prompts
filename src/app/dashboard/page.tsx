import { createClient } from "@/lib/supabase/server";
import { getPrompts } from "@/lib/actions/prompts";
import { getModels } from "@/lib/actions/models";
import { getFolders } from "@/lib/actions/folders";
import { getTags } from "@/lib/actions/tags";
import { DashboardPageClient } from "@/components/dashboard/DashboardPageClient";

export default async function DashboardPage() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return <div>Please log in</div>;
    }

    // Fetch all required data
    const [prompts, models, folders, tags] = await Promise.all([
      getPrompts(),
      getModels(),
      getFolders(),
      getTags(),
    ]);

    return (
      <DashboardPageClient
        initialPrompts={prompts}
        models={models}
        folders={folders}
        tags={tags}
      />
    );
  } catch (error) {
    const errMsg = error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String((error as Record<string, unknown>).message)
        : JSON.stringify(error);
    console.error("Error loading dashboard:", errMsg);
    return (
      <div className="space-y-8 animate-fadeIn">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            All Prompts
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Manage and organize your creative prompt library
          </p>
        </div>
        <div className="flex items-center justify-center min-h-96 rounded-2xl border border-surface-200 bg-surface/50">
          <div className="text-center max-w-sm">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Unable to load prompts
            </h2>
            <p className="text-text-muted text-sm">
              {errMsg || "Something went wrong"}
            </p>
          </div>
        </div>
      </div>
    );
  }
}
