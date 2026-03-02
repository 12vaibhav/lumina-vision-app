
-- Users Table (Managed by Supabase Auth, but we might need a profiles table)
-- For now, we'll rely on `auth.users` and just store generation history linked to user_id.

create table public.generations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  original_image_url text not null,
  result_image_url text not null,
  style text not null,
  room_type text not null,
  lighting text,
  prompt text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.generations enable row level security;

create policy "Users can view their own generations"
  on public.generations for select
  using (auth.uid() = user_id);

create policy "Users can insert their own generations"
  on public.generations for insert
  with check (auth.uid() = user_id);
