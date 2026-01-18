'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useSupabaseAuth } from '@/context/SupabaseAuthProvider';
import { getHumanAvatarSvg } from '@/lib/avatar';
import { useToast } from '@/hooks/use-toast';

type TaskItem = {
    id: string;
    type: 'step' | 'checklist';
    value: string; // The text content
    checked: boolean;
};

type TaskDetails = {
    id: string;
    title: string;
    description: string;
    due_date: string | null;
    priority: number;
    priority_string: string;
    steps: TaskItem[];
    assignee_profile: {
        id: string;
        full_name: string | null;
    } | null;
    team: {
        id: string;
        team_name: string;
        team_members: {
            users: {
                id: string;
                full_name: string | null;
            } | null;
        }[];
    } | null;
};


function TaskDetailsComponent() {
    const router = useRouter();
    const { id: taskId } = useParams<{ id: string }>();
    const { session, isLoading: isAuthLoading } = useSupabaseAuth();
    const { toast } = useToast();

    const [task, setTask] = useState<TaskDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isAuthLoading || !taskId) return;

        if (!session) {
            router.replace('/login');
            return;
        }

        const fetchTask = async () => {
            setIsLoading(true);
            setError(null);
            
            try {
                const response = await fetch(`/api/tasks/${taskId}`, {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `Failed to fetch task with status: ${response.status}`);
                }

                const data = await response.json();
                if (data && !Array.isArray(data.steps)) {
                    data.steps = [];
                }
                setTask(data);
            } catch (e: any) {
                console.error(e);
                setError(e.message || "An unknown error occurred.");
                toast({
                    variant: 'destructive',
                    title: 'Error Loading Task',
                    description: e.message,
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchTask();
    }, [taskId, session, isAuthLoading, router, toast]);

    const handleToggleItem = async (itemId: string) => {
        if (!task || !session) return;

        const updatedSteps = task.steps.map(item =>
            item.id === itemId ? { ...item, checked: !item.checked } : item
        );
        
        const originalTask = task;
        setTask({ ...task, steps: updatedSteps });

        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ steps: updatedSteps }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update task');
            }
            
        } catch (e: any) {
            console.error("Failed to update task:", e);
            setTask(originalTask); 
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: e.message,
            });
        }
    };
    
    const handleSwipeComplete = async () => {
        if (!task || !session || !isSwipeEnabled) return;
    
        const updatedSteps = task.steps.map(item => ({ ...item, checked: true }));
    
        const originalTask = task;
        setTask({ ...task, steps: updatedSteps });
    
        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ steps: updatedSteps }),
            });
    
            if (!response.ok) {
                throw new Error((await response.json()).error || 'Failed to complete task');
            }
            toast({ title: "Task Completed!", description: "All steps and checklist items have been marked as complete." });
        } catch (e: any) {
            console.error("Failed to complete task:", e);
            setTask(originalTask);
            toast({ variant: 'destructive', title: 'Update Failed', description: e.message });
        }
    };


    const { steps, checklist } = useMemo(() => {
        const steps = task?.steps?.filter(item => item.type === 'step') || [];
        const checklist = task?.steps?.filter(item => item.type === 'checklist') || [];
        return { steps, checklist };
    }, [task]);

    const completedStepsCount = useMemo(() => steps.filter(s => s.checked).length, [steps]);
    const completedChecklistCount = useMemo(() => checklist.filter(c => c.checked).length, [checklist]);
    
    const isSwipeEnabled = useMemo(() => {
        if (!steps || steps.length === 0) return true; // Enable if there are no steps
        return steps.every(item => item.checked);
    }, [steps]);

    if (isLoading || isAuthLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center mesh-background">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="flex h-screen w-full items-center justify-center mesh-background text-center px-6">
                <div>
                    <h2 className="text-2xl font-bold text-red-400 mb-2">Error</h2>
                    <p className="text-lavender-muted">{error}</p>
                    <button onClick={() => router.back()} className="mt-6 glass-panel px-6 py-3 rounded-xl font-bold">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (!task) {
        return (
             <div className="flex h-screen w-full items-center justify-center mesh-background text-center px-6">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Task Not Found</h2>
                     <button onClick={() => router.back()} className="mt-6 glass-panel px-6 py-3 rounded-xl font-bold">
                        Go Back
                    </button>
                </div>
            </div>
        )
    }
    
    const teamMembers = task.team?.team_members?.map(m => m.users).filter(Boolean) || [];

    return (
        <div className="font-display antialiased m-0 p-0 text-white mesh-background min-h-screen flex flex-col">
            <header className="pt-14 px-6 pb-4 flex items-center justify-between sticky top-0 z-30 bg-[#1a0b2e]/40 backdrop-blur-md">
                <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full glass-panel text-white active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-2xl">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold tracking-tight">{task.title}</h1>
                <div className="flex items-center gap-2">
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

                        {/* Assignee Section */}
                        <section className="space-y-5">
                            <div className="flex items-center gap-3">
                                {task.assignee_profile && (
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 glass-panel rounded-full border-white/30">
                                        <div className="w-6 h-6 rounded-full overflow-hidden border border-white/40" dangerouslySetInnerHTML={{ __html: getHumanAvatarSvg(task.assignee_profile.id)}}>
                                        </div>
                                        <span className="text-sm font-medium">{task.assignee_profile.full_name}</span>
                                    </div>
                                )}
                                <button className="flex items-center gap-1.5 px-3 py-1.5 glass-panel rounded-full border-white/20 active:scale-95 transition-transform hover:bg-white/10">
                                    <span className="material-symbols-outlined text-[16px]">person_add</span>
                                    <span className="text-[11px] font-semibold tracking-wide">Reassign</span>
                                </button>
                            </div>
                        </section>

                        {/* Date & Priority Section */}
                        <section className="flex items-center gap-4">
                            {task.due_date && (
                                <div className="flex items-center gap-2 glass-panel px-4 py-2 rounded-2xl border-white/10">
                                    <span className="material-symbols-outlined text-lavender-muted text-lg">calendar_today</span>
                                    <span className="text-sm font-medium">{task.due_date}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 glass-panel px-4 py-2 rounded-full border-white/20 priority-glow bg-white/10">
                                <span className="text-xs font-bold text-white uppercase tracking-tighter">{task.priority_string}</span>
                                <span className="text-[10px] opacity-70">Priority</span>
                            </div>
                        </section>

                        {/* Steps Section */}
                        {steps.length > 0 && (
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-lavender-muted px-1">Steps</h3>
                                    <span className="text-xs font-medium text-white/50">{completedStepsCount}/{steps.length} Complete</span>
                                </div>
                                <div className="space-y-3">
                                    {steps.map(step => (
                                        <button key={step.id} onClick={() => handleToggleItem(step.id)} className="w-full text-left glass-panel px-4 py-3 rounded-2xl border-white/10 flex items-center justify-between">
                                            <span className="text-sm font-medium">{step.value}</span>
                                            <span className={`material-symbols-outlined text-xl ${step.checked ? 'text-success' : 'text-white/30'}`}>
                                                {step.checked ? 'check_circle' : 'circle'}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </section>
                        )}
                        
                        {/* Checklist Section */}
                        {checklist.length > 0 && (
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-lavender-muted px-1">Checklist</h3>
                                    <span className="text-xs font-medium text-white/50">{completedChecklistCount}/{checklist.length} Complete</span>
                                </div>
                                <div className="space-y-3">
                                    {checklist.map(item => (
                                         <button key={item.id} onClick={() => handleToggleItem(item.id)} className="w-full text-left glass-panel px-4 py-3 rounded-2xl border-white/10 flex items-center gap-3">
                                            <div className={`w-5 h-5 border-2 ${item.checked ? 'bg-success border-success' : 'border-white/30'} rounded-md flex items-center justify-center transition-all`}>
                                                {item.checked && <span className="material-symbols-outlined text-white text-sm">check</span>}
                                            </div>
                                            <span className={`text-sm font-medium ${item.checked ? 'line-through text-white/50' : ''}`}>{item.value}</span>
                                        </button>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Swipe to Complete Section */}
                        <section className="pt-4">
                            <div className="relative w-full h-16 swipe-track rounded-full p-1.5 flex items-center">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className={`text-sm font-bold uppercase tracking-widest ${isSwipeEnabled ? 'text-success/80' : 'text-white/30'} pointer-events-none transition-colors`}>
                                        {isSwipeEnabled ? 'Swipe to Complete' : 'Complete all steps'}
                                    </span>
                                </div>
                                {isSwipeEnabled && (
                                    <div onClick={handleSwipeComplete} className="h-14 w-14 aspect-square glass-panel bg-success/30 border-success/40 rounded-full flex items-center justify-center shadow-lg shadow-success/20 cursor-pointer">
                                        <span className="material-symbols-outlined text-white text-2xl">keyboard_double_arrow_right</span>
                                    </div>
                                )}
                            </div>
                        </section>

                    </div>
                </div>
            </main>

            {/* Team Discussion FAB */}
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
                        {teamMembers.slice(0, 2).map(member => (
                           member && <div key={member.id} className="w-6 h-6 rounded-full border border-white/20 overflow-hidden" dangerouslySetInnerHTML={{ __html: getHumanAvatarSvg(member.id)}}></div>
                        ))}
                        {teamMembers.length > 2 && (
                            <div className="w-6 h-6 rounded-full glass-panel border border-white/20 flex items-center justify-center text-[10px] font-bold">
                                +{teamMembers.length - 2}
                            </div>
                        )}
                    </div>
                </button>
            </div>
        </div>
    );
}

export default function TaskDetailsPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center mesh-background">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        }>
            <TaskDetailsComponent />
        </Suspense>
    )
}
