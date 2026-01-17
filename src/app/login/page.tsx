'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        throw error;
      }
      
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });

      // Redirect to home page on successful login
      router.push('/home');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    }
  };

  return (
    <div className="relative flex h-[100dvh] w-full flex-col mesh-background">
      <header className="pt-14 px-6 flex items-center justify-between shrink-0">
        <Link href="/" className="w-10 h-10 flex items-center justify-center rounded-full glass-panel text-white active:scale-95 transition-transform">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </Link>
        <h1 className="text-white text-xl font-bold">Login</h1>
        <div className="w-10"></div>
      </header>
      <div className="flex-1 px-6 pt-8 pb-4 flex flex-col justify-center">
        <div className="glass-panel w-full rounded-3xl p-8 flex flex-col gap-6 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 blur-[60px] rounded-full pointer-events-none"></div>
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-white/70 text-sm font-medium pl-1">Email</label>
              <input 
                className="glass-input w-full px-4 py-3.5 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/40" 
                placeholder="hello@example.com" 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-white/70 text-sm font-medium">Password</label>
                <button type="button" className="text-lavender-muted text-[12px] hover:text-white transition-colors">Forgot?</button>
              </div>
              <div className="relative">
                <input 
                  className="glass-input w-full px-4 py-3.5 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/40" 
                  placeholder="••••••••" 
                  type={isPasswordVisible ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40" 
                  type="button"
                  onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                >
                  <span className="material-symbols-outlined text-[20px]">{isPasswordVisible ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>
            <button className="mt-2 w-full bg-white text-primary font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-[0.98] transition-all hover:bg-lavender-muted" type="submit">
              Login
            </button>
          </form>
          {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}
        </div>
      </div>
      <div className="pb-10 px-6 flex flex-col items-center gap-6 shrink-0">
        <Link className="text-lavender-muted text-sm font-medium hover:text-white transition-colors" href="/signup">
          Don't have an account? <span className="font-bold underline underline-offset-4">Sign Up</span>
        </Link>
      </div>
      <div className="h-4 w-full shrink-0"></div>
    </div>
  );
}
