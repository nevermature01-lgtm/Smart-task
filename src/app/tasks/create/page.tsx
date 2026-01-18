'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/context/SupabaseAuthProvider';
import { supabase } from '@/lib/supabase/client';
import { useTeam } from '@/context/TeamProvider';
import { getHumanAvatarSvg } from '@/lib/avatar';
import { cn } from '@/lib/utils';
import Link from 'next/link';

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
                // For personal workspace, automatically assign to self and move to the next step.
                setIsLoading(false);
                router.push(`/tasks/create/details?assigneeId=${user.id}`);
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
                    // Filter out the logged-in user from the list of assignable members
                    const finalProfiles: Profile[] = usersData
                        .map(member => ({
                            id: member.id,
                            full_name: member.full_name || "Team Member",
                        }))
                        .filter(member => member.id !== user.id);
                    
                    setMembers(finalProfiles);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, activeTeamId, isTeamLoading, isAuthLoading]);
    
    const handleSelectAssignee = (id: string) => {
        router.push(`/tasks/create/details?assigneeId=${id}`);
    };
    
    const pageLoading = isLoading || isAuthLoading || isTeamLoading;

    return (
        <div className="mesh-background min-h-screen flex flex-col">
            <header className="pt-14 px-6 pb-4 flex items-center justify-between sticky top-0 z-30">
                <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full glass-panel text-white active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-2xl">chevron_left</span>
                </button>
                <h1 className="text-xl font-bold tracking-tight">Assign Task</h1>
                 <div className="w-10 h-10"></div>
            </header>
            
            <main className="flex-1 px-6 py-4 overflow-y-auto custom-scrollbar pb-32">
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-white/80 px-1">Who is this task for?</h3>
                    <div className="space-y-3">
                        {pageLoading ? (
                            <div className="flex justify-center items-center p-8">
                                <div className="w-6 h-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                            </div>
                        ) : members.length > 0 ? (
                            members.map((member) => (
                                <button 
                                    key={member.id}
                                    onClick={() => handleSelectAssignee(member.id)}
                                    className="w-full text-left glass-panel p-4 rounded-2xl flex items-center gap-4 active:scale-[0.98] transition-all active:bg-white/10"
                                >
                                    <div className="w-12 h-12 rounded-full border-2 border-white/20 overflow-hidden shrink-0 flex items-center justify-center">
                                        <div
                                            style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden' }}
                                            dangerouslySetInnerHTML={{ __html: getHumanAvatarSvg(String(member.id)) }}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-sm truncate">{member.full_name}</h4>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="glass-panel p-5 rounded-2xl text-center">
                                <p className="text-lavender-muted">
                                    {'No other team members to assign tasks to.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#1a0b2e] via-[#1a0b2e]/90 to-transparent z-30">
                <Link href="/teams/members" className="w-full h-14 glass-panel text-white rounded-2xl font-bold text-lg active:scale-[0.98] transition-all flex items-center justify-center">
                    Manage team
                </Link>
            </div>
        </div>
    );
}
