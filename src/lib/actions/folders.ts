"use server";

import { createClient } from "@/lib/supabase/server";
import type { Folder } from "@/lib/types";

export async function getFolders(): Promise<Folder[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("folders")
    .select("*")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return (data || []) as Folder[];
}

export async function createFolder(
  name: string,
  color?: string
): Promise<Folder> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (!name.trim()) throw new Error("Folder name is required");

  // Get the next sort order
  const { data: lastFolder } = await supabase
    .from("folders")
    .select("sort_order")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const nextSortOrder = (lastFolder?.sort_order || 0) + 1;

  const { data, error } = await supabase
    .from("folders")
    .insert({
      user_id: user.id,
      name: name.trim(),
      color: color || "#e8764b",
      sort_order: nextSortOrder,
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Failed to create folder");

  return data as Folder;
}

export async function renameFolder(id: string, name: string): Promise<Folder> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  if (!name.trim()) throw new Error("Folder name is required");

  // Verify ownership
  const { data: folder, error: fetchError } = await supabase
    .from("folders")
    .select("user_id")
    .eq("id", id)
    .single();

  if (fetchError || !folder) throw new Error("Folder not found");
  if (folder.user_id !== user.id)
    throw new Error("Unauthorized to rename this folder");

  const { data, error } = await supabase
    .from("folders")
    .update({ name: name.trim() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Failed to rename folder");

  return data as Folder;
}

export async function deleteFolder(id: string): Promise<void> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verify ownership
  const { data: folder, error: fetchError } = await supabase
    .from("folders")
    .select("user_id")
    .eq("id", id)
    .single();

  if (fetchError || !folder) throw new Error("Folder not found");
  if (folder.user_id !== user.id)
    throw new Error("Unauthorized to delete this folder");

  // Move prompts to null folder_id before deleting
  await supabase
    .from("prompts")
    .update({ folder_id: null })
    .eq("folder_id", id);

  // Delete the folder
  const { error: deleteError } = await supabase
    .from("folders")
    .delete()
    .eq("id", id);

  if (deleteError) throw deleteError;
}
