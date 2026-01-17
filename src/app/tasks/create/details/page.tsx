'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSupabaseAuth } from '@/context/SupabaseAuthProvider';
import { useTeam } from '@/context/TeamProvider';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


function CreateTaskDetailsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    
    const assigneeId = searchParams.get('assigneeId');
    const { user, isLoading: isAuthLoading } = useSupabaseAuth();
    const { activeTeam, isLoading: isTeamLoading } = useTeam();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('medium');
    const [dueDate, setDueDate] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [assigneeName, setAssigneeName] = useState('...');

    useEffect(() => {
        if (!assigneeId) {
            toast({ variant: 'destructive', title: 'No assignee selected.' });
            router.replace('/tasks/create');
            return;
        }

        const fetchAssignee = async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', assigneeId)
                .single();
            
            if (error || !data) {
                console.error("Error fetching assignee name:", error);
                toast({ variant: 'destructive', title: 'Could not find assignee.' });
                router.replace('/tasks/create');
            } else {
                setAssigneeName(data.full_name || 'Unknown User');
            }
        };

        fetchAssignee();

    }, [assigneeId, router, toast]);

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            toast({ variant: 'destructive', title: 'Task title is required.' });
            return;
        }
        if (!user || !assigneeId) {
             toast({ variant: 'destructive', title: 'Authentication or assignee error.' });
             return;
        }
        
        setIsCreating(true);
        const teamId = activeTeam === 'personal' ? null : activeTeam;

        const { error } = await supabase.from('tasks').insert({
            title: title.trim(),
            description: description.trim(),
            priority,
            due_date: dueDate || null,
            assignee_id: assigneeId,
            creator_id: user.id,
            team_id: teamId,
            status: 'todo' // default status
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
        <div className="mesh-background min-h-screen flex flex-col">
             <header className="pt-14 px-6 pb-4 flex items-center justify-between sticky top-0 z-30">
                <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full glass-panel text-white active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-2xl">chevron_left</span>
                </button>
                <h1 className="text-xl font-bold tracking-tight">Task Details</h1>
                <div className="w-10 h-10" />
            </header>

            <main className="flex-1 px-6 pb-32 space-y-6 overflow-y-auto custom-scrollbar">
                <div className="glass-panel p-6 rounded-3xl">
                    <p className="text-sm text-lavender-muted">Assigning To</p>
                    <p className="text-lg font-bold text-white mt-1">{assigneeName}</p>
                </div>

                <form onSubmit={handleCreateTask} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-lavender-muted ml-1">Title</label>
                        <input
                            className="w-full px-4 py-3.5 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/40 glass-input"
                            placeholder="e.g., Finalize Q3 report"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>
                     <div className="space-y-2">
                        <label className="text-sm font-bold text-lavender-muted ml-1">Description (Optional)</label>
                        <Textarea
                            className="w-full px-4 py-3.5 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/40 glass-input min-h-[100px] resize-none"
                            placeholder="Add more details about the task..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-lavender-muted ml-1">Priority</label>
                             <Select onValueChange={setPriority} defaultValue="medium" disabled={isLoading}>
                                <SelectTrigger className="w-full h-[46px] rounded-xl text-white glass-input focus:ring-1 focus:ring-white/40">
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent className="glass-panel text-white border-white/20">
                                    <SelectItem value="low" className="focus:bg-white/10">Low</SelectItem>
                                    <SelectItem value="medium" className="focus:bg-white/10">Medium</SelectItem>
                                    <SelectItem value="high" className="focus:bg-white/10">High</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <label className="text-sm font-bold text-lavender-muted ml-1">Due Date (Optional)</label>
                            <input
                                type="date"
                                className="w-full h-[46px] px-4 py-3.5 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/40 glass-input"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                </form>
            </main>

             <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#1a0b2e] via-[#1a0b2e]/90 to-transparent shrink-0">
                <button 
                    onClick={handleCreateTask}
                    disabled={isLoading || !title}
                    className="w-full bg-white text-primary font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                    {isCreating ? "Creating..." : "Create Task"}
                </button>
            </div>
        </div>
    );
}


export default function CreateTaskDetailsPage() {
    return (
        <Suspense fallback={
            <div className="mesh-background min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        }>
            <CreateTaskDetailsContent />
        </Suspense>
    );
}