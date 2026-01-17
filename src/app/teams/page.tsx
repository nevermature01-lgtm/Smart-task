'use client';

import Link from 'next/link';

export default function TeamsPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col mesh-gradient overflow-x-hidden text-black">
      <main className="flex-1 px-6 pt-14 pb-12">
        <div className="mb-10">
          <h1 className="text-black text-2xl font-bold mb-6">Smart Task</h1>
          <div className="flex gap-4">
            <button className="glass-button-3d flex-1 flex flex-col items-center justify-center p-4 rounded-2xl active:scale-95 transition-transform">
              <span className="material-symbols-outlined text-black mb-2 text-2xl">add_circle</span>
              <span className="text-black text-sm font-bold">Create Team</span>
            </button>
            <button className="glass-button-3d flex-1 flex flex-col items-center justify-center p-4 rounded-2xl active:scale-95 transition-transform">
              <span className="material-symbols-outlined text-black mb-2 text-2xl">login</span>
              <span className="text-black text-sm font-bold">Join Team</span>
            </button>
          </div>
        </div>
        <div>
          <h2 className="text-black text-lg font-bold mb-4">Your Teams</h2>
          <div className="flex flex-col gap-4">
            <div className="glass-card p-4 rounded-2xl flex items-center justify-between border-black/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-black/10 rounded-full flex items-center justify-center overflow-hidden border border-black/5">
                  <span className="material-symbols-outlined text-black">architecture</span>
                </div>
                <div>
                  <h3 className="text-black font-bold text-base">Smart Decor</h3>
                  <p className="text-black/60 text-xs">Admin</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="bg-black text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Active</span>
              </div>
            </div>
            <div className="glass-card p-4 rounded-2xl flex items-center justify-between border-transparent">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-black/10 rounded-full flex items-center justify-center overflow-hidden border border-black/5">
                  <span className="material-symbols-outlined text-black">rocket_launch</span>
                </div>
                <div>
                  <h3 className="text-black font-bold text-base">Project Alpha</h3>
                  <p className="text-black/60 text-xs">Manager</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-black/40">chevron_right</span>
            </div>
            <div className="glass-card p-4 rounded-2xl flex items-center justify-between border-transparent">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-black/10 rounded-full flex items-center justify-center overflow-hidden border border-black/5">
                  <span className="material-symbols-outlined text-black">palette</span>
                </div>
                <div>
                  <h3 className="text-black font-bold text-base">Design Studio</h3>
                  <p className="text-black/60 text-xs">Contributor</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-black/40">chevron_right</span>
            </div>
            <div className="glass-card p-4 rounded-2xl flex items-center justify-between border-transparent">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-black/10 rounded-full flex items-center justify-center overflow-hidden border border-black/5">
                  <span className="material-symbols-outlined text-black">hub</span>
                </div>
                <div>
                  <h3 className="text-black font-bold text-base">Marketing Sync</h3>
                  <p className="text-black/60 text-xs">Viewer</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-black/40">chevron_right</span>
            </div>
          </div>
        </div>
      </main>
      <div className="pb-6">
        <div className="flex justify-center">
          <div className="w-32 h-1.5 bg-black/20 rounded-full"></div>
        </div>
      </div>
      <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-40 -left-10 w-48 h-48 bg-primary/15 rounded-full blur-[80px] pointer-events-none"></div>
    </div>
  );
}
