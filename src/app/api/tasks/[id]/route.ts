import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { format, parseISO } from 'date-fns';

// Helper function to get Supabase user UUID from email
async function getUserUUIDByEmail(email: string): Promise<string | null> {
    const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle(); // Use maybeSingle to prevent error if user not found
    
    if (error) {
        console.error("Error fetching user by email:", error);
        return null;
    }
    
    return user?.id ?? null;
}


// GET a single task by ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const token = request.headers.get('authorization')?.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !authUser || !authUser.email) {
            return NextResponse.json({ error: authError?.message || 'Unauthorized' }, { status: 401 });
        }
        
        const userUUID = await getUserUUIDByEmail(authUser.email);
        if (!userUUID) {
            // This happens if the user exists in auth but not in the public.users table.
            return NextResponse.json({ error: 'User profile not found in database.' }, { status: 404 });
        }

        const taskId = params.id;
        
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
            .or(`assigned_to.eq.${userUUID},assigned_by.eq.${userUUID}`)
            .maybeSingle();

        if (taskError) {
            console.error('Error fetching task:', taskError);
            return NextResponse.json({ error: 'Database query failed.' }, { status: 500 });
        }

        if (!task) {
            return NextResponse.json({ error: 'Task not found or you do not have permission to view it.' }, { status: 404 });
        }

        // Format date if it exists
        if (task.due_date) {
            try {
                // Supabase returns 'YYYY-MM-DD'
                task.due_date = format(parseISO(task.due_date), 'MMM dd, yyyy');
            } catch (e) {
                console.error('Error formatting date:', e);
                // leave date as is if formatting fails
            }
        }

        // Convert numeric priority to string P{number}
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
        const token = request.headers.get('authorization')?.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !authUser || !authUser.email) {
            return NextResponse.json({ error: authError?.message || 'Unauthorized' }, { status: 401 });
        }

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

        // Authorization check: ensure user is assigner or assignee before updating
        const { data: existingTask, error: authCheckError } = await supabaseAdmin
            .from('tasks')
            .select('id')
            .eq('id', taskId)
            .or(`assigned_to.eq.${userUUID},assigned_by.eq.${userUUID}`)
            .maybeSingle();
        
        if (authCheckError) {
             console.error('Auth check error:', authCheckError);
             return NextResponse.json({ error: 'Database error during authorization check.' }, { status: 500 });
        }

        if (!existingTask) {
            return NextResponse.json({ error: 'Task not found or you do not have permission to update it.' }, { status: 403 });
        }

        // Perform the update
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
