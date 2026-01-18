import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user: callingUser }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !callingUser) {
      return NextResponse.json({ error: userError?.message || 'Unauthorized' }, { status: 401 });
    }

    const { teamId, targetUserId } = await request.json();

    if (!teamId || !targetUserId) {
        return NextResponse.json({ error: 'Team ID and Target User ID are required' }, { status: 400 });
    }
    
    // Authorization check: Is the calling user an owner or admin?
    const { data: team, error: teamError } = await supabaseAdmin
        .from('teams')
        .select('owner_id')
        .eq('id', teamId)
        .single();
    
    if (teamError || !team) {
        return NextResponse.json({ error: 'Team not found or error fetching team.' }, { status: 404 });
    }

    let isAuthorized = false;
    if (callingUser.id === team.owner_id) {
        isAuthorized = true;
    } else {
        const { data: membership, error: membershipError } = await supabaseAdmin
            .from('team_members')
            .select('role')
            .eq('team_id', teamId)
            .eq('user_id', callingUser.id)
            .single();

        if (membershipError) {
             return NextResponse.json({ error: 'Error checking permissions.' }, { status: 500 });
        }
        if (membership?.role === 'admin') {
            isAuthorized = true;
        }
    }

    if (!isAuthorized) {
        return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
    }
    
    // Cannot demote the owner
    if (targetUserId === team.owner_id) {
        return NextResponse.json({ error: 'Cannot change the role of the team owner.' }, { status: 400 });
    }

    // Perform the update
    const { error: updateError } = await supabaseAdmin
        .from('team_members')
        .update({ role: 'member' })
        .match({ team_id: teamId, user_id: targetUserId });

    if (updateError) {
        console.error("Error demoting admin:", updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Admin demoted to member successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('API Error in remove-admin:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}
