export default function WelcomeScreen() {
  return (
    <div className="relative flex h-screen w-full flex-col mesh-gradient overflow-hidden">
      <div className="flex flex-col items-center justify-center pt-24 pb-12">
        <div className="w-24 h-24 bg-white/70 backdrop-blur-md rounded-3xl flex items-center justify-center mb-10 logo-glow border border-white/80">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-3xl">
              check_circle
            </span>
          </div>
        </div>
        <h1 className="text-foreground tracking-tight text-[40px] font-bold leading-[1.1] px-10 text-center">
          Welcome to <br /> <span className="text-primary">Smart Task</span>
        </h1>
        <p className="text-muted-foreground text-lg font-normal mt-6 px-12 text-center opacity-70 leading-relaxed max-w-sm">
          Elevate your productivity with clarity and modern workflow design.
        </p>
      </div>
      <div className="flex-1 flex flex-col justify-center pb-12 px-8">
        <div className="flex flex-col gap-5 max-w-[420px] mx-auto w-full">
          <button className="glass-button relative group active:scale-95 transition-all duration-200 flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-[24px] h-[72px] px-5 w-full">
            <span className="text-foreground text-xl font-bold leading-normal tracking-[0.015em] relative z-10 flex items-center gap-2">
              Get Started
              <span className="material-symbols-outlined text-2xl">
                arrow_forward
              </span>
            </span>
          </button>
          <button className="glass-button relative group active:scale-95 transition-all duration-200 flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-[24px] h-[72px] px-5 w-full">
            <span className="text-foreground text-xl font-bold leading-normal tracking-[0.015em] relative z-10">
              Log In
            </span>
          </button>
        </div>
      </div>
      <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-20 -left-10 w-48 h-48 bg-primary/15 rounded-full blur-[80px] pointer-events-none"></div>
    </div>
  );
}
