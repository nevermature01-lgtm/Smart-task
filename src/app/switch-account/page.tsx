'use client';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import Image from 'next/image';
import Link from 'next/link';

export default function SwitchAccountPage() {
    const { user } = useUser();
    const auth = useAuth();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            // The AuthManager will redirect to /login
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };
    
    const otherUsers = [
        {
            name: 'Jane Doe',
            email: 'jane.doe@example.com',
            avatar: 'https://i.pravatar.cc/150?u=jane_doe'
        },
        {
            name: 'Peter Jones',
            email: 'peter.jones@work.co',
            avatar: 'https://i.pravatar.cc/150?u=peter_jones'
        }
    ];

    return (
        <div className="relative flex flex-col pb-28 min-h-screen">
            <header className="pt-14 px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
                 <Link href="/home" className="w-10 h-10 flex items-center justify-center rounded-xl glass-panel text-white active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-xl">arrow_back_ios_new</span>
                </Link>
                <h1 className="text-xl font-bold tracking-tight">Switch Account</h1>
                <div className="w-10 h-10"></div>
            </header>
            <main className="px-6 pt-8 space-y-8 flex-1">
                <div className="space-y-4">
                     {user && (
                        <div className="glass-panel p-4 rounded-2xl flex items-center gap-4 border-2 border-primary/40">
                            <div className="relative">
                                {user.photoURL ? (
                                    <Image src={user.photoURL} alt={user.displayName || 'Current User'} width={48} height={48} className="rounded-full" />
                                ) : (
                                     <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                                        <span className="text-xl font-bold">{user.displayName?.charAt(0) || 'U'}</span>
                                    </div>
                                )}
                                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm truncate">{user.displayName}</h4>
                                <p className="text-xs text-lavender-muted opacity-80 mt-0.5 truncate">{user.email}</p>
                            </div>
                            <span className="material-symbols-outlined text-green-400 text-2xl">check_circle</span>
                        </div>
                     )}

                    {otherUsers.map((otherUser, index) => (
                         <button key={index} onClick={handleLogout} className="w-full glass-panel p-4 rounded-2xl flex items-center gap-4 active:bg-white/10 transition-colors text-left">
                            <Image src={otherUser.avatar} alt={otherUser.name} width={48} height={48} className="rounded-full opacity-70" />
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm truncate text-white/80">{otherUser.name}</h4>
                                <p className="text-xs text-lavender-muted opacity-60 mt-0.5 truncate">{otherUser.email}</p>
                            </div>
                        </button>
                    ))}
                    
                    <button onClick={handleLogout} className="w-full glass-panel p-4 rounded-2xl flex items-center gap-4 active:bg-white/10 transition-colors">
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                            <span className="material-symbols-outlined text-2xl">add</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm">Log in to another account</h4>
                        </div>
                    </button>
                </div>
            </main>
        </div>
    );
}
