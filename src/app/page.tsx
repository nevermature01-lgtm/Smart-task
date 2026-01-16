import Link from 'next/link';

export default function WelcomeScreen() {
  return (
    <div className="relative flex h-[100dvh] w-full flex-col mesh-background">
      <div className="pt-12 px-6 shrink-0">
        <div className="glass-panel w-full aspect-[2/1] rounded-3xl overflow-hidden flex items-center justify-center relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
          <div
            className="relative w-[90%] h-[85%] bg-center bg-no-repeat bg-contain rounded-2xl"
            style={{
              backgroundImage:
                'url("https://storage.googleapis.com/project-spark-b9c51/experiments/prompts/89668472-353d-495c-a5f1-325d4812f88b.png")',
            }}
          ></div>
        </div>
      </div>

      <div className="flex flex-col gap-2 px-8 pt-8 text-left">
        <h1 className="text-white text-[34px] font-bold leading-[1.1] tracking-tight">
          Welcome to
          <br />
          Smart Decor
        </h1>
        <p className="text-lavender-muted text-lg font-medium opacity-90">
          Turning dreams into reality.
        </p>
      </div>

      <div className="mt-6 px-6 flex flex-col gap-4">
        <Link
          href="/login"
          className="glass-card flex items-center justify-between gap-4 rounded-2xl p-5 text-left active:scale-[0.98] transition-all duration-200"
        >
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2 text-white">
              <span className="material-symbols-outlined text-[22px]">
                arrow_forward
              </span>
              <span className="text-lg font-bold">Login</span>
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
        </Link>
        <Link
          href="/signup"
          className="glass-card flex items-center justify-between gap-4 rounded-2xl p-5 text-left active:scale-[0.98] transition-all duration-200"
        >
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2 text-white">
              <span className="material-symbols-outlined text-[22px]">add</span>
              <span className="text-lg font-bold">Create Account</span>
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
        </Link>
      </div>

      <div className="mt-auto"></div>
      <div className="h-6 w-full shrink-0"></div>
    </div>
  );
}
