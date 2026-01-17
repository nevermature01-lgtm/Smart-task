'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    const supabase = createClient();
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: error.message,
        });
        setIsLoading(false);
        return;
      }
      
      if (data.session) {
        toast({
          title: 'Success!',
          description: 'Redirecting to home...',
        });
        
        // Thoda wait karein taaki cookies set ho jayein
        await new Promise(resolve => setTimeout(resolve, 500));
        
        window.location.href = '/home';
      } else {
         // This case handles scenarios like MFA or other login flows
         // where a session isn't immediately returned.
        toast({
          title: 'Login Pending',
          description: 'Please complete the next step to log in.',
        });
        setIsLoading(false);
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'An unexpected error occurred',
        description: err.message || 'An error occurred during login.',
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex h-[100dvh] w-full flex-col mesh-background">
      <header className="pt-14 px-6 flex items-center justify-between shrink-0">
        <Link href="/" className="w-10 h-10 flex items-center justify-center rounded-full glass-panel text-white active:scale-95 transition-transform">
          <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
        </Link>
        <h1 className="text-white text-xl font-bold">Login</h1>
        <div className="w-10"></div>
      </header>
      <div className="flex-1 px-6 pt-8 pb-4 flex flex-col justify-center">
        <div className="glass-panel w-full rounded-3xl p-8 flex flex-col gap-6 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 blur-[60px] rounded-full pointer-events-none"></div>
          {/* This is NOT a <form> to prevent page reloads */}
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-white/70 text-sm font-medium pl-1">Email</label>
              <input 
                className="glass-input w-full px-4 py-3.5 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/40 disabled:opacity-50" 
                placeholder="hello@example.com" 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-white/70 text-sm font-medium">Password</label>
                <Link href="/forgot-password" className="text-lavender-muted text-[12px] hover:text-white transition-colors">Forgot?</Link>
              </div>
              <div className="relative">
                <input 
                  className="glass-input w-full px-4 py-3.5 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/40 disabled:opacity-50" 
                  placeholder="••••••••" 
                  type={isPasswordVisible ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <button 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40" 
                  type="button"
                  onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  disabled={isLoading}
                >
                  {isPasswordVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <button 
              onClick={handleLogin}
              className="mt-2 w-full bg-white text-primary font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-[0.98] transition-all hover:bg-lavender-muted disabled:opacity-70 disabled:cursor-not-allowed" 
              type="button" // MUST be type="button" to prevent form submission
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </div>
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
