"use server";

import { createClient } from "@/lib/supabase/server";
import type { Tag } from "@/lib/types";

export async function getTags(): Promise<Tag[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  if (error) throw error;

  return (data || []) as Tag[];
}

export async function createTag(name: string, color?: string): Promise<Tag> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (!name.trim()) throw new Error("Tag name is required");

  const { data, error } = await supabase
    .from("tags")
    .insert({
      user_id: user.id,
      name: name.trim(),
      color: color || null,
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Failed to create tag");

  return data as Tag;
}

export async function deleteTag(id: string): Promise<void> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verify ownership
  const { data: tag, error: fetchError } = await supabase
    .from("tags")
    .select("user_id")
    .eq("id", id)
    .single();

  if (fetchError || !tag) throw new Error("Tag not found");
  if (tag.user_id !== user.id) throw new Error("Unauthorized to delete this tag");

  // Delete tag associations
  await supabase.from("prompt_tags").delete().eq("tag_id", id);

  // Delete the tag
  const { error: deleteError } = await supabase
    .from("tags")
    .delete()
    .eq("id", id);

  if (deleteError) throw deleteError;
}
