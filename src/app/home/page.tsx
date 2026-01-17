'use client';
import { useUser } from '@/firebase';
import { getAuth, signOut } from 'firebase/auth';

export default function HomePage() {
  const { user, isLoading } = useUser();
  const auth = getAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // The central AuthManager will detect the sign-out and redirect to /login.
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center mesh-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  
  const firstName = user?.displayName?.split(' ')[0] || 'User';

  return (
    <div className="font-display antialiased text-white mesh-background min-h-screen">
        <div className="relative flex flex-col pb-28">
            <header className="pt-14 px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
                <button className="w-10 h-10 flex items-center justify-center rounded-xl glass-panel text-white active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-xl">menu</span>
                </button>
                <h1 className="text-lg font-bold tracking-tight">Smart Task</h1>
                <button onClick={handleLogout} className="w-10 h-10 flex items-center justify-center rounded-xl glass-panel text-white active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-xl">logout</span>
                </button>
            </header>
            <main className="px-6 pt-8 space-y-8">
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
                        <div className="flex flex-col items-center gap-3 flex-1">
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
            </main>
            <button className="fixed bottom-32 right-6 w-14 h-14 bg-primary rounded-full shadow-[0_8px_24px_rgba(86,29,201,0.5)] flex items-center justify-center text-white active:scale-90 transition-transform z-30">
                <span className="material-symbols-outlined text-3xl">add</span>
            </button>
            <nav className="fixed bottom-8 left-6 right-6 h-20 glass-panel rounded-3xl flex items-center justify-around px-4 z-40">
                <button className="flex flex-col items-center gap-1 nav-active">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Home</span>
                </button>
                <button className="flex flex-col items-center gap-1 text-lavender-muted/60">
                    <span className="material-symbols-outlined text-2xl">check_circle</span>
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Tasks</span>
                </button>
                <button className="flex flex-col items-center gap-1 text-lavender-muted/60">
                    <span className="material-symbols-outlined text-2xl">group</span>
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Teams</span>
                </button>
                <button className="flex flex-col items-center gap-1 text-lavender-muted/60">
                    <span className="material-symbols-outlined text-2xl">settings</span>
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Settings</span>
                </button>
            </nav>
        </div>
    </div>
  );
}
