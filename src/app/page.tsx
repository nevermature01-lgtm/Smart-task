'use client';

import { useRouter } from 'next/navigation';

export default function WelcomeScreen() {
  const router = useRouter();
  return (
    <div className="relative flex h-[100dvh] w-full flex-col mesh-background">
      <div className="flex-1 flex flex-col justify-center px-8">
        <div className="flex flex-col gap-3 text-left">
          <div className="w-12 h-12 glass-panel rounded-xl flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-white text-[28px]">
              task_alt
            </span>
          </div>
          <h1 className="text-white text-[40px] font-bold leading-[1.1] tracking-tight">
            Welcome to
            <br />
            Smart Task
          </h1>
          <p className="text-lavender-muted text-lg font-medium opacity-90 max-w-[280px]">
            Evolve the way you manage productivity.
          </p>
        </div>
        <div className="mt-12 flex flex-col gap-4">
          <button
            onClick={() => router.push('/login')}
            className="glass-card flex items-center justify-between gap-4 rounded-2xl p-6 text-left active:scale-[0.98] transition-all duration-200"
          >
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2 text-white">
                <span className="material-symbols-outlined text-[22px]">
                  login
                </span>
                <span className="text-xl font-bold">Login</span>
              </div>
              <p className="text-white/60 text-sm font-normal">
                Access your existing workspaces.
              </p>
            </div>
            <div className="bg-white/10 h-10 w-10 flex items-center justify-center rounded-full border border-white/20">
              <span className="material-symbols-outlined text-white text-[20px]">
                chevron_right
              </span>
            </div>
          </button>
          <button
            onClick={() => router.push('/signup')}
            className="glass-card flex items-center justify-between gap-4 rounded-2xl p-6 text-left active:scale-[0.98] transition-all duration-200"
          >
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2 text-white">
                <span className="material-symbols-outlined text-[22px]">
                  person_add
                </span>
                <span className="text-xl font-bold">Create Account</span>
              </div>
              <p className="text-white/60 text-sm font-normal">
                Start organizing your life today.
              </p>
            </div>
            <div className="bg-white/10 h-10 w-10 flex items-center justify-center rounded-full border border-white/20">
              <span className="material-symbols-outlined text-white text-[20px]">
                arrow_outward
              </span>
            </div>
          </button>
        </div>
      </div>
      <div className="h-10 w-full shrink-0"></div>
    </div>
  );
}
