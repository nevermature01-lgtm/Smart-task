import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const taskId = params.id;

  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: userError?.message || 'Unauthorized' }, { status: 401 });
    }

    // Step 1: Fetch the task by ID
    const { data: task, error: taskError } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .maybeSingle();
      
    if (taskError) {
      console.error('Error fetching task:', taskError);
      return NextResponse.json({ error: 'Error fetching task details.' }, { status: 500 });
    }

    // Step 2: If task not found, return 404
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    // Step 4: Authorization check
    if (task.assigned_to !== user.id && task.assigned_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Step 5: Fetch assignee details separately
    const { data: assignee, error: assigneeError } = await supabaseAdmin
      .from('users')
      .select('id, full_name')
      .eq('id', task.assigned_to)
      .single();
    
    if (assigneeError) {
        console.error('Error fetching assignee details:', assigneeError);
        return NextResponse.json({ error: 'Error fetching assignee details.' }, { status: 500 });
    }
    
    // Combine task with assignee details
    const taskWithAssignee = {
      ...task,
      assignee,
    };

    return NextResponse.json(taskWithAssignee);

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}
