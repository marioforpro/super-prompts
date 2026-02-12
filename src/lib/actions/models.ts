"use server";

import { createClient } from "@/lib/supabase/server";
import type { AiModel } from "@/lib/types";

export async function getModels(): Promise<AiModel[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ai_models")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;

  return (data || []) as AiModel[];
}
