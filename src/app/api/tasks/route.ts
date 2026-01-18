import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { parse, format } from 'date-fns';

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
        
        let numericPriority: number;
        if (typeof priority === 'string') {
            switch (priority.toLowerCase()) {
                case 'low':
                    numericPriority = 1;
                    break;
                case 'medium':
                    numericPriority = 5;
                    break;
                case 'high':
                    numericPriority = 10;
                    break;
                default:
                    numericPriority = parseInt(priority, 10) || 5; 
            }
        } else if (typeof priority === 'number') {
            numericPriority = priority;
        } else {
            numericPriority = 5;
        }

        const combinedSteps: { type: string; value: string; checked?: boolean }[] = [];

        if (steps && Array.isArray(steps)) {
            steps.forEach((step: unknown) => {
                if (typeof step === 'string' && step.trim() !== '') {
                    combinedSteps.push({ type: 'step', value: step.trim() });
                }
            });
        }

        if (checklist && Array.isArray(checklist)) {
            checklist.forEach((item: any) => {
                if (item && typeof item.text === 'string' && item.text.trim() !== '') {
                    combinedSteps.push({ type: 'checklist', value: item.text.trim(), checked: !!item.checked });
                }
            });
        }

        console.log('Final steps payload for DB:', JSON.stringify(combinedSteps, null, 2));
        
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

        return NextResponse.json(newTask, { status: 201 });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
    }
}
