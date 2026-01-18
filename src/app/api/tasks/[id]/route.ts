import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { format, parseISO } from 'date-fns';

// Helper function to get Supabase user UUID from email
async function getUserUUIDByEmail(email: string): Promise<string | null> {
    const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();
    
    if (error) {
        console.error("Error fetching user by email:", error);
        return null;
    }
    
    return user?.id ?? null;
}


// GET a single task by ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        // 1. Authenticate user
        const token = request.headers.get('authorization')?.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !authUser || !authUser.email) {
            return NextResponse.json({ error: authError?.message || 'Unauthorized' }, { status: 401 });
        }
        
        // 2. Resolve Supabase user ID
        const userUUID = await getUserUUIDByEmail(authUser.email);
        if (!userUUID) {
            return NextResponse.json({ error: 'User profile not found in database.' }, { status: 404 });
        }

        const taskId = params.id;
        
        // 3. Fetch task by ID only
        const { data: task, error: taskError } = await supabaseAdmin
            .from('tasks')
            .select(`
                *,
                assignee_profile:users!tasks_assigned_to_fkey(id, full_name),
                team:teams!tasks_team_id_fkey(
                    id, 
                    team_name,
                    team_members(
                        users(id, full_name)
                    )
                )
            `)
            .eq('id', taskId)
            .maybeSingle();

        if (taskError) {
            console.error('Error fetching task:', taskError);
            return NextResponse.json({ error: 'Database query failed.' }, { status: 500 });
        }

        if (!task) {
            return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
        }

        // 4. Authorization check
        const isAssigner = task.assigned_by === userUUID;
        const isAssignee = task.assigned_to === userUUID;
        if (!isAssigner && !isAssignee) {
            return NextResponse.json({ error: 'You do not have permission to view this task.' }, { status: 403 });
        }


        // 5. Format and return
        if (task.due_date) {
            try {
                task.due_date = format(parseISO(task.due_date), 'MMM dd, yyyy');
            } catch (e) {
                console.error('Error formatting date:', e);
            }
        }

        task.priority_string = `P${task.priority}`;

        return NextResponse.json(task);

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
    }
}


// PATCH to update task steps/checklist
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    try {
        // 1. Authenticate user
        const token = request.headers.get('authorization')?.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !authUser || !authUser.email) {
            return NextResponse.json({ error: authError?.message || 'Unauthorized' }, { status: 401 });
        }

        // 2. Resolve Supabase user ID
        const userUUID = await getUserUUIDByEmail(authUser.email);
        if (!userUUID) {
            return NextResponse.json({ error: 'User profile not found in database.' }, { status: 404 });
        }

        const taskId = params.id;
        const body = await request.json();
        const { steps } = body;

        if (!steps || !Array.isArray(steps)) {
            return NextResponse.json({ error: 'Invalid payload: steps array is required.' }, { status: 400 });
        }

        // 3. Fetch task for authorization check
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
        
        // 4. Authorization check
        const isAssigner = existingTask.assigned_by === userUUID;
        const isAssignee = existingTask.assigned_to === userUUID;
        if (!isAssigner && !isAssignee) {
             return NextResponse.json({ error: 'You do not have permission to update this task.' }, { status: 403 });
        }

        // 5. Perform the update
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
