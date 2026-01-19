'use client';

import { useSupabaseAuth } from '@/context/SupabaseAuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, Suspense } from 'react';
import gsap from 'gsap';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

function VerifyEmailComponent() {
  const { session, isLoading } = useSupabaseAuth();
  const router = useRouter();
  const containerRef = useRef(null);
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 12 },
        {
          opacity: 1,
          y: 0,
          duration: 0.25,
          ease: 'power1.out',
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
      ease: 'power1.out',
      onComplete: () => {
        router.push(path);
      },
    });
  };

  useEffect(() => {
    if (!isLoading && session) {
      router.replace('/home');
    }
  }, [session, isLoading, router]);

  const handleResendLink = async () => {
    if (!email) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Email address not found. Please try signing up again.',
      });
      return;
    }
    setIsResending(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error Resending Link',
        description: error.message,
      });
    } else {
      toast({
        title: 'Verification Link Resent',
        description: 'A new verification link has been sent to your email.',
      });
    }
    setIsResending(false);
  };

  return (
    <div ref={containerRef} className="relative flex h-[100dvh] w-full flex-col mesh-background">
      <div className="flex-1 px-6 pt-8 pb-4 flex flex-col justify-center">
        <div className="glass-panel w-full rounded-3xl p-8 flex flex-col items-center gap-8 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 blur-[60px] rounded-full pointer-events-none"></div>
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center border border-white/20 icon-glow">
            <span
              className="material-symbols-outlined text-[48px] text-white"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              mark_email_read
            </span>
          </div>
          <div className="flex flex-col gap-3 text-center">
            <h2 className="text-white text-2xl font-bold tracking-tight">
              Verify your Email
            </h2>
            <p className="text-lavender-muted/80 leading-relaxed text-sm">
              We've sent a verification link to{' '}
              <span className="font-bold text-white">{email}</span>. Please check
              your inbox (and spam folder) and click the link to continue.
            </p>
          </div>
           <div className="w-full flex flex-col gap-4">
             <button
                onClick={() => handleRouteChange('/login')}
                className="w-full bg-white text-primary font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-[0.98] transition-all hover:bg-lavender-muted"
            >
                Login after Verification
            </button>
            <button
              onClick={handleResendLink}
              disabled={isResending}
              className="text-lavender-muted text-sm font-medium hover:text-white transition-colors disabled:opacity-50"
            >
              {isResending ? 'Resending...' : "Didn't receive a link? Resend"}
            </button>
          </div>
        </div>
      </div>
      <div className="h-4 w-full shrink-0"></div>
    </div>
  );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center mesh-background">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        }>
            <VerifyEmailComponent />
        </Suspense>
    )
}
