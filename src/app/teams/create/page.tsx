'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

export default function CreateTeamPage() {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const { toast } = useToast();
  
  const [teamName, setTeamName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

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
      router.push('/login');
      return;
    }

    setIsCreating(true);

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/create-team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ teamName: teamName.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }

      toast({
        title: 'Team Created Successfully!',
        description: `Your new team code is: ${data.teamCode}`,
      });

      router.push('/home');

    } catch (error: any) {
      console.error('Team creation failed:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Create Team',
        description: error.message,
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  const isLoading = isUserLoading || isCreating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 modal-overlay">
      <button 
        onClick={() => router.back()}
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
              {isCreating ? 'Creating...' : 'Create'}
            </button>
            <button 
              onClick={() => router.back()}
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
