'use client';

import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
    const router = useRouter();

    return (
        <div className="mesh-background min-h-screen flex flex-col">
            <header className="pt-14 px-6 pb-4 flex items-center justify-between sticky top-0 z-30 bg-gradient-to-b from-[#1a0b2e] via-[#1a0b2e]/90 to-transparent">
                <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full glass-panel text-white active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-2xl">chevron_left</span>
                </button>
                <h1 className="text-xl font-bold tracking-tight">Notifications</h1>
                <div className="w-10 h-10"></div>
            </header>
            <main className="flex-1 px-6 py-4 overflow-y-auto custom-scrollbar pb-32">
                <div className="glass-panel p-8 rounded-3xl text-center flex flex-col items-center gap-4">
                    <span className="material-symbols-outlined text-4xl text-white/50">notifications_off</span>
                    <p className="text-lavender-muted">You have no notifications yet.</p>
                </div>
            </main>
        </div>
    );
}
