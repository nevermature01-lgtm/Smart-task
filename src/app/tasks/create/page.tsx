'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/context/SupabaseAuthProvider';
import { supabase } from '@/lib/supabase/client';
import { useTeam } from '@/context/TeamProvider';
import { getHumanAvatarSvg } from '@/lib/avatar';
import { cn } from '@/lib/utils';

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
                    setIsLoading(false);
                    return;
                }

                if (!usersData) {
                    setMembers([]);
                    setIsLoading(false);
                    return;
                }

                const { data: teamData, error: teamError } = await supabase
                    .from('teams')
                    .select('owner_id')
                    .eq('id', activeTeamId)
                    .single();
                
                if (teamError) {
                    console.error("Error fetching team owner:", teamError.message);
                }

                const ownerId = teamData?.owner_id;

                const finalProfiles: Profile[] = usersData
                    .filter(member => member.id !== user.id && member.id !== ownerId)
                    .map(member => ({
                        id: member.id,
                        full_name: member.full_name || "Team Member",
                    }));
                
                setMembers(finalProfiles);

                setSelectedAssigneeId(prevId => {
                    const isSelectionStillValid = prevId && finalProfiles.some(p => p.id === prevId);
                    if (isSelectionStillValid) {
                        return prevId;
                    }
                    if (finalProfiles.length === 1) {
                        return finalProfiles[0].id;
                    }
                    return null;
                });

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
    }, [showSearch])

    const handleContinue = () => {
        if (selectedAssigneeId) {
            router.push(`/tasks/create/details?assigneeId=${selectedAssigneeId}`);
        }
    };
    
    const pageLoading = isLoading || isAuthLoading || isTeamLoading;

    const filteredMembers = members.filter(member => 
        member.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="mesh-background min-h-screen flex flex-col">
            <header className="pt-14 px-6 pb-4 flex items-center justify-between sticky top-0 z-30 bg-[#1a0b2e]/60 backdrop-blur-md">
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
            
            <div className="px-6 py-4">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-white/50">Assign Task to:</h2>
            </div>
            <main className="flex-1 px-6 pb-32 space-y-3 overflow-y-auto custom-scrollbar">
                {pageLoading ? (
                    <div className="flex justify-center items-center h-full pt-16">
                        <div className="w-8 h-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                ) : filteredMembers.length > 0 ? (
                    filteredMembers.map((member) => (
                        <button 
                            key={member.id}
                            onClick={() => setSelectedAssigneeId(member.id)}
                            className={cn("w-full text-left glass-panel p-4 rounded-2xl flex items-center justify-between transition-all active:scale-[0.98]", {
                                "border-primary/80 bg-white/20 ring-2 ring-primary": selectedAssigneeId === member.id,
                                "active:bg-white/5 border-transparent": selectedAssigneeId !== member.id,
                            })}
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn("w-12 h-12 rounded-full border-2 overflow-hidden shrink-0 flex items-center justify-center", {
                                    "border-primary": selectedAssigneeId === member.id,
                                    "border-white/20": selectedAssigneeId !== member.id,
                                })}>
                                    <div
                                        style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: '50%',
                                            overflow: 'hidden',
                                        }}
                                        dangerouslySetInnerHTML={{ __html: getHumanAvatarSvg(String(member.id)) }}
                                    />
                                </div>
                                <span className={cn("font-bold text-base", { "text-white": selectedAssigneeId === member.id, "text-white/90": selectedAssigneeId !== member.id})}>{member.full_name}</span>
                            </div>
                            <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0", {
                                "border-primary": selectedAssigneeId === member.id,
                                "border-white/30": selectedAssigneeId !== member.id,
                            })}>
                                {selectedAssigneeId === member.id && <div className="w-3 h-3 rounded-full bg-primary" />}
                            </div>
                        </button>
                    ))
                ) : (
                    <div className="text-center text-lavender-muted pt-16">
                        <p>No other members found to assign.</p>
                        {activeTeamId !== 'personal' && !searchTerm && <p className="text-sm mt-2">You can only assign tasks to team members.</p>}
                        {activeTeamId === 'personal' && <p className="text-sm mt-2">Create or join a team to assign tasks to others.</p>}
                        {searchTerm && <p className="text-sm mt-2">Try adjusting your search.</p>}
                    </div>
                )}
            </main>
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#1a0b2e] via-[#1a0b2e]/90 to-transparent shrink-0">
                <button 
                    onClick={handleContinue} 
                    disabled={!selectedAssigneeId || filteredMembers.length === 0}
                    className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    Continue
                    <span className="material-symbols-outlined text-xl">arrow_forward</span>
                </button>
            </div>
        </div>
    );
}
