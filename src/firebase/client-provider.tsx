'use client';

import React, { ReactNode, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { initializeFirebase } from './index';
import { FirebaseProvider, useAuth } from './provider';

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
                        
                        try {
                            const nameParts = user.displayName?.split(' ') || ['', ''];
                            const response = await fetch('/api/sync-user', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    firebase_uid: user.uid,
                                    email: user.email!,
                                    first_name: nameParts[0] || null,
                                    last_name: nameParts.slice(1).join(' ') || null,
                                }),
                            });

                            if (!response.ok) {
                                console.error('Failed to sync user to Supabase.', await response.json());
                            }
                        } catch (error) {
                            console.error('Error calling sync-user API:', error);
                        } finally {
                            // Redirect to home only after the API call is attempted.
                            if (pathname !== '/home') {
                                router.replace('/home');
                            }
                        }
                    } else {
                        // Sync already triggered, just ensure redirect if not on home
                        if (pathname !== '/home') {
                            router.replace('/home');
                        }
                    }
                } else { // Email not verified
                    if (pathname !== '/verify-email') {
                         router.replace('/verify-email');
                    }
                }
            } else { // No user
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
