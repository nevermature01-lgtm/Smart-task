'use client';
import Link from 'next/link';
import { useSupabaseAuth } from '@/context/SupabaseAuthProvider';
import { supabase } from '@/lib/supabase/client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getHumanAvatarSvg } from '@/lib/avatar';
import { useTeam } from '@/context/TeamProvider';
import gsap from 'gsap';

type Team = {
  id: string;
  team_name: string;
  owner_id: string;
  created_at: string;
  team_code: string;
  role: string;
  owner_name: string | null;
  owner_email: string | null;
};

export default function TeamsPage() {
    const { user } = useSupabaseAuth();
    const router = useRouter();
    const [teams, setTeams] = useState<Team[]>([]);
    const [isLoadingTeams, setIsLoadingTeams] = useState(true);
    const { activeTeam, setActiveTeam, isLoading: isTeamLoading } = useTeam();
    const unreadCount = 0;
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
        const fetchTeams = async () => {
            if (user) {
                setIsLoadingTeams(true);
                
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

                if (memberships) {
                     const userTeamsData = memberships
                        .map(m => {
                            if (!m.teams) return null;
                            return {
                                ...m.teams,
                                role: m.role,
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
            fetchTeams();
        } else {
            setIsLoadingTeams(false);
        }
    }, [user]);

    const handleSwitchTeam = (teamId: string | null) => {
        setActiveTeam(teamId);
        handleRouteChange('/home');
    }

    const displayName = user?.user_metadata?.full_name || 'Personal Account';
    const isLoading = isLoadingTeams || isTeamLoading;

    return (
        <div ref={containerRef} className="relative flex flex-col pb-28 min-h-screen">
            <header className="pt-14 px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <button onClick={handleRouteBack} className="w-10 h-10 flex items-center justify-center rounded-full glass-panel text-white active:scale-95 transition-transform">
                        <span className="material-symbols-outlined text-2xl">chevron_left</span>
                    </button>
                    <h1 className="text-2xl font-bold tracking-tight">Smart Task</h1>
                </div>
                 <a href="/notifications" onClick={(e) => {e.preventDefault(); handleRouteChange('/notifications')}} className="relative w-10 h-10 flex items-center justify-center rounded-xl glass-panel text-white active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-xl">notifications</span>
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white ring-2 ring-[#1a0b2e]">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </a>
            </header>
            <main className="px-6 pt-8 space-y-8">
                <section className="grid grid-cols-2 gap-4">
                    <a href="/teams/create" onClick={(e) => {e.preventDefault(); handleRouteChange('/teams/create')}} className="glass-panel p-6 rounded-3xl flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform border-primary/20">
                        <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-white/10">
                            <span className="material-symbols-outlined text-white text-3xl">group_add</span>
                        </div>
                        <span className="font-bold text-sm text-white">Create Team</span>
                    </a>
                    <a href="/teams/join" onClick={(e) => {e.preventDefault(); handleRouteChange('/teams/join')}} className="glass-panel p-6 rounded-3xl flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
                            <span className="material-symbols-outlined text-white text-3xl">login</span>
                        </div>
                        <span className="font-bold text-sm text-white">Join Team</span>
                    </a>
                </section>
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg">Your Teams</h3>
                        <button onClick={() => handleRouteChange('/teams/manage')} className="text-sm text-lavender-muted font-medium">Manage</button>
                    </div>
                    <div className="space-y-3">
                         {isLoading ? (
                            <div className="flex justify-center items-center p-8">
                                <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                            </div>
                        ) : (
                            <>
                                <button onClick={() => handleSwitchTeam('personal')} className="w-full text-left glass-panel p-4 rounded-2xl flex items-center gap-4 active:bg-white/10 transition-colors">
                                    <div className="w-12 h-12 rounded-full border-2 border-primary/30 flex items-center justify-center bg-gradient-to-br from-primary/40 to-transparent shrink-0 p-1 overflow-hidden">
                                         {user ? (
                                            <div
                                                style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden' }}
                                                dangerouslySetInnerHTML={{ __html: getHumanAvatarSvg(String(user.id)) }}
                                            />
                                        ) : (
                                            <div className="w-full h-full rounded-full bg-primary/20 flex items-center justify-center">
                                                <span className="text-xl font-bold text-white">{displayName.charAt(0)}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-sm truncate">{displayName}</h4>
                                        <p className="text-xs text-lavender-muted opacity-80 mt-0.5">Personal Account</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {(activeTeam === 'personal' || activeTeam === null) && (
                                            <div className="px-2.5 py-1 rounded-full glass-panel bg-green-500/20 border-green-500/20">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-green-300">Active</span>
                                            </div>
                                        )}
                                        <span className="material-symbols-outlined text-lavender-muted/50 text-lg">chevron_right</span>
                                    </div>
                                </button>
                                {teams.length > 0 ? (
                                    teams.map((team) => (
                                        <button key={team.id} onClick={() => handleSwitchTeam(team.id)} className="w-full text-left glass-panel p-4 rounded-2xl flex items-center gap-4 active:bg-white/10 transition-colors">
                                            <div className="w-12 h-12 rounded-full border-2 border-white/10 flex items-center justify-center bg-white/5 shrink-0">
                                                <span className="material-symbols-outlined">auto_awesome</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-sm truncate">{team.team_name}</h4>
                                                <p className="text-xs text-lavender-muted opacity-80 mt-0.5">Team Code: {team.team_code}</p>
                                                <p className="text-xs text-lavender-muted opacity-80 mt-0.5">Created by {team.owner_name || team.owner_email || 'Team Owner'}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {activeTeam === team.id && (
                                                    <div className="px-2.5 py-1 rounded-full glass-panel bg-green-500/20 border-green-500/20">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-green-300">Active</span>
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
                <a href="/teams/manage" onClick={(e) => {e.preventDefault(); handleRouteChange('/teams/manage')}} className="w-full h-14 glass-panel text-white rounded-2xl font-bold text-lg active:scale-[0.98] transition-all flex items-center justify-center">
                    Manage team
                </a>
            </div>
        </div>
    );
}
