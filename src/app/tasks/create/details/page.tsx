'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { getHumanAvatarSvg } from '@/lib/avatar';
import { useSupabaseAuth } from '@/context/SupabaseAuthProvider';
import { useTeam } from '@/context/TeamProvider';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import gsap from 'gsap';


type Profile = {
    id: string;
    full_name: string | null;
};

function CreateTaskDetailsComponent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { user: currentUser, isLoading: isAuthLoading } = useSupabaseAuth();
    const { activeTeam, isLoading: isTeamLoading } = useTeam();
    const containerRef = useRef(null);

    const [assignee, setAssignee] = useState<Profile | null>(null);
    const [isLoadingAssignee, setIsLoadingAssignee] = useState(true);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState(1);
    const [steps, setSteps] = useState<string[]>([]);
    const [checklist, setChecklist] = useState<{ text: string, checked: boolean }[]>([]);
    const [dueDate, setDueDate] = useState<Date | undefined>();
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

    const [isCreating, setIsCreating] = useState(false);
    const assigneeId = searchParams.get('assigneeId');

    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const ctx = gsap.context(() => {
          gsap.fromTo(
            containerRef.current,
            { opacity: 0, y: 12 },
            {
              opacity: 1,
              y: 0,
              duration: 0.35,
              ease: 'power2.out',
              clearProps: 'transform,opacity',
            }
          );
        }, containerRef);
        return () => ctx.revert();
    }, []);

    const handleRouteChange = (path: string) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        router.push(path);
        return;
      }
      gsap.to(containerRef.current, {
        opacity: 0,
        y: -8,
        duration: 0.25,
        ease: 'power1.inOut',
        onComplete: () => router.push(path),
      });
    };

    const handleRouteBack = () => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            router.back();
            return;
        }
        gsap.to(containerRef.current, {
            opacity: 0,
            y: -8,
            duration: 0.25,
            ease: 'power1.inOut',
            onComplete: () => router.back(),
        });
    };
    
    const handleRouteReplace = (path: string) => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            router.replace(path);
            return;
        }
        gsap.to(containerRef.current, {
            opacity: 0,
            y: -8,
            duration: 0.25,
            ease: 'power1.inOut',
            onComplete: () => router.replace(path),
        });
    };

    const handleAddStep = () => setSteps([...steps, '']);
    const handleStepChange = (index: number, value: string) => {
        const newSteps = [...steps];
        newSteps[index] = value;
        setSteps(newSteps);
    };
    const handleRemoveStep = (index: number) => {
        setSteps(steps.filter((_, i) => i !== index));
    };

    const handleAddChecklistItem = () => setChecklist([...checklist, { text: '', checked: false }]);
    const handleChecklistTextChange = (index: number, text: string) => {
        const newChecklist = [...checklist];
        newChecklist[index].text = text;
        setChecklist(newChecklist);
    };
    const handleChecklistCheckedChange = (index: number, checked: boolean) => {
        const newChecklist = [...checklist];
        newChecklist[index].checked = checked;
        setChecklist(newChecklist);
    };
    const handleRemoveChecklistItem = (index: number) => {
        setChecklist(checklist.filter((_, i) => i !== index));
    };


    useEffect(() => {
        if (isAuthLoading) {
            return;
        }

        if (!assigneeId) {
            setIsLoadingAssignee(false);
            toast({ variant: 'destructive', title: 'No assignee selected. Redirecting...' });
            handleRouteReplace('/tasks/create');
            return;
        }

        // Optimization for self-assignment (personal workspace) to prevent race condition
        if (currentUser && currentUser.id === assigneeId) {
            setAssignee({
                id: currentUser.id,
                full_name: currentUser.user_metadata?.full_name || "Me"
            });
            setIsLoadingAssignee(false);
            return;
        }

        const fetchAssignee = async () => {
            setIsLoadingAssignee(true);
            const { data, error } = await supabase
                .from('users')
                .select('id, full_name')
                .eq('id', assigneeId)
                .single();

            if (error) {
                console.error('Error fetching assignee:', error.message);
                toast({ variant: 'destructive', title: 'Failed to load assignee details.' });
                setAssignee(null);
            } else if (!data) {
                toast({ variant: 'destructive', title: 'Assignee not found.' });
                setAssignee(null);
            } else {
                setAssignee(data);
            }
            setIsLoadingAssignee(false);
        };

        fetchAssignee();
    }, [assigneeId, toast, currentUser, isAuthLoading]);

    const handleCreateTask = async () => {
        if (!title.trim()) {
            toast({ variant: 'destructive', title: 'Task title is required.' });
            return;
        }
        if (!currentUser || !assignee) {
             toast({ variant: 'destructive', title: 'An assignee is required.' });
             return;
        }

        setIsCreating(true);
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            toast({ variant: 'destructive', title: 'Authentication error', description: 'You are not logged in.' });
            setIsCreating(false);
            return;
        }

        const teamId = activeTeam === 'personal' ? null : activeTeam;

        const formattedDueDate = dueDate ? format(dueDate, 'dd-MM-yyyy') : null;

        const taskData = {
            title: title.trim(),
            description: description.trim(),
            priority: priority,
            assigneeId: assignee.id,
            teamId: teamId,
            steps: steps.filter(s => s.trim() !== ''),
            checklist: checklist.filter(c => c.text.trim() !== ''),
            dueDate: formattedDueDate,
        };

        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify(taskData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create task');
            }

            toast({ title: 'Task Created!', description: `"${taskData.title}" has been assigned.` });
            handleRouteChange('/home');

        } catch (error: any) {
            console.error("Error creating task:", error);
            toast({ variant: 'destructive', title: 'Failed to create task', description: error.message });
        } finally {
            setIsCreating(false);
        }
    };
    
    const isLoading = isAuthLoading || isTeamLoading || isLoadingAssignee || isCreating;

    return (
        <div ref={containerRef} className="font-display antialiased m-0 p-0 text-white mesh-background min-h-screen flex flex-col">
            <header className="pt-14 px-6 pb-4 flex items-center justify-between sticky top-0 z-30">
                <button onClick={handleRouteBack} className="w-10 h-10 flex items-center justify-center rounded-full glass-panel text-white active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-2xl">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold tracking-tight">Create Task</h1>
                <div className="w-10 h-10"></div>
            </header>
            <main className="flex-1 px-4 py-4 overflow-y-auto custom-scrollbar pb-32">
                <div className="glass-panel rounded-[2.5rem] p-6 shadow-2xl space-y-8 bg-white/10 border-white/20">
                    <section className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 px-1">Details</h3>
                        <div className="flex flex-wrap items-center gap-3">
                            {isLoadingAssignee ? (
                                <div className="h-8 w-24 bg-white/10 rounded-full animate-pulse"></div>
                            ) : assignee ? (
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 glass-panel rounded-full border-white/30">
                                    <div className="w-6 h-6 rounded-full overflow-hidden border border-white/40">
                                         <div
                                            style={{ width: 24, height: 24 }}
                                            dangerouslySetInnerHTML={{ __html: getHumanAvatarSvg(String(assignee.id)) }}
                                        />
                                    </div>
                                    <span className="text-sm font-medium">{assignee.full_name}</span>
                                    <button onClick={handleRouteBack}>
                                        <span className="material-symbols-outlined text-xs text-white/60">close</span>
                                    </button>
                                </div>
                            ) : (
                                 <p className="text-white/50 text-sm px-1">Could not load assignee.</p>
                            )}
                             <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                                <PopoverTrigger asChild>
                                    <button className="inline-flex items-center gap-2 px-3 py-1.5 glass-panel rounded-full border-white/20 active:scale-95 transition-transform hover:bg-white/10 disabled:opacity-50" disabled={isLoading}>
                                        <CalendarIcon className="w-4 h-4 text-white/70" />
                                        <span className="text-sm font-medium">
                                            {dueDate ? format(dueDate, 'dd-MM-yyyy') : "Set Due Date"}
                                        </span>
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 glass-modal border-white/20 text-white" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={dueDate}
                                        onSelect={(date) => {
                                            setDueDate(date);
                                            setIsDatePickerOpen(false);
                                        }}
                                        disabled={{ before: new Date() }}
                                        initialFocus
                                        className="bg-transparent"
                                        classNames={{
                                            caption_label: "text-white",
                                            nav_button: "text-white hover:bg-white/10 active:bg-white/5",
                                            nav_icon: "text-white",
                                            head_cell: "text-white/70",
                                            day: "text-white hover:bg-white/10 rounded-md",
                                            day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary",
                                            day_today: "bg-white/20 text-white rounded-md",
                                            day_outside: "text-white/40",
                                            day_disabled: "text-white/30",
                                        }}
                                    />
                                    <div className="p-2 border-t border-white/10">
                                        <button 
                                            onClick={() => {
                                                setDueDate(undefined);
                                                setIsDatePickerOpen(false);
                                            }} 
                                            className="w-full text-center text-sm font-semibold text-red-400 p-2 rounded-lg hover:bg-white/10 transition-colors"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </section>
                    <section className="space-y-6">
                        <div className="relative group">
                            <label className="text-xs font-bold uppercase tracking-widest text-white/50 px-1">Task Name</label>
                            <input disabled={isLoading} className="w-full bg-transparent border-t-0 border-l-0 border-r-0 border-b-2 border-white/20 focus:border-white focus:ring-0 text-white font-semibold text-lg py-2 placeholder-white/30" placeholder="Enter task name..." type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
                        </div>
                        <div className="relative group">
                            <label className="text-xs font-bold uppercase tracking-widest text-white/50 px-1">Description</label>
                            <textarea disabled={isLoading} className="w-full bg-transparent border-t-0 border-l-0 border-r-0 border-b-2 border-white/20 focus:border-white focus:ring-0 text-white/90 text-sm py-2 resize-none placeholder-white/30" placeholder="Add more details about this task..." rows={2} value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
                        </div>
                    </section>
                    <section className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 px-1">Steps</h3>
                                <button onClick={handleAddStep} disabled={isLoading} className="w-6 h-6 flex items-center justify-center rounded-full glass-panel text-white/70 active:scale-90 transition-transform disabled:opacity-50">
                                    <span className="material-symbols-outlined text-sm">add</span>
                                </button>
                            </div>
                            <div className="space-y-2">
                                {steps.map((step, index) => (
                                    <div key={index}>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={step}
                                                onChange={(e) => handleStepChange(index, e.target.value)}
                                                placeholder="New step..."
                                                disabled={isLoading}
                                                className="w-full bg-white/5 glass-panel px-3 py-2 rounded-xl text-[12px] font-medium border-white/10 focus:ring-1 focus:ring-white/50 focus:outline-none placeholder:text-white/40"
                                            />
                                            <button onClick={() => handleRemoveStep(index)} disabled={isLoading} className="p-1 rounded-full hover:bg-white/10 transition-colors">
                                                <span className="material-symbols-outlined text-sm text-white/50 hover:text-white">close</span>
                                            </button>
                                        </div>
                                        {index < steps.length - 1 && (
                                            <div className="flex justify-center py-1">
                                                <span className="material-symbols-outlined text-white/30">arrow_downward</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 px-1">Checklist</h3>
                                <button onClick={handleAddChecklistItem} disabled={isLoading} className="w-6 h-6 flex items-center justify-center rounded-full glass-panel text-white/70 active:scale-90 transition-transform disabled:opacity-50">
                                    <span className="material-symbols-outlined text-sm">add</span>
                                </button>
                            </div>
                            <div className="space-y-2">
                                {checklist.map((item, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <button onClick={() => handleChecklistCheckedChange(index, !item.checked)} disabled={isLoading} className="w-4 h-4 border-2 border-white/40 rounded-sm flex items-center justify-center shrink-0">
                                            {item.checked && <span className="material-symbols-outlined text-xs text-white">check</span>}
                                        </button>
                                        <input
                                            type="text"
                                            value={item.text}
                                            onChange={(e) => handleChecklistTextChange(index, e.target.value)}
                                            placeholder="New item..."
                                            disabled={isLoading}
                                            className="w-full bg-transparent text-[12px] font-medium focus:outline-none placeholder:text-white/40"
                                        />
                                        <button onClick={() => handleRemoveChecklistItem(index)} disabled={isLoading} className="p-1 rounded-full hover:bg-white/10 transition-colors">
                                             <span className="material-symbols-outlined text-sm text-white/50 hover:text-white">close</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                    <section className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 px-1">Priority</h3>
                        <div className="flex justify-center py-2">
                            <div className="relative flex items-center glass-panel h-20 w-full rounded-full p-2 border-white/10">
                                <div className="flex items-center gap-4 px-4 overflow-x-auto hide-scrollbar w-full snap-x snap-mandatory">
                                     {Array.from({ length: 10 }, (_, i) => i + 1).map((p) => (
                                        <div key={p} onClick={() => !isLoading && setPriority(p)} className="cursor-pointer flex-shrink-0 snap-center relative flex items-center justify-center w-14 h-14">
                                            {priority === p && (
                                                <div className="absolute inset-0 priority-oval bg-white/30 rounded-full border border-white/40 shadow-inner"></div>
                                            )}
                                            <span className={`relative z-10 text-xl font-bold ${priority !== p ? 'opacity-40' : ''}`}>{p}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
            <div className="fixed bottom-0 left-0 right-0 p-6 z-40">
                <button onClick={handleCreateTask} disabled={isLoading} className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/40 active:scale-95 transition-transform flex items-center justify-center gap-2 border border-white/10 disabled:opacity-70">
                    {isCreating ? "Creating..." : "Create Task"}
                    <span className="material-symbols-outlined text-xl">done_all</span>
                </button>
            </div>
        </div>
    );
}

export default function CreateTaskDetailsPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center mesh-background">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        }>
            <CreateTaskDetailsComponent />
        </Suspense>
    );
}
