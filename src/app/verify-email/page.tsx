import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Smart Task - Verify Email',
};

export default function VerifyEmailPage() {
  return (
    <div className="relative flex h-[100dvh] w-full flex-col mesh-background">
      <header className="pt-14 px-6 flex items-center justify-between shrink-0">
        <Link href="/signup" className="w-10 h-10 flex items-center justify-center rounded-full glass-panel text-white active:scale-95 transition-transform">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </Link>
        <div className="w-10"></div>
      </header>
      <div className="flex-1 px-6 pt-8 pb-4 flex flex-col justify-center">
        <div className="glass-panel w-full rounded-3xl p-8 flex flex-col items-center gap-8 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 blur-[60px] rounded-full pointer-events-none"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-lavender-muted/10 blur-[60px] rounded-full pointer-events-none"></div>
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center border border-white/20 icon-glow">
            <span className="material-symbols-outlined text-[48px] text-white" style={{fontVariationSettings: "'FILL' 1"}}>mark_email_read</span>
          </div>
          <div className="flex flex-col gap-3 text-center">
            <h2 className="text-white text-2xl font-bold tracking-tight">Verify your Email</h2>
            <p className="text-lavender-muted/80 leading-relaxed text-sm">
              We've sent a verification link to your email address. Please check your inbox and click the link to continue.
            </p>
          </div>
          <Link href="https://mail.google.com" target="_blank" className="w-full text-center bg-white text-primary font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-[0.98] transition-all hover:bg-lavender-muted">
            Open Gmail
          </Link>
        </div>
      </div>
      <div className="pb-10 px-6 flex flex-col items-center gap-6 shrink-0">
        <button className="text-lavender-muted text-sm font-medium hover:text-white transition-colors">
          Didn't receive the email? <span className="font-bold underline underline-offset-4">Resend</span>
        </button>
      </div>
      <div className="h-4 w-full shrink-0"></div>
    </div>
  );
}
