'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
    const { toast } = useToast();

    // Swipe to complete logic
    const [isDragging, setIsDragging] = useState(false);
    const swipeTrackRef = useRef<HTMLDivElement>(null);
    const swipeHandleRef = useRef<HTMLDivElement>(null);
    const isDraggingRef = useRef(false);
    const startXRef = useRef(0);
    const dragXRef = useRef(0);
    const animationFrameRef = useRef<number | null>(null);


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
    
    const { steps, checklist, checklistCompletion, isTaskComplete } = useMemo(() => {
        if (!task?.steps) {
            return { steps: [], checklist: [], checklistCompletion: "0/0", isTaskComplete: false };
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
        };
    }, [task]);

    const isCompleted = isTaskComplete;

    const handleCompleteTask = useCallback(async () => {
        if (!task || isTaskComplete) return;

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
                throw new Error(errorData.error || 'Failed to update task.');
            }
            toast({ title: "Task Completed!", description: "All checklist items have been marked as complete." });

        } catch (e: any) {
            setTask({ ...task, steps: originalSteps });
            toast({ variant: 'destructive', title: 'Error completing task', description: e.message });
        }
    }, [isTaskComplete, task, taskId, toast]);

    const handlePointerMove = useCallback((e: PointerEvent) => {
        if (!isDraggingRef.current) return;

        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }

        animationFrameRef.current = requestAnimationFrame(() => {
            if (!swipeTrackRef.current || !swipeHandleRef.current) return;

            const deltaX = e.clientX - startXRef.current;
            const trackWidth = swipeTrackRef.current.offsetWidth;
            const handleWidth = 52;
            const maxTranslateX = trackWidth - handleWidth - 12;

            const newTranslateX = Math.max(0, Math.min(deltaX, maxTranslateX));
            dragXRef.current = newTranslateX;

            swipeHandleRef.current.style.transform = `translate(${newTranslateX}px, -50%)`;

            const opacity = Math.max(0, 1 - (newTranslateX / (trackWidth * 0.5)));
            const textElement = swipeTrackRef.current.querySelector('span.swipe-text');
            if (textElement) {
                (textElement as HTMLElement).style.opacity = `${opacity}`;
            }
        });
    }, []);

    const handlePointerUp = useCallback((e: PointerEvent) => {
        if (!isDraggingRef.current) return;

        isDraggingRef.current = false;
        setIsDragging(false);

        try {
            swipeHandleRef.current?.releasePointerCapture(e.pointerId);
        } catch (err) {}

        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('pointercancel', handlePointerUp);

        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        
        if (!swipeTrackRef.current || !swipeHandleRef.current) return;

        const trackWidth = swipeTrackRef.current.offsetWidth;
        const completionThreshold = trackWidth * 0.7;

        if (dragXRef.current >= completionThreshold) {
            handleCompleteTask();
        } else {
            swipeHandleRef.current.style.transition = 'transform 0.3s ease';
            swipeHandleRef.current.style.transform = 'translate(0px, -50%)';
            dragXRef.current = 0;
            const textElement = swipeTrackRef.current.querySelector('span.swipe-text');
            if (textElement) {
                (textElement as HTMLElement).style.transition = 'opacity 0.3s ease';
                (textElement as HTMLElement).style.opacity = '1';
            }
        }
    }, [handleCompleteTask, handlePointerMove]);

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (isCompleted || !swipeHandleRef.current) return;

        e.preventDefault();
        isDraggingRef.current = true;
        setIsDragging(true);
        
        startXRef.current = e.clientX - dragXRef.current;
        
        swipeHandleRef.current.setPointerCapture(e.pointerId);
        swipeHandleRef.current.style.transition = 'none';

        const textElement = swipeTrackRef.current?.querySelector('span.swipe-text');
        if (textElement) {
            (textElement as HTMLElement).style.transition = 'none';
        }

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerUp);
    };

    useEffect(() => {
        const handle = swipeHandleRef.current;
        const track = swipeTrackRef.current;
        if (!handle || !track) return;
        
        handle.style.transition = 'transform 0.3s ease';

        if (isCompleted) {
            const trackWidth = track.offsetWidth;
            const handleWidth = 52;
            const maxTranslateX = trackWidth - handleWidth - 12;
            handle.style.transform = `translate(${maxTranslateX}px, -50%)`;
            dragXRef.current = maxTranslateX;
        } else if (!isDraggingRef.current) {
            handle.style.transform = 'translate(0px, -50%)';
            dragXRef.current = 0;
        }
    }, [isCompleted]);

    useEffect(() => {
        const handle = swipeHandleRef.current;
        if (handle) {
            handle.style.transform = 'translate(0px, -50%)';
        }
        return () => {
             if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerUp);
        }
    }, [handlePointerMove, handlePointerUp]);


    const handleToggleChecklist = async (itemToToggle: Step) => {
        if (!task) return;
        
        const itemExists = task.steps.find(step => step.id === itemToToggle.id);
        if (!itemExists) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not find the item to update.' });
            return;
        }

        const originalSteps = task.steps;

        const newSteps = originalSteps.map(step =>
            step.id === itemToToggle.id ? { ...step, checked: !step.checked } : step
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

            <main className="flex-1 px-4 py-4 overflow-y-auto custom-scrollbar pb-48">
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
                                            key={item.id || `checklist-temp-${index}`} 
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
                    </div>
                </div>
            </main>

            <div className="fixed bottom-0 left-0 right-0 p-6 z-40 w-full space-y-3">
                 {checklist.length > 0 && (
                    <div 
                        ref={swipeTrackRef} 
                        className="relative w-full h-16 rounded-full swipe-track shadow-lg"
                        style={{ overflow: 'visible' }}
                    >
                        <div
                            ref={swipeHandleRef}
                            onPointerDown={handlePointerDown}
                            style={{
                                position: 'absolute',
                                left: 6,
                                top: '50%',
                                transform: 'translate(0px, -50%)',
                                width: 52,
                                height: 52,
                                zIndex: 50,
                                opacity: 1,
                                pointerEvents: 'auto',
                                touchAction: 'none',
                                willChange: 'transform'
                            }}
                            className={cn(
                                "aspect-square glass-panel rounded-full flex items-center justify-center shadow-lg",
                                { "cursor-grab": !isCompleted },
                                { "cursor-grabbing": isDragging },
                                { "bg-success/50 border-success/60 cursor-default": isCompleted }
                            )}
                        >
                            <span className="material-symbols-outlined text-3xl text-white">
                                {isCompleted ? 'check' : 'chevron_right'}
                            </span>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                             <span className={cn(
                                "swipe-text text-sm font-bold uppercase tracking-widest text-white/50 transition-opacity",
                                { "opacity-0": isDragging || isCompleted }
                             )}>
                                SWIPE TO COMPLETE
                            </span>
                        </div>
                         {isCompleted && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-sm font-bold uppercase tracking-widest text-white">
                                    COMPLETED
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
