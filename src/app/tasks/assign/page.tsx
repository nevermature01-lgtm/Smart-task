'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/context/SupabaseAuthProvider';
import { useTeam } from '@/context/TeamProvider';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getHumanAvatarSvg } from '@/lib/avatar';

type Profile = {
    id: string;
    full_name: string | null;
};

export default function AssignTaskPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user, isLoading: isAuthLoading } = useSupabaseAuth();
    const { activeTeam, isLoading: isTeamLoading } = useTeam();

    const [title, setTitle] = useState('Redesign Mobile App');
    const [description, setDescription] = useState('Establish a new visual language for the task creation flow using glassmorphism effects.');
    const [priority, setPriority] = useState(1);
    const [assignee, setAssignee] = useState<Profile | null>(null);
    const [steps] = useState(['Sketch Layout', 'Color Palette']);
    const [checklist] = useState([{ text: 'Review Assets', checked: false }]);

    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (user && !assignee) {
            setAssignee({
                id: user.id,
                full_name: user.user_metadata?.full_name || 'Alex Rivera'
            });
        }
    }, [user, assignee]);
    
    const handleCreateTask = async () => {
        if (!title.trim()) {
            toast({ variant: 'destructive', title: 'Task title is required.' });
            return;
        }
        if (!user || !assignee) {
             toast({ variant: 'destructive', title: 'An assignee is required.' });
             return;
        }

        setIsCreating(true);
        const teamId = activeTeam === 'personal' ? null : activeTeam;

        let priorityString = 'medium';
        if (priority <= 3) priorityString = 'low';
        if (priority >= 8) priorityString = 'high';

        const { error } = await supabase.from('tasks').insert({
            title: title.trim(),
            description: description.trim(),
            priority: priorityString,
            assignee_id: assignee.id,
            creator_id: user.id,
            team_id: teamId,
            status: 'todo'
        });

        setIsCreating(false);

        if (error) {
            console.error("Error creating task:", error);
            toast({ variant: 'destructive', title: 'Failed to create task', description: error.message });
        } else {
            toast({ title: 'Task Created!', description: `"${title.trim()}" has been assigned.` });
            router.push('/home');
        }
    };

    const isLoading = isAuthLoading || isTeamLoading || isCreating;

    return (
        <div className="font-display antialiased m-0 p-0 text-white mesh-background min-h-screen flex flex-col">
            <header className="pt-14 px-6 pb-4 flex items-center justify-between sticky top-0 z-30 bg-[#1a0b2e]/40 backdrop-blur-md">
                <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full glass-panel text-white active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-2xl">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold tracking-tight">Create Task</h1>
                <div className="w-10 h-10"></div>
            </header>
            <main className="flex-1 px-4 py-4 overflow-y-auto custom-scrollbar pb-32">
                <div className="glass-panel rounded-[2.5rem] p-6 shadow-2xl space-y-8 bg-white/10 border-white/20">
                    <section className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 px-1">Assign To</h3>
                        {assignee ? (
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 glass-panel rounded-full border-white/30">
                                <div className="w-6 h-6 rounded-full overflow-hidden border border-white/40">
                                    <div
                                        style={{ width: 24, height: 24 }}
                                        dangerouslySetInnerHTML={{ __html: getHumanAvatarSvg(String(assignee.id)) }}
                                    />
                                </div>
                                <span className="text-sm font-medium">{assignee.full_name}</span>
                                <button onClick={() => setAssignee(null)}>
                                    <span className="material-symbols-outlined text-xs text-white/60">close</span>
                                </button>
                            </div>
                        ) : (
                            <p className="text-white/50 text-sm px-1">No assignee selected</p>
                        )}
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
                    <section className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 px-1">Steps</h3>
                                <button className="w-6 h-6 flex items-center justify-center rounded-full glass-panel text-white/70">
                                    <span className="material-symbols-outlined text-sm">add</span>
                                </button>
                            </div>
                            <div className="space-y-2">
                                {steps.map((step, index) => (
                                    <div key={index} className="glass-panel px-3 py-2 rounded-xl text-[10px] font-medium border-white/10">{step}</div>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 px-1">Checklist</h3>
                                <button className="w-6 h-6 flex items-center justify-center rounded-full glass-panel text-white/70">
                                    <span className="material-symbols-outlined text-sm">add</span>
                                </button>
                            </div>
                            <div className="space-y-2">
                                {checklist.map((item, index) => (
                                    <div key={index} className="glass-panel px-3 py-2 rounded-xl text-[10px] font-medium border-white/10 flex items-center gap-2">
                                        <div className="w-3 h-3 border border-white/40 rounded-sm"></div>
                                        <span>{item.text}</span>
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
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#1a0b2e] via-[#1a0b2e]/90 to-transparent z-40">
                <button onClick={handleCreateTask} disabled={isLoading} className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/40 active:scale-95 transition-transform flex items-center justify-center gap-2 border border-white/10 disabled:opacity-70">
                    {isCreating ? "Creating..." : "Create Task"}
                    <span className="material-symbols-outlined text-xl">done_all</span>
                </button>
            </div>
        </div>
    );
}
