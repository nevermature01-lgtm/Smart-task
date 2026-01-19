'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '@/context/SupabaseAuthProvider';
import { supabase } from '@/lib/supabase/client';
import gsap from 'gsap';

export default function CreateTeamPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useSupabaseAuth();
  const containerRef = useRef(null);
  
  const [teamName, setTeamName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

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
      duration: 0.15,
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
        duration: 0.15,
        ease: 'power1.inOut',
        onComplete: () => router.back(),
    });
  };

  // Function to generate a unique 6-digit numeric code for the team
  async function generateUniqueTeamCode(): Promise<string> {
    let teamCode: string;
    let isUnique = false;

    while (!isUnique) {
      teamCode = Math.floor(100000 + Math.random() * 900000).toString();
      // Check if the code already exists in the database
      const { data, error } = await supabase
        .from('teams')
        .select('team_code')
        .eq('team_code', teamCode)
        .single();
      
      // If there's an error and it's not the "No rows found" error, throw it
      if (error && error.code !== 'PGRST116') {
        throw new Error(error.message);
      }
      
      // If no data is returned, the code is unique
      if (!data) {
        isUnique = true;
      }
    }
    return teamCode!;
  }

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Team Name Required',
        description: 'Please enter a name for your team.',
      });
      return;
    }

    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to create a team.',
      });
      return;
    }

    setIsCreating(true);

    try {
      const teamCode = await generateUniqueTeamCode();
      
      const { data: newTeam, error: createTeamError } = await supabase
        .from('teams')
        .insert({
          team_name: teamName.trim(),
          team_code: teamCode,
          owner_id: user.id,
          owner_name: user.user_metadata?.full_name || user.email,
          owner_email: user.email
        })
        .select()
        .single();

      if (createTeamError) {
        throw createTeamError;
      }

      if (newTeam) {
        const { error: addMemberError } = await supabase
          .from('team_members')
          .insert({
            team_id: newTeam.id,
            user_id: user.id,
            role: 'owner',
          });
        
        if (addMemberError) {
            // If adding the owner as a member fails, we should let them know.
            // For this implementation, we'll throw the error, which will be caught below.
            throw addMemberError;
        }
      }

      toast({
        title: 'Team Created Successfully!',
        description: `Your new team code is: ${teamCode}`,
      });

      handleRouteChange('/teams');

    } catch (error: any) {
      console.error('Team creation failed:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Create Team',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  const isLoading = isAuthLoading || isCreating;
  const buttonText = isAuthLoading ? 'Authenticating...' : (isCreating ? 'Creating...' : 'Create');

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 flex items-center justify-center p-6 modal-overlay">
      <button 
        onClick={handleRouteBack}
        className="absolute top-14 left-6 w-12 h-12 flex items-center justify-center rounded-full glass-panel text-white active:scale-90 transition-all z-[60] shadow-lg border-white/20 disabled:opacity-50"
        disabled={isLoading}>
        <span className="material-symbols-outlined text-2xl">chevron_left</span>
      </button>
      <div className="w-full max-w-sm glass-panel rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden ring-1 ring-white/20">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 blur-3xl rounded-full"></div>
        <div className="relative z-10 space-y-8">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border border-white/20 mb-2">
              <span className="material-symbols-outlined text-white text-3xl">add_circle</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Create New Team</h2>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-lavender-muted ml-1" htmlFor="team-name">Team Name</label>
              <input 
                className="w-full h-14 px-5 rounded-2xl input-glass text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all font-bold disabled:opacity-50" 
                id="team-name" 
                placeholder="e.g. Design Lab" 
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="pt-2 flex flex-col gap-4">
            <button 
              onClick={handleCreateTeam}
              className="w-full h-14 bg-white text-primary rounded-2xl font-bold text-lg active:scale-[0.98] transition-all shadow-xl shadow-black/20 disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {buttonText}
            </button>
            <button 
              onClick={handleRouteBack}
              className="w-full py-2 text-white/60 font-bold text-sm active:opacity-70 transition-opacity disabled:opacity-50"
              disabled={isLoading}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
