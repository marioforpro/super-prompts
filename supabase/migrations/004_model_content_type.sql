-- Add content_type column to ai_models table so each model declares its output type
alter table public.ai_models
  add column if not exists content_type text default null
  check (content_type is null or content_type in ('IMAGE', 'VIDEO', 'AUDIO', 'TEXT'));

-- Backfill existing models based on their category field
update public.ai_models set content_type = upper(category) where category in ('image', 'video', 'audio', 'text');
