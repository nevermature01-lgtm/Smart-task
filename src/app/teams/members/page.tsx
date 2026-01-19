'use client';

import { useRouter } from 'next/navigation';
import { getHumanAvatarSvg } from '@/lib/avatar';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTeam } from '@/context/TeamProvider';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '@/context/SupabaseAuthProvider';
import gsap from 'gsap';

type Member = {
    id: string;
    full_name: string;
    role: string;
};

export default function ManageMembersPage() {
    const router = useRouter();
    const { user } = useSupabaseAuth();
    const { activeTeam: activeTeamId, isLoading: isTeamLoading } = useTeam();
    const { toast } = useToast();
    const containerRef = useRef(null);
    
    const [members, setMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
    const [currentUserIsAdmin, setCurrentUserIsAdmin] = useState(false);
    const [isUpdatingRole, setIsUpdatingRole] = useState(false);

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
        duration: 0.25,
        ease: 'power1.inOut',
        onComplete: () => router.push(path),
      });
    };
    
    const handleRouteBack = () => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            router.back();
            return;
        }
        gsap.to(containerRef.current, {
            opacity: 0,
            y: -8,
            duration: 0.25,
            ease: 'power1.inOut',
            onComplete: () => router.back(),
        });
    };

    const fetchTeamData = useCallback(async () => {
        if (!activeTeamId || activeTeamId === 'personal' || !user) return;
        setIsLoading(true);

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            toast({ variant: 'destructive', title: 'Authentication Error' });
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(`/api/team/members?teamId=${activeTeamId}`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                toast({
                    variant: 'destructive',
                    title: 'Error Loading Members',
                    description: errorData.error || 'Could not fetch team members.'
                });
                setMembers([]);
                setCurrentUserIsAdmin(false);
                return;
            }

            const data: Member[] = await response.json();
            setMembers(data);
            
            const currentUserMembership = data.find(m => m.id === user.id);
            setCurrentUserIsAdmin(currentUserMembership?.role === 'admin' || currentUserMembership?.role === 'owner');

        } catch (e: any) {
            console.error("Error fetching team data:", e);
            toast({ variant: 'destructive', title: 'Failed to load team.' });
        } finally {
            setIsLoading(false);
        }
    }, [activeTeamId, user, toast]);

    useEffect(() => {
        if (isTeamLoading || !user) return;

        if (!activeTeamId || activeTeamId === 'personal') {
            toast({
                variant: 'destructive',
                title: 'No Team Selected',
                description: 'You must select a team to manage its members.',
            });
            handleRouteChange('/teams');
            return;
        }

        fetchTeamData();
    }, [activeTeamId, isTeamLoading, router, toast, user, fetchTeamData]);

    useEffect(() => {
        if (!searchQuery) {
            setFilteredMembers(members);
        } else {
            setFilteredMembers(
                members.filter(member =>
                    member.full_name.toLowerCase().includes(searchQuery.toLowerCase())
                )
            );
        }
    }, [searchQuery, members]);

    const toggleSearch = () => {
        setIsSearchVisible(!isSearchVisible);
        if (isSearchVisible) {
            setSearchQuery('');
        }
    };

    const handleMakeAdmin = async (memberId: string) => {
        if (!activeTeamId || !currentUserIsAdmin) {
            toast({
                variant: 'destructive',
                title: 'Permission Denied',
                description: 'You do not have permission to perform this action.',
            });
            return;
        }
        setIsUpdatingRole(true);
        
        const { data: { session } } = await supabase.auth.getSession();

        try {
            const response = await fetch('/api/team/make-admin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({ teamId: activeTeamId, targetUserId: memberId }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to promote member.');
            }

            toast({
                title: 'Member Promoted',
                description: 'The user has been promoted to admin.',
            });
            await fetchTeamData();
        } catch (e: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to Promote Member',
                description: e.message,
            });
        } finally {
            setIsUpdatingRole(false);
        }
    };

    const handleRemoveAdmin = async (memberId: string) => {
        if (!activeTeamId || !currentUserIsAdmin) {
            toast({
                variant: 'destructive',
                title: 'Permission Denied',
                description: 'You do not have permission to perform this action.',
            });
            return;
        }
        setIsUpdatingRole(true);

        const { data: { session } } = await supabase.auth.getSession();
        
        try {
            const response = await fetch('/api/team/remove-admin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({ teamId: activeTeamId, targetUserId: memberId }),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to demote member.');
            }

            toast({
                title: 'Member Demoted',
                description: 'The user is no longer an admin.',
            });
            await fetchTeamData();
        } catch (e: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to Demote Member',
                description: e.message,
            });
        } finally {
            setIsUpdatingRole(false);
        }
    };


    return (
        <div ref={containerRef} className="font-display antialiased m-0 p-0 text-white mesh-background min-h-screen flex flex-col">
            <header className="pt-14 px-6 pb-6 flex items-center justify-between sticky top-0 z-30">
                <button onClick={handleRouteBack} className="w-10 h-10 flex items-center justify-center rounded-full glass-panel text-white active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-2xl leading-none">chevron_left</span>
                </button>
                
                {isSearchVisible ? (
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search members..."
                        className="flex-1 mx-4 px-4 py-2 rounded-xl glass-input text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/40"
                        autoFocus
                    />
                ) : (
                    <h1 className="text-xl font-bold tracking-tight text-white">Team Members</h1>
                )}

                <button onClick={toggleSearch} className="w-10 h-10 flex items-center justify-center rounded-full glass-panel text-white active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-2xl leading-none">
                        {isSearchVisible ? 'close' : 'search'}
                    </span>
                </button>
            </header>
            <main className="flex-1 px-6 pb-24 space-y-4 overflow-y-auto custom-scrollbar">
                {isLoading ? (
                    <div className="flex justify-center items-center p-8">
                        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                ) : filteredMembers.length === 0 ? (
                    <div className="glass-panel p-6 rounded-3xl text-center">
                        <p className="text-lavender-muted">{searchQuery ? 'No members found.' : 'No members found for this team.'}</p>
                    </div>
                ) : (
                    filteredMembers.map((member) => (
                        <div key={member.id} className="glass-panel p-5 rounded-3xl space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full border-2 border-white/20 overflow-hidden shadow-sm flex-shrink-0">
                                     <div
                                        style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' }}
                                        dangerouslySetInnerHTML={{ __html: getHumanAvatarSvg(member.id) }}
                                    />
                                </div>
                                <div className="flex flex-col flex-1">
                                    <span className="font-bold text-lg text-white">{member.full_name}</span>
                                    {(member.role === 'owner' || member.role === 'admin') ? (
                                         <span className="text-[10px] uppercase tracking-wider font-bold bg-amber-400/20 text-amber-400 px-2 py-0.5 rounded-full w-fit">Admin</span>
                                    ) : (
                                         <span className="text-[10px] uppercase tracking-wider font-bold bg-white/10 text-white/80 px-2 py-0.5 rounded-full w-fit">MEMBER</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                 {member.role === 'owner' ? (
                                    <button disabled className="flex-1 flex items-center justify-center gap-2 text-xs font-bold text-white py-2.5 rounded-xl glass-button-secondary opacity-50 cursor-not-allowed">
                                        <span className="material-symbols-outlined text-base">shield_person</span>
                                        Owner
                                    </button>
                                 ) : member.role === 'admin' ? (
                                    <button 
                                        onClick={() => handleRemoveAdmin(member.id)}
                                        disabled={!currentUserIsAdmin || isLoading || isUpdatingRole}
                                        className="flex-1 flex items-center justify-center gap-2 text-xs font-bold text-white py-2.5 rounded-xl glass-button-secondary active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                        <span className="material-symbols-outlined text-base">shield_person</span>
                                        Remove Admin
                                    </button>
                                 ) : (
                                    <button 
                                        onClick={() => handleMakeAdmin(member.id)}
                                        disabled={!currentUserIsAdmin || isLoading || isUpdatingRole}
                                        className="flex-1 flex items-center justify-center gap-2 text-xs font-bold text-white py-2.5 rounded-xl glass-button-secondary active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                        <span className="material-symbols-outlined text-base">shield</span>
                                        Make Admin
                                    </button>
                                 )}
                            </div>
                        </div>
                    ))
                )}
            </main>
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#1a0b2e] via-[#1a0b2e]/60 to-transparent pointer-events-none h-24"></div>
        </div>
    );
}
