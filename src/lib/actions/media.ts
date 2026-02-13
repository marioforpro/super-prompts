"use server";

import { createClient } from "@/lib/supabase/server";
import type { PromptMedia, FrameFit } from "@/lib/types";

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
  setAsPrimary: boolean = true,
  sortOrder: number = 0,
  frameFit: FrameFit = "cover",
  cropX: number = 50,
  cropY: number = 50,
  cropScale: number = 1
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
      sort_order: sortOrder,
      frame_fit: frameFit,
      crop_x: cropX,
      crop_y: cropY,
      crop_scale: cropScale,
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
 * Removes a prompt media item (deletes from storage and DB).
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
    // Try to promote the next media item as primary
    const { data: nextMedia } = await supabase
      .from("prompt_media")
      .select("id")
      .eq("prompt_id", promptId)
      .neq("id", mediaId)
      .order("sort_order", { ascending: true })
      .limit(1)
      .single();

    await supabase
      .from("prompts")
      .update({
        primary_media_id: nextMedia?.id || null,
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

/**
 * Updates a media item's frame_fit property.
 */
export async function updateMediaFrameFit(
  mediaId: string,
  frameFit: FrameFit
): Promise<PromptMedia> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verify ownership through prompt
  const { data: media, error: fetchError } = await supabase
    .from("prompt_media")
    .select("prompt_id, prompts!prompt_media_prompt_id_fkey(user_id)")
    .eq("id", mediaId)
    .single();

  if (fetchError || !media) throw new Error("Media not found");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ownerUserId = (media as any).prompts?.user_id;
  if (ownerUserId !== user.id) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("prompt_media")
    .update({ frame_fit: frameFit })
    .eq("id", mediaId)
    .select()
    .single();

  if (error) throw error;
  return data as PromptMedia;
}

/**
 * Updates a media item's crop/zoom settings.
 */
export async function updateMediaCrop(
  mediaId: string,
  cropX: number,
  cropY: number,
  cropScale: number
): Promise<PromptMedia> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verify ownership through prompt
  const { data: media, error: fetchError } = await supabase
    .from("prompt_media")
    .select("prompt_id, prompts!prompt_media_prompt_id_fkey(user_id)")
    .eq("id", mediaId)
    .single();

  if (fetchError || !media) throw new Error("Media not found");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ownerUserId = (media as any).prompts?.user_id;
  if (ownerUserId !== user.id) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("prompt_media")
    .update({ crop_x: cropX, crop_y: cropY, crop_scale: cropScale })
    .eq("id", mediaId)
    .select()
    .single();

  if (error) throw error;
  return data as PromptMedia;
}

/**
 * Batch update frame_fit + crop in a single call per media item.
 */
export async function updateMediaSettings(
  mediaId: string,
  frameFit: FrameFit,
  cropX: number,
  cropY: number,
  cropScale: number
): Promise<void> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase
    .from("prompt_media")
    .update({
      frame_fit: frameFit,
      crop_x: cropX,
      crop_y: cropY,
      crop_scale: cropScale,
    })
    .eq("id", mediaId);
}
