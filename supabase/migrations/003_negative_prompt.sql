-- Add negative_prompt column to prompts table
alter table public.prompts
  add column if not exists negative_prompt text default null;
