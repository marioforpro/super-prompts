"use server";

import { createClient } from "@/lib/supabase/server";
import type { PromptMedia } from "@/lib/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

/**
 * Creates a prompt_media record and optionally sets it as the prompt's primary media.
 * Called after client-side upload to Supabase Storage is complete.
 */
export async function createPromptMedia(
  promptId: string,
  storagePath: string,
  type: "image" | "video",
  fileSize: number | null,
  setAsPrimary: boolean = true
): Promise<PromptMedia> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verify prompt ownership
  const { data: prompt, error: promptError } = await supabase
    .from("prompts")
    .select("user_id")
    .eq("id", promptId)
    .single();

  if (promptError || !prompt) throw new Error("Prompt not found");
  if (prompt.user_id !== user.id)
    throw new Error("Unauthorized to modify this prompt");

  // Construct the public URL
  const originalUrl = `${SUPABASE_URL}/storage/v1/object/public/prompt-media/${storagePath}`;

  // Create the media record
  const { data: mediaData, error: mediaError } = await supabase
    .from("prompt_media")
    .insert({
      prompt_id: promptId,
      type,
      storage_path: storagePath,
      original_url: originalUrl,
      file_size: fileSize,
      sort_order: 0,
    })
    .select()
    .single();

  if (mediaError) throw mediaError;
  if (!mediaData) throw new Error("Failed to create media record");

  // Set as primary media if requested
  if (setAsPrimary) {
    const { error: updateError } = await supabase
      .from("prompts")
      .update({
        primary_media_id: mediaData.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", promptId);

    if (updateError) throw updateError;
  }

  return mediaData as PromptMedia;
}

/**
 * Removes a prompt's primary media (deletes from storage and DB).
 */
export async function removePromptMedia(
  promptId: string,
  mediaId: string
): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verify prompt ownership
  const { data: prompt, error: promptError } = await supabase
    .from("prompts")
    .select("user_id, primary_media_id")
    .eq("id", promptId)
    .single();

  if (promptError || !prompt) throw new Error("Prompt not found");
  if (prompt.user_id !== user.id)
    throw new Error("Unauthorized to modify this prompt");

  // Get the media record to find storage path
  const { data: media } = await supabase
    .from("prompt_media")
    .select("storage_path")
    .eq("id", mediaId)
    .single();

  // Clear primary_media_id if this was the primary
  if (prompt.primary_media_id === mediaId) {
    await supabase
      .from("prompts")
      .update({
        primary_media_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", promptId);
  }

  // Delete from storage
  if (media?.storage_path) {
    await supabase.storage
      .from("prompt-media")
      .remove([media.storage_path]);
  }

  // Delete the media record
  await supabase.from("prompt_media").delete().eq("id", mediaId);
}
