'use client';

export default function CreateTaskDetailsPage() {
    return (
        <div className="font-display antialiased m-0 p-0 text-white mesh-background min-h-screen flex flex-col">
            <header className="pt-14 px-6 pb-4 flex items-center justify-between sticky top-0 z-30 bg-[#1a0b2e]/40 backdrop-blur-md">
                <button className="w-10 h-10 flex items-center justify-center rounded-full glass-panel text-white active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-2xl">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold tracking-tight">Create Task</h1>
                <button className="w-10 h-10 flex items-center justify-center rounded-full glass-panel text-white active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-2xl">search</span>
                </button>
            </header>
            <main className="flex-1 px-4 py-4 overflow-y-auto custom-scrollbar pb-32">
                <div className="glass-panel rounded-[2.5rem] p-6 shadow-2xl space-y-8 bg-white/10 border-white/20">
                    <section className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 px-1">Assign To</h3>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 glass-panel rounded-full border-white/30">
                            <div className="w-6 h-6 rounded-full overflow-hidden border border-white/40">
                                <img alt="avatar" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC7P8HUUkmQKSXWyZjs2yvuNkxhSxWLhsWTJcYqUxEjInv2mZM932tu1CUiNltjsAdKK3cmKHL5au4LI9QZL_eF_dKxJLDVeT0DZVjwlH9ATGoEx2rrGremzUA0iRjrRbMfDyCZfaffzh-DfnVNoaan-0Cm-EuQioNOFL4l0lo2pGP6ZhI6Ymj7F_EsQjskvPXnLN2xtST2PZHulqIe_7twd_TQ5CdaTYlspIdOJqNVcFaQCLnImCaB7XQhXMS0LWRjNhGtVPUNGBTJ"/>
                            </div>
                            <span className="text-sm font-medium">Alex Rivera</span>
                            <span className="material-symbols-outlined text-xs text-white/60">close</span>
                        </div>
                    </section>
                    <section className="space-y-6">
                        <div className="relative group">
                            <label className="text-xs font-bold uppercase tracking-widest text-white/50 px-1">Task Name</label>
                            <input className="w-full bg-transparent border-t-0 border-l-0 border-r-0 border-b-2 border-white/20 focus:border-white focus:ring-0 text-white font-semibold text-lg py-2 placeholder-white/30" placeholder="Enter task name..." type="text" defaultValue="Redesign Mobile App"/>
                        </div>
                        <div className="relative group">
                            <label className="text-xs font-bold uppercase tracking-widest text-white/50 px-1">Description</label>
                            <textarea className="w-full bg-transparent border-t-0 border-l-0 border-r-0 border-b-2 border-white/20 focus:border-white focus:ring-0 text-white/90 text-sm py-2 resize-none placeholder-white/30" placeholder="Add more details about this task..." rows={2} defaultValue="Establish a new visual language for the task creation flow using glassmorphism effects."></textarea>
                        </div>
                    </section>
                    <section className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 px-1">Steps</h3>
                                <button className="w-6 h-6 flex items-center justify-center rounded-full glass-panel text-white/70">
                                    <span className="material-symbols-outlined text-sm">add</span>
                                </button>
                            </div>
                            <div className="space-y-2">
                                <div className="glass-panel px-3 py-2 rounded-xl text-[10px] font-medium border-white/10">Sketch Layout</div>
                                <div className="glass-panel px-3 py-2 rounded-xl text-[10px] font-medium border-white/10">Color Palette</div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 px-1">Checklist</h3>
                                <button className="w-6 h-6 flex items-center justify-center rounded-full glass-panel text-white/70">
                                    <span className="material-symbols-outlined text-sm">add</span>
                                </button>
                            </div>
                            <div className="space-y-2">
                                <div className="glass-panel px-3 py-2 rounded-xl text-[10px] font-medium border-white/10 flex items-center gap-2">
                                    <div className="w-3 h-3 border border-white/40 rounded-sm"></div>
                                    <span>Review Assets</span>
                                </div>
                            </div>
                        </div>
                    </section>
                    <section className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 px-1">Priority</h3>
                        <div className="flex justify-center py-2">
                            <div className="relative flex items-center glass-panel h-20 w-full rounded-full p-2 border-white/10">
                                <div className="flex items-center gap-4 px-4 overflow-x-auto hide-scrollbar w-full snap-x snap-mandatory">
                                    <div className="flex-shrink-0 snap-center relative flex items-center justify-center w-14 h-14">
                                        <div className="absolute inset-0 priority-oval bg-white/30 rounded-full border border-white/40 shadow-inner"></div>
                                        <span className="relative z-10 text-xl font-bold">1</span>
                                    </div>
                                    <div className="flex-shrink-0 snap-center flex items-center justify-center w-14 h-14 opacity-40">
                                        <span className="text-xl font-bold">2</span>
                                    </div>
                                    <div className="flex-shrink-0 snap-center flex items-center justify-center w-14 h-14 opacity-40">
                                        <span className="text-xl font-bold">3</span>
                                    </div>
                                    <div className="flex-shrink-0 snap-center flex items-center justify-center w-14 h-14 opacity-40">
                                        <span className="text-xl font-bold">4</span>
                                    </div>
                                    <div className="flex-shrink-0 snap-center flex items-center justify-center w-14 h-14 opacity-40">
                                        <span className="text-xl font-bold">5</span>
                                    </div>
                                    <div className="flex-shrink-0 snap-center flex items-center justify-center w-14 h-14 opacity-40">
                                        <span className="text-xl font-bold">6</span>
                                    </div>
                                    <div className="flex-shrink-0 snap-center flex items-center justify-center w-14 h-14 opacity-40">
                                        <span className="text-xl font-bold">7</span>
                                    </div>
                                    <div className="flex-shrink-0 snap-center flex items-center justify-center w-14 h-14 opacity-40">
                                        <span className="text-xl font-bold">8</span>
                                    </div>
                                    <div className="flex-shrink-0 snap-center flex items-center justify-center w-14 h-14 opacity-40">
                                        <span className="text-xl font-bold">9</span>
                                    </div>
                                    <div className="flex-shrink-0 snap-center flex items-center justify-center w-14 h-14 opacity-40">
                                        <span className="text-xl font-bold">10</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#1a0b2e] via-[#1a0b2e]/90 to-transparent z-40">
                <button className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/40 active:scale-95 transition-transform flex items-center justify-center gap-2 border border-white/10">
                    Create Task
                    <span className="material-symbols-outlined text-xl">done_all</span>
                </button>
            </div>
        </div>
    );
}
