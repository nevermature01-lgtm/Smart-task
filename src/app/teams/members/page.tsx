'use client';

import { useRouter } from 'next/navigation';
import { getHumanAvatarSvg } from '@/lib/avatar';
import { useState, useEffect } from 'react';
import { useTeam } from '@/context/TeamProvider';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '@/context/SupabaseAuthProvider';

type Member = {
    id: string;
    full_name: string;
    role: string;
};

export default function ManageMembersPage() {
    const router = useRouter();
    const { user } = useSupabaseAuth();
    const { activeTeam: activeTeamId, isLoading: isTeamLoading } = useTeam();
    const { toast } = useToast();
    
    const [members, setMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isTeamLoading) return;

        if (!activeTeamId || activeTeamId === 'personal') {
            toast({
                variant: 'destructive',
                title: 'No Team Selected',
                description: 'You must select a team to manage its members.',
            });
            router.push('/teams');
            return;
        }

        const fetchTeamData = async () => {
            setIsLoading(true);

            // Fetch team owner
            const { data: teamData, error: teamError } = await supabase
                .from('teams')
                .select('owner_id')
                .eq('id', activeTeamId)
                .single();

            if (teamError) {
                console.error('Error fetching team data:', teamError);
                toast({ variant: 'destructive', title: 'Failed to load team.' });
                setIsLoading(false);
                return;
            }

            // Fetch members
            const { data: teamMembersData, error: membersError } = await supabase
                .from('team_members')
                .select(`
                    user_id,
                    role,
                    users!team_members_user_id_fkey (
                      id,
                      full_name
                    )
                `)
                .eq('team_id', activeTeamId);

            if (membersError) {
                console.error('Error fetching team members:', membersError.message || membersError);
                toast({ variant: 'destructive', title: 'Failed to load members.' });
                setIsLoading(false);
                return;
            }

            if (teamMembersData) {
                const processedMembers: Member[] = teamMembersData.map((item: any) => ({
                    id: item.user_id,
                    full_name: item.users?.full_name || 'Team Member',
                    role: item.user_id === teamData.owner_id ? 'owner' : item.role,
                }));
                
                setMembers(processedMembers);
            } else {
                setMembers([]);
            }
            setIsLoading(false);
        };

        fetchTeamData();
    }, [activeTeamId, isTeamLoading, router, toast]);

    return (
        <div className="font-display antialiased m-0 p-0 text-white mesh-background min-h-screen flex flex-col">
            <header className="pt-14 px-6 pb-6 flex items-center justify-between sticky top-0 z-30 bg-[#1a0b2e]/30 backdrop-blur-md">
                <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full glass-panel text-white active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-2xl leading-none">chevron_left</span>
                </button>
                <h1 className="text-xl font-bold tracking-tight text-white">Team Members</h1>
                <button className="w-10 h-10 flex items-center justify-center rounded-full glass-panel text-white active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-2xl leading-none">search</span>
                </button>
            </header>
            <main className="flex-1 px-6 pb-24 space-y-4 overflow-y-auto custom-scrollbar">
                {isLoading ? (
                    <div className="flex justify-center items-center p-8">
                        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                ) : members.length === 0 ? (
                    <div className="glass-panel p-6 rounded-3xl text-center">
                        <p className="text-lavender-muted">No members found for this team.</p>
                    </div>
                ) : (
                    members.map((member) => (
                        <div key={member.id} className="glass-panel p-5 rounded-3xl space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full border-2 border-white/20 overflow-hidden shadow-sm flex-shrink-0">
                                     <div
                                        style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' }}
                                        dangerouslySetInnerHTML={{ __html: getHumanAvatarSvg(member.id) }}
                                    />
                                </div>
                                <div className="flex flex-col flex-1">
                                    <span className="font-bold text-lg text-white">{member.full_name}</span>
                                    {(member.role === 'owner' || member.role === 'admin') ? (
                                         <span className="text-[10px] uppercase tracking-wider font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full w-fit">Admin</span>
                                    ) : (
                                         <span className="text-[10px] uppercase tracking-wider font-bold bg-white/10 text-white/80 px-2 py-0.5 rounded-full w-fit">Staff</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                 {member.role === 'owner' ? (
                                    <button disabled className="flex-1 flex items-center justify-center gap-2 text-xs font-bold text-white py-2.5 rounded-xl glass-button-secondary opacity-50 cursor-not-allowed">
                                        <span className="material-symbols-outlined text-base">shield_person</span>
                                        Owner
                                    </button>
                                 ) : member.role === 'admin' ? (
                                    <button disabled className="flex-1 flex items-center justify-center gap-2 text-xs font-bold text-white py-2.5 rounded-xl glass-button-secondary active:scale-95 transition-all">
                                        <span className="material-symbols-outlined text-base">shield_person</span>
                                        Remove Admin
                                    </button>
                                 ) : (
                                    <button disabled className="flex-1 flex items-center justify-center gap-2 text-xs font-bold text-white py-2.5 rounded-xl glass-button-secondary active:scale-95 transition-all">
                                        <span className="material-symbols-outlined text-base">shield</span>
                                        Make Admin
                                    </button>
                                 )}
                                <button disabled={member.role === 'owner'} className="flex-1 flex items-center justify-center gap-2 text-xs font-bold text-red-400 py-2.5 rounded-xl glass-button-red active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                    <span className="material-symbols-outlined text-base">person_remove</span>
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </main>
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#1a0b2e] via-[#1a0b2e]/60 to-transparent pointer-events-none h-24"></div>
        </div>
    );
}
