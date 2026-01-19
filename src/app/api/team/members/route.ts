import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ error: userError?.message || 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }
    
    // Authorization Check: Only owner or admin can fetch members
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'You are not a member of this team.' }, { status: 403 });
    }

    const authorizedRoles = ['owner', 'admin'];
    if (!authorizedRoles.includes(membership.role)) {
      return NextResponse.json({ error: 'You do not have permission to view team members.' }, { status: 403 });
    }

    // Fetch all member IDs for the team
    const { data: teamMembersData, error: teamMembersError } = await supabaseAdmin
      .from('team_members')
      .select('user_id, role')
      .eq('team_id', teamId);
      
    if (teamMembersError) {
        throw teamMembersError;
    }

    if (!teamMembersData) {
        return NextResponse.json([]);
    }

    // Fetch user profiles for those members
    const userIds = teamMembersData.map(m => m.user_id);
    const { data: usersData, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id, full_name')
        .in('id', userIds);
    
    if (usersError) {
        throw usersError;
    }

    // Get owner ID to correctly assign owner role
    const { data: teamData } = await supabaseAdmin
        .from('teams')
        .select('owner_id')
        .eq('id', teamId)
        .single();
    
    // Combine profiles with roles
    const members = usersData?.map(u => {
        const memberInfo = teamMembersData.find(m => m.user_id === u.id);
        return {
            id: u.id,
            full_name: u.full_name || 'Team Member',
            role: u.id === teamData?.owner_id ? 'owner' : (memberInfo?.role || 'member'),
        };
    }) || [];

    return NextResponse.json(members);

  } catch (error: any) {
    console.error('API Error in /api/team/members:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}
