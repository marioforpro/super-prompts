-- Allow prompts to belong to multiple folders (without duplicating prompt rows)
create table if not exists public.prompt_folders (
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  folder_id uuid not null references public.folders(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (prompt_id, folder_id)
);

create index if not exists idx_prompt_folders_folder_id on public.prompt_folders(folder_id);
create index if not exists idx_prompt_folders_prompt_id on public.prompt_folders(prompt_id);

alter table public.prompt_folders enable row level security;

drop policy if exists "Users can manage own prompt folders" on public.prompt_folders;
create policy "Users can manage own prompt folders"
  on public.prompt_folders for all
  using (
    exists (
      select 1 from public.prompts
      where prompts.id = prompt_folders.prompt_id
      and prompts.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.prompts
      where prompts.id = prompt_folders.prompt_id
      and prompts.user_id = auth.uid()
    )
  );

-- Backfill existing prompt.folder_id values into junction table
insert into public.prompt_folders (prompt_id, folder_id)
select id, folder_id
from public.prompts
where folder_id is not null
on conflict (prompt_id, folder_id) do nothing;

