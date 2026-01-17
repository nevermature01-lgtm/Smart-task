'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { useRouter, usePathname } from 'next/navigation';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // This handles session changes, including sign-in, sign-out, and token refreshes.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      // Special handling for password recovery to redirect the user to the update page
      if (event === 'PASSWORD_RECOVERY') {
        router.replace('/reset-password');
      }
    });

    // Check for initial session on app load
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
            setIsLoading(false);
        }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    if (isLoading) return; // Don't perform redirects until the auth state is confirmed

    const publicPaths = ['/login', '/signup', '/forgot-password', '/', '/verify-email'];
    // Allow access to reset-password page even if not logged in (e.g., from an email link)
    const isPublicPath = publicPaths.includes(pathname) || pathname.startsWith('/reset-password');

    if (session) { // If a user session exists
      // If the user is on a public page but should be in the app, redirect to home.
      // Exception for /reset-password, which they might be on after a recovery link click.
      if (isPublicPath && pathname !== '/reset-password') {
        router.replace('/home');
      }
    } else { // If no user session exists
      // If the user is on a protected page, redirect them to the login page.
      if (!isPublicPath) {
        router.replace('/login');
      }
    }
  }, [session, isLoading, pathname, router]);

  const value = { user, session, isLoading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useSupabaseAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};
