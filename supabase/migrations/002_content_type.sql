-- ============================================
-- Super Prompts — Add content_type to prompts
-- Run this in Supabase SQL Editor
-- ============================================

-- Add content_type column to prompts table
alter table public.prompts
  add column content_type text default null
  check (content_type in ('IMAGE', 'VIDEO', 'AUDIO', 'TEXT'));

-- Index for filtering by content type
create index idx_prompts_content_type on public.prompts(content_type)
  where content_type is not null;
