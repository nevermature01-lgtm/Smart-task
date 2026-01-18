'use client';

import { useRouter } from 'next/navigation';
import { getHumanAvatarSvg } from '@/lib/avatar';

const members = [
    {
        id: 'alex-rivera',
        name: 'Alex Rivera',
        role: 'Admin',
    },
    {
        id: 'sarah-chen',
        name: 'Sarah Chen',
        role: 'Staff',
    },
    {
        id: 'jordan-smith',
        name: 'Jordan Smith',
        role: 'Staff',
    },
    {
        id: 'elena-rodriguez',
        name: 'Elena Rodriguez',
        role: 'Staff',
    },
    {
        id: 'marcus-thorne',
        name: 'Marcus Thorne',
        role: 'Staff',
    }
];


export default function ManageMembersPage() {
    const router = useRouter();

    return (
        <div className="font-display antialiased m-0 p-0 text-white mesh-background min-h-screen flex flex-col">
            <header className="pt-14 px-6 pb-6 flex items-center justify-between sticky top-0 z-30 bg-[#1a0b2e]/30 backdrop-blur-md">
                <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full glass-panel text-white active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-2xl leading-none">chevron_left</span>
                </button>
                <h1 className="text-xl font-bold tracking-tight text-white">Team Members</h1>
                <button className="w-10 h-10 flex items-center justify-center rounded-full glass-panel text-white active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-2xl leading-none">search</span>
                </button>
            </header>
            <main className="flex-1 px-6 pb-24 space-y-4 overflow-y-auto custom-scrollbar">
                {members.map((member) => (
                    <div key={member.id} className="glass-panel p-5 rounded-3xl space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full border-2 border-white/20 overflow-hidden shadow-sm flex-shrink-0">
                                 <div
                                    style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' }}
                                    dangerouslySetInnerHTML={{ __html: getHumanAvatarSvg(member.id) }}
                                />
                            </div>
                            <div className="flex flex-col flex-1">
                                <span className="font-bold text-lg text-white">{member.name}</span>
                                {member.role === 'Admin' ? (
                                     <span className="text-[10px] uppercase tracking-wider font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full w-fit">Admin</span>
                                ) : (
                                     <span className="text-[10px] uppercase tracking-wider font-bold bg-white/10 text-white/80 px-2 py-0.5 rounded-full w-fit">Staff</span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                             {member.role === 'Admin' ? (
                                <button className="flex-1 flex items-center justify-center gap-2 text-xs font-bold text-white py-2.5 rounded-xl glass-button-secondary active:scale-95 transition-all">
                                    <span className="material-symbols-outlined text-base">shield_person</span>
                                    Remove Admin
                                </button>
                             ) : (
                                <button className="flex-1 flex items-center justify-center gap-2 text-xs font-bold text-white py-2.5 rounded-xl glass-button-secondary active:scale-95 transition-all">
                                    <span className="material-symbols-outlined text-base">shield</span>
                                    Make Admin
                                </button>
                             )}
                            <button className="flex-1 flex items-center justify-center gap-2 text-xs font-bold text-red-400 py-2.5 rounded-xl glass-button-red active:scale-95 transition-all">
                                <span className="material-symbols-outlined text-base">person_remove</span>
                                Remove
                            </button>
                        </div>
                    </div>
                ))}
            </main>
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#1a0b2e] via-[#1a0b2e]/60 to-transparent pointer-events-none h-24"></div>
        </div>
    );
}
