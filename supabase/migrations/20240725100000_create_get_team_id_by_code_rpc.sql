
-- Create the function to securely get a team ID by its code, bypassing RLS for the lookup.
-- This function is defined with `security definer` to run with the privileges of the owner.
create or replace function public.get_team_id_by_code(p_team_code text)
returns table (id uuid)
language sql
security definer
-- Set a secure search_path
set search_path = public
as $$
  select T.id from public.teams as T where T.team_code = p_team_code;
$$;

-- Grant execute permission on the function to all authenticated users.
-- Without this, users would not be able to call the RPC.
grant execute on function public.get_team_id_by_code(text) to authenticated;
