'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import { useSupabaseAuth } from '@/context/SupabaseAuthProvider';
import gsap from 'gsap';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user, isLoading: isUserLoading } = useSupabaseAuth();
  const router = useRouter();
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
    setIsLoading(true);
    
    // Get the full redirect URL
    const redirectURL = `${window.location.origin}/reset-password`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectURL,
    });

    if (error) {
        toast({
            variant: 'destructive',
            title: 'Error sending reset link',
            description: error.message,
        });
    } else {
        toast({
            title: 'Reset Link Sent',
            description: 'Check your email for a link to reset your password.',
        });
    }
    
    setIsLoading(false);
  };
  
  if (isUserLoading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative flex h-[100dvh] w-full flex-col mesh-background">
      <header className="pt-14 px-6 flex items-center justify-between shrink-0">
        <a
          href="/login"
          onClick={(e) => {
            e.preventDefault();
            handleRouteChange('/login');
          }}
          className="w-10 h-10 flex items-center justify-center rounded-full glass-panel text-white active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-[20px]">
            arrow_back_ios_new
          </span>
        </a>
        <h1 className="text-white text-xl font-bold">Forgot Password</h1>
        <div className="w-10"></div>
      </header>
      <div className="flex-1 px-6 pt-8 pb-4 flex flex-col justify-center">
        <div className="glass-panel w-full rounded-3xl p-8 flex flex-col gap-8 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 blur-[60px] rounded-full pointer-events-none"></div>
          <form onSubmit={handlePasswordReset} className="flex flex-col gap-6">
            <p className="text-white/80 text-sm leading-relaxed text-center px-2">
              Enter your email address and we&apos;ll send you a link to reset
              your password.
            </p>
            <div className="flex flex-col gap-2">
              <label className="text-white/70 text-sm font-medium pl-1">
                Email
              </label>
              <input
                className="glass-input w-full px-4 py-3.5 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/40"
                placeholder="hello@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button
              className="w-full bg-white text-primary font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-[0.98] transition-all hover:bg-lavender-muted disabled:opacity-70 disabled:cursor-not-allowed"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
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
