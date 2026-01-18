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

export async function PATCH(
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

    const { steps } = await request.json();

    if (!steps) {
        return NextResponse.json({ error: 'Missing steps data' }, { status: 400 });
    }

    // Step 1: Fetch the task to verify ownership
    const { data: existingTask, error: taskError } = await supabaseAdmin
      .from('tasks')
      .select('assigned_to, assigned_by')
      .eq('id', taskId)
      .maybeSingle();
      
    if (taskError) {
      console.error('Error fetching task for patch:', taskError);
      return NextResponse.json({ error: 'Error verifying task ownership.' }, { status: 500 });
    }

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    // Step 2: Authorization check
    if (existingTask.assigned_to !== user.id && existingTask.assigned_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Step 3: Update the task with the new steps
    const { data: updatedTask, error: updateError } = await supabaseAdmin
      .from('tasks')
      .update({ steps: steps })
      .eq('id', taskId)
      .select()
      .single();

    if (updateError) {
        console.error('Supabase update error:', updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    
    return NextResponse.json(updatedTask);

  } catch (error: any) {
    console.error('API PATCH Error:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function DELETE(
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

    // Fetch the task to verify ownership
    const { data: task, error: taskError } = await supabaseAdmin
      .from('tasks')
      .select('assigned_by')
      .eq('id', taskId)
      .single();

    if (taskError) {
      console.error('Error fetching task for deletion:', taskError);
      return NextResponse.json({ error: 'Error verifying task ownership.' }, { status: 500 });
    }
    
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Authorization check: only the creator can delete
    if (task.assigned_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the task
    const { error: deleteError } = await supabaseAdmin
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (deleteError) {
      console.error('Supabase delete error:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Task deleted successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('API DELETE Error:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}
