'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { getHumanAvatarSvg } from '@/lib/avatar';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

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

    const handleToggleChecklist = async (itemId: string) => {
        if (!task) return;

        const originalSteps = task.steps;

        // Optimistic UI update
        const newSteps = originalSteps.map(step =>
            step.id === itemId ? { ...step, checked: !step.checked } : step
        );

        const newTask = { ...task, steps: newSteps };
        setTask(newTask);

        // Persist to DB
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setTask({ ...task, steps: originalSteps });
                setError("You are not authenticated.");
                return;
            }

            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ steps: newSteps }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update task.');
            }

        } catch (e: any) {
            // Revert optimistic update on any error
            setTask({ ...task, steps: originalSteps });
            setError(e.message);
        }
    };


    const { steps, checklist, checklistCompletion } = useMemo(() => {
        if (!task?.steps) {
            return { steps: [], checklist: [], checklistCompletion: "0/0" };
        }
        const s = task.steps.filter(item => item.type === 'step');
        const c = task.steps.filter(item => item.type === 'checklist');
        
        const completedChecklistCount = c.filter(item => item.checked).length;
        return {
            steps: s,
            checklist: c,
            checklistCompletion: `${completedChecklistCount}/${c.length}`
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
                     <h2 className="text-xl font-bold text-red-400 mb-2">Task Not Found</h2>
                     <p className="text-lavender-muted">The requested task could not be found.</p>
                     <button onClick={() => router.back()} className="mt-6 bg-white text-primary font-bold py-3 px-6 rounded-xl">Go Back</button>
                </div>
            </div>
        );
    }

    return (
        <>
            <header className="pt-14 px-6 pb-4 flex items-center justify-between sticky top-0 z-30 transparent">
                <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full glass-panel text-white active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-2xl">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold tracking-tight">Task Details</h1>
                <div className="flex items-center gap-2">
                    
                    <button className="w-10 h-10 flex items-center justify-center rounded-full glass-panel text-red-400 active:scale-95 transition-transform border-red-500/20">
                        <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 px-4 py-4 overflow-y-auto custom-scrollbar pb-32">
                <div className="glass-panel rounded-[2.5rem] p-6 shadow-2xl bg-white/10 border-white/20 flex flex-col">
                    <div className="space-y-8">
                        <section className="space-y-5">
                             <h2 className="text-2xl font-bold tracking-tight">{task.title}</h2>
                            {task.description && <p className="text-lavender-muted text-sm leading-relaxed">{task.description}</p>}
                            <div className="flex items-center gap-3">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 glass-panel rounded-full border-white/30">
                                    <div className="w-6 h-6 rounded-full overflow-hidden border border-white/40">
                                        <div style={{ width: 24, height: 24 }} dangerouslySetInnerHTML={{ __html: assigneeAvatar }} />
                                    </div>
                                    <span className="text-sm font-medium">{task.assignee.full_name}</span>
                                </div>
                                <button className="flex items-center gap-1.5 px-3 py-1.5 glass-panel rounded-full border-white/20 active:scale-95 transition-transform hover:bg-white/10">
                                    <span className="material-symbols-outlined text-[16px]">person_add</span>
                                    <span className="text-[11px] font-semibold tracking-wide">Reassign</span>
                                </button>
                            </div>
                        </section>
                        <section className="flex items-center gap-4">
                            {task.due_date && (
                                <div className="flex items-center gap-2 glass-panel px-4 py-2 rounded-2xl border-white/10">
                                    <span className="material-symbols-outlined text-lavender-muted text-lg">calendar_today</span>
                                    <span className="text-sm font-medium">
                                        {format(parseISO(task.due_date), 'dd MMM, yyyy')}
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 glass-panel px-4 py-2 rounded-full border-white/20 priority-glow bg-white/10">
                                <span className="text-xs font-bold text-white uppercase tracking-tighter">P{task.priority}</span>
                                 <span className="text-[10px] opacity-70">Priority</span>
                            </div>
                        </section>
                        
                        {steps.length > 0 && (
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-lavender-muted px-1">Steps</h3>
                                </div>
                                <div className="space-y-3">
                                    {steps.map((step, index) => (
                                        <div key={step.id || `step-temp-${Date.now()}-${index}`} className="glass-panel px-4 py-3 rounded-2xl border-white/10 flex items-center justify-between">
                                            <p className="text-sm font-medium">{step.value}</p>
                                             {step.checked && <span className="material-symbols-outlined text-success text-xl">check_circle</span>}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                        
                        {checklist.length > 0 && (
                             <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-lavender-muted px-1">Checklist</h3>
                                    <span className="text-xs font-medium text-white/50">{checklistCompletion} Complete</span>
                                </div>
                                <div className="space-y-3">
                                    {checklist.map((item, index) => (
                                        <div 
                                            key={item.id || `checklist-temp-${Date.now()}-${index}`} 
                                            className="glass-panel px-4 py-3 rounded-2xl border-white/10 flex items-center gap-3 cursor-pointer"
                                            onClick={() => handleToggleChecklist(item.id)}
                                        >
                                            <div className="w-5 h-5 border-2 border-white/30 rounded-md flex items-center justify-center">
                                                {item.checked && <span className="material-symbols-outlined text-sm">check</span>}
                                            </div>
                                            <span className={cn("text-sm font-medium", item.checked && "line-through text-white/60")}>
                                                {item.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        <section className="pt-4">
                            <div className="relative w-full h-16 swipe-track rounded-full p-1.5 flex items-center">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-sm font-bold uppercase tracking-widest text-white/30 pointer-events-none">Swipe to Complete</span>
                                </div>
                                <div className="h-13 w-13 aspect-square glass-panel bg-success/30 border-success/40 rounded-full flex items-center justify-center shadow-lg shadow-success/20 cursor-pointer">
                                    <span className="material-symbols-outlined text-white text-2xl">keyboard_double_arrow_right</span>
                                </div>
                            </div>
                        </section>
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
                    <div className="flex -space-x-2">
                        <img alt="team member" className="w-6 h-6 rounded-full border border-white/20" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC7P8HUUkmQKSXWyZjs2yvuNkxhSxWLhsWTJcYqUxEjInv2mZM932tu1CUiNltjsAdKK3cmKHL5au4LI9QZL_eF_dKxJLDVeT0DZVjwlH9ATGoEx2rrGremzUA0iRjrRbMfDyCZfaffzh-DfnVNoaan-0Cm-EuQioNOFL4l0lo2pGP6ZhI6Ymj7F_EsQjskvPXnLN2xtST2PZHulqIe_7twd_TQ5CdaTYlspIdOJqNVcFaQCLnImCaB7XQhXMS0LWRjNhGtVPUNGBTJ"/>
                        <div className="w-6 h-6 rounded-full glass-panel border border-white/20 flex items-center justify-center text-[10px] font-bold">
                            +3
                        </div>
                    </div>
                </button>
            </div>
        </>
    );
}
