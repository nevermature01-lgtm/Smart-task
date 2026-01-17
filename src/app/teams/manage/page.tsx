'use client';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/context/SupabaseAuthProvider';
import { supabase } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type Team = {
  id: string;
  team_name: string;
};

// Mock data to replicate the design from the HTML mockup
const mockAvatars = [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuC7P8HUUkmQKSXWyZjs2yvuNkxhSxWLhsWTJcYqUxEjInv2mZM932tu1CUiNltjsAdKK3cmKHL5au4LI9QZL_eF_dKxJLDVeT0DZVjwlH9ATGoEx2rrGremzUA0iRjrRbMfDyCZfaffzh-DfnVNoaan-0Cm-EuQioNOFL4l0lo2pGP6ZhI6Ymj7F_EsQjskvPXnLN2xtST2PZHulqIe_7twd_TQ5CdaTYlspIdOJqNVcFaQCLnImCaB7XQhXMS0LWRjNhGtVPUNGBTJ',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDNi2_7gUa9IsYvs44fo8axPLH0hw6wzaAOY8DgP4b1sxWg4aAqEIphTlS1V7uY9DuwNSlt7ATRAOj7nVZG2BWaRTwWY9CxQU48UpIlX9p-fa4dxqeZ_EpuEGKBjiPmyHqIyqADLu3iELFLTc6cXmQbJ5sZYMzZ0OMGT5sYMNj9aIQ06skoAWHhJcFjj7-u60BLIXk0VCQaI1FBKOEygqMrC8h_pDa3_gAFmhq5oLtmvVve_TrcbkLs4QDKzsGM7rLljokvaprF7LB0',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBVVzDTrbV2P8VqeVSFOXmK5m2SwYo6YINLkY-eILAxC6YJ9csJ1MOTYQR1XDRQ-utmlWNW9Pi-CFyT4Hz-RzXNIxLE5rGdJ5wsapqpGvZOs39xe0yzLXee0_CtN8ktFLn2RKHGhwdgbXEGeJ1vYs58nQnSzorrKf7UbbUhdU4y10NG8Fo7mHQbzqohgRpmhPYu4Ue68B2VNpURpDRVtRppaRv94v2OpDKpT0m1GQ4CIQ86wzezfsUnuz0XLt2dQvH7T-QA_nXS9pZ0',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAMZBMTWvPeRBCYOJv8QxPzVAaxDFwJ5A4DXw_CuRv0tIkt0Cgi9dMuP8u2S25Fm1bCZwey0ILigbev8YegqgjsxeaEm51URsYfiqY4AT9Nw69p-XwXPIyxSqaiu2_CB7NeNDhLZkIns3Xno94SrDGdFyKCyLEfV6dx3K_V6Iq9Vm5EMQkRLlGIGtqlJT0wLoMpPooAgg6PmWvEwBEeJVkvb0mNaygnuhmqehHkfkHUWkRHYIOqNo6ljxrbXEpY51WTMLQ4QyjRZ5CQ'
];

const teamDetailsMock = [
    { memberCount: 12, plusCount: 4 },
    { memberCount: 10, plusCount: 8 },
    { memberCount: 4, plusCount: 2 },
    { memberCount: 3, plusCount: 1 },
];


