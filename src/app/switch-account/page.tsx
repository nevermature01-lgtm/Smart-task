'use client';

import Link from 'next/link';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import Image from 'next/image';

// Mock data for other accounts. In a real app, this would come from a backend or state management.
const otherAccounts = [
  {
    id: '1',
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    avatar: 'https://picsum.photos/seed/account1/100/100',
  },
  {
    id: '2',
    name: 'John Smith',
    email: 'john.smith@work.com',
    avatar: 'https://picsum.photos/seed/account2/100/100',
  },
];


export default function SwitchAccountPage() {
    const auth = useAuth();

    const handleLogoutAndLogin = async () => {
        await signOut(auth);
        // The AuthManager will automatically redirect to the login page after sign out.
    };

  return (
    <div className="relative flex flex-col pb-28 min-h-screen">
      <header className="pt-14 px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
        <Link href="/home" className="w-10 h-10 flex items-center justify-center rounded-xl glass-panel text-white active:scale-95 transition-transform">
          <span className="material-symbols-outlined text-xl">arrow_back_ios_new</span>
        </Link>
        <h1 className="text-xl font-bold tracking-tight">Switch Account</h1>
        <div className="w-10 h-10" />
      </header>
      <main className="px-6 pt-8 space-y-8 flex-1">
        <div className="space-y-4">
            <p className="text-center text-lavender-muted/80">Select an account to continue or add a new one.</p>
            
            <div className="space-y-3 pt-4">
            {otherAccounts.map((account) => (
                <button key={account.id} onClick={handleLogoutAndLogin} className="w-full glass-panel p-4 rounded-2xl flex items-center gap-4 active:bg-white/10 transition-colors text-left">
                    <Image src={account.avatar} alt={account.name} width={48} height={48} className="w-12 h-12 rounded-full border-2 border-white/10" data-ai-hint="people" />
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm truncate">{account.name}</h4>
                        <p className="text-xs text-lavender-muted opacity-80 mt-0.5">{account.email}</p>
                    </div>
                    <span className="material-symbols-outlined text-lavender-muted/50 text-lg">login</span>
                </button>
            ))}

            <button onClick={handleLogoutAndLogin} className="w-full glass-panel p-4 rounded-2xl flex items-center gap-4 active:bg-white/10 transition-colors mt-6 !mb-4">
                <div className="w-12 h-12 rounded-full border-2 border-white/10 flex items-center justify-center bg-white/5 shrink-0">
                    <span className="material-symbols-outlined">add</span>
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm truncate">Log in to another account</h4>
                </div>
                 <span className="material-symbols-outlined text-lavender-muted/50 text-lg">chevron_right</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
