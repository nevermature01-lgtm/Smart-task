CREATE OR REPLACE FUNCTION get_team_id_by_code(p_team_code TEXT)
RETURNS TABLE (id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function can be called by any authenticated user.
  -- It safely returns the team ID for a given team code,
  -- bypassing RLS for this specific lookup without exposing other team data.
  RETURN QUERY
  SELECT t.id FROM public.teams AS t
  WHERE t.team_code = p_team_code;
END;
$$;
