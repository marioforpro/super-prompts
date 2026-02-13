"use server";

import { createClient } from "@/lib/supabase/server";
import type { Prompt, CreatePromptInput, UpdatePromptInput } from "@/lib/types";

export async function getPrompts(): Promise<Prompt[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("prompts")
    .select(
      `
      *,
      ai_model:ai_models(*),
      prompt_tags(tag:tags(*)),
      media:prompt_media!prompt_media_prompt_id_fkey(*),
      primary_media:prompt_media!prompts_primary_media_id_fkey(*)
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Flatten prompt_tags junction into a tags array
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prompts = (data || []).map((p: any) => {
    const tags = Array.isArray(p.prompt_tags)
      ? p.prompt_tags.map((pt: any) => pt.tag).filter(Boolean)
      : [];
    const { prompt_tags: _, ...rest } = p;
    return { ...rest, tags };
  });

  return prompts as unknown as Prompt[];
}

export async function getPrompt(id: string): Promise<Prompt> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("prompts")
    .select(
      `
      *,
      ai_model:ai_models(*),
      prompt_tags(tag:tags(*)),
      media:prompt_media!prompt_media_prompt_id_fkey(*),
      primary_media:prompt_media!prompts_primary_media_id_fkey(*)
    `
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) throw error;
  if (!data) throw new Error("Prompt not found");

  // Flatten prompt_tags junction into a tags array
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = data as any;
  const tags = Array.isArray(d.prompt_tags)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? d.prompt_tags.map((pt: any) => pt.tag).filter(Boolean)
    : [];
  const { prompt_tags: _, ...rest } = d;

  return { ...rest, tags } as unknown as Prompt;
}

export async function createPrompt(input: CreatePromptInput): Promise<Prompt> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Validate required fields
  if (!input.title.trim()) throw new Error("Title is required");
  if (!input.content.trim()) throw new Error("Content is required");

  // Create the prompt
  const { data: promptData, error: promptError } = await supabase
    .from("prompts")
    .insert({
      user_id: user.id,
      title: input.title.trim(),
      content: input.content.trim(),
      model_id: input.model_id || null,
      folder_id: input.folder_id || null,
      content_type: input.content_type || null,
      negative_prompt: input.negative_prompt?.trim() || null,
      notes: input.notes?.trim() || null,
      source_url: input.source_url?.trim() || null,
      is_favorite: false,
      is_public: false,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (promptError) throw promptError;
  if (!promptData) throw new Error("Failed to create prompt");

  // Add tags if provided
  if (input.tag_ids && input.tag_ids.length > 0) {
    const tagRecords = input.tag_ids.map((tagId) => ({
      prompt_id: promptData.id,
      tag_id: tagId,
    }));

    const { error: tagError } = await supabase
      .from("prompt_tags")
      .insert(tagRecords);

    if (tagError) throw tagError;
  }

  // Fetch the complete prompt with relations
  return getPrompt(promptData.id);
}

export async function updatePrompt(
  id: string,
  input: UpdatePromptInput
): Promise<Prompt> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Build update data
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.title !== undefined) {
    if (!input.title.trim()) throw new Error("Title cannot be empty");
    updateData.title = input.title.trim();
  }

  if (input.content !== undefined) {
    if (!input.content.trim()) throw new Error("Content cannot be empty");
    updateData.content = input.content.trim();
  }

  if (input.model_id !== undefined) updateData.model_id = input.model_id;
  if (input.folder_id !== undefined) updateData.folder_id = input.folder_id;
  if (input.content_type !== undefined) updateData.content_type = input.content_type;
  if (input.negative_prompt !== undefined)
    updateData.negative_prompt = input.negative_prompt?.trim() || null;
  if (input.notes !== undefined)
    updateData.notes = input.notes?.trim() || null;
  if (input.source_url !== undefined)
    updateData.source_url = input.source_url?.trim() || null;
  if (input.is_favorite !== undefined) updateData.is_favorite = input.is_favorite;
  if (input.is_public !== undefined) updateData.is_public = input.is_public;

  // Run update and tag operations in parallel
  const updatePromise = supabase
    .from("prompts")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id);

  const tagPromise = input.tag_ids !== undefined
    ? (async () => {
        await supabase.from("prompt_tags").delete().eq("prompt_id", id);
        if (input.tag_ids!.length > 0) {
          const tagRecords = input.tag_ids!.map((tagId) => ({
            prompt_id: id,
            tag_id: tagId,
          }));
          const { error: tagError } = await supabase
            .from("prompt_tags")
            .insert(tagRecords);
          if (tagError) throw tagError;
        }
      })()
    : Promise.resolve();

  const [updateResult] = await Promise.all([updatePromise, tagPromise]);
  if (updateResult.error) throw updateResult.error;

  return getPrompt(id);
}

export async function deletePrompt(id: string): Promise<void> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verify ownership
  const { data: existingPrompt, error: fetchError } = await supabase
    .from("prompts")
    .select("user_id")
    .eq("id", id)
    .single();

  if (fetchError || !existingPrompt) throw new Error("Prompt not found");
  if (existingPrompt.user_id !== user.id)
    throw new Error("Unauthorized to delete this prompt");

  // Delete associated tags
  await supabase.from("prompt_tags").delete().eq("prompt_id", id);

  // Delete the prompt
  const { error: deleteError } = await supabase
    .from("prompts")
    .delete()
    .eq("id", id);

  if (deleteError) throw deleteError;
}

export async function toggleFavorite(id: string): Promise<Prompt> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Get current favorite status
  const { data: prompt, error: fetchError } = await supabase
    .from("prompts")
    .select("is_favorite, user_id")
    .eq("id", id)
    .single();

  if (fetchError || !prompt) throw new Error("Prompt not found");
  if (prompt.user_id !== user.id)
    throw new Error("Unauthorized to update this prompt");

  // Toggle favorite
  const { error: updateError } = await supabase
    .from("prompts")
    .update({
      is_favorite: !prompt.is_favorite,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) throw updateError;

  return getPrompt(id);
}
