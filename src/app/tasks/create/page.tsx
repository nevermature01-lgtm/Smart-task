'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/context/SupabaseAuthProvider';
import { supabase } from '@/lib/supabase/client';
import { useTeam } from '@/context/TeamProvider';
import Image from 'next/image';
import { cn } from '@/lib/utils';

type Profile = {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
}

export default function CreateTaskPage() {
    const router = useRouter();
    const { user, isLoading: isAuthLoading } = useSupabaseAuth();
    const { activeTeam, isLoading: isTeamLoading } = useTeam();
    const [members, setMembers] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchMembers = async () => {
            if (isTeamLoading || !user) return;
            
            setIsLoading(true);
            let profiles: Profile[] = [];

            if (activeTeam === 'personal') {
                // In personal workspace, only the user themselves can be assigned.
                 if (user) {
                    profiles = [{
                        id: user.id,
                        full_name: user.user_metadata?.full_name || 'Personal Account',
                        avatar_url: user.user_metadata?.avatar_url || null,
                    }];
                }
            } else {
                // In a team, fetch all members of that team.
                const { data, error } = await supabase
                    .from('team_members')
                    .select('profiles(id, full_name, avatar_url)')
                    .eq('team_id', activeTeam);

                if (error) {
                    console.error("Error fetching team members:", error);
                } else if (data) {
                    profiles = data.map(item => item.profiles).filter((p): p is Profile => p !== null);
                }
            }
            setMembers(profiles);
            // If there's only one member (personal workspace), auto-select them.
            if(profiles.length === 1) {
                setSelectedAssigneeId(profiles[0].id);
            }
            setIsLoading(false);
        };

        if (user) {
            fetchMembers();
        } else if (!isAuthLoading) {
            setIsLoading(false);
        }
    }, [user, activeTeam, isTeamLoading, isAuthLoading]);

    useEffect(() => {
        if(showSearch) {
            searchInputRef.current?.focus();
        } else {
            setSearchTerm('');
        }
    }, [showSearch])

    const handleContinue = () => {
        if (selectedAssigneeId) {
            router.push(`/tasks/create/details?assigneeId=${selectedAssigneeId}`);
        }
    };
    
    const pageLoading = isLoading || isAuthLoading || isTeamLoading;

    const filteredMembers = members.filter(member => 
        member.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="mesh-background min-h-screen flex flex-col">
            <header className="pt-14 px-6 pb-4 flex items-center justify-between sticky top-0 z-30 bg-[#1a0b2e]/60 backdrop-blur-md">
                <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full glass-panel text-white active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-2xl">chevron_left</span>
                </button>
                
                {showSearch ? (
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search member..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-10 px-4 flex-1 mx-4 rounded-xl glass-input text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/40 bg-transparent"
                    />
                ) : (
                    <h1 className="text-xl font-bold tracking-tight">Create Task</h1>
                )}

                <button onClick={() => setShowSearch(!showSearch)} className="w-10 h-10 flex items-center justify-center rounded-full glass-panel text-white active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-2xl">{showSearch ? 'close' : 'search'}</span>
                </button>
            </header>
            
            <div className="px-6 py-4">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-white/50">Assign Task to:</h2>
            </div>
            <main className="flex-1 px-6 pb-32 space-y-3 overflow-y-auto custom-scrollbar">
                {pageLoading ? (
                    <div className="flex justify-center items-center h-full pt-16">
                        <div className="w-8 h-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                ) : filteredMembers.length > 0 ? (
                    filteredMembers.map((member) => (
                        <button 
                            key={member.id}
                            onClick={() => setSelectedAssigneeId(member.id)}
                            className={cn("w-full text-left glass-panel p-4 rounded-2xl flex items-center justify-between transition-all active:scale-[0.98]", {
                                "border-primary/80 bg-white/20 ring-2 ring-primary": selectedAssigneeId === member.id,
                                "active:bg-white/5 border-transparent": selectedAssigneeId !== member.id,
                            })}
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn("w-12 h-12 rounded-full border-2 overflow-hidden shrink-0", {
                                    "border-primary": selectedAssigneeId === member.id,
                                    "border-white/20": selectedAssigneeId !== member.id,
                                })}>
                                    <Image alt={member.full_name || 'avatar'} className="w-full h-full object-cover" src={member.avatar_url || `https://i.pravatar.cc/150?u=${member.id}`} width={48} height={48}/>
                                </div>
                                <span className={cn("font-bold text-base", { "text-white": selectedAssigneeId === member.id, "text-white/90": selectedAssigneeId !== member.id})}>{member.full_name}</span>
                            </div>
                            <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0", {
                                "border-primary": selectedAssigneeId === member.id,
                                "border-white/30": selectedAssigneeId !== member.id,
                            })}>
                                {selectedAssigneeId === member.id && <div className="w-3 h-3 rounded-full bg-primary" />}
                            </div>
                        </button>
                    ))
                ) : (
                    <div className="text-center text-lavender-muted pt-16">
                        <p>No members found.</p>
                        {searchTerm && <p className="text-sm mt-2">Try adjusting your search.</p>}
                    </div>
                )}
            </main>
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#1a0b2e] via-[#1a0b2e]/90 to-transparent shrink-0">
                <button 
                    onClick={handleContinue} 
                    disabled={!selectedAssigneeId || filteredMembers.length === 0}
                    className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    Continue
                    <span className="material-symbols-outlined text-xl">arrow_forward</span>
                </button>
            </div>
        </div>
    );
}
