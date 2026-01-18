'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { getHumanAvatarSvg } from '@/lib/avatar';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

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
    const [isCompleting, setIsCompleting] = useState(false);
    const { toast } = useToast();

    // Swipe functionality state and refs
    const swipeContainerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState(0);
    const [maxDrag, setMaxDrag] = useState(0);

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
    
    const { steps, checklist, checklistCompletion, isTaskComplete, hasChecklist } = useMemo(() => {
        if (!task?.steps) {
            return { steps: [], checklist: [], checklistCompletion: "0/0", isTaskComplete: false, hasChecklist: false };
        }
        const s = task.steps.filter(item => item.type === 'step');
        const c = task.steps.filter(item => item.type === 'checklist');
        
        const completedChecklistCount = c.filter(item => item.checked).length;
        const hasChecklist = c.length > 0;
        const isTaskComplete = hasChecklist && completedChecklistCount === c.length; 

        return {
            steps: s,
            checklist: c,
            checklistCompletion: `${completedChecklistCount}/${c.length}`,
            isTaskComplete,
            hasChecklist
        };
    }, [task]);

    // Calculate maxDrag on mount and resize
    useEffect(() => {
        const calculateMaxDrag = () => {
            if (swipeContainerRef.current) {
                const containerWidth = swipeContainerRef.current.offsetWidth;
                const handleWidth = 56; // w-14
                const padding = 12; // p-1.5 on container is 6px on each side
                setMaxDrag(containerWidth - handleWidth - padding);
            }
        }
        calculateMaxDrag();
        window.addEventListener('resize', calculateMaxDrag);
        return () => window.removeEventListener('resize', calculateMaxDrag);
    }, []);
    
    const finalDragOffset = useMemo(() => {
        if (isTaskComplete) {
            return maxDrag;
        }
        return dragOffset;
    }, [isTaskComplete, dragOffset, maxDrag]);

    const handleToggleChecklist = async (itemToToggle: Step) => {
        if (!task || isTaskComplete) return;

        const originalSteps = task.steps;

        const newSteps = originalSteps.map(step =>
            step === itemToToggle ? { ...step, checked: !step.checked } : step
        );

        const newTask = { ...task, steps: newSteps };
        setTask(newTask);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { throw new Error("You are not authenticated."); }

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
            setTask({ ...task, steps: originalSteps });
            toast({ variant: 'destructive', title: 'Error updating checklist', description: e.message });
        }
    };

    const handleCompleteTask = async () => {
        if (!task || isCompleting) return;

        setIsCompleting(true);
        const originalSteps = task.steps;

        const newSteps = originalSteps.map(step => 
            step.type === 'checklist' ? { ...step, checked: true } : step
        );
        const newTask = { ...task, steps: newSteps };
        setTask(newTask);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { throw new Error("You are not authenticated."); }

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
                throw new Error(errorData.error || 'Failed to complete task.');
            }
            toast({ title: "Task Completed!", description: `"${task.title}" has been marked as complete.` });
        } catch (e: any) {
            setTask({ ...task, steps: originalSteps });
            toast({ variant: "destructive", title: "Error", description: e.message });
        } finally {
            setIsCompleting(false);
        }
    };
    
    const handleDragStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
        if (isTaskComplete || isCompleting || !hasChecklist) return;
        e.preventDefault();
        
        setIsDragging(true);
        const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const dragOffsetAtStart = finalDragOffset;

        const handleDragMove = (moveEvent: MouseEvent | TouchEvent) => {
            const currentX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
            const offsetX = currentX - startX + dragOffsetAtStart;
            setDragOffset(Math.max(0, Math.min(offsetX, maxDrag)));
        };

        const handleDragEnd = () => {
            window.removeEventListener('mousemove', handleDragMove);
            window.removeEventListener('touchmove', handleDragMove);
            window.removeEventListener('mouseup', handleDragEnd);
            window.removeEventListener('touchend', handleDragEnd);

            setIsDragging(false);

            if (dragOffset > maxDrag * 0.6) {
                handleCompleteTask();
                setDragOffset(maxDrag);
            } else {
                setDragOffset(0);
            }
        };

        window.addEventListener('mousemove', handleDragMove);
        window.addEventListener('touchmove', handleDragMove);
        window.addEventListener('mouseup', handleDragEnd);
        window.addEventListener('touchend', handleDragEnd);
    };

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
                            </div>
                        </section>
                        
                        {steps.length > 0 && (
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-lavender-muted px-1">Steps</h3>
                                </div>
                                <div className="space-y-3">
                                    {steps.map((step, index) => (
                                        <div key={step.id || `step-temp-${index}`}>
                                            <div className="glass-panel px-4 py-3 rounded-2xl border-white/10 flex items-center justify-between">
                                                <p className="text-sm font-medium">{step.value}</p>
                                            </div>
                                            {index < steps.length - 1 && (
                                                <div className="flex justify-center py-2">
                                                    <span className="material-symbols-outlined text-white/30">arrow_downward</span>
                                                </div>
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
                                    <span className="text-xs font-medium text-white/50">{checklistCompletion} Complete</span>
                                </div>
                                <div className="space-y-3">
                                    {checklist.map((item, index) => (
                                        <div 
                                            key={item.id || `checklist-${index}`} 
                                            className="glass-panel px-4 py-3 rounded-2xl border-white/10 flex items-center gap-3 cursor-pointer"
                                            onClick={() => handleToggleChecklist(item)}
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
                            <div
                                ref={swipeContainerRef}
                                className={cn(
                                    "relative w-full h-16 swipe-track rounded-full p-1.5 flex items-center",
                                    !hasChecklist && "opacity-50 cursor-not-allowed",
                                    (isTaskComplete || isCompleting) && "bg-success/20 border-success/30 transition-colors"
                                )}
                            >
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span style={{ opacity: isTaskComplete ? 0 : 1 - Math.min(1, finalDragOffset / (maxDrag * 0.7) ) }}
                                        className={cn(
                                        "text-sm font-bold uppercase tracking-widest text-white/50 pointer-events-none transition-opacity",
                                        isCompleting && "opacity-0"
                                    )}>
                                        {!hasChecklist ? "NO CHECKLIST" : "SWIPE TO COMPLETE"}
                                    </span>
                                     <span className={cn(
                                        "absolute text-sm font-bold uppercase tracking-widest text-white/80 pointer-events-none transition-opacity opacity-0",
                                        isTaskComplete && !isCompleting && "opacity-100"
                                    )}>
                                        COMPLETED
                                    </span>
                                </div>
                                <div
                                    onMouseDown={handleDragStart}
                                    onTouchStart={handleDragStart}
                                    style={{ transform: `translateX(${finalDragOffset}px)` }}
                                    className={cn(
                                        "h-14 w-14 aspect-square glass-panel rounded-full flex items-center justify-center shadow-lg absolute z-10",
                                        !isDragging && "transition-transform duration-300 ease-out",
                                        isTaskComplete || isCompleting ? "cursor-default" : "cursor-grab active:cursor-grabbing",
                                        isCompleting && "animate-spin",
                                        isTaskComplete ? "bg-success/50 border-success/60" : "bg-primary/50 border-primary/60"
                                )}>
                                    {isCompleting ? (
                                        <div className="h-5 w-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                                    ) : isTaskComplete ? (
                                        <span className="material-symbols-outlined text-white text-3xl">check</span>
                                    ) : (
                                        <span className="material-symbols-outlined text-white text-2xl">keyboard_double_arrow_right</span>
                                    )}
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
