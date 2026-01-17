
alter table public.profiles enable row level security;

create policy "Allow authenticated users to read profiles"
on public.profiles
for select
using (auth.uid() is not null);
