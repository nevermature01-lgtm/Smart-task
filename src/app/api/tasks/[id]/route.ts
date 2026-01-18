import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { format, parseISO } from 'date-fns';

// GET a single task by ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const taskId = params.id;
        if (!taskId) {
            return NextResponse.json({ error: 'Task ID is missing.' }, { status: 400 });
        }

        // 1. Resolve User
        const token = request.headers.get('authorization')?.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !authUser || !authUser.email) {
            return NextResponse.json({ error: authError?.message || 'Unauthorized' }, { status: 401 });
        }
        const { data: supabaseUser, error: userError } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', authUser.email)
            .maybeSingle();

        if (userError) {
            console.error("API Error: Error fetching user by email:", userError);
            return NextResponse.json({ error: 'Server error while fetching user profile.' }, { status: 500 });
        }
        if (!supabaseUser) {
            return NextResponse.json({ error: 'User profile not found in database.' }, { status: 404 });
        }
        const userUUID = supabaseUser.id;
        
        // 2. Fetch Task (Stage 1)
        const { data: task, error: taskError } = await supabaseAdmin
            .from('tasks')
            .select('*')
            .eq('id', taskId)
            .maybeSingle();

        if (taskError) {
            console.error('Error fetching task:', taskError);
            return NextResponse.json({ error: 'Database query failed.' }, { status: 500 });
        }

        if (!task) {
            return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
        }

        // 3. Authorize (Stage 2)
        const isAssigner = task.assigned_by === userUUID;
        const isAssignee = task.assigned_to === userUUID;
        if (!isAssigner && !isAssignee) {
            return NextResponse.json({ error: 'You do not have permission to view this task.' }, { status: 403 });
        }

        // 4. Fetch related data
        let assignee_profile = null;
        if (task.assigned_to) {
            const { data } = await supabaseAdmin.from('users').select('id, full_name').eq('id', task.assigned_to).maybeSingle();
            assignee_profile = data;
        }

        let team = null;
        if (task.team_id) {
            const { data: team_basics } = await supabaseAdmin.from('teams').select('id, team_name').eq('id', task.team_id).maybeSingle();
            if (team_basics) {
                const { data: team_members_data } = await supabaseAdmin.from('team_members').select('users(id, full_name)').eq('team_id', task.team_id);
                team = {
                    ...team_basics,
                    team_members: team_members_data || []
                };
            }
        }
        
        // 5. Format response
        let priority_string = `P${task.priority}`;
        if (task.priority <= 3) priority_string = 'Low';
        if (task.priority >= 8) priority_string = 'High';

        const formattedDueDate = task.due_date ? format(parseISO(task.due_date), 'dd-MM-yyyy') : null;

        return NextResponse.json({
            ...task,
            assignee_profile,
            team,
            priority_string,
            due_date: formattedDueDate,
        });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
    }
}


// PATCH to update task steps/checklist
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    try {
        const taskId = params.id;
        if (!taskId) {
            return NextResponse.json({ error: 'Task ID is missing.' }, { status: 400 });
        }

        const token = request.headers.get('authorization')?.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !authUser || !authUser.email) {
            return NextResponse.json({ error: authError?.message || 'Unauthorized' }, { status: 401 });
        }
        const { data: supabaseUser, error: userError } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', authUser.email)
            .maybeSingle();
        
        if (userError) {
            console.error("API Error: Error fetching user by email:", userError);
            return NextResponse.json({ error: 'Server error while fetching user profile.' }, { status: 500 });
        }
        if (!supabaseUser) {
            return NextResponse.json({ error: 'User profile not found in database.' }, { status: 404 });
        }
        const userUUID = supabaseUser.id;

        const body = await request.json();
        const { steps } = body;

        if (!steps || !Array.isArray(steps)) {
            return NextResponse.json({ error: 'Invalid payload: steps array is required.' }, { status: 400 });
        }

        const { data: existingTask, error: authCheckError } = await supabaseAdmin
            .from('tasks')
            .select('id, assigned_by, assigned_to')
            .eq('id', taskId)
            .maybeSingle();
        
        if (authCheckError) {
             console.error('Auth check error:', authCheckError);
             return NextResponse.json({ error: 'Database error during authorization check.' }, { status: 500 });
        }

        if (!existingTask) {
            return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
        }
        
        const isAssigner = existingTask.assigned_by === userUUID;
        const isAssignee = existingTask.assigned_to === userUUID;
        if (!isAssigner && !isAssignee) {
             return NextResponse.json({ error: 'You do not have permission to update this task.' }, { status: 403 });
        }

        const { data: updatedTask, error: updateError } = await supabaseAdmin
            .from('tasks')
            .update({ steps: steps })
            .eq('id', taskId)
            .select()
            .maybeSingle();

        if (updateError) {
            console.error('Error updating task:', updateError);
            return NextResponse.json({ error: 'Failed to update task.' }, { status: 500 });
        }

        return NextResponse.json(updatedTask);

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
    }
}
