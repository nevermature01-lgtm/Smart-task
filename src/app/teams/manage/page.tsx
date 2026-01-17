'use client';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/context/SupabaseAuthProvider';
import { supabase } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
    const [teams, setTeams] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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
    }, [user]);

    const handleDeleteTeam = async (teamId: string) => {
        const { error } = await supabase
            .from('teams')
            .delete()
            .eq('id', teamId);

        if (error) {
            console.error('Error deleting team:', error);
            // Optionally, show a toast notification for the error
        } else {
            setTeams(teams.filter(team => team.id !== teamId));
            // Optionally, show a success toast
        }
    };

    return (
        <div className="mesh-background min-h-screen text-white font-display">
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

                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                     <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white active:scale-90 transition-transform">
                                        <span className="material-symbols-outlined text-xl">delete</span>
                                    </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="text-white border-white/20 bg-[#1a0b2e]/80 backdrop-blur-md">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription className="text-lavender-muted/80">
                                            This action cannot be undone. This will permanently delete the "{team.team_name}" team and all of its data.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="border-t-0 pt-4">
                                        <AlertDialogCancel className="bg-transparent border border-white/20 text-white hover:bg-white/10 hover:text-white mt-0">Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteTeam(team.id)} className="bg-red-600 hover:bg-red-600/80 text-white">Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    ))
                )}
            </main>
        </div>
    );
}
