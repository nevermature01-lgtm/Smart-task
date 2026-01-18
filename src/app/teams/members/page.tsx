'use client';

import { useRouter } from 'next/navigation';
import { getHumanAvatarSvg } from '@/lib/avatar';
import { useState, useEffect, useCallback } from 'react';
import { useTeam } from '@/context/TeamProvider';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '@/context/SupabaseAuthProvider';

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
    
    const [members, setMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
    const [currentUserIsAdmin, setCurrentUserIsAdmin] = useState(false);
    const [isUpdatingRole, setIsUpdatingRole] = useState(false);

    const fetchTeamData = useCallback(async () => {
        if (!activeTeamId || activeTeamId === 'personal' || !user) return;

        setIsLoading(true);

        const { data: teamData, error: teamError } = await supabase
            .from('teams')
            .select('owner_id')
            .eq('id', activeTeamId)
            .single();

        if (teamError) {
            console.error('Error fetching team data:', teamError);
            toast({ variant: 'destructive', title: 'Failed to load team.' });
            setIsLoading(false);
            return;
        }

        const { data: teamMembersData, error: membersError } = await supabase
            .from('team_members')
            .select('user_id, role')
            .eq('team_id', activeTeamId);

        if (membersError) {
            console.error('Error fetching team members:', membersError.message || membersError);
            toast({ variant: 'destructive', title: 'Failed to load members.' });
            setIsLoading(false);
            return;
        }

        if (!teamMembersData || teamMembersData.length === 0) {
            setMembers([]);
            setIsLoading(false);
            return;
        }

        if (user.id === teamData.owner_id) {
            setCurrentUserIsAdmin(true);
        } else {
            const currentUserMembership = teamMembersData.find(m => m.user_id === user.id);
            setCurrentUserIsAdmin(currentUserMembership?.role === 'admin');
        }
        
        const memberUserIds = teamMembersData.map(m => m.user_id);
        const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, full_name')
            .in('id', memberUserIds);

        if (usersError) {
            console.error('Error fetching user details:', usersError);
            toast({ variant: 'destructive', title: 'Failed to load member details.' });
            setIsLoading(false);
            return;
        }

        if (usersData) {
            const processedMembers: Member[] = teamMembersData.map((membership) => {
                const userProfile = usersData.find((u) => u.id === membership.user_id);
                return {
                    id: membership.user_id,
                    full_name: userProfile?.full_name || 'Team Member',
                    role: membership.user_id === teamData.owner_id ? 'owner' : membership.role,
                };
            });
            
            setMembers(processedMembers);
        } else {
            setMembers([]);
        }
        setIsLoading(false);
    }, [activeTeamId, user, toast]);

    useEffect(() => {
        if (isTeamLoading || !user) return;

        if (!activeTeamId || activeTeamId === 'personal') {
            toast({
                variant: 'destructive',
                title: 'No Team Selected',
                description: 'You must select a team to manage its members.',
            });
            router.push('/teams');
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
        <div className="font-display antialiased m-0 p-0 text-white mesh-background min-h-screen flex flex-col">
            <header className="pt-14 px-6 pb-6 flex items-center justify-between sticky top-0 z-30">
                <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full glass-panel text-white active:scale-95 transition-transform">
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
