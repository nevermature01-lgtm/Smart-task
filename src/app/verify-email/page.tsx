'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function VerifyEmailPage() {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    // If user is somehow verified while on this page, the central AuthManager
    // will redirect them to /home. If they log out, it will redirect to /login.
    // This page is now passive.
  }, [user, router]);

  return (
    <div className="relative flex h-[100dvh] w-full flex-col mesh-background">
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
              We've sent a verification link to your email address. Please check
              your inbox (and spam folder) and click the link.
            </p>
             <p className="text-lavender-muted/80 leading-relaxed text-sm mt-2">
              Return to the app after you have verified your email.
            </p>
          </div>
        </div>
      </div>
      <div className="h-4 w-full shrink-0"></div>
    </div>
  );
}
