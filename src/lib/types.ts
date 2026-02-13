export type ContentType = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'TEXT';

export interface Prompt {
  id: string;
  user_id: string;
  folder_id: string | null;
  folder_ids?: string[];
  model_id: string | null;
  content_type: ContentType | null;
  title: string;
  content: string;
  negative_prompt: string | null;
  notes: string | null;
  source_url: string | null;
  is_favorite: boolean;
  is_public: boolean;
  share_slug: string | null;
  is_featured: boolean;
  featured_category: string | null;
  featured_at: string | null;
  primary_media_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  ai_model?: AiModel | null;
  tags?: Tag[];
  media?: PromptMedia[];
  primary_media?: PromptMedia | null;
}

export interface AiModel {
  id: string;
  name: string;
  slug: string;
  category: string;
  content_type: ContentType | null;
  icon_url: string | null;
  is_default: boolean;
  created_by: string | null;
  created_at: string;
}

export interface Folder {
  id: string;
  user_id: string;
  name: string;
  color: string;
  sort_order: number;
  created_at: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  created_at: string;
}

export type FrameFit = "cover" | "contain" | "fill";

export interface PromptMedia {
  id: string;
  prompt_id: string;
  type: "image" | "video";
  storage_path: string;
  thumbnail_path: string | null;
  original_url: string | null;
  file_size: number | null;
  sort_order: number;
  frame_fit: FrameFit;
  crop_x: number;
  crop_y: number;
  crop_scale: number;
  created_at: string;
}

export interface CreatePromptInput {
  title: string;
  content: string;
  negative_prompt?: string | null;
  model_id?: string | null;
  folder_id?: string | null;
  content_type?: ContentType | null;
  notes?: string | null;
  source_url?: string | null;
  tag_ids?: string[];
}

export interface UpdatePromptInput {
  title?: string;
  content?: string;
  negative_prompt?: string | null;
  model_id?: string | null;
  folder_id?: string | null;
  content_type?: ContentType | null;
  notes?: string | null;
  source_url?: string | null;
  tag_ids?: string[];
  is_favorite?: boolean;
  is_public?: boolean;
}
