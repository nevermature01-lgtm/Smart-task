export default function WelcomeScreen() {
  return (
    <div className="relative flex h-screen w-full flex-col mesh-gradient overflow-hidden">
      {/* Header / Logo Area */}
      <div className="flex flex-col items-center justify-center pt-28 pb-12">
        <div className="w-20 h-20 flex items-center justify-center mb-8 logo-glow">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center transform rotate-12">
            <span className="material-symbols-outlined text-white text-2xl">check_circle</span>
          </div>
        </div>
        <h1 className="text-foreground tracking-tight text-[36px] font-bold leading-[1.1] px-10 text-center">
          Welcome to <br /> <span className="text-primary">Smart Task</span>
        </h1>
        <p className="text-muted-foreground text-base font-normal mt-4 px-12 text-center opacity-80 leading-relaxed">
          Elevate your productivity with clarity and modern workflow design.
        </p>
      </div>
      {/* Interactive 3D Glass Area */}
      <div className="flex-1 flex flex-col justify-end pb-20 px-6">
        <div className="flex flex-col gap-6 max-w-[420px] mx-auto w-full">
          {/* 3D Glass Sign Up Button (Primary) */}
          <button className="glass-button relative group active:scale-95 transition-all duration-200 flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-16 px-5 w-full">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="text-foreground text-lg font-bold leading-normal tracking-[0.015em] relative z-10 flex items-center gap-2">
              Get Started
              <span className="material-symbols-outlined text-xl">arrow_forward</span>
            </span>
          </button>
          {/* 3D Glass Login Button (Secondary) */}
          <button className="glass-button relative group active:scale-95 transition-all duration-200 flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-16 px-5 w-full">
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="text-foreground text-lg font-bold leading-normal tracking-[0.015em] relative z-10">
              Log In
            </span>
          </button>
        </div>
      </div>
      {/* Footer */}
      <div className="pb-10 px-4">
        <div className="flex justify-center gap-4">
          <p className="text-muted-foreground text-[13px] font-normal leading-normal opacity-60 underline underline-offset-4">Terms of Service</p>
          <div className="w-1 h-1 bg-muted-foreground rounded-full mt-2 opacity-40"></div>
          <p className="text-muted-foreground text-[13px] font-normal leading-normal opacity-60 underline underline-offset-4">Privacy Policy</p>
        </div>
        {/* iOS Home Indicator */}
        <div className="mt-8 flex justify-center">
          <div className="w-32 h-1.5 bg-foreground/10 rounded-full"></div>
        </div>
      </div>
      {/* Abstract Decorative Elements */}
      <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-20 -left-10 w-48 h-48 bg-primary/15 rounded-full blur-[80px] pointer-events-none"></div>
    </div>
  );
}
