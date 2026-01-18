import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

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

        const { title, description, priority, assigneeId, teamId, steps } = body;

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

        const { data: newTask, error: insertError } = await supabaseAdmin
            .from('tasks')
            .insert({
                title,
                description,
                priority: numericPriority,
                steps: steps || [],
                team_id: teamId,
                assigned_to: assigneeId,
                assigned_by: user.id,
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
