'use client';

import { useState, useRef, ChangeEvent, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import { useSupabaseAuth } from '@/context/SupabaseAuthProvider';

export default function JoinTeamPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useSupabaseAuth();
  const [code, setCode] = useState<string[]>(Array(6).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const { value } = e.target;
    if (/^[0-9]$/.test(value) || value === '') {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      // Move to next input if a digit is entered
      if (value && index < 5) {
        inputsRef.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    // Move to previous input on backspace if current input is empty
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };
  
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (/^[0-9]{1,6}$/.test(pastedData)) {
      const newCode = [...code];
      for (let i = 0; i < pastedData.length; i++) {
        newCode[i] = pastedData[i];
      }
      setCode(newCode);
      const lastPastedIndex = Math.min(pastedData.length - 1, 5);
       if (lastPastedIndex < 5) {
          inputsRef.current[lastPastedIndex + 1]?.focus();
       } else {
          inputsRef.current[lastPastedIndex]?.focus();
       }
    }
  };

  const handleJoinTeam = async () => {
    const teamCode = code.join('');
    if (teamCode.length !== 6) {
      toast({
        variant: 'destructive',
        title: 'Invalid Code',
        description: 'Please enter a 6-digit team code.',
      });
      return;
    }

    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Not Logged In',
            description: 'You must be logged in to join a team.',
        });
        return;
    }
    
    setIsLoading(true);

    try {
      // 1. Find team by code
      const { data: team, error: findTeamError } = await supabase
          .from('teams')
          .select('id')
          .eq('team_code', teamCode)
          .single();

      if (findTeamError || !team) {
          toast({
              variant: 'destructive',
              title: 'Invalid Team Code',
              description: 'No team found with that code. Please check and try again.',
          });
          setIsLoading(false);
          return;
      }

      // 2. Add user to team_members
      const { error: joinError } = await supabase
          .from('team_members')
          .insert({
              team_id: team.id,
              user_id: user.id,
              role: 'member',
          });

      if (joinError) {
          // Check for unique constraint violation (PostgreSQL error code '23505')
          if (joinError.code === '23505') {
               toast({
                  variant: 'destructive',
                  title: 'Already a Member',
                  description: "You are already a member of this team.",
              });
          } else {
              throw joinError;
          }
      } else {
          toast({
              title: 'Joined Team!',
              description: `You have successfully joined the team.`,
          });
          router.push('/teams'); // Redirect to see the new team
      }
    } catch (error: any) {
        console.error('Failed to join team:', error);
        toast({
            variant: 'destructive',
            title: 'Failed to Join Team',
            description: error.message || 'An unexpected error occurred.',
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 modal-overlay overflow-hidden">
        <button 
            onClick={() => router.back()}
            className="absolute top-14 left-6 w-12 h-12 rounded-full glass-panel flex items-center justify-center text-white active:scale-90 transition-transform z-[60] shadow-lg disabled:opacity-50"
            disabled={isLoading}>
            <span className="material-symbols-outlined text-2xl ml-[-2px]">chevron_left</span>
        </button>
        <div className="w-full max-w-[340px] glass-panel rounded-[2.5rem] py-10 px-8 shadow-2xl relative overflow-hidden ring-1 ring-white/20 flex flex-col items-center justify-center">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 blur-3xl rounded-full"></div>
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-primary/10 blur-3xl rounded-full"></div>
            <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-8 w-full">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center border border-white/20 shadow-inner">
                        <span className="material-symbols-outlined text-white text-4xl" style={{fontVariationSettings: "'wght' 500"}}>group_add</span>
                    </div>
                    <div className="space-y-1.5">
                        <h2 className="text-2xl font-bold text-white tracking-tight">Join a Team</h2>
                        <p className="text-[13px] font-semibold text-lavender-muted/70">Enter the 6-digit invitation code</p>
                    </div>
                </div>
                <div className="flex justify-center gap-1.5 w-full" onPaste={handlePaste}>
                    {code.map((digit, index) => (
                        <input
                            key={index}
                            ref={el => inputsRef.current[index] = el}
                            className="w-[42px] h-[52px] text-center rounded-xl input-glass text-white font-bold text-xl focus:ring-2 focus:ring-white/40 focus:outline-none transition-all placeholder-white/20"
                            maxLength={1}
                            placeholder="•"
                            type="text"
                            inputMode="numeric"
                            value={digit}
                            onChange={(e) => handleInputChange(e, index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            disabled={isLoading}
                        />
                    ))}
                </div>
                <div className="flex flex-col items-center gap-4 w-full pt-2">
                    <button 
                        onClick={handleJoinTeam}
                        className="w-full h-14 bg-white text-primary rounded-2xl font-bold text-lg active:scale-[0.98] transition-all shadow-xl shadow-black/20 flex items-center justify-center hover:bg-white/90 disabled:opacity-70 disabled:cursor-not-allowed"
                        disabled={isLoading}
                    >
                       {isLoading ? 'Joining...' : 'Join'}
                    </button>
                    <button 
                        onClick={() => router.back()}
                        className="text-white/60 font-bold text-sm active:opacity-70 transition-opacity hover:text-white px-6 py-2 disabled:opacity-50"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
}
