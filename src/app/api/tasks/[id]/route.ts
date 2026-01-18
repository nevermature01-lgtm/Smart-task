import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { randomUUID } from 'crypto';

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

    // Step 5: Build reassignment chain
    const previousAssigneeIds = (task.steps || [])
        .filter((step: any) => step.type === 'reassignment')
        .map((step: any) => step.value);

    const allAssigneeIds = [...new Set([...previousAssigneeIds, task.assigned_to])];

    const { data: assignees, error: assigneesError } = await supabaseAdmin
        .from('users')
        .select('id, full_name')
        .in('id', allAssigneeIds);

    if (assigneesError) {
        console.error('Error fetching assignee chain:', assigneesError);
        return NextResponse.json({ error: 'Error fetching assignee details.' }, { status: 500 });
    }

    const assigneesById = new Map((assignees || []).map(a => [a.id, a]));
    const reassignmentChain = [...previousAssigneeIds, task.assigned_to]
        .map(id => assigneesById.get(id))
        .filter(Boolean as <T>(x: T | undefined) => x is T);
    
    const taskWithChain = {
        ...task,
        reassignmentChain,
    };

    return NextResponse.json(taskWithChain);

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

    const body = await request.json();
    const { steps, complete, assigneeId } = body;

    const returnFullTask = async (taskData: any) => {
        const previousAssigneeIds = (taskData.steps || [])
            .filter((step: any) => step.type === 'reassignment')
            .map((step: any) => step.value);
        
        const allAssigneeIds = [...new Set([...previousAssigneeIds, taskData.assigned_to])];

        const { data: assignees, error: assigneesError } = await supabaseAdmin
            .from('users')
            .select('id, full_name')
            .in('id', allAssigneeIds);
        
        if (assigneesError) {
            console.error('Error fetching assignee chain for PATCH response:', assigneesError);
            return NextResponse.json({ error: 'Error fetching assignee chain details.' }, { status: 500 });
        }
        
        const assigneesById = new Map((assignees || []).map(a => [a.id, a]));
        const reassignmentChain = [...previousAssigneeIds, taskData.assigned_to]
            .map(id => assigneesById.get(id))
            .filter(Boolean as <T>(x: T | undefined) => x is T);

        return NextResponse.json({
            ...taskData,
            reassignmentChain,
        });
    };

    const { data: existingTask, error: taskError } = await supabaseAdmin
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .maybeSingle();
      
    if (taskError) {
        console.error('Error fetching task for patch:', taskError);
        return NextResponse.json({ error: 'Error verifying task details.' }, { status: 500 });
    }

    if (!existingTask) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (assigneeId) {
        if (existingTask.assigned_by !== user.id) {
            return NextResponse.json({ error: 'Forbidden: Only the task creator can reassign.' }, { status: 403 });
        }

        const reassignmentStep = {
            id: randomUUID(),
            type: 'reassignment',
            value: existingTask.assigned_to,
            checked: false,
        };

        const newSteps = [...(existingTask.steps || []), reassignmentStep];

        const { data: updatedTask, error: updateError } = await supabaseAdmin
            .from('tasks')
            .update({ 
                assigned_to: assigneeId,
                steps: newSteps
             })
            .eq('id', taskId)
            .select()
            .single();

        if (updateError) {
            console.error('Supabase reassignment error:', updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }
        return await returnFullTask(updatedTask);
    }

    if (complete) {
      if (existingTask.assigned_to !== user.id) {
        return NextResponse.json({ error: 'Forbidden: Only the assignee can complete the task.' }, { status: 403 });
      }

      if (existingTask.completed_at) {
        return await returnFullTask(existingTask);
      }

      const { data: updatedTask, error: updateError } = await supabaseAdmin
        .from('tasks')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', taskId)
        .select()
        .single();
      
      if (updateError) {
        console.error('Supabase completion update error:', updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return await returnFullTask(updatedTask);
    }
    
    if (steps) {
        if (existingTask.completed_at) {
            return NextResponse.json({ error: 'Cannot update a completed task.' }, { status: 400 });
        }

        if (existingTask.assigned_to !== user.id && existingTask.assigned_by !== user.id) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

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
        
        return await returnFullTask(updatedTask);
    }

    return NextResponse.json({ error: 'Invalid request body. Missing "steps", "complete", or "assigneeId".' }, { status: 400 });

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
