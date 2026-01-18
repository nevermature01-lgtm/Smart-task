'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/context/SupabaseAuthProvider';
import { getHumanAvatarSvg } from '@/lib/avatar';
import { format, parse } from 'date-fns';

type TaskDetails = {
    id: string;
    title: string;
    description: string | null;
    due_date: string | null;
    priority: number;
    steps: { id: string; type: string; value: string; checked: boolean }[];
    assignee: {
        id: string;
        full_name: string | null;
    } | null;
};

export default function TaskDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const taskId = params.id as string;
    const { session, isLoading: isAuthLoading } = useSupabaseAuth();

    const [task, setTask] = useState<TaskDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        const fetchTask = async () => {
            if (!taskId || !session) {
                if (!isAuthLoading && !session) {
                    setError("You must be logged in to view this page.");
                    setLoading(false);
                }
                return;
            };

            setLoading(true);

            try {
                const response = await fetch(`/api/tasks/${taskId}`, {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                });
                
                const data = await response.json();

                if (!response.ok) {
                    setError(data.error || `Error: ${response.statusText}`);
                } else {
                    setTask(data);
                }
            } catch (e: any) {
                setError('Failed to fetch task details.');
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        if (!isAuthLoading) {
            fetchTask();
        }
    }, [taskId, session, isAuthLoading]);

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center mesh-background">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }
    
    if (error || !task) {
        return (
             <div className="flex h-screen w-full flex-col items-center justify-center mesh-background text-center">
                 <div className="glass-panel p-8 rounded-3xl">
                    <h2 className="text-2xl font-bold text-red-400">Error</h2>
                    <p className="text-white/80 mt-2 max-w-sm">{error || 'Could not load the requested task.'}</p>
                    <button onClick={() => router.push('/home')} className="mt-6 inline-block bg-primary text-white font-bold py-3 px-6 rounded-xl">
                        Go to Home
                    </button>
                 </div>
            </div>
        );
    }

    const assigneeName = task.assignee?.full_name || '...';
    const assigneeAvatar = task.assignee ? getHumanAvatarSvg(task.assignee.id) : '';
    
    const steps = Array.isArray(task.steps) ? task.steps.filter(item => item.type === 'step') : [];
    const checklist = Array.isArray(task.steps) ? task.steps.filter(item => item.type === 'checklist') : [];
    const checklistCompleted = checklist.filter(item => item.checked).length;
    
  return (
    <>
      <header className="pt-14 px-6 pb-4 flex items-center justify-between sticky top-0 z-30 bg-[#1a0b2e]/40 backdrop-blur-md">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full glass-panel text-white active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </button>
        <h1 className="text-xl font-bold tracking-tight">Task Details</h1>
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
            <section className="space-y-5">
                <div className="flex items-center gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 glass-panel rounded-full border-white/30">
                    <div className="w-6 h-6 rounded-full overflow-hidden border border-white/40">
                         <div
                            style={{ width: 24, height: 24 }}
                            dangerouslySetInnerHTML={{ __html: assigneeAvatar }}
                        />
                    </div>
                    <span className="text-sm font-medium">{assigneeName}</span>
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
                    {task.due_date
                        ? format(parse(task.due_date, 'yyyy-MM-dd', new Date()), 'dd-MM-yyyy')
                        : 'No Due Date'}
                </span>
                </div>
                <div className="flex items-center gap-2 glass-panel px-4 py-2 rounded-full border-white/20 priority-glow bg-white/10">
                    <span className="text-xs font-bold text-white uppercase tracking-tighter">P{task.priority}</span>
                </div>
            </section>
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-lavender-muted px-1">Steps</h3>
                </div>
                <div className="space-y-3">
                {steps.length > 0 ? (
                    steps.map((step) => (
                        <div key={step.id} className="glass-panel px-4 py-3 rounded-2xl border-white/10 flex items-center justify-between">
                            <span className="text-sm font-medium">{step.value}</span>
                            {step.checked && (
                                <span className="material-symbols-outlined text-success text-xl">check_circle</span>
                            )}
                        </div>
                    ))
                ) : (
                     <div className="glass-panel px-4 py-3 rounded-2xl border-white/10 text-center">
                        <span className="text-sm font-medium text-white/50">No steps for this task.</span>
                    </div>
                )}
                </div>
            </section>
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-lavender-muted px-1">Checklist</h3>
                {checklist.length > 0 &&
                    <span className="text-xs font-medium text-white/50">{checklistCompleted}/{checklist.length} Complete</span>
                }
                </div>
                <div className="space-y-3">
                {checklist.length > 0 ? (
                    checklist.map(item => (
                        <div key={item.id} className="glass-panel px-4 py-3 rounded-2xl border-white/10 flex items-center gap-3">
                            <div className={`w-5 h-5 border-2 ${item.checked ? 'bg-success border-success' : 'border-white/30'} rounded-md flex items-center justify-center`}>
                               {item.checked && <span className="material-symbols-outlined text-white text-sm">check</span>}
                            </div>
                            <span className="text-sm font-medium">{item.value}</span>
                        </div>
                    ))
                ) : (
                    <div className="glass-panel px-4 py-3 rounded-2xl border-white/10 text-center">
                        <span className="text-sm font-medium text-white/50">No checklist items for this task.</span>
                    </div>
                )}
                </div>
            </section>
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

    