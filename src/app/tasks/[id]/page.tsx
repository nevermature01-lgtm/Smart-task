'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { getHumanAvatarSvg } from '@/lib/avatar';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '@/context/SupabaseAuthProvider';

type Profile = {
    id: string;
    full_name: string | null;
};

type Step = {
    id: string;
    type: 'step' | 'checklist' | 'reassignment';
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
    reassignmentChain: Profile[];
    assigned_by: string;
    is_completed: boolean;
    completed_at: string | null;
    team_id: string | null;
};

export default function TaskDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const taskId = params.id as string;
    const { user } = useSupabaseAuth();

    const [task, setTask] = useState<Task | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    
    const [isCompleting, setIsCompleting] = useState(false);
    const [showCompleteDialog, setShowCompleteDialog] = useState(false);

    const [showReassignModal, setShowReassignModal] = useState(false);
    const [teamMembers, setTeamMembers] = useState<Profile[]>([]);
    const [isFetchingMembers, setIsFetchingMembers] = useState(false);
    const [isReassigning, setIsReassigning] = useState(false);
    
    const [showReopenDialog, setShowReopenDialog] = useState(false);
    const [isReopening, setIsReopening] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);


    const currentAssignee = useMemo(() => {
        if (!task?.reassignmentChain || task.reassignmentChain.length === 0) return null;
        return task.reassignmentChain[task.reassignmentChain.length - 1];
    }, [task]);

    useEffect(() => {
        if (!taskId || !user) return;

        const fetchTaskAndRole = async () => {
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

                if (data.team_id && user) {
                    const { data: memberData } = await supabase
                        .from('team_members')
                        .select('role')
                        .eq('team_id', data.team_id)
                        .eq('user_id', user.id)
                        .single();
                    if (memberData) {
                        setUserRole(memberData.role);
                    }
                }
            } catch (e: any) {
                setError(e.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTaskAndRole();
    }, [taskId, user]);
    
    const isTaskCompleted = !!task?.is_completed;

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
            checklistCompletion: `${completedChecklistCount}/${c.length}`,
        };
    }, [task]);

    const handleToggleChecklist = async (itemToToggle: Step) => {
        if (!task || isTaskCompleted) return;
        
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
    
    const handleDeleteTask = async () => {
        if (!task) return;

        setIsDeleting(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            toast({ variant: 'destructive', title: 'Authentication error' });
            setIsDeleting(false);
            return;
        }

        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete task.');
            }

            toast({ title: 'Task Deleted' });
            router.push('/home');

        } catch (e: any) {
            toast({
                variant: 'destructive',
                title: 'Error Deleting Task',
                description: e.message,
            });
            setIsDeleting(false);
            setShowDeleteDialog(false);
        }
    };
    
    const handleCompleteTask = async () => {
        if (!task || isTaskCompleted) return;
        setIsCompleting(true);
        
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { throw new Error("Authentication failed."); }

            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ complete: true }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to complete task.');
            }
            
            const updatedTask = await response.json();
            setTask(updatedTask);
            toast({ title: 'Task Completed!' });
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error completing task', description: e.message });
        } finally {
            setIsCompleting(false);
            setShowCompleteDialog(false);
        }
    };

    const handleOpenReassignModal = async () => {
        if (!task || isTaskCompleted) return;
        if (!task.team_id) {
            toast({
                variant: "destructive",
                title: "Cannot Reassign",
                description: "This task is not part of a team and cannot be reassigned.",
            });
            return;
        }

        setIsFetchingMembers(true);
        setShowReassignModal(true);

        try {
            const { data: teamMembersData, error: teamMembersError } = await supabase
                .from('team_members')
                .select('user_id')
                .eq('team_id', task.team_id);

            if (teamMembersError) throw teamMembersError;

            const userIds = teamMembersData.map(m => m.user_id);

            const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select('id, full_name')
                .in('id', userIds);
            
            if (usersError) throw usersError;

            if (usersData) {
                setTeamMembers(usersData.filter(member => member.id !== currentAssignee?.id && member.id !== task.assigned_by));
            } else {
                setTeamMembers([]);
            }

        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error fetching members', description: e.message });
            setShowReassignModal(false);
        } finally {
            setIsFetchingMembers(false);
        }
    };

    const handleReassignTask = async (newAssignee: Profile) => {
        if (!task) return;
        
        setIsReassigning(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Authentication failed.");

            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ assigneeId: newAssignee.id }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to reassign task.');
            }
            
            const updatedTaskData = await response.json();
            setTask(updatedTaskData);
            toast({ title: 'Task Reassigned', description: `Task has been reassigned to ${newAssignee.full_name}.` });
        
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Reassignment Failed', description: e.message });
        } finally {
            setIsReassigning(false);
            setShowReassignModal(false);
        }
    };
    
    const handleReopenTask = async () => {
        if (!task) return;
        setIsReopening(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Authentication failed.");

            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ reopen: true }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to reopen task.');
            }

            const updatedTask = await response.json();
            setTask(updatedTask);
            toast({ title: 'Task Reopened' });
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error reopening task', description: e.message });
        } finally {
            setIsReopening(false);
            setShowReopenDialog(false);
        }
    };


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

    const canCompleteTask = user?.id === currentAssignee?.id;
    const canManageTask = userRole === 'owner' || userRole === 'admin' || (task?.assigned_by === user?.id);

    return (
        <>
            <header className="pt-14 px-6 pb-4 flex items-center justify-between sticky top-0 z-30 transparent">
                <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full glass-panel text-white active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-2xl">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold tracking-tight">Task Details</h1>
                <div className="flex items-center gap-2">
                    
                    {isTaskCompleted && (
                        <button
                            onClick={() => canManageTask && setShowReopenDialog(true)}
                            disabled={!canManageTask}
                            className="w-10 h-10 flex items-center justify-center rounded-full glass-panel text-white active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="material-symbols-outlined text-xl">lock</span>
                        </button>
                    )}

                    {canManageTask && !isTaskCompleted && (
                        <button onClick={() => setShowDeleteDialog(true)} className="w-10 h-10 flex items-center justify-center rounded-full glass-panel text-red-400 active:scale-95 transition-transform border-red-500/20">
                            <span className="material-symbols-outlined text-xl">delete</span>
                        </button>
                    )}
                </div>
            </header>

            <main className="flex-1 px-4 py-4 overflow-y-auto custom-scrollbar pb-32">
                <div className="glass-panel rounded-[2.5rem] p-6 shadow-2xl bg-white/10 border-white/20 flex flex-col">
                    <div className="space-y-8">
                        <section className="space-y-5">
                             <h2 className="text-2xl font-bold tracking-tight">{task.title}</h2>
                            {task.description && <p className="text-lavender-muted text-sm leading-relaxed">{task.description}</p>}
                        </section>
                        
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-lavender-muted px-1">Assignment History</h3>
                                {canManageTask && !isTaskCompleted && (
                                    <button onClick={handleOpenReassignModal} className="flex items-center gap-1.5 px-3 py-1.5 glass-panel rounded-full border-white/20 active:scale-95 transition-transform hover:bg-white/10">
                                        <span className="material-symbols-outlined text-[16px]">person_add</span>
                                        <span className="text-[11px] font-semibold tracking-wide">Reassign</span>
                                    </button>
                                )}
                            </div>
                            <div className="space-y-3">
                                {(task.reassignmentChain || []).map((assignee, index, arr) => (
                                    <React.Fragment key={`${assignee.id}-${index}`}>
                                        <div
                                            className={cn(
                                                "flex items-center gap-3 p-3 glass-panel rounded-2xl border-white/20",
                                                index < arr.length - 1 && "opacity-60"
                                            )}
                                        >
                                            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/40 shrink-0">
                                                <div style={{ width: 32, height: 32 }} dangerouslySetInnerHTML={{ __html: getHumanAvatarSvg(assignee.id) }} />
                                            </div>
                                            <span className={cn(
                                                "text-sm font-medium",
                                                index < arr.length - 1 && "line-through"
                                            )}>
                                                {assignee.full_name}
                                            </span>
                                        </div>
                                        {index < arr.length - 1 && (
                                            <div className="flex justify-center py-1">
                                                <span className="material-symbols-outlined text-white/30">arrow_downward</span>
                                            </div>
                                        )}
                                    </React.Fragment>
                                ))}
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
                                            className={cn(
                                                "glass-panel px-4 py-3 rounded-2xl border-white/10 flex items-center gap-3",
                                                !isTaskCompleted && "cursor-pointer"
                                            )}
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
            <div className="fixed bottom-0 left-0 right-0 p-6 z-40 bg-gradient-to-t from-[#1a0b2e] via-[#1a0b2e]/90 to-transparent">
                <button 
                    onClick={() => setShowCompleteDialog(true)}
                    disabled={isTaskCompleted || !canCompleteTask}
                    className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/40 active:scale-95 transition-transform flex items-center justify-center gap-2 border border-white/10 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {isTaskCompleted ? 'Completed' : 'Submit'}
                </button>
            </div>
            
            {showDeleteDialog && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/40 backdrop-blur-sm">
                    <div className="glass-modal w-full max-w-sm rounded-[3rem] p-8 flex flex-col items-center text-center">
                        <div className="w-20 h-20 mb-6 rounded-full glass-button-red flex items-center justify-center">
                            <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
                                <span className="material-symbols-outlined text-3xl text-white font-bold">priority_high</span>
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold mb-3 tracking-tight">Delete Task?</h2>
                        <p className="text-white/80 leading-relaxed mb-8 text-base">
                            Are you sure you want to delete this task? This action cannot be undone.
                        </p>
                        <div className="w-full space-y-3">
                            <button
                                onClick={handleDeleteTask}
                                disabled={isDeleting}
                                className="w-full py-4 rounded-2xl glass-button-red text-white font-bold text-lg active:scale-95 transition-transform disabled:opacity-50"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                            <button
                                onClick={() => setShowDeleteDialog(false)}
                                disabled={isDeleting}
                                className="w-full py-4 rounded-2xl glass-button-secondary text-white font-bold text-lg active:scale-95 transition-transform disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showCompleteDialog && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/40 backdrop-blur-sm">
                    <div className="glass-modal w-full max-w-sm rounded-[3rem] p-8 flex flex-col items-center text-center">
                        <div className="w-20 h-20 mb-6 rounded-full glass-panel flex items-center justify-center border-primary/20">
                            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                                <span className="material-symbols-outlined text-3xl text-white font-bold">check_circle</span>
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold mb-3 tracking-tight">Complete Task?</h2>
                        <p className="text-white/80 leading-relaxed mb-8 text-base">
                           Are you sure you want to mark this task as complete?
                        </p>
                        <div className="w-full space-y-3">
                            <button
                                onClick={handleCompleteTask}
                                disabled={isCompleting}
                                className="w-full py-4 rounded-2xl bg-white text-primary font-bold text-lg active:scale-95 transition-transform disabled:opacity-50"
                            >
                                {isCompleting ? 'Completing...' : 'Yes, Complete'}
                            </button>
                            <button
                                onClick={() => setShowCompleteDialog(false)}
                                disabled={isCompleting}
                                className="w-full py-4 rounded-2xl glass-button-secondary text-white font-bold text-lg active:scale-95 transition-transform disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {showReopenDialog && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/40 backdrop-blur-sm">
                    <div className="glass-modal w-full max-w-sm rounded-[3rem] p-8 flex flex-col items-center text-center">
                        <div className="w-20 h-20 mb-6 rounded-full glass-panel flex items-center justify-center border-primary/20">
                            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                                <span className="material-symbols-outlined text-3xl text-white font-bold">lock_open</span>
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold mb-3 tracking-tight">Reopen Task?</h2>
                        <p className="text-white/80 leading-relaxed mb-8 text-base">
                           Reopening this task will mark it as incomplete.
                        </p>
                        <div className="w-full space-y-3">
                            <button
                                onClick={handleReopenTask}
                                disabled={isReopening}
                                className="w-full py-4 rounded-2xl bg-white text-primary font-bold text-lg active:scale-95 transition-transform disabled:opacity-50"
                            >
                                {isReopening ? 'Reopening...' : 'Yes, Reopen'}
                            </button>
                            <button
                                onClick={() => setShowReopenDialog(false)}
                                disabled={isReopening}
                                className="w-full py-4 rounded-2xl glass-button-secondary text-white font-bold text-lg active:scale-95 transition-transform disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {showReassignModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/40 backdrop-blur-sm">
                    <div className="glass-modal w-full max-w-sm rounded-[3rem] p-6 flex flex-col text-center">
                        <h2 className="text-xl font-bold mb-4 tracking-tight">Reassign Task</h2>
                        <div className="max-h-[60vh] overflow-y-auto space-y-3 custom-scrollbar pr-1">
                            {isFetchingMembers ? (
                                <div className="flex justify-center items-center p-8">
                                    <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                                </div>
                            ) : teamMembers.length > 0 ? (
                                teamMembers.map(member => (
                                    <button
                                        key={member.id}
                                        onClick={() => handleReassignTask(member)}
                                        disabled={isReassigning}
                                        className="w-full text-left glass-panel p-4 rounded-2xl flex items-center gap-4 active:scale-[0.98] transition-all hover:bg-white/10 disabled:opacity-50"
                                    >
                                        <div className="w-10 h-10 rounded-full border-2 border-white/20 overflow-hidden shrink-0 flex items-center justify-center">
                                            <div
                                                style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden' }}
                                                dangerouslySetInnerHTML={{ __html: getHumanAvatarSvg(String(member.id)) }}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-sm truncate">{member.full_name}</h4>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <p className="text-white/60 py-4">No other team members available.</p>
                            )}
                        </div>
                        <button
                            onClick={() => setShowReassignModal(false)}
                            disabled={isReassigning}
                            className="w-full mt-6 py-3 rounded-2xl glass-button-secondary text-white font-bold text-lg active:scale-95 transition-transform disabled:opacity-50"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
