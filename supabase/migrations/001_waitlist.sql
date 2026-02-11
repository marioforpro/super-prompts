-- Waitlist table for landing page email capture
-- Run this in your Supabase dashboard → SQL Editor

create table if not exists public.waitlist (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  created_at timestamptz default now() not null
);

-- Enable Row Level Security
alter table public.waitlist enable row level security;

-- Allow anonymous inserts (for the landing page API)
create policy "Allow anonymous inserts" on public.waitlist
  for insert
  with check (true);

-- Only authenticated service role can read (for admin)
create policy "Service role can read all" on public.waitlist
  for select
  using (auth.role() = 'service_role');

-- Create index on email for fast duplicate checks
create index if not exists waitlist_email_idx on public.waitlist (email);
