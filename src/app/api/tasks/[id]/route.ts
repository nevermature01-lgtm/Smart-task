import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const taskId = params.id;
        const token = request.headers.get('authorization')?.split(' ')[1];

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

        if (userError || !user) {
            return NextResponse.json({ error: userError?.message || 'Unauthorized' }, { status: 401 });
        }

        const { data: task, error: taskError } = await supabaseAdmin
            .from('tasks')
            .select(`
                *,
                assignee:assigned_to ( id, full_name ),
                assigner:assigned_by ( id, full_name )
            `)
            .eq('id', taskId)
            .or(`assigned_to.eq.${user.id},assigned_by.eq.${user.id}`)
            .maybeSingle();

        if (taskError) {
            console.error('Error fetching task:', taskError);
            return NextResponse.json({ error: 'Error fetching task' }, { status: 500 });
        }
        
        if (!task) {
             return NextResponse.json({ error: 'Task not found or you are not authorized to view it.' }, { status: 404 });
        }
        
        let teamMembers: any[] = [];
        if (task.team_id) {
            const { data: members, error: membersError } = await supabaseAdmin
                .from('team_members')
                .select('users(id, full_name)')
                .eq('team_id', task.team_id)
                .neq('user_id', user.id);

            if (membersError) {
                console.error("Error fetching team members for task details:", membersError);
            } else if (members) {
                teamMembers = members.map(m => m.users).filter(Boolean); // filter out null users
            }
        }


        return NextResponse.json({ ...task, teamMembers });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
    }
}
