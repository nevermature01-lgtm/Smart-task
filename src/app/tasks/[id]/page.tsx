'use client';

import { useRouter } from 'next/navigation';
import { getHumanAvatarSvg } from '@/lib/avatar';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { format, parse } from 'date-fns';
import { cn } from '@/lib/utils';

type Profile = {
    id: string;
    full_name: string | null;
};

type TaskStep = {
    type: 'step' | 'checklist';
    value: string;
    checked?: boolean;
};

type Task = {
    id: string;
    title: string;
    description: string | null;
    priority: number;
    steps: TaskStep[] | null;
    team_id: string | null;
    due_date: string | null;
    assignee: Profile;
    assigner: Profile;
    teamMembers: Profile[];
};

export default function TaskDetailsPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [task, setTask] = useState<Task | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTask = async () => {
            setIsLoading(true);
            setError(null);
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                setError('You must be logged in to view this task.');
                setIsLoading(false);
                router.push('/login');
                return;
            }

            try {
                const response = await fetch(`/api/tasks/${params.id}`, {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `Error: ${response.status}`);
                }

                const data = await response.json();
                setTask(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        if (params.id) {
            fetchTask();
        }
    }, [params.id, router]);

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center mesh-background">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen w-full items-center justify-center mesh-background text-center px-6">
                <div className="glass-panel p-8 rounded-3xl">
                    <h2 className="text-xl font-bold text-red-400 mb-2">Error loading task</h2>
                    <p className="text-lavender-muted">{error}</p>
                    <button onClick={() => router.back()} className="mt-6 w-full bg-white text-primary font-bold py-3 rounded-xl">Go Back</button>
                </div>
            </div>
        );
    }
    
    if (!task) {
         return (
            <div className="flex h-screen w-full items-center justify-center mesh-background text-center px-6">
                <div className="glass-panel p-8 rounded-3xl">
                    <h2 className="text-xl font-bold mb-2">Task not found</h2>
                    <p className="text-lavender-muted">The requested task could not be found.</p>
                    <button onClick={() => router.back()} className="mt-6 w-full bg-white text-primary font-bold py-3 rounded-xl">Go Back</button>
                </div>
            </div>
        );
    }

    const allSteps = task.steps || [];
    const steps = allSteps.filter(s => s.type === 'step');
    const checklist = allSteps.filter(s => s.type === 'checklist');

    const completedSteps = steps.filter(s => s.checked).length;
    const completedChecklist = checklist.filter(c => c.checked).length;
    
    const teamMembersForDisplay = task.teamMembers.slice(0, 1);
    const plusCount = task.teamMembers.length - teamMembersForDisplay.length;

    return (
        <div className="font-display antialiased m-0 p-0 text-white mesh-background min-h-screen flex flex-col">
            <header className="pt-14 px-6 pb-4 flex items-center justify-between sticky top-0 z-30 bg-[#1a0b2e]/40 backdrop-blur-md">
                <button onClick={() => router.back()} className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full glass-panel text-white active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-2xl">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold tracking-tight truncate px-2 text-center">{task.title}</h1>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button className="w-10 h-10 flex items-center justify-center rounded-full glass-panel text-white active:scale-95 transition-transform">
                        <span className="material-symbols-outlined text-xl">edit</span>
                    </button>
                    <button className="w-10 h-10 flex items-center justify-center rounded-full glass-panel text-red-400 active:scale-95 transition-transform border-red-500/20">
                        <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                </div>
            </header>
            <main className="flex-1 px-4 py-4 overflow-y-auto custom-scrollbar pb-32">
                <div className="glass-panel rounded-[2.5rem] p-6 shadow-2xl bg-white/10 border-white/20 flex flex-col">
                    <div className="space-y-8">
                         <section className="space-y-3">
                            {task.description && <p className="text-white/80 text-sm leading-relaxed">{task.description}</p>}
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 glass-panel rounded-full border-white/30">
                                    <div className="w-6 h-6 rounded-full overflow-hidden border border-white/40">
                                        <div
                                            style={{ width: 24, height: 24, borderRadius: '50%' }}
                                            dangerouslySetInnerHTML={{ __html: getHumanAvatarSvg(task.assignee.id) }}
                                        />
                                    </div>
                                    <span className="text-sm font-medium">{task.assignee.full_name || 'Assignee'}</span>
                                </div>
                                <button className="flex items-center gap-1.5 px-3 py-1.5 glass-panel rounded-full border-white/20 active:scale-95 transition-transform hover:bg-white/10">
                                    <span className="material-symbols-outlined text-[16px]">person_add</span>
                                    <span className="text-[11px] font-semibold tracking-wide">Reassign</span>
                                </button>
                            </div>
                        </section>
                        <section className="flex items-center gap-4">
                            <div className="flex items-center gap-2 glass-panel px-4 py-2 rounded-2xl border-white/10">
                                <span className="material-symbols-outlined text-lavender-muted text-lg">calendar_today</span>
                                <span className="text-sm font-medium">
                                    {task.due_date ? format(parse(task.due_date, 'yyyy-MM-dd', new Date()), 'dd-MM-yyyy') : 'No Due Date'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 glass-panel px-4 py-2 rounded-full border-white/20 priority-glow bg-white/10">
                                <span className="text-xs font-bold text-white uppercase tracking-tighter">P{task.priority}</span>
                                <span className="text-[10px] opacity-70">Priority</span>
                            </div>
                        </section>

                        {steps.length > 0 && (
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-lavender-muted px-1">Steps</h3>
                                    <span className="text-xs font-medium text-white/50">{completedSteps}/{steps.length} Complete</span>
                                </div>
                                <div className="space-y-3">
                                    {steps.map((step, index) => (
                                        <div key={`step-${index}`} className="glass-panel px-4 py-3 rounded-2xl border-white/10 flex items-center justify-between">
                                            <span className="text-sm font-medium">{step.value}</span>
                                            {step.checked ? (
                                                <span className="material-symbols-outlined text-success text-xl">check_circle</span>
                                            ) : (
                                                <div className="w-5 h-5 rounded-full border-2 border-white/30"></div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {checklist.length > 0 && (
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-lavender-muted px-1">Checklist</h3>
                                    <span className="text-xs font-medium text-white/50">{completedChecklist}/{checklist.length} Complete</span>
                                </div>
                                <div className="space-y-3">
                                    {checklist.map((item, index) => (
                                        <div key={`checklist-${index}`} className="glass-panel px-4 py-3 rounded-2xl border-white/10 flex items-center gap-3">
                                            {item.checked ? (
                                                <div className="w-5 h-5 border-2 border-success bg-success/20 rounded-md flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-success text-sm">check</span>
                                                </div>
                                            ) : (
                                                <div className="w-5 h-5 border-2 border-white/30 rounded-md"></div>
                                            )}
                                            <span className={cn("text-sm font-medium", { "line-through text-white/50": item.checked })}>{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                        
                        {(steps.length > 0 || checklist.length > 0) && (
                            <section className="pt-4">
                                <div className="relative w-full h-16 swipe-track rounded-full p-1.5 flex items-center">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-sm font-bold uppercase tracking-widest text-white/30 pointer-events-none">Swipe to Complete</span>
                                    </div>
                                    <div className="h-[52px] w-[52px] aspect-square glass-panel bg-success/30 border-success/40 rounded-full flex items-center justify-center shadow-lg shadow-success/20 cursor-pointer">
                                        <span className="material-symbols-outlined text-white text-2xl">keyboard_double_arrow_right</span>
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </main>
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#1a0b2e] via-[#1a0b2e]/95 to-transparent z-40">
                <button className="w-full flex items-center justify-between px-6 py-4 glass-panel rounded-2xl border-white/20 active:scale-95 transition-transform fab-glow">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <span className="material-symbols-outlined text-2xl text-white">chat_bubble</span>
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full border border-white/50"></span>
                        </div>
                        <span className="text-sm font-semibold tracking-wide">Team Discussion</span>
                    </div>
                    {task.teamMembers && task.teamMembers.length > 0 && (
                        <div className="flex -space-x-2">
                            {teamMembersForDisplay.map(member => (
                                <div key={member.id} className="w-6 h-6 rounded-full border border-white/20 overflow-hidden">
                                   <div
                                        style={{ width: 24, height: 24, borderRadius: '50%' }}
                                        dangerouslySetInnerHTML={{ __html: getHumanAvatarSvg(member.id) }}
                                    />
                                </div>
                            ))}
                            {plusCount > 0 && (
                                <div className="w-6 h-6 rounded-full glass-panel border border-white/20 flex items-center justify-center text-[10px] font-bold">
                                    +{plusCount}
                                </div>
                            )}
                        </div>
                    )}
                </button>
            </div>
        </div>
    );
}
