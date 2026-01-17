'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSupabaseAuth } from '@/context/SupabaseAuthProvider';
import { supabase } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTeam } from '@/context/TeamProvider';

type Team = {
  id: string;
  team_name: string;
  owner_id: string;
  created_at: string;
  team_code: string;
  role: string;
  owner_name?: string;
};

export default function SwitchAccountPage() {
    const router = useRouter();
    const { user } = useSupabaseAuth();
    const [teams, setTeams] = useState<Team[]>([]);
    const [isLoadingTeams, setIsLoadingTeams] = useState(true);
    const { activeTeam, setActiveTeam, isLoading: isTeamLoading } = useTeam();

    useEffect(() => {
        const fetchTeamsAndOwners = async () => {
            if (user) {
                setIsLoadingTeams(true);
                
                // Step 1: Fetch team memberships and team data
                const { data: memberships, error: membershipError } = await supabase
                    .from('team_members')
                    .select('role, teams(*)')
                    .eq('user_id', user.id);

                if (membershipError && membershipError.message) {
                    console.error('Error fetching teams:', membershipError.message);
                    setTeams([]);
                    setIsLoadingTeams(false);
                    return;
                }

                if (memberships && memberships.length > 0) {
                    const validMemberships = memberships.filter(m => m.teams);
                    const ownerIds = validMemberships.map(m => m.teams!.owner_id);

                    // Step 2: Fetch profiles for all owners in a single query
                    const { data: profiles, error: profilesError } = await supabase
                        .from('profiles')
                        .select('id, full_name, first_name, last_name')
                        .in('id', ownerIds);
                    
                    if (profilesError && profilesError.message) {
                        console.error('Error fetching owner profiles:', profilesError.message);
                    }

                    const profilesById = profiles?.reduce((acc, p) => {
                        acc[p.id] = p;
                        return acc;
                    }, {} as Record<string, any>) || {};

                    const userTeamsData = validMemberships
                        .map(m => {
                            const teamData = m.teams!;
                            const ownerProfile = profilesById[teamData.owner_id];
                            const ownerName = ownerProfile?.full_name ||
                                              (`${ownerProfile?.first_name || ''} ${ownerProfile?.last_name || ''}`).trim() ||
                                              'Unknown Owner';

                            return {
                                ...teamData,
                                role: m.role,
                                owner_name: ownerName
                            };
                        })
                        .filter((t): t is Team => t !== null && t.id !== null);

                    const sortedTeams = userTeamsData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                    setTeams(sortedTeams);
                } else {
                    setTeams([]);
                }
                setIsLoadingTeams(false);
            }
        };

        if (user) {
            fetchTeamsAndOwners();
        } else {
            setIsLoadingTeams(false);
        }
    }, [user]);

    const handleSwitchTeam = (teamId: string | null) => {
        setActiveTeam(teamId);
        router.push('/home');
    }

    const displayName = user?.user_metadata?.full_name || 'Personal Account';
    const userPhoto = user?.user_metadata?.avatar_url;

    const isLoading = isLoadingTeams || isTeamLoading;

    return (
        <div className="relative flex flex-col min-h-screen pb-28">
            <header className="pt-14 px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full glass-panel text-white active:scale-95 transition-transform">
                        <span className="material-symbols-outlined text-2xl">chevron_left</span>
                    </button>
                    <h1 className="text-2xl font-bold tracking-tight">Smart Task</h1>
                </div>
                <button className="w-10 h-10 flex items-center justify-center rounded-full glass-panel text-white active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-xl">notifications</span>
                </button>
            </header>
            <main className="px-6 pt-8 space-y-8">
                <section className="grid grid-cols-2 gap-4">
                    <Link href="/teams/create" className="glass-panel p-6 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform border-primary/20">
                        <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center border border-white/10">
                            <span className="material-symbols-outlined text-white text-3xl">group_add</span>
                        </div>
                        <span className="font-bold text-sm">Create Team</span>
                    </Link>
                    <Link href="/teams/join" className="glass-panel p-6 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform">
                        <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                            <span className="material-symbols-outlined text-white text-3xl">login</span>
                        </div>
                        <span className="font-bold text-sm">Join Team</span>
                    </Link>
                </section>
                <section className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="font-bold text-xl">Your Teams</h3>
                    </div>
                    <div className="space-y-3">
                        {isLoading ? (
                            <div className="flex justify-center items-center p-8">
                                <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                            </div>
                        ) : (
                            <>
                                <button onClick={() => handleSwitchTeam('personal')} className="w-full text-left glass-panel p-5 rounded-[2rem] flex items-center gap-4 active:bg-white/10 transition-colors">
                                    <div className="w-12 h-12 rounded-full border-2 border-primary/30 flex items-center justify-center bg-gradient-to-br from-primary/40 to-transparent shrink-0 p-1">
                                        {userPhoto ? (
                                            <Image alt={displayName} className="w-full h-full rounded-full object-cover" src={userPhoto} width={48} height={48} />
                                        ) : (
                                            <div className="w-full h-full rounded-full bg-primary/20 flex items-center justify-center">
                                                <span className="text-xl font-bold text-white">{displayName.charAt(0)}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-base truncate">{displayName}</h4>
                                        <p className="text-xs text-lavender-muted opacity-80 mt-0.5">Personal Account</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {(activeTeam === 'personal' || activeTeam === null) && (
                                            <div className="px-3 py-1.5 rounded-full glass-panel bg-green-500/10 border-green-500/20">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-green-400">Active</span>
                                            </div>
                                        )}
                                        <span className="material-symbols-outlined text-lavender-muted/50 text-lg">chevron_right</span>
                                    </div>
                                </button>
                                
                                {teams.length > 0 ? (
                                    teams.map((team) => (
                                        <button key={team.id} onClick={() => handleSwitchTeam(team.id)} className="w-full text-left glass-panel p-5 rounded-[2rem] flex items-center gap-4 active:bg-white/10 transition-colors">
                                            <div className="w-12 h-12 rounded-full border-2 border-white/10 flex items-center justify-center bg-white/5 shrink-0">
                                                <span className="material-symbols-outlined">auto_awesome</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-base truncate">{team.team_name}</h4>
                                                <p className="text-xs text-lavender-muted opacity-80 mt-0.5">Team Code: {team.team_code}</p>
                                                <p className="text-xs text-lavender-muted opacity-80 mt-0.5">Created by {team.owner_name}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {activeTeam === team.id && (
                                                    <div className="px-3 py-1.5 rounded-full glass-panel bg-green-500/10 border-green-500/20">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-green-400">Active</span>
                                                    </div>
                                                )}
                                                <span className="material-symbols-outlined text-lavender-muted/50 text-lg">chevron_right</span>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="glass-panel p-5 rounded-[2rem] text-center">
                                        <p className="text-lavender-muted">You haven't joined or created any teams yet.</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </section>
            </main>
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#1a0b2e] via-[#1a0b2e]/90 to-transparent z-30">
                <Link href="/teams/manage" className="w-full h-14 glass-panel text-white rounded-2xl font-bold text-lg active:scale-[0.98] transition-all flex items-center justify-center">
                    Manage Teams
                </Link>
            </div>
        </div>
    );
}
