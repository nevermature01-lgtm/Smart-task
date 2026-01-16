import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Smart Decor - Sign Up',
};

export default function SignUpScreen() {
  return (
    <div className="relative flex h-screen w-full flex-col mesh-gradient overflow-hidden">
      <div className="px-6 pt-12 shrink-0 z-20">
        <Link href="/" className="w-10 h-10 flex items-center justify-center rounded-full bg-white/40 backdrop-blur-md border border-white/60">
          <span className="material-symbols-outlined text-foreground text-[20px]">arrow_back_ios_new</span>
        </Link>
      </div>
      <div className="px-8 pt-6 pb-4 shrink-0">
        <h1 className="text-foreground tracking-tight text-[32px] font-bold leading-tight">
          Create Account
        </h1>
        <p className="text-muted-foreground text-sm mt-1 opacity-80">
          Join Smart Decor and turn your dreams into reality.
        </p>
      </div>
      <div className="flex-1 px-6 overflow-y-auto pb-6">
        <div className="glass-card rounded-[2.5rem] p-8 w-full max-w-[420px] mx-auto">
          <form className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-foreground text-[10px] font-bold uppercase tracking-widest ml-1">First Name</label>
              <input className="glass-input h-14 rounded-2xl px-5 text-foreground placeholder:text-foreground/30 border-none ring-0" placeholder="John" type="text" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-foreground text-[10px] font-bold uppercase tracking-widest ml-1">Last Name</label>
              <input className="glass-input h-14 rounded-2xl px-5 text-foreground placeholder:text-foreground/30 border-none ring-0" placeholder="Doe" type="text" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-foreground text-[10px] font-bold uppercase tracking-widest ml-1">Gmail</label>
              <input className="glass-input h-14 rounded-2xl px-5 text-foreground placeholder:text-foreground/30 border-none ring-0" placeholder="john.doe@gmail.com" type="email" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-foreground text-[10px] font-bold uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <input className="glass-input h-14 w-full rounded-2xl px-5 text-foreground placeholder:text-foreground/30 border-none ring-0" placeholder="••••••••" type="password" />
                <button className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40" type="button">
                  <span className="material-symbols-outlined">visibility</span>
                </button>
              </div>
            </div>
            <button className="mt-4 bg-foreground text-background h-16 rounded-2xl font-bold text-lg active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-xl shadow-black/10" type="submit">
              Sign Up
              <span className="material-symbols-outlined text-xl">how_to_reg</span>
            </button>
          </form>
          <p className="text-center mt-6 text-sm text-muted-foreground">
            Already have an account? <Link className="text-primary font-bold" href="/login">Log In</Link>
          </p>
        </div>
      </div>
      <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-20 -left-10 w-48 h-48 bg-primary/15 rounded-full blur-[80px] pointer-events-none"></div>
    </div>
  );
}
