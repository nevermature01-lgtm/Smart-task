'use client';

import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/context/SupabaseAuthProvider';
import { supabase } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import { useTeam } from '@/context/TeamProvider';
import { useToast } from '@/hooks/use-toast';
import { getHumanAvatarSvg } from '@/lib/avatar';
import { cn } from '@/lib/utils';

type Member = {
  id: string;
  role: 'owner' | 'admin' | 'member';
  full_name: string | null;
  user_id: string;
};

type TeamDetails = {
    owner_id: string;
};

export default function ManageMembersPage() {
    const router = useRouter();
    const { user, isLoading: isAuthLoading } = useSupabaseAuth();
    const { activeTeam: activeTeamId, isLoading: isTeamLoading } = useTeam();
    const { toast } = useToast();

    const [members, setMembers] = useState<Member[]>([]);
    const [teamDetails, setTeamDetails] = useState<TeamDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
    const [roleChange, setRoleChange] = useState<{ member: Member; newRole: 'admin' | 'member' } | null>(null);

    useEffect(() => {
        if (isAuthLoading || isTeamLoading) return;

        if (!user) {
            router.replace('/login');
            return;
        }

        if (!activeTeamId || activeTeamId === 'personal') {
            toast({ title: "No Team Selected", description: "You need to select a team to manage its members.", variant: "destructive" });
            router.replace('/teams');
            return;
        }

        const fetchTeamInfo = async () => {
            setIsLoading(true);

            // Fetch team details to verify ownership
            const { data: teamData, error: teamError } = await supabase
                .from('teams')
                .select('owner_id')
                .eq('id', activeTeamId)
                .single();

            if (teamError || !teamData) {
                toast({ title: "Error", description: "Could not fetch team details.", variant: "destructive" });
                router.replace('/teams');
                return;
            }

            setTeamDetails(teamData);

            // Fetch members
            const { data: membersData, error: membersError } = await supabase
                .from('team_members')
                .select('role, user_id, users(id, full_name)')
                .eq('team_id', activeTeamId);

            if (membersError) {
                toast({ title: "Error", description: "Could not fetch team members.", variant: "destructive" });
                setIsLoading(false);
                return;
            }
            
            const processedMembers = (membersData as any[]).map(m => ({
                id: m.users.id,
                user_id: m.user_id,
                full_name: m.users.full_name,
                role: m.role,
            }));

            // Sort members: owner first, then admins, then members
            processedMembers.sort((a, b) => {
                const roleOrder = { owner: 0, admin: 1, member: 2 };
                return roleOrder[a.role] - roleOrder[b.role];
            });

            setMembers(processedMembers);
            setIsLoading(false);
        };

        fetchTeamInfo();
    }, [user, activeTeamId, isAuthLoading, isTeamLoading, router, toast]);

    const isOwner = user && teamDetails?.owner_id === user.id;

    const handleRoleChange = async () => {
        if (!roleChange || !isOwner) return;

        const { member, newRole } = roleChange;

        const { error } = await supabase
            .from('team_members')
            .update({ role: newRole })
            .eq('team_id', activeTeamId!)
            .eq('user_id', member.user_id);

        if (error) {
            toast({ title: "Error updating role", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Role Updated", description: `${member.full_name}'s role has been changed to ${newRole}.` });
            setMembers(members.map(m => m.id === member.id ? { ...m, role: newRole } : m));
        }
        setRoleChange(null);
    };

    const handleRemoveMember = async () => {
        if (!memberToRemove || !isOwner) return;

        const { error } = await supabase
            .from('team_members')
            .delete()
            .eq('team_id', activeTeamId!)
            .eq('user_id', memberToRemove.user_id);

        if (error) {
            toast({ title: "Error removing member", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Member Removed", description: `${memberToRemove.full_name} has been removed from the team.` });
            setMembers(members.filter(m => m.id !== memberToRemove.id));
        }
        setMemberToRemove(null);
    };
    
    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center mesh-background">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }
    
    return (
        <>
            <div className={cn("font-display antialiased m-0 p-0 text-white mesh-background min-h-screen flex flex-col transition-all", { "deep-blur opacity-50 pointer-events-none": memberToRemove || roleChange })}>
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
                    {!isOwner && (
                        <div className="glass-panel p-4 rounded-2xl text-center text-sm">
                            <p className="text-white/80">Only the team owner can manage members.</p>
                        </div>
                    )}
                    {members.map(member => (
                        <div key={member.id} className="glass-panel p-5 rounded-3xl space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full border-2 border-white/20 overflow-hidden shadow-sm flex-shrink-0">
                                    <div
                                        style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' }}
                                        dangerouslySetInnerHTML={{ __html: getHumanAvatarSvg(String(member.id)) }}
                                    />
                                </div>
                                <div className="flex flex-col flex-1">
                                    <span className="font-bold text-lg text-white">{member.full_name}</span>
                                    <span className={cn('text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full w-fit', {
                                        'bg-primary/30 text-primary-foreground/90 border border-primary/50': member.role === 'owner',
                                        'bg-accent/30 text-accent-foreground/90 border border-accent/50': member.role === 'admin',
                                        'bg-white/10 text-white/80 border border-white/20': member.role === 'member',
                                    })}>
                                        {member.role}
                                    </span>
                                </div>
                            </div>
                            {isOwner && user?.id !== member.id && (
                                <div className="flex items-center gap-2">
                                    {member.role === 'admin' ? (
                                        <button onClick={() => setRoleChange({ member, newRole: 'member' })} className="flex-1 flex items-center justify-center gap-2 text-xs font-bold text-white py-2.5 rounded-xl glass-button-secondary active:scale-95 transition-all">
                                            <span className="material-symbols-outlined text-base">shield_person</span>
                                            Remove Admin
                                        </button>
                                    ) : (
                                        <button onClick={() => setRoleChange({ member, newRole: 'admin' })} className="flex-1 flex items-center justify-center gap-2 text-xs font-bold text-white py-2.5 rounded-xl glass-button-secondary active:scale-95 transition-all">
                                            <span className="material-symbols-outlined text-base">shield</span>
                                            Make Admin
                                        </button>
                                    )}
                                    <button onClick={() => setMemberToRemove(member)} className="flex-1 flex items-center justify-center gap-2 text-xs font-bold text-red-400 py-2.5 rounded-xl glass-button-red active:scale-95 transition-all">
                                        <span className="material-symbols-outlined text-base">person_remove</span>
                                        Remove
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </main>
                <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#1a0b2e] via-[#1a0b2e]/60 to-transparent pointer-events-none h-24"></div>
            </div>

            {/* Modals */}
            {roleChange && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/40 backdrop-blur-sm">
                    <div className="glass-modal w-full max-w-sm rounded-[3rem] p-8 flex flex-col items-center text-center">
                        <div className="w-20 h-20 mb-6 rounded-full glass-panel flex items-center justify-center">
                            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                                <span className="material-symbols-outlined text-3xl text-white font-bold">shield</span>
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold mb-3 tracking-tight">Confirm Role Change</h2>
                        <p className="text-white/80 leading-relaxed mb-8 text-base">
                            Are you sure you want to change {roleChange.member.full_name}'s role to team {roleChange.newRole}?
                        </p>
                        <div className="w-full space-y-3">
                            <button onClick={handleRoleChange} className="w-full py-4 rounded-2xl bg-primary text-white font-bold text-lg active:scale-95 transition-transform">
                                Confirm
                            </button>
                            <button onClick={() => setRoleChange(null)} className="w-full py-4 rounded-2xl glass-button-secondary text-white font-bold text-lg active:scale-95 transition-transform">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {memberToRemove && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/40 backdrop-blur-sm">
                    <div className="glass-modal w-full max-w-sm rounded-[3rem] p-8 flex flex-col items-center text-center">
                        <div className="w-20 h-20 mb-6 rounded-full glass-button-red flex items-center justify-center">
                            <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
                                <span className="material-symbols-outlined text-3xl text-white font-bold">person_remove</span>
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold mb-3 tracking-tight">Remove Member?</h2>
                        <p className="text-white/80 leading-relaxed mb-8 text-base">
                            Are you sure you want to remove {memberToRemove.full_name} from the team?
                        </p>
                        <div className="w-full space-y-3">
                            <button onClick={handleRemoveMember} className="w-full py-4 rounded-2xl glass-button-red text-white font-bold text-lg active:scale-95 transition-transform">
                                Remove
                            </button>
                            <button onClick={() => setMemberToRemove(null)} className="w-full py-4 rounded-2xl glass-button-secondary text-white font-bold text-lg active:scale-95 transition-transform">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
