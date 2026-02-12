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

export async function createModel(name: string, slug: string, category: string = "image"): Promise<AiModel> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("ai_models")
    .insert({
      name: name.trim(),
      slug: slug.trim().toLowerCase().replace(/\s+/g, "-"),
      category,
      is_default: false,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as AiModel;
}

export async function updateModel(modelId: string, updates: { name?: string; slug?: string; category?: string }): Promise<AiModel> {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = {};
  if (updates.name !== undefined) updateData.name = updates.name.trim();
  if (updates.slug !== undefined) updateData.slug = updates.slug.trim().toLowerCase().replace(/\s+/g, "-");
  if (updates.category !== undefined) updateData.category = updates.category;

  const { data, error } = await supabase
    .from("ai_models")
    .update(updateData)
    .eq("id", modelId)
    .select()
    .single();

  if (error) throw error;
  return data as AiModel;
}

export async function deleteModel(modelId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("ai_models")
    .delete()
    .eq("id", modelId);

  if (error) throw error;
}
