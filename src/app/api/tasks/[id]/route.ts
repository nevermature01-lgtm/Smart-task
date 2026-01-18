import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const taskId = params.id;
        const token = request.headers.get('authorization')?.split(' ')[1];

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Get the authenticated user from the token.
        const { data: { user: authUser }, error: userError } = await supabaseAdmin.auth.getUser(token);

        if (userError || !authUser) {
            return NextResponse.json({ error: userError?.message || 'Unauthorized' }, { status: 401 });
        }
        
        if (!authUser.email) {
             return NextResponse.json({ error: 'User email not found in token.' }, { status: 400 });
        }
        
        console.log('Authenticated user email:', authUser.email);
        
        // 2. Query the public 'users' table to get the internal user profile UUID using email.
        const { data: userProfile, error: profileError } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', authUser.email)
            .maybeSingle();

        if (profileError || !userProfile) {
            console.error('Error resolving Supabase user by email:', profileError?.message || 'User not found');
            return NextResponse.json({ error: 'Could not resolve user profile in database.' }, { status: 404 });
        }
        
        const userUUID = userProfile.id;
        console.log('Resolved Supabase user UUID:', userUUID);
        console.log('Querying for task ID:', taskId);

        // 3. Fetch the task using the task ID and the user's internal UUID for authorization.
        const { data: task, error: taskError } = await supabaseAdmin
            .from('tasks')
            .select(`
                *,
                assignee:assigned_to ( id, full_name ),
                assigner:assigned_by ( id, full_name )
            `)
            .eq('id', taskId)
            .or(`assigned_to.eq.${userUUID},assigned_by.eq.${userUUID}`)
            .maybeSingle();

        if (taskError) {
            console.error('Error fetching task:', taskError);
            return NextResponse.json({ error: 'Error fetching task' }, { status: 500 });
        }
        
        if (!task) {
             return NextResponse.json({ error: 'Task not found or you are not authorized to view it.' }, { status: 404 });
        }
        
        // 4. Fetch team members if the task is associated with a team.
        let teamMembers: any[] = [];
        if (task.team_id) {
            const { data: members, error: membersError } = await supabaseAdmin
                .from('team_members')
                .select('users(id, full_name)')
                .eq('team_id', task.team_id)
                .neq('user_id', userUUID);

            if (membersError) {
                console.error("Error fetching team members for task details:", membersError);
            } else if (members) {
                teamMembers = members.map(m => m.users).filter(Boolean);
            }
        }

        // 5. Return the complete task details.
        return NextResponse.json({ ...task, teamMembers });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
    }
}
