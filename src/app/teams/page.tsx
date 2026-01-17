'use client';
import Link from 'next/link';
import { useSupabaseAuth } from '@/context/SupabaseAuthProvider';
import { supabase } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTeam } from '@/context/TeamProvider';

type Team = {
  id: string;
  team_name: string;
  owner_id: string;
  created_at: string;
  team_code: string;
};

export default function TeamsPage() {
    const { user } = useSupabaseAuth();
    const router = useRouter();
    const [teams, setTeams] = useState<Team[]>([]);
    const [isLoadingTeams, setIsLoadingTeams] = useState(true);
    const { activeTeam, setActiveTeam, isLoading: isTeamLoading } = useTeam();

     useEffect(() => {
        const fetchTeams = async () => {
            if (user) {
                setIsLoadingTeams(true);
                const { data, error } = await supabase
                    .from('teams')
                    .select('*')
                    .eq('owner_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Error fetching teams:', error);
                } else if (data) {
                    setTeams(data);
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
    }

    const displayName = user?.user_metadata?.full_name || 'Personal Account';
    const userPhoto = user?.user_metadata?.avatar_url;
    
    const isLoading = isLoadingTeams || isTeamLoading;

    return (
        <div className="relative flex flex-col pb-28 min-h-screen">
            <header className="pt-14 px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
                <h1 className="text-2xl font-bold tracking-tight">Smart Task</h1>
                <button className="w-10 h-10 flex items-center justify-center rounded-xl glass-panel text-white active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-xl">notifications</span>
                </button>
            </header>
            <main className="px-6 pt-8 space-y-8">
                <section className="grid grid-cols-2 gap-4">
                    <Link href="/teams/create" className="glass-panel p-6 rounded-3xl flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform border-primary/20">
                        <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-white/10">
                            <span className="material-symbols-outlined text-white text-3xl">group_add</span>
                        </div>
                        <span className="font-bold text-sm text-white">Create Team</span>
                    </Link>
                    <Link href="/teams/join" className="glass-panel p-6 rounded-3xl flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
                            <span className="material-symbols-outlined text-white text-3xl">login</span>
                        </div>
                        <span className="font-bold text-sm text-white">Join Team</span>
                    </Link>
                </section>
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg">Your Teams</h3>
                        <button onClick={() => router.push('/teams/manage')} className="text-sm text-lavender-muted font-medium">Manage</button>
                    </div>
                    <div className="space-y-3">
                         {isLoading ? (
                            <div className="flex justify-center items-center p-8">
                                <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                            </div>
                        ) : (
                            <>
                                <button onClick={() => handleSwitchTeam('personal')} className="w-full text-left glass-panel p-4 rounded-2xl flex items-center gap-4 active:bg-white/10 transition-colors">
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
                                        <h4 className="font-bold text-sm truncate">{displayName}</h4>
                                        <p className="text-xs text-lavender-muted opacity-80 mt-0.5">Personal Account</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {activeTeam === 'personal' && (
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
                                                <p className="text-xs text-lavender-muted opacity-80 mt-0.5">Created by: {displayName}</p>
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
                                    <div className="glass-panel p-4 rounded-2xl text-center">
                                        <p className="text-lavender-muted">You haven't created any teams yet.</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </section>
            </main>
            <nav className="fixed bottom-8 left-6 right-6 h-20 glass-panel rounded-3xl flex items-center justify-around px-4 z-40">
                <Link href="/home" className="flex flex-col items-center gap-1 text-lavender-muted/60">
                    <span className="material-symbols-outlined text-2xl">home</span>
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Home</span>
                </Link>
                <button className="flex flex-col items-center gap-1 text-lavender-muted/60">
                    <span className="material-symbols-outlined text-2xl">check_circle</span>
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Tasks</span>
                </button>
                <button className="flex flex-col items-center gap-1 nav-active">
                    <span className="material-symbols-outlined text-2xl" style={{fontVariationSettings: "'FILL' 1"}}>group</span>
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Teams</span>
                </button>
                <button className="flex flex-col items-center gap-1 text-lavender-muted/60">
                    <span className="material-symbols-outlined text-2xl">settings</span>
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Settings</span>
                </button>
            </nav>
        </div>
    );
}
