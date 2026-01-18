'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { getHumanAvatarSvg } from '@/lib/avatar';
import { format, parseISO } from 'date-fns';

type Profile = {
    id: string;
    full_name: string | null;
};

type Step = {
    id: string;
    type: 'step' | 'checklist';
    value: string;
    checked: boolean;
};

type Task = {
    id: string;
    title: string;
    description: string;
    priority: number;
    due_date: string | null;
    steps: Step[];
    assignee: Profile;
};

export default function TaskDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const taskId = params.id as string;

    const [task, setTask] = useState<Task | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!taskId) return;

        const fetchTask = async () => {
            setIsLoading(true);
            setError(null);

            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                setError("You are not authenticated.");
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(`/api/tasks/${taskId}`, {
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
            } catch (e: any) {
                setError(e.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTask();
    }, [taskId]);

    const { steps, checklist, checklistCompletion } = useMemo(() => {
        if (!task?.steps) {
            return { steps: [], checklist: [], checklistCompletion: "0/0" };
        }
        const s = task.steps.filter(item => item.type === 'step');
        const c = task.steps.filter(item => item.type === 'checklist');
        const completedCount = c.filter(item => item.checked).length;
        return {
            steps: s,
            checklist: c,
            checklistCompletion: `${completedCount}/${c.length}`
        };
    }, [task]);

    const assigneeAvatar = useMemo(() => {
        if (!task?.assignee?.id) return '';
        return getHumanAvatarSvg(task.assignee.id);
    }, [task]);

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center mesh-background">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen w-full items-center justify-center text-center px-6 mesh-background">
                <div className="glass-panel p-8 rounded-3xl">
                     <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
                     <p className="text-lavender-muted">{error}</p>
                     <button onClick={() => router.back()} className="mt-6 bg-white text-primary font-bold py-3 px-6 rounded-xl">Go Back</button>
                </div>
            </div>
        );
    }

    if (!task) {
        return (
             <div className="flex h-screen w-full items-center justify-center text-center px-6 mesh-background">
                <div className="glass-panel p-8 rounded-3xl">
                     <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
                     <p className="text-lavender-muted">Task could not be loaded.</p>
                     <button onClick={() => router.back()} className="mt-6 bg-white text-primary font-bold py-3 px-6 rounded-xl">Go Back</button>
                </div>
            </div>
        );
    }

    return (
        <div className="font-display antialiased m-0 p-0 text-white mesh-background min-h-screen flex flex-col">
            <header className="pt-14 px-6 pb-4 flex items-center justify-between sticky top-0 z-30 bg-gradient-to-b from-[#1a0b2e] via-[#1a0b2e]/90 to-transparent">
                <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full glass-panel text-white active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-2xl">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold tracking-tight">Task Details</h1>
                <div className="w-10 h-10"></div>
            </header>

            <main className="flex-1 px-4 py-4 overflow-y-auto custom-scrollbar pb-32">
                <div className="glass-panel rounded-[2.5rem] p-6 shadow-2xl space-y-8 bg-white/10 border-white/20">
                    
                    {/* Task Title & Description */}
                    <section className="space-y-2">
                        <h2 className="text-2xl font-bold tracking-tight">{task.title}</h2>
                        {task.description && <p className="text-lavender-muted text-sm leading-relaxed">{task.description}</p>}
                    </section>

                    {/* Meta Details */}
                    <section className="flex flex-wrap items-center gap-3">
                         <div className="inline-flex items-center gap-2 px-3 py-1.5 glass-panel rounded-full border-white/30">
                            <div className="w-6 h-6 rounded-full overflow-hidden border border-white/40">
                                <div
                                    style={{ width: 24, height: 24 }}
                                    dangerouslySetInnerHTML={{ __html: assigneeAvatar }}
                                />
                            </div>
                            <span className="text-sm font-medium">{task.assignee.full_name}</span>
                        </div>

                        {task.due_date && (
                           <div className="flex items-center gap-2 glass-panel px-4 py-2 rounded-2xl border-white/10">
                               <span className="material-symbols-outlined text-lg text-white/70">calendar_today</span>
                               <span className="text-sm font-medium">
                                   {format(parseISO(task.due_date), 'dd MMM, yyyy')}
                               </span>
                           </div>
                        )}
                        
                        <div className="flex items-center gap-2 glass-panel px-4 py-2 rounded-full border-white/20 priority-glow bg-white/10">
                            <span className="text-sm font-bold">P{task.priority}</span>
                        </div>
                    </section>

                    {/* Steps */}
                    {steps.length > 0 && (
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-lavender-muted px-1">Steps</h3>
                            </div>
                            <div className="space-y-3">
                                {steps.map((step, index) => (
                                    <div key={step.id || `step-${index}`} className="glass-panel px-4 py-3 rounded-2xl border-white/10 flex items-center justify-between">
                                        <p className="text-sm font-medium">{step.value}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Checklist */}
                    {checklist.length > 0 && (
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-lavender-muted px-1">Checklist</h3>
                                <span className="text-xs font-medium text-white/50">{checklistCompletion} Complete</span>
                            </div>
                             <div className="space-y-3">
                                {checklist.map((item, index) => (
                                    <div key={item.id || `checklist-${index}`} className="flex items-center gap-3">
                                        <div className="w-5 h-5 border-2 border-white/40 rounded-md flex items-center justify-center shrink-0">
                                            {item.checked && <span className="material-symbols-outlined text-sm text-white">check</span>}
                                        </div>
                                        <p className="text-sm font-medium">{item.value}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </main>
        </div>
    );
}
