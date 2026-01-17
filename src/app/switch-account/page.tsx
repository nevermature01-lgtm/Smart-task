'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSupabaseAuth } from '@/context/SupabaseAuthProvider';
import { supabase } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';

type Team = {
  id: string;
  team_name: string;
  owner_id: string;
  created_at: string;
};

export default function SwitchAccountPage() {
    const router = useRouter();
    const { user } = useSupabaseAuth();
    const [teams, setTeams] = useState<Team[]>([]);
    const [isLoadingTeams, setIsLoadingTeams] = useState(true);

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

    const ownerName = user?.user_metadata?.full_name || 'Owner';

    return (
        <div className="relative flex flex-col pb-8 min-h-screen">
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
                    <button className="glass-panel p-6 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform">
                        <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                            <span className="material-symbols-outlined text-white text-3xl">login</span>
                        </div>
                        <span className="font-bold text-sm">Join Team</span>
                    </button>
                </section>
                <section className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="font-bold text-xl">Your Teams</h3>
                    </div>
                    <div className="space-y-3">
                        {isLoadingTeams ? (
                            <div className="flex justify-center items-center p-8">
                                <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                            </div>
                        ) : teams.length === 0 ? (
                            <div className="glass-panel p-5 rounded-[2rem] text-center">
                                <p className="text-lavender-muted">You haven't created any teams yet.</p>
                            </div>
                        ) : (
                            teams.map((team, index) => (
                                <div key={team.id} className="glass-panel p-5 rounded-[2rem] flex items-center gap-4 active:bg-white/10 transition-colors">
                                    <div className={`w-12 h-12 rounded-full border-2 ${index === 0 ? 'border-primary/30' : 'border-white/10'} flex items-center justify-center ${index === 0 ? 'bg-gradient-to-br from-primary/40 to-transparent' : 'bg-white/5'} shrink-0`}>
                                        <span className="material-symbols-outlined">auto_awesome</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-base truncate">{team.team_name}</h4>
                                        <p className="text-xs text-lavender-muted opacity-80 mt-0.5">Created By {ownerName}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {index === 0 && (
                                            <div className="px-3 py-1.5 rounded-full glass-panel bg-green-500/10 border-green-500/20">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-green-400">Active</span>
                                            </div>
                                        )}
                                        <span className="material-symbols-outlined text-lavender-muted/50 text-lg">chevron_right</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
