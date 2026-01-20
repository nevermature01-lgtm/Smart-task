'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/context/SupabaseAuthProvider';
import { supabase } from '@/lib/supabase/client';
import { format, parseISO } from 'date-fns';
import gsap from 'gsap';
import { cn } from '@/lib/utils';

type Task = {
  id: string;
  title: string;
  priority: number;
  due_date: string | null;
  completed_at: string | null;
};

export default function CompletedTasksPage() {
    const router = useRouter();
    const { user, isLoading: isAuthLoading } = useSupabaseAuth();
    const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const containerRef = useRef(null);

    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const ctx = gsap.context(() => {
        gsap.fromTo(
            containerRef.current,
            { opacity: 0, y: 12 },
            {
            opacity: 1,
            y: 0,
            duration: 0.25,
            ease: 'power1.out',
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
        duration: 0.15,
        ease: 'power1.out',
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
            duration: 0.15,
            ease: 'power1.out',
            onComplete: () => router.back(),
        });
    };

    useEffect(() => {
        if (isAuthLoading || !user) {
            if (!isAuthLoading) setIsLoading(false);
            return;
        }

        const fetchCompletedTasks = async () => {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('tasks')
                .select('id, title, priority, due_date, completed_at')
                .eq('is_completed', true)
                .or(`assigned_to.eq.${user.id},assigned_by.eq.${user.id}`)
                .order('completed_at', { ascending: false });

            if (error) {
                console.error("Error fetching completed tasks:", error);
                setCompletedTasks([]);
            } else if (data) {
                setCompletedTasks(data);
            }
            setIsLoading(false);
        };

        fetchCompletedTasks();
    }, [user, isAuthLoading]);

    return (
        <div ref={containerRef} className="mesh-background min-h-screen flex flex-col">
            <header className="pt-14 px-6 pb-4 flex items-center justify-between sticky top-0 z-30 bg-gradient-to-b from-[#1a0b2e] via-[#1a0b2e]/90 to-transparent">
                <button onClick={handleRouteBack} className="w-10 h-10 flex items-center justify-center rounded-full glass-panel text-white active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-2xl">chevron_left</span>
                </button>
                <h1 className="text-xl font-bold tracking-tight">Completed Tasks</h1>
                <div className="w-10 h-10"></div>
            </header>
            <main className="flex-1 px-6 py-4 overflow-y-auto custom-scrollbar pb-32">
                {isLoading ? (
                    <div className="flex justify-center items-center p-8">
                        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                ) : completedTasks.length > 0 ? (
                    <div className="space-y-4">
                        {completedTasks.map((task) => (
                            <a key={task.id} href={`/tasks/${task.id}`} onClick={(e) => {e.preventDefault(); handleRouteChange(`/tasks/${task.id}`)}} className="block">
                                <div className="glass-panel p-4 rounded-2xl flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
                                        <span className="material-symbols-outlined text-green-400 leading-none">check_circle</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-sm truncate">{task.title}</h4>
                                        <p className="text-xs text-lavender-muted opacity-80 mt-0.5">
                                            Completed: {task.completed_at ? format(parseISO(task.completed_at), 'dd MMM, yyyy') : 'N/A'}
                                        </p>
                                    </div>
                                    <div className={cn("px-3 py-1.5 rounded-full glass-panel bg-white/10 border-white/20")}>
                                        <span className={cn("text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap")}>
                                            P{task.priority}
                                        </span>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                ) : (
                    <div className="glass-panel p-8 rounded-3xl text-center flex flex-col items-center gap-4">
                        <span className="material-symbols-outlined text-4xl text-white/50">task_alt</span>
                        <p className="text-lavender-muted">You have no completed tasks.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
