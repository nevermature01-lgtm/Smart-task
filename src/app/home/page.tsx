'use client';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const auth = getAuth();

  useEffect(() => {
    // The central AuthManager now handles redirection for unauthenticated users.
    // This useEffect is kept for potential future logic for authenticated users.
  }, [user, isLoading, router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // The central AuthManager will detect the sign-out and redirect to /login.
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // The AuthManager shows a loader or redirects, so we can be sure
  // that if we reach this point, the user is authenticated and verified.
  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Welcome Home,</h1>
        <p className="mt-2 text-lg text-muted-foreground">{user.displayName || user.email}!</p>
        <p className="mt-4 text-sm">Your email is {user.emailVerified ? 'verified' : 'not verified'}.</p>
        <Button onClick={handleLogout} className="mt-6">
          Logout
        </Button>
      </div>
    </div>
  );
}
