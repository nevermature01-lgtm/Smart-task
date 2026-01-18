'use client';

import { useRouter } from 'next/navigation';
import { getHumanAvatarSvg } from '@/lib/avatar';

export default function TaskDetailsPage({ params }: { params: { id: string } }) {
    const router = useRouter();

    const assignee = {
        name: 'Alex Rivera',
        avatarSeed: params.id + '-assignee',
    };
    const teamMembers = [
        { avatarSeed: params.id + '-member-1' },
        { avatarSeed: params.id + '-member-2' },
    ];

    return (
        <div className="font-display antialiased m-0 p-0 text-white mesh-background min-h-screen flex flex-col">
            <header className="pt-14 px-6 pb-4 flex items-center justify-between sticky top-0 z-30 bg-[#1a0b2e]/40 backdrop-blur-md">
                <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full glass-panel text-white active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-2xl">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold tracking-tight">Task Details</h1>
                <div className="flex items-center gap-2">
                    <button className="w-10 h-10 flex items-center justify-center rounded-full glass-panel text-white active:scale-95 transition-transform">
                        <span className="material-symbols-outlined text-xl">edit</span>
                    </button>
                    <button className="w-10 h-10 flex items-center justify-center rounded-full glass-panel text-red-400 active:scale-95 transition-transform border-red-500/20">
                        <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                </div>
            </header>
            <main className="flex-1 px-4 py-4 overflow-y-auto custom-scrollbar pb-32">
                <div className="glass-panel rounded-[2.5rem] p-6 shadow-2xl bg-white/10 border-white/20 flex flex-col">
                    <div className="space-y-8">
                        <section className="space-y-5">
                            <div className="flex items-center gap-3">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 glass-panel rounded-full border-white/30">
                                    <div className="w-6 h-6 rounded-full overflow-hidden border border-white/40">
                                        <div
                                            style={{ width: 24, height: 24, borderRadius: '50%' }}
                                            dangerouslySetInnerHTML={{ __html: getHumanAvatarSvg(assignee.avatarSeed) }}
                                        />
                                    </div>
                                    <span className="text-sm font-medium">{assignee.name}</span>
                                </div>
                                <button className="flex items-center gap-1.5 px-3 py-1.5 glass-panel rounded-full border-white/20 active:scale-95 transition-transform hover:bg-white/10">
                                    <span className="material-symbols-outlined text-[16px]">person_add</span>
                                    <span className="text-[11px] font-semibold tracking-wide">Reassign</span>
                                </button>
                            </div>
                        </section>
                        <section className="flex items-center gap-4">
                            <div className="flex items-center gap-2 glass-panel px-4 py-2 rounded-2xl border-white/10">
                                <span className="material-symbols-outlined text-lavender-muted text-lg">calendar_today</span>
                                <span className="text-sm font-medium">Jan 24, 2026</span>
                            </div>
                            <div className="flex items-center gap-2 glass-panel px-4 py-2 rounded-full border-white/20 priority-glow bg-white/10">
                                <span className="text-xs font-bold text-white uppercase tracking-tighter">P1</span>
                                <span className="text-[10px] opacity-70">Priority</span>
                            </div>
                        </section>
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-lavender-muted px-1">Steps</h3>
                                <span className="text-xs font-medium text-white/50">2/2 Complete</span>
                            </div>
                            <div className="space-y-3">
                                <div className="glass-panel px-4 py-3 rounded-2xl border-white/10 flex items-center justify-between">
                                    <span className="text-sm font-medium">Sketch Layout</span>
                                    <span className="material-symbols-outlined text-success text-xl">check_circle</span>
                                </div>
                                <div className="glass-panel px-4 py-3 rounded-2xl border-white/10 flex items-center justify-between">
                                    <span className="text-sm font-medium">Color Palette</span>
                                    <span className="material-symbols-outlined text-success text-xl">check_circle</span>
                                </div>
                            </div>
                        </section>
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-lavender-muted px-1">Checklist</h3>
                                <span className="text-xs font-medium text-white/50">0/1 Complete</span>
                            </div>
                            <div className="space-y-3">
                                <div className="glass-panel px-4 py-3 rounded-2xl border-white/10 flex items-center gap-3">
                                    <div className="w-5 h-5 border-2 border-white/30 rounded-md"></div>
                                    <span className="text-sm font-medium">Review Assets</span>
                                </div>
                            </div>
                        </section>
                        <section className="pt-4">
                            <div className="relative w-full h-16 swipe-track rounded-full p-1.5 flex items-center">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-sm font-bold uppercase tracking-widest text-white/30 pointer-events-none">Swipe to Complete</span>
                                </div>
                                <div className="h-[52px] w-[52px] aspect-square glass-panel bg-success/30 border-white/20 rounded-full flex items-center justify-center shadow-lg cursor-pointer">
                                    <span className="material-symbols-outlined text-white text-2xl">keyboard_double_arrow_right</span>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </main>
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#1a0b2e] via-[#1a0b2e]/95 to-transparent z-40">
                <button className="w-full flex items-center justify-between px-6 py-4 glass-panel rounded-2xl border-white/20 active:scale-95 transition-transform fab-glow">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <span className="material-symbols-outlined text-2xl text-white">chat_bubble</span>
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full border border-white/50"></span>
                        </div>
                        <span className="text-sm font-semibold tracking-wide">Team Discussion</span>
                    </div>
                    <div className="flex -space-x-2">
                        {teamMembers.map((member, index) => (
                             <div key={index} className="w-6 h-6 rounded-full border border-white/20 overflow-hidden">
                                <div
                                    style={{ width: 24, height: 24, borderRadius: '50%' }}
                                    dangerouslySetInnerHTML={{ __html: getHumanAvatarSvg(member.avatarSeed) }}
                                />
                            </div>
                        ))}
                        <div className="w-6 h-6 rounded-full glass-panel border border-white/20 flex items-center justify-center text-[10px] font-bold">
                            +3
                        </div>
                    </div>
                </button>
            </div>
        </div>
    );
}
