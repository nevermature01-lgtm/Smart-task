'use client';

import React, { ReactNode, useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { initializeFirebase } from './index';
import { FirebaseProvider, useAuth } from './provider';
import { syncUser } from '@/app/actions/sync-user';
import { User } from 'firebase/auth';

const AuthManager = ({ children }: { children: ReactNode }) => {
    const auth = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const isSyncTriggeredRef = useRef(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
            const publicPaths = ['/', '/login', '/signup', '/forgot-password', '/reset-password', '/verify-email'];
            const isPublicPath = publicPaths.includes(pathname);
            
            if (user) {
                if (user.emailVerified) {
                    if (!isSyncTriggeredRef.current) {
                        isSyncTriggeredRef.current = true;
                        const nameParts = user.displayName?.split(' ') || ['', ''];
                        await syncUser({
                            firebase_uid: user.uid,
                            email: user.email!,
                            first_name: nameParts[0] || null,
                            last_name: nameParts.slice(1).join(' ') || null,
                        });
                    }
                    if (pathname !== '/home') {
                        router.replace('/home');
                    }
                } else {
                    if (pathname !== '/verify-email') {
                         router.replace('/verify-email');
                    }
                }
            } else { // no user
                isSyncTriggeredRef.current = false;
                if (!isPublicPath) {
                    router.replace('/login');
                }
            }
        });

        return () => unsubscribe();
    }, [auth, router, pathname]);

    return <>{children}</>;
};

export default function FirebaseClientProvider({ children }: { children: ReactNode }) {
    const firebase = initializeFirebase();
    return (
        <FirebaseProvider value={firebase}>
            <AuthManager>{children}</AuthManager>
        </FirebaseProvider>
    );
}
