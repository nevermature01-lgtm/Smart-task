'use client';
import { useState, useEffect, useRef } from 'react';
import { useSupabaseAuth } from '@/context/SupabaseAuthProvider';
import { supabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTeam } from '@/context/TeamProvider';
import { getHumanAvatarSvg } from '@/lib/avatar';
import { format, parse } from 'date-fns';
import gsap from 'gsap';

type TeamDetails = {
  team_name: string;
  team_code: string;
  owner_id: string;
  owner_name: string | null;
};

type Task = {
  id: string;
  title: string;
  priority: number;
  due_date: string | null;
};

export default function HomePage() {
  const { user, isLoading } = useSupabaseAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { activeTeam: activeTeamId, isTeamLoading } = useTeam();
  const [teamDetails, setTeamDetails] = useState<TeamDetails | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [assignedByCount, setAssignedByCount] = useState(0);
  const [assignedToCount, setAssignedToCount] = useState(0);
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
          duration: 0.35,
          ease: 'power2.out',
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
      ease: 'power1.inOut',
      onComplete: () => router.push(path),
    });
  };
  
  const handleLogout = () => {
    handleRouteChange('/login');
    supabase.auth.signOut();
  };
  
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  useEffect(() => {
    if (isTeamLoading || isLoading) {
      return;
    }

    if (!activeTeamId || activeTeamId === 'personal') {
      setTeamDetails(null);
      return;
    }
    
    const fetchTeamData = async () => {
      const { data: teamsData, error: teamError } = await supabase
        .from('teams')
        .select('team_name, team_code, owner_id, owner_name')
        .eq('id', activeTeamId);
        
      if (teamError) {
        console.error("Error fetching team details:", teamError.message);
      } else {
        setTeamDetails(teamsData?.[0] ?? null);
      }
    };

    fetchTeamData();
  }, [activeTeamId, isTeamLoading, isLoading]);

  useEffect(() => {
    if (isLoading || !user) {
      if (!isLoading) {
        setTasksLoading(false);
      }
      return;
    }
  
    const fetchTaskData = async () => {
      setTasksLoading(true);

      const tasksPromise = supabase
        .from('tasks')
        .select('id, title, priority, due_date')
        .or(`assigned_by.eq.${user.id},assigned_to.eq.${user.id}`)
        .order('priority', { ascending: true });

      const assignedByPromise = supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_by', user.id);
        
      const assignedToPromise = supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', user.id);
        
      const [tasksResult, assignedByResult, assignedToResult] = await Promise.all([tasksPromise, assignedByPromise, assignedToPromise]);

      const { data: tasksData, error: tasksError } = tasksResult;
      if (tasksError) {
        console.error("Error fetching tasks:", tasksError);
        setTasks([]);
      } else if (tasksData) {
        setTasks(tasksData);
      }

      const { count: byCount, error: byError } = assignedByResult;
      if (byError) {
          console.error("Error fetching assigned by count:", byError);
          setAssignedByCount(0);
      } else {
          setAssignedByCount(byCount || 0);
      }
      
      const { count: toCount, error: toError } = assignedToResult;
      if (toError) {
          console.error("Error fetching assigned to count:", toError);
          setAssignedToCount(0);
      } else {
          setAssignedToCount(toCount || 0);
      }

      setTasksLoading(false);
    };
  
    fetchTaskData();
  }, [user, isLoading]);


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
    <div ref={containerRef}>
        {isMenuOpen && (
            <div className="fixed inset-0 z-[60] flex animate-in fade-in-0 duration-300">
                <aside className="w-[85%] max-w-[320px] h-full deep-glass flex flex-col relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                    <button onClick={toggleMenu} className="absolute top-14 right-6 w-10 h-10 flex items-center justify-center rounded-full glass-panel active:scale-95 transition-transform">
                        <span className="material-symbols-outlined text-xl text-white">close</span>
                    </button>
                    <div className="pt-20 px-8 pb-10">
                        <div className="w-16 h-16 rounded-full border-2 border-primary/60 p-1 mb-4 shadow-lg shadow-black/20 overflow-hidden">
                            {user ? (
                                <div
                                    style={{
                                        width: 56,
                                        height: 56,
                                        borderRadius: '50%',
                                        overflow: 'hidden',
                                    }}
                                    dangerouslySetInnerHTML={{ __html: getHumanAvatarSvg(String(user.id)) }}
                                />
                            ) : (
                                <div className="w-full h-full rounded-full bg-primary/20 flex items-center justify-center">
                                    <span className="text-2xl font-bold text-white">{displayName.charAt(0)}</span>
                                </div>
                            )}
                        </div>
                        <h2 className="text-xl font-bold text-white tracking-tight drop-shadow-sm">{displayName}</h2>
                    </div>
                    <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                        <a href="/home" onClick={(e) => {e.preventDefault(); handleRouteChange('/home')}} className="sidebar-item flex items-center gap-4 px-4 py-4 rounded-2xl bg-white/10 border border-white/10 shadow-sm">
                            <span className="material-symbols-outlined text-white">grid_view</span>
                            <span className="font-bold text-[15px] text-white">Dashboard</span>
                        </a>
                         <a href="/switch-account" onClick={(e) => {e.preventDefault(); handleRouteChange('/switch-account')}} className="sidebar-item flex items-center gap-4 px-4 py-4 rounded-2xl transition-all hover:bg-white/5">
                            <span className="material-symbols-outlined text-white/70">cached</span>
                            <span className="font-medium text-white/70 text-[15px]">Switch Account</span>
                        </a>
                        <a href="/teams" onClick={(e) => {e.preventDefault(); handleRouteChange('/teams')}} className="sidebar-item flex items-center gap-4 px-4 py-4 rounded-2xl transition-all hover:bg-white/5">
                            <span className="material-symbols-outlined text-white/70">hub</span>
                            <span className="font-medium text-white/70 text-[15px]">Team Workspace</span>
                        </a>
                        <a href="#" className="sidebar-item flex items-center gap-4 px-4 py-4 rounded-2xl transition-all hover:bg-white/5">
                            <span className="material-symbols-outlined text-white/70">query_stats</span>
                            <span className="font-medium text-white/70 text-[15px]">Project Analytics</span>
                        </a>
                        <a href="#" className="sidebar-item flex items-center gap-4 px-4 py-4 rounded-2xl transition-all hover:bg-white/5">
                            <span className="material-symbols-outlined text-white/70">contact_support</span>
                            <span className="font-medium text-white/70 text-[15px]">Support</span>
                        </a>
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
                <div className="w-10 h-10" />
            </header>
            <main className="px-6 pt-8 space-y-8 flex-1 pb-28">
                <section className="glass-panel p-6 rounded-3xl relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/5 blur-2xl rounded-full"></div>
                    <h2 className="text-2xl font-bold">Hello, {firstName}!</h2>
                    {assignedToCount > 0 ? (
                        <p className="text-lavender-muted mt-1 opacity-90">You have {assignedToCount} tasks to complete today.</p>
                    ) : assignedByCount > 0 ? (
                        <p className="text-lavender-muted mt-1 opacity-90">You have {assignedByCount} tasks to check today.</p>
                    ) : (
                        <p className="text-lavender-muted mt-1 opacity-90">You have no tasks today.</p>
                    )}
                </section>
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg">Ongoing Tasks</h3>
                        <button className="text-sm text-lavender-muted font-medium">View All</button>
                    </div>
                    {tasksLoading ? (
                        <div className="flex justify-center items-center p-8">
                            <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        </div>
                    ) : tasks.length > 0 ? (
                        <div>
                            {tasks.map((task) => (
                                <a key={task.id} href={`/tasks/${task.id}`} onClick={(e) => {e.preventDefault(); handleRouteChange(`/tasks/${task.id}`)}} className="block mb-8">
                                    <div className="glass-panel p-4 rounded-2xl flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center border border-white/10">
                                            <span className="material-symbols-outlined text-white leading-none">task</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-sm truncate">{task.title}</h4>
                                            <p className="text-xs text-lavender-muted opacity-80 mt-0.5">
                                                Priority: P{task.priority}
                                            </p>
                                        </div>
                                        <div className="px-3 py-1.5 rounded-full glass-panel bg-white/10 border-white/20">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                                                {task.due_date
                                                    ? format(parse(task.due_date, 'yyyy-MM-dd', new Date()), 'dd-MM-yyyy')
                                                    : 'No Due Date'}
                                            </span>
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    ) : (
                        <div className="glass-panel p-6 rounded-2xl text-center">
                            <p className="text-lavender-muted">No ongoing tasks found.</p>
                        </div>
                    )}
                </section>
            </main>
            <a href="/tasks/create" onClick={(e) => {e.preventDefault(); handleRouteChange('/tasks/create')}} className="fixed bottom-10 right-6 w-14 h-14 bg-primary rounded-full shadow-[0_8px_24px_rgba(86,29,201,0.5)] flex items-center justify-center text-white active:scale-90 transition-transform z-30">
                <span className="material-symbols-outlined text-3xl">add</span>
            </a>
        </div>
    </div>
  );
}
