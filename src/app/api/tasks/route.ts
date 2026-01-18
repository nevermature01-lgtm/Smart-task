import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { parse, format } from 'date-fns';
import { randomUUID } from 'crypto';

// Helper function to create a notification
async function createNotification(payload: Record<string, any>) {
    try {
        const { error } = await supabaseAdmin.from('notifications').insert(payload);
        if (error) {
            console.error('Error creating notification:', error.message);
        }
    } catch (e: any) {
        console.error('Failed to create notification:', e.message);
    }
}


export async function POST(request: Request) {
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

        const { title, description, priority, assigneeId, teamId, steps, checklist, dueDate } = body;

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }
        if (!assigneeId) {
            return NextResponse.json({ error: 'Assignee is required' }, { status: 400 });
        }
        
        // Priority should be a number between 1 and 10. Default to 5 if not provided or invalid.
        const numericPriority = (typeof priority === 'number' && priority >= 1 && priority <= 10) ? priority : 5;

        const combinedSteps: { id: string; type: string; value: string; checked: boolean }[] = [];

        if (steps && Array.isArray(steps)) {
            steps.forEach((step: unknown) => {
                if (typeof step === 'string' && step.trim() !== '') {
                    combinedSteps.push({ id: randomUUID(), type: 'step', value: step.trim(), checked: false });
                }
            });
        }

        if (checklist && Array.isArray(checklist)) {
            checklist.forEach((item: any) => {
                if (item && typeof item.text === 'string' && item.text.trim() !== '') {
                    combinedSteps.push({ id: randomUUID(), type: 'checklist', value: item.text.trim(), checked: !!item.checked });
                }
            });
        }
        
        let formattedDueDateForDb: string | null = null;
        if (dueDate) {
            try {
                // Input format is DD-MM-YYYY, Supabase needs YYYY-MM-DD
                const parsedDate = parse(dueDate, 'dd-MM-yyyy', new Date());
                formattedDueDateForDb = format(parsedDate, 'yyyy-MM-dd');
            } catch (e) {
                console.error("Error parsing due date:", e);
                // Don't insert a malformed date, let it be null
                formattedDueDateForDb = null;
            }
        }

        const { data: newTask, error: insertError } = await supabaseAdmin
            .from('tasks')
            .insert({
                title,
                description,
                priority: numericPriority,
                steps: combinedSteps,
                team_id: teamId,
                assigned_to: assigneeId,
                assigned_by: user.id,
                due_date: formattedDueDateForDb,
            })
            .select()
            .single();
        
        if (insertError) {
            console.error('Supabase insert error:', insertError);
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        // Create notification for assignee
        if (newTask && assigneeId !== user.id) { // Don't notify if assigning to self
            const creatorName = user.user_metadata?.full_name || 'Someone';
            await createNotification({
                user_id: assigneeId,
                message: `${creatorName} assigned you a new task: "${newTask.title}"`,
                link: `/tasks/${newTask.id}`,
                type: 'task_assigned',
                title: 'New Task Assigned',
                task_id: newTask.id,
            });
        }


        return NextResponse.json(newTask, { status: 201 });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
    }
}
