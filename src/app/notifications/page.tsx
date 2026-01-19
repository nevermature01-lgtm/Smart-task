'use client';

import { useRouter } from 'next/navigation';
import { useRef, useEffect } from 'react';
import gsap from 'gsap';

export default function NotificationsPage() {
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

    const handleRouteBack = () => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            router.back();
            return;
        }
        gsap.to(containerRef.current, {
            opacity: 0,
            y: -8,
            duration: 0.25,
            ease: 'power1.inOut',
            onComplete: () => router.back(),
        });
    };

    return (
        <div ref={containerRef} className="mesh-background min-h-screen flex flex-col">
            <header className="pt-14 px-6 pb-4 flex items-center justify-between sticky top-0 z-30 bg-gradient-to-b from-[#1a0b2e] via-[#1a0b2e]/90 to-transparent">
                <button onClick={handleRouteBack} className="w-10 h-10 flex items-center justify-center rounded-full glass-panel text-white active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-2xl">chevron_left</span>
                </button>
                <h1 className="text-xl font-bold tracking-tight">Notifications</h1>
                <div className="w-10 h-10"></div>
            </header>
            <main className="flex-1 px-6 py-4 overflow-y-auto custom-scrollbar pb-32">
                <div className="glass-panel p-8 rounded-3xl text-center flex flex-col items-center gap-4">
                    <span className="material-symbols-outlined text-4xl text-white/50">notifications_off</span>
                    <p className="text-lavender-muted">You have no notifications yet.</p>
                </div>
            </main>
        </div>
    );
}
