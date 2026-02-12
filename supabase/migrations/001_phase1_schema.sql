-- ============================================
-- Super Prompts — Phase 1 Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- 1. PROFILES (extends auth.users)
-- ============================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  is_admin boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;

create policy "Users can view any profile"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- ============================================
-- 2. AI MODELS (reference table)
-- ============================================
create table public.ai_models (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  category text not null check (category in ('image', 'video', 'text', 'audio', '3d', 'multi')),
  icon_url text,
  is_default boolean default true,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- RLS
alter table public.ai_models enable row level security;

create policy "Anyone can view default models"
  on public.ai_models for select using (is_default = true or created_by = auth.uid());

create policy "Users can create custom models"
  on public.ai_models for insert with check (auth.uid() = created_by and is_default = false);

-- Pre-seed models
insert into public.ai_models (name, slug, category) values
  ('Midjourney', 'midjourney', 'image'),
  ('DALL-E 3', 'dall-e-3', 'image'),
  ('Stable Diffusion', 'stable-diffusion', 'image'),
  ('Flux', 'flux', 'image'),
  ('Leonardo AI', 'leonardo-ai', 'image'),
  ('Freepik AI', 'freepik-ai', 'image'),
  ('Nano Banana Pro', 'nano-banana-pro', 'image'),
  ('Ideogram', 'ideogram', 'image'),
  ('Runway', 'runway', 'video'),
  ('Kling', 'kling', 'video'),
  ('Sora', 'sora', 'video'),
  ('Pika', 'pika', 'video'),
  ('VEO', 'veo', 'video'),
  ('Higgsfield', 'higgsfield', 'video'),
  ('Seedance', 'seedance', 'video'),
  ('ChatGPT', 'chatgpt', 'text'),
  ('Claude', 'claude', 'text'),
  ('Gemini', 'gemini', 'multi'),
  ('Grok', 'grok', 'multi');

-- ============================================
-- 3. FOLDERS
-- ============================================
create table public.folders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text default '#e8764b',
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- RLS
alter table public.folders enable row level security;

create policy "Users can CRUD own folders"
  on public.folders for all using (auth.uid() = user_id);

-- ============================================
-- 4. TAGS
-- ============================================
create table public.tags (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz default now(),
  unique(user_id, name)
);

-- RLS
alter table public.tags enable row level security;

create policy "Users can CRUD own tags"
  on public.tags for all using (auth.uid() = user_id);

-- ============================================
-- 5. PROMPTS
-- ============================================
create table public.prompts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  folder_id uuid references public.folders(id) on delete set null,
  model_id uuid references public.ai_models(id) on delete set null,
  title text not null,
  content text not null,
  notes text,
  source_url text,
  is_favorite boolean default false,
  is_public boolean default false,
  share_slug text unique,
  is_featured boolean default false,
  featured_category text,
  featured_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for search
create index idx_prompts_user_id on public.prompts(user_id);
create index idx_prompts_folder_id on public.prompts(folder_id);
create index idx_prompts_model_id on public.prompts(model_id);
create index idx_prompts_share_slug on public.prompts(share_slug);
create index idx_prompts_is_featured on public.prompts(is_featured) where is_featured = true;
create index idx_prompts_full_text on public.prompts using gin(to_tsvector('english', title || ' ' || content));

-- RLS
alter table public.prompts enable row level security;

create policy "Users can CRUD own prompts"
  on public.prompts for all using (auth.uid() = user_id);

create policy "Anyone can view public prompts"
  on public.prompts for select using (is_public = true);

create policy "Anyone can view featured prompts"
  on public.prompts for select using (is_featured = true);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_prompt_updated
  before update on public.prompts
  for each row execute function public.handle_updated_at();

-- ============================================
-- 6. PROMPT_TAGS (junction)
-- ============================================
create table public.prompt_tags (
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (prompt_id, tag_id)
);

-- RLS
alter table public.prompt_tags enable row level security;

create policy "Users can manage own prompt tags"
  on public.prompt_tags for all
  using (
    exists (select 1 from public.prompts where id = prompt_id and user_id = auth.uid())
  );

create policy "Anyone can view tags of public prompts"
  on public.prompt_tags for select
  using (
    exists (select 1 from public.prompts where id = prompt_id and (is_public = true or is_featured = true))
  );

-- ============================================
-- 7. PROMPT_MEDIA
-- ============================================
create table public.prompt_media (
  id uuid primary key default uuid_generate_v4(),
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  type text not null check (type in ('image', 'video')),
  storage_path text not null,
  thumbnail_path text,
  original_url text,
  file_size integer,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- RLS
alter table public.prompt_media enable row level security;

create policy "Users can manage own prompt media"
  on public.prompt_media for all
  using (
    exists (select 1 from public.prompts where id = prompt_id and user_id = auth.uid())
  );

create policy "Anyone can view media of public prompts"
  on public.prompt_media for select
  using (
    exists (select 1 from public.prompts where id = prompt_id and (is_public = true or is_featured = true))
  );

-- Now add the FK for primary_media_id on prompts
alter table public.prompts
  add column primary_media_id uuid references public.prompt_media(id) on delete set null;

-- ============================================
-- 8. TREND_INSIGHTS
-- ============================================
create table public.trend_insights (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  category_slug text,
  trend_score integer default 50 check (trend_score between 1 and 100),
  source_data jsonb,
  is_active boolean default true,
  week_of date,
  created_at timestamptz default now()
);

-- RLS (read-only for all, admin-managed)
alter table public.trend_insights enable row level security;

create policy "Anyone can view active trends"
  on public.trend_insights for select using (is_active = true);

-- ============================================
-- 9. STORAGE BUCKETS
-- ============================================
insert into storage.buckets (id, name, public)
values ('prompt-media', 'prompt-media', true)
on conflict (id) do nothing;

-- Storage policies
create policy "Users can upload media"
  on storage.objects for insert
  with check (bucket_id = 'prompt-media' and auth.uid() is not null);

create policy "Users can update own media"
  on storage.objects for update
  using (bucket_id = 'prompt-media' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own media"
  on storage.objects for delete
  using (bucket_id = 'prompt-media' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Anyone can view media"
  on storage.objects for select
  using (bucket_id = 'prompt-media');
