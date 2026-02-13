import { getModels } from "@/lib/actions/models";
import SettingsClient from "./SettingsClient";

export const metadata = {
  title: "Settings — Super Prompts",
  description: "Manage your AI models and preferences",
};

export default async function SettingsPage() {
  const models = await getModels();
  return <SettingsClient models={models} />;
}
