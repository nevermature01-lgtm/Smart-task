'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SwitchAccountPage() {
    const router = useRouter();

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
                            <span className="material-symbols-outlined text-primary text-3xl">group_add</span>
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
                        <div className="glass-panel p-5 rounded-[2rem] flex items-center gap-4 active:bg-white/10 transition-colors">
                            <div className="w-12 h-12 rounded-full border-2 border-primary/30 flex items-center justify-center bg-gradient-to-br from-primary/40 to-transparent shrink-0">
                                <span className="material-symbols-outlined">auto_awesome</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-base truncate">Smart Decor</h4>
                                <p className="text-xs text-lavender-muted opacity-80 mt-0.5">Admin</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="px-3 py-1.5 rounded-full glass-panel bg-green-500/10 border-green-500/20">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-green-400">Active</span>
                                </div>
                                <span className="material-symbols-outlined text-lavender-muted/50 text-lg">chevron_right</span>
                            </div>
                        </div>
                        <div className="glass-panel p-5 rounded-[2rem] flex items-center gap-4 active:bg-white/10 transition-colors">
                            <div className="w-12 h-12 rounded-full border-2 border-white/10 flex items-center justify-center bg-white/5 shrink-0">
                                <span className="material-symbols-outlined">rocket_launch</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-base truncate">Project Alpha</h4>
                                <p className="text-xs text-lavender-muted opacity-80 mt-0.5">Manager</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-lavender-muted/50 text-lg">chevron_right</span>
                            </div>
                        </div>
                        <div className="glass-panel p-5 rounded-[2rem] flex items-center gap-4 active:bg-white/10 transition-colors">
                            <div className="w-12 h-12 rounded-full border-2 border-white/10 flex items-center justify-center bg-white/5 shrink-0">
                                <span className="material-symbols-outlined">brush</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-base truncate">Design Studio</h4>
                                <p className="text-xs text-lavender-muted opacity-80 mt-0.5">Contributor</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-lavender-muted/50 text-lg">chevron_right</span>
                            </div>
                        </div>
                        <div className="glass-panel p-5 rounded-[2rem] flex items-center gap-4 active:bg-white/10 transition-colors">
                            <div className="w-12 h-12 rounded-full border-2 border-white/10 flex items-center justify-center bg-white/5 shrink-0">
                                <span className="material-symbols-outlined">campaign</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-base truncate">Marketing Sync</h4>
                                <p className="text-xs text-lavender-muted opacity-80 mt-0.5">Viewer</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-lavender-muted/50 text-lg">chevron_right</span>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}