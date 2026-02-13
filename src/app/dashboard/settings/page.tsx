import { getModels } from "@/lib/actions/models";
import { getFolders } from "@/lib/actions/folders";
import SettingsClient from "./SettingsClient";

export const metadata = {
  title: "Settings — Super Prompts",
  description: "Manage your AI models and preferences",
};

export default async function SettingsPage() {
  const [models, folders] = await Promise.all([getModels(), getFolders()]);
  return <SettingsClient models={models} folders={folders} />;
}
