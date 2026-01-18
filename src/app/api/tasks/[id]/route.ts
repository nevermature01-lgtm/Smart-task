import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user: authUser }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !authUser) {
      return NextResponse.json({ error: userError?.message || 'Unauthorized' }, { status: 401 });
    }
    
    const taskId = params.id;
    if (!taskId) {
        return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const { data: task, error: taskError } = await supabaseAdmin
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .maybeSingle();
        
    if (taskError) {
        console.error('Supabase query error:', taskError);
        return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
    }

    if (!task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const isAssigner = task.assigned_by === authUser.id;
    const isAssignee = task.assigned_to === authUser.id;

    if (!isAssigner && !isAssignee) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: assignee, error: assigneeError } = await supabaseAdmin
        .from('users')
        .select('id, full_name')
        .eq('id', task.assigned_to)
        .maybeSingle();
    
    if (assigneeError) {
        console.error('Error fetching assignee:', assigneeError);
    }
    
    const responseData = {
        ...task,
        assignee: assignee || null
    };

    return NextResponse.json(responseData, { status: 200 });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}