export default function ManageTeamsPage() {
    const router = useRouter();
    const { user } = useSupabaseAuth();
    const { toast } = useToast();
    const [teams, setTeams] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);

    useEffect(() => {
        const fetchTeams = async () => {
            if (user) {
                setIsLoading(true);
                const { data, error } = await supabase
                    .from('teams')
                    .select('id, team_name')
                    .eq('owner_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Error fetching teams:', error);
                    toast({
                        variant: 'destructive',
                        title: 'Error fetching teams',
                        description: error.message,
                    });
                } else if (data) {
                    setTeams(data);
                }
                setIsLoading(false);
            }
        };

        if (user) {
            fetchTeams();
        } else if (!user) {
            setIsLoading(false);
        }
    }, [user, toast]);

    const handleDeleteTeam = async () => {
        if (!teamToDelete) return;

        // Use { count: 'exact' } to get the number of deleted rows.
        const { error, count } = await supabase
            .from('teams')
            .delete({ count: 'exact' })
            .eq('id', teamToDelete.id);

        if (error) {
            console.error('Error deleting team:', error);
            toast({
                variant: 'destructive',
                title: 'Error Deleting Team',
                description: error.message,
            });
        } else if (count === 0) {
            // If count is 0, the delete didn't happen, likely due to RLS.
            console.error('Delete failed: No rows were deleted. Check RLS policies.');
            toast({
                variant: 'destructive',
                title: 'Deletion Failed',
                description: 'You may not have permission to delete this team. Please check security policies.',
            });
        }
        else {
            // Only update the UI if the delete was successful in the database.
            setTeams(teams.filter(team => team.id !== teamToDelete.id));
            toast({
                title: 'Team Deleted',
                description: `The team "${teamToDelete.team_name}" has been successfully deleted.`,
            });
        }
        setTeamToDelete(null);
    };

    return (
        <div className="mesh-background min-h-screen text-white font-display relative overflow-hidden">
            <div className={cn("min-h-screen transition-all", { "deep-blur opacity-50 pointer-events-none": teamToDelete })}>
                 <header className="pt-14 px-6 pb-8 flex items-center sticky top-0 z-30 bg-gradient-to-b from-[#1a0b2e] via-[#1a0b2e]/90 to-transparent">
                    <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full glass-panel text-white active:scale-95 transition-transform absolute left-6">
                        <span className="material-symbols-outlined text-2xl">chevron_left</span>
                    </button>
                    <div className="w-full flex justify-center">
                        <h1 className="text-xl font-bold tracking-tight">Manage Teams</h1>
                    </div>
                </header>
                <main className="px-6 pb-12 space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center items-center p-8">
                            <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        </div>
                    ) : teams.length === 0 ? (
                        <div className="glass-panel p-6 rounded-[2.5rem] text-center">
                            <p className="text-lavender-muted">You haven't created any teams to manage.</p>
                        </div>
                    ) : (
                        teams.map((team, index) => (
                            <div key={team.id} className="glass-panel p-6 rounded-[2.5rem] flex items-center justify-between">
                                <div className="flex flex-col gap-2">
                                    <h3 className="font-bold text-lg leading-tight">{team.team_name}</h3>
                                    <div className="flex items-center gap-2">
                                        <div className="flex -space-x-2">
                                            <div className="w-7 h-7 rounded-full border border-white/20 overflow-hidden">
                                                <Image alt="avatar" className="w-full h-full object-cover" src={mockAvatars[index % mockAvatars.length]} width={28} height={28}/>
                                            </div>
                                            <div className="w-7 h-7 rounded-full border border-white/20 overflow-hidden">
                                                <Image alt="avatar" className="w-full h-full object-cover" src={mockAvatars[(index + 1) % mockAvatars.length]} width={28} height={28} />
                                            </div>
                                            {teamDetailsMock[index % teamDetailsMock.length]?.plusCount > 0 && (
                                                <div className="w-7 h-7 rounded-full border border-white/20 bg-white/20 backdrop-blur-sm flex items-center justify-center text-[10px] font-bold">
                                                    +{teamDetailsMock[index % teamDetailsMock.length].plusCount}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-xs font-medium text-white/60">{teamDetailsMock[index % teamDetailsMock.length]?.memberCount || 0} members</span>
                                    </div>
                                </div>

                                <button onClick={() => setTeamToDelete(team)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-red-400 active:scale-90 transition-transform">
                                    <span className="material-symbols-outlined text-xl">delete</span>
                                </button>
                            </div>
                        ))
                    )}
                </main>
            </div>
            
            {teamToDelete && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/40 backdrop-blur-sm">
                    <div className="glass-modal w-full max-w-sm rounded-[3rem] p-8 flex flex-col items-center text-center">
                        <div className="w-20 h-20 mb-6 rounded-full glass-button-red flex items-center justify-center">
                            <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
                                <span className="material-symbols-outlined text-3xl text-white font-bold">priority_high</span>
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold mb-3 tracking-tight">Delete Team?</h2>
                        <p className="text-white/80 leading-relaxed mb-8 text-base">
                            Are you sure you want to delete the "{teamToDelete.team_name}" team? This action cannot be undone.
                        </p>
                        <div className="w-full space-y-3">
                            <button onClick={handleDeleteTeam} className="w-full py-4 rounded-2xl glass-button-red text-white font-bold text-lg active:scale-95 transition-transform">
                                Delete
                            </button>
                            <button onClick={() => setTeamToDelete(null)} className="w-full py-4 rounded-2xl glass-button-secondary text-white font-bold text-lg active:scale-95 transition-transform">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
