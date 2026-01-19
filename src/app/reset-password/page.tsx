'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, Suspense, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import gsap from 'gsap';

function ResetPasswordComponent() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const { toast } = useToast();
  const containerRef = useRef(null);

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

  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Passwords do not match',
        description: 'Please ensure both passwords are the same.',
      });
      return;
    }

    if (password.length < 6) {
        toast({
            variant: 'destructive',
            title: 'Password too short',
            description: 'Password should be at least 6 characters.',
        });
        return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error updating password',
        description: error.message,
      });
    } else {
      toast({
        title: 'Password Updated',
        description: 'Your password has been successfully reset. Please log in.',
      });
      // Sign out to ensure the old session is cleared
      handleRouteChange('/login');
      supabase.auth.signOut();
    } 
    
    setIsLoading(false);
  };

  return (
    <div ref={containerRef} className="relative flex h-[100dvh] w-full flex-col mesh-background">
      <header className="pt-14 px-6 flex items-center justify-between shrink-0">
         <div className="w-10"></div>
        <h1 className="text-white text-xl font-bold">Reset Password</h1>
        <div className="w-10"></div>
      </header>
      <div className="flex-1 px-6 pt-8 pb-4 flex flex-col justify-center">
        <div className="glass-panel w-full rounded-3xl p-8 flex flex-col gap-8 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 blur-[60px] rounded-full pointer-events-none"></div>
          <form onSubmit={handlePasswordReset} className="flex flex-col gap-6">
            <p className="text-white/80 text-sm leading-relaxed text-center px-2">
              You are now authenticated. Please enter and confirm your new password.
            </p>
            <div className="flex flex-col gap-2">
                <label className="text-white/70 text-sm font-medium pl-1">New Password</label>
                <div className="relative">
                    <input
                        className="glass-input w-full px-4 py-3.5 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/40"
                        placeholder="••••••••"
                        type={isPasswordVisible ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40"
                        type="button"
                        onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                    >
                        {isPasswordVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                </div>
            </div>
             <div className="flex flex-col gap-2">
                <label className="text-white/70 text-sm font-medium pl-1">Confirm New Password</label>
                <div className="relative">
                    <input
                        className="glass-input w-full px-4 py-3.5 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/40"
                        placeholder="••••••••"
                        type={isConfirmPasswordVisible ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                    <button
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40"
                        type="button"
                        onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                    >
                        {isConfirmPasswordVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                </div>
            </div>
            <button
              className="w-full bg-white text-primary font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-[0.98] transition-all hover:bg-lavender-muted disabled:opacity-70 disabled:cursor-not-allowed"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
       <div className="pb-10 px-6 flex flex-col items-center gap-6 shrink-0">
        <a
          className="text-lavender-muted text-sm font-medium hover:text-white transition-colors"
          href="/login"
          onClick={(e) => {
            e.preventDefault();
            handleRouteChange('/login');
          }}
        >
          Back to Login
        </a>
      </div>
      <div className="h-4 w-full shrink-0"></div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordComponent />
    </Suspense>
  );
}
