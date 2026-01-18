'use client';
import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/context/SupabaseAuthProvider';
import { supabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTeam } from '@/context/TeamProvider';
import Avatar from 'boring-avatars';

type TeamDetails = {
  team_name: string;
  team_code: string;
  owner_id: string;
  owner_name: string | null;
};

type TeamMember = {
  id: string;
  role: string;
  full_name: string | null;
}

export default function HomePage() {
  const { user, isLoading } = useSupabaseAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { activeTeam: activeTeamId, isTeamLoading } = useTeam();
  const [teamDetails, setTeamDetails] = useState<TeamDetails | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };
  
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  useEffect(() => {
    if (isTeamLoading || isLoading) {
      return;
    }

    if (!activeTeamId || activeTeamId === 'personal') {
      setTeamDetails(null);
      setMembers([]);
      setIsLoadingMembers(false);
      return;
    }
    
    const fetchTeamData = async () => {
      setIsLoadingMembers(true);
      
      const { data: teamsData, error: teamError } = await supabase
        .from('teams')
        .select('team_name, team_code, owner_id, owner_name')
        .eq('id', activeTeamId);
        
      if (teamError) {
        console.error("Error fetching team details:", teamError.message);
      } else {
        setTeamDetails(teamsData?.[0] ?? null);
      }
      
      const { data: memberships, error: membershipError } = await supabase
        .from('team_members')
        .select('user_id, role')
        .eq('team_id', activeTeamId);

      if (membershipError || !memberships || memberships.length === 0) {
        if(membershipError && membershipError.message) console.error("Error fetching team members:", membershipError.message);
        setMembers([]);
        setIsLoadingMembers(false);
        return;
      }

      const userIds = memberships.map(m => m.user_id);
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, full_name')
        .in('id', userIds);

      if (usersError) {
        console.error("Error fetching users for team:", usersError.message);
        setMembers([]);
        setIsLoadingMembers(false);
        return;
      }

      const processedMembers = memberships.map(membership => {
        const userData = usersData.find(u => u.id === membership.user_id);
        return {
          id: membership.user_id,
          role: membership.role.charAt(0).toUpperCase() + membership.role.slice(1),
          full_name: userData?.full_name || 'Team Member',
        };
      });
      
      setMembers(processedMembers);
      setIsLoadingMembers(false);
    };

    fetchTeamData();
  }, [activeTeamId, isTeamLoading, isLoading]);


  if (isLoading || isTeamLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  
  const displayName = user?.user_metadata?.full_name || 'User';
  const firstName = user?.user_metadata?.first_name || 'User';

  return (
    <>
        {isMenuOpen && (
            <div className="fixed inset-0 z-[60] flex animate-in fade-in-0 duration-300">
                <aside className="w-[85%] max-w-[320px] h-full deep-glass flex flex-col relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                    <button onClick={toggleMenu} className="absolute top-14 right-6 w-10 h-10 flex items-center justify-center rounded-full glass-panel active:scale-95 transition-transform">
                        <span className="material-symbols-outlined text-xl text-white">close</span>
                    </button>
                    <div className="pt-20 px-8 pb-10">
                        <div className="w-16 h-16 rounded-full border-2 border-primary/60 p-1 mb-4 shadow-lg shadow-black/20 overflow-hidden">
                            {user ? (
                                <div style={{ width: 56, height: 56, borderRadius: '50%', overflow: 'hidden' }}>
                                    <Avatar
                                        size={56}
                                        name={String(user.id)}
                                        variant="beam"
                                        colors={["#6D28D9", "#7C3AED", "#8B5CF6", "#A78BFA", "#C4B5FD"]}
                                    />
                                </div>
                            ) : (
                                <div className="w-full h-full rounded-full bg-primary/20 flex items-center justify-center">
                                    <span className="text-2xl font-bold text-white">{displayName.charAt(0)}</span>
                                </div>
                            )}
                        </div>
                        <h2 className="text-xl font-bold text-white tracking-tight drop-shadow-sm">{displayName}</h2>
                    </div>
                    <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                        <Link href="/home" className="sidebar-item flex items-center gap-4 px-4 py-4 rounded-2xl bg-white/10 border border-white/10 shadow-sm">
                            <span className="material-symbols-outlined text-white">grid_view</span>
                            <span className="font-bold text-[15px] text-white">Dashboard</span>
                        </Link>
                         <Link href="/switch-account" className="sidebar-item flex items-center gap-4 px-4 py-4 rounded-2xl transition-all hover:bg-white/5">
                            <span className="material-symbols-outlined text-white/70">cached</span>
                            <span className="font-medium text-white/70 text-[15px]">Switch Account</span>
                        </Link>
                        <Link href="/teams" className="sidebar-item flex items-center gap-4 px-4 py-4 rounded-2xl transition-all hover:bg-white/5">
                            <span className="material-symbols-outlined text-white/70">hub</span>
                            <span className="font-medium text-white/70 text-[15px]">Team Workspace</span>
                        </Link>
                        <Link href="#" className="sidebar-item flex items-center gap-4 px-4 py-4 rounded-2xl transition-all hover:bg-white/5">
                            <span className="material-symbols-outlined text-white/70">query_stats</span>
                            <span className="font-medium text-white/70 text-[15px]">Project Analytics</span>
                        </Link>
                        <Link href="#" className="sidebar-item flex items-center gap-4 px-4 py-4 rounded-2xl transition-all hover:bg-white/5">
                            <span className="material-symbols-outlined text-white/70">contact_support</span>
                            <span className="font-medium text-white/70 text-[15px]">Support</span>
                        </Link>
                    </nav>
                    <div className="p-8">
                        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl logout-glass active:scale-95 transition-transform shadow-lg">
                            <span className="material-symbols-outlined text-red-400 font-bold">logout</span>
                            <span className="font-bold text-red-400">Logout</span>
                        </button>
                    </div>
                </aside>
                <div onClick={toggleMenu} className="flex-1 bg-black/40 backdrop-blur-md"></div>
            </div>
        )}

        <div className={cn(
          "relative flex h-full min-h-screen flex-col transition-all duration-300",
          { "opacity-30 grayscale-[0.5] scale-[0.98] pointer-events-none blur-sm": isMenuOpen }
        )}>
            <header className="pt-14 px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
                <button onClick={toggleMenu} className="w-10 h-10 flex items-center justify-center rounded-xl glass-panel text-white active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-xl">menu</span>
                </button>
                <div className="text-center">
                  {teamDetails ? (
                    <>
                      <h1 className="text-lg font-bold tracking-tight">{teamDetails.team_name}</h1>
                      <p className="text-xs text-lavender-muted">Code: {teamDetails.team_code}</p>
                    </>
                  ) : (
                    <h1 className="text-lg font-bold tracking-tight">Smart Task</h1>
                  )}
                </div>
                <button className="w-10 h-10 flex items-center justify-center rounded-xl glass-panel text-white active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-xl">notifications</span>
                </button>
            </header>
            <main className="px-6 pt-8 space-y-8 flex-1 pb-28">
                <section className="glass-panel p-6 rounded-3xl relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/5 blur-2xl rounded-full"></div>
                    <h2 className="text-2xl font-bold">Hello, {firstName}!</h2>
                    <p className="text-lavender-muted mt-1 opacity-90">You have 5 tasks to complete today.</p>
                </section>

                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg">Tasks Analytics</h3>
                        <div className="flex items-center gap-1 text-sm text-lavender-muted">
                            <span>This Week</span>
                            <span className="material-symbols-outlined text-sm leading-none">expand_more</span>
                        </div>
                    </div>
                    <div className="glass-panel p-6 rounded-3xl h-48 flex items-end justify-between gap-2">
                        <div className="flex flex-col items-center gap-3 flex-1">
                            <div className="w-full chart-bar rounded-t-lg h-12"></div>
                            <span className="text-[10px] text-lavender-muted uppercase font-bold">Mon</span>
                        </div>
                        <div className="flex flex-col items-center gap-3 flex-1">
                            <div className="w-full chart-bar rounded-t-lg h-24"></div>
                            <span className="text-[10px] text-lavender-muted uppercase font-bold">Tue</span>
                        </div>
                        <div className="flex flex-col items-center gap-3 flex-1">
                            <div className="w-full chart-bar rounded-t-lg h-16"></div>
                            <span className="text-[10px] text-lavender-muted uppercase font-bold">Wed</span>
                        </div>
                        <div className="flex flex-col items-center gap-3 flex-1">
                            <div className="w-full chart-bar-active rounded-t-lg h-32 shadow-[0_0_15px_rgba(86,29,201,0.3)]"></div>
                            <span className="text-[10px] text-white uppercase font-bold">Thu</span>
                        </div>
                        <div className="flex flex-col items-center gap-3 flex-1">
                            <div className="w-full chart-bar rounded-t-lg h-20"></div>
                            <span className="text-[10px] text-lavender-muted uppercase font-bold">Fri</span>
                        </div>
                        <div className="flex flex-col items-center gap-3 flex-1">
                            <div className="w-full chart-bar rounded-t-lg h-14"></div>
                            <span className="text-[10px] text-lavender-muted uppercase font-bold">Sat</span>
                        </div>
                        <div className="flex flex-col items-center gap-3 flex-1 opacity-40">
                          <div className="w-full chart-bar rounded-t-lg h-10"></div>
                          <span className="text-[10px] text-lavender-muted uppercase font-bold">Sun</span>
                        </div>
                    </div>
                </section>
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg">Ongoing Tasks</h3>
                        <button className="text-sm text-lavender-muted font-medium">View All</button>
                    </div>
                    <div className="space-y-3">
                        <div className="glass-panel p-4 rounded-2xl flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center border border-white/10">
                                <span className="material-symbols-outlined text-primary leading-none">palette</span>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-sm">Design System Update</h4>
                                <p className="text-xs text-lavender-muted opacity-80 mt-0.5">High Priority</p>
                            </div>
                            <div className="px-3 py-1.5 rounded-full glass-panel bg-primary/30 border-primary/20">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-white">In Progress</span>
                            </div>
                        </div>
                         <div className="glass-panel p-4 rounded-2xl flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center border border-white/10">
                                <span className="material-symbols-outlined text-orange-400 leading-none">api</span>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-sm">Revenue Analytics API</h4>
                                <p className="text-xs text-lavender-muted opacity-80 mt-0.5">Team Priority</p>
                            </div>
                            <div className="px-3 py-1.5 rounded-full glass-panel bg-orange-500/20 border-orange-500/20">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-200">Pending</span>
                            </div>
                        </div>
                    </div>
                </section>

                {activeTeamId !== 'personal' && (
                    <section>
                        <h3 className="font-bold text-lg mb-4">Team Members</h3>
                        {isLoadingMembers ? (
                             <div className="flex justify-center items-center p-8">
                                <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {members.length > 0 ? members.map(member => (
                                    <div key={member.id} className="glass-panel p-4 rounded-2xl flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full border-2 border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                                            <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden' }}>
                                                <Avatar
                                                    size={40}
                                                    name={String(member.id)}
                                                    variant="beam"
                                                    colors={["#6D28D9", "#7C3AED", "#8B5CF6", "#A78BFA", "#C4B5FD"]}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-sm">{member.full_name}</h4>
                                            <p className="text-xs text-lavender-muted opacity-80 mt-0.5">{member.role}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="glass-panel p-5 rounded-2xl text-center">
                                        <p className="text-lavender-muted">No members found for this team.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                )}

            </main>
            <Link href="/tasks/create" className="fixed bottom-10 right-6 w-14 h-14 bg-primary rounded-full shadow-[0_8px_24px_rgba(86,29,201,0.5)] flex items-center justify-center text-white active:scale-90 transition-transform z-30">
                <span className="material-symbols-outlined text-3xl">add</span>
            </Link>
        </div>
    </>
  );
}
