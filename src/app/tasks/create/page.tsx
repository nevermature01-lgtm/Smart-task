'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/context/SupabaseAuthProvider';
import { supabase } from '@/lib/supabase/client';
import { useTeam } from '@/context/TeamProvider';
import { getHumanAvatarSvg } from '@/lib/avatar';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

type Profile = {
    id: string;
    full_name: string | null;
}

export default function CreateTaskPage() {
    const router = useRouter();
    const { user, isLoading: isAuthLoading } = useSupabaseAuth();
    const { activeTeam: activeTeamId, isLoading: isTeamLoading } = useTeam();
    const [members, setMembers] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | null>(null);

    const [taskName, setTaskName] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [priority, setPriority] = useState(1);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isAuthLoading || isTeamLoading) {
            return;
        }

        const fetchMembers = async () => {
            setIsLoading(true);

            if (!user) {
                setMembers([]);
                setIsLoading(false);
                return;
            }

            if (activeTeamId === 'personal' || !activeTeamId) {
                const self: Profile = {
                    id: user.id,
                    full_name: user.user_metadata?.full_name || 'Personal Account',
                };
                setMembers([self]);
                setSelectedAssigneeId(self.id);
                setIsLoading(false);
                return;
            }

            try {
                const { data: teamMembersData, error: teamMembersError } = await supabase
                    .from('team_members')
                    .select('user_id')
                    .eq('team_id', activeTeamId);

                if (teamMembersError) {
                    console.error("Error fetching team members:", teamMembersError);
                    setIsLoading(false);
                    return;
                }
                
                if (!teamMembersData || teamMembersData.length === 0) {
                    setMembers([]);
                    setIsLoading(false);
                    return;
                }
                
                const userIds = teamMembersData.map(m => m.user_id);

                const { data: usersData, error: usersError } = await supabase
                    .from('users')
                    .select('id, full_name')
                    .in('id', userIds);

                if (usersError) {
                    console.error("Error fetching user details:", usersError);
                    setMembers([]);
                    setIsLoading(false);
                    return;
                }

                if (usersData) {
                    const finalProfiles: Profile[] = usersData.map(member => ({
                        id: member.id,
                        full_name: member.full_name || "Team Member",
                    }));
                    setMembers(finalProfiles);

                    // Auto-select if there's only one member
                    if (finalProfiles.length === 1) {
                        setSelectedAssigneeId(finalProfiles[0].id);
                    }
                } else {
                    setMembers([]);
                }
            } catch (e) {
                console.error("An unexpected error occurred in fetchMembers:", e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMembers();
    }, [user, activeTeamId, isTeamLoading, isAuthLoading]);

    useEffect(() => {
        if(showSearch) {
            searchInputRef.current?.focus();
        } else {
            setSearchTerm('');
        }
    }, [showSearch]);

    const handleCreateTask = () => {
        // Logic for creating task will go here
        console.log('Creating task:', {
            assignee: selectedAssigneeId,
            name: taskName,
            description: taskDescription,
            priority,
        });
        // router.push('/home');
    };
    
    const pageLoading = isLoading || isAuthLoading || isTeamLoading;

    const filteredMembers = members.filter(member => 
        member.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="mesh-background min-h-screen flex flex-col">
            <header className="pt-14 px-6 pb-4 flex items-center justify-between sticky top-0 z-30">
                <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full glass-panel text-white active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-2xl">chevron_left</span>
                </button>
                
                {showSearch ? (
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search member..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-10 px-4 flex-1 mx-4 rounded-xl glass-input text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/40 bg-transparent"
                    />
                ) : (
                    <h1 className="text-xl font-bold tracking-tight">Create Task</h1>
                )}

                <button onClick={() => setShowSearch(!showSearch)} className="w-10 h-10 flex items-center justify-center rounded-full glass-panel text-white active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-2xl">{showSearch ? 'close' : 'search'}</span>
                </button>
            </header>
            
            <main className="flex-1 px-4 py-4 overflow-y-auto custom-scrollbar pb-32">
                <div className="glass-panel rounded-[2.5rem] p-6 shadow-2xl space-y-8 bg-white/10 border-white/20">
                    
                    <section className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 px-1">Assign To</h3>
                        <div className="overflow-x-auto hide-scrollbar">
                            <div className="flex items-center gap-3">
                                {pageLoading ? (
                                    <div className="flex justify-center items-center w-full p-4">
                                        <div className="w-6 h-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                                    </div>
                                ) : filteredMembers.length > 0 ? (
                                    filteredMembers.map((member) => (
                                        <button 
                                            key={member.id}
                                            onClick={() => setSelectedAssigneeId(member.id)}
                                            className={cn("flex-shrink-0 flex flex-col items-center justify-center gap-2 transition-all active:scale-95 p-2 rounded-2xl w-20", {
                                                "bg-white/20": selectedAssigneeId === member.id,
                                            })}
                                        >
                                            <div className={cn("w-12 h-12 rounded-full border-2 overflow-hidden shrink-0 flex items-center justify-center", {
                                                "border-primary": selectedAssigneeId === member.id,
                                                "border-white/20": selectedAssigneeId !== member.id,
                                            })}>
                                                <div
                                                    style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden' }}
                                                    dangerouslySetInnerHTML={{ __html: getHumanAvatarSvg(String(member.id)) }}
                                                />
                                            </div>
                                            <span className={cn("text-xs font-medium w-full text-center truncate", { "text-white": selectedAssigneeId === member.id, "text-white/80": selectedAssigneeId !== member.id})}>
                                                {member.full_name}
                                            </span>
                                        </button>
                                    ))
                                ) : (
                                    <div className="text-center text-lavender-muted py-4 w-full">
                                        <p>No members found.</p>
                                        {searchTerm && <p className="text-sm mt-1">Try adjusting your search.</p>}
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                    
                    <section className="space-y-6">
                        <div className="relative group">
                            <label className="text-xs font-bold uppercase tracking-widest text-white/50 px-1">Task Name</label>
                            <input 
                                className="w-full bg-transparent border-t-0 border-l-0 border-r-0 border-b-2 border-white/20 focus:border-white focus:ring-0 text-white font-semibold text-lg py-2 placeholder-white/30" 
                                placeholder="Enter task name..." 
                                type="text"
                                value={taskName}
                                onChange={(e) => setTaskName(e.target.value)}
                            />
                        </div>
                        <div className="relative group">
                            <label className="text-xs font-bold uppercase tracking-widest text-white/50 px-1">Description</label>
                            <Textarea
                                className="w-full bg-transparent border-t-0 border-l-0 border-r-0 border-b-2 border-white/20 focus:border-white focus:ring-0 text-white/90 text-sm py-2 resize-none placeholder-white/30 min-h-0"
                                placeholder="Add more details about this task..." 
                                value={taskDescription}
                                onChange={(e) => setTaskDescription(e.target.value)}
                                rows={2}
                            />
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 px-1">Priority</h3>
                        <div className="flex justify-center py-2">
                            <div className="relative flex items-center glass-panel h-20 w-full rounded-full p-2 border-white/10">
                                <div className="flex items-center gap-4 px-4 overflow-x-auto hide-scrollbar w-full snap-x snap-mandatory">
                                    {Array.from({ length: 10 }, (_, i) => i + 1).map(p => (
                                        <div key={p} onClick={() => setPriority(p)} className="flex-shrink-0 snap-center relative flex items-center justify-center w-14 h-14 cursor-pointer">
                                            {priority === p && <div className="absolute inset-0 priority-oval bg-white/30 rounded-full border border-white/40 shadow-inner"></div>}
                                            <span className={cn("relative z-10 text-xl font-bold", { "opacity-40": priority !== p })}>{p}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#1a0b2e] via-[#1a0b2e]/90 to-transparent z-40">
                <button 
                    onClick={handleCreateTask} 
                    disabled={!selectedAssigneeId || !taskName}
                    className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/40 active:scale-95 transition-transform flex items-center justify-center gap-2 border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed">
                    Create Task
                    <span className="material-symbols-outlined text-xl">done_all</span>
                </button>
            </div>
        </div>
    );
}
