-- Enable Row Level Security on the team_members table. This is idempotent.
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert a membership record for themselves.
-- This is crucial for the "Join Team" feature to work. The user_id in the
-- new row MUST match the ID of the currently authenticated user.
CREATE POLICY "Allow authenticated users to insert their own membership"
ON public.team_members
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to view their own membership records.
-- This ensures that a user can see which teams they are a part of, but not
-- the memberships of other users (unless another policy allows it).
CREATE POLICY "Allow users to view their own team memberships"
ON public.team_members
FOR SELECT TO authenticated
USING (auth.uid() = user_id);
