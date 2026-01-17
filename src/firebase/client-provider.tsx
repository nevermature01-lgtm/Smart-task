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
            
            if (user) { // User is logged in
                if (user.emailVerified) { // User is verified
                    // If user is on a public path, they should be redirected to the app's home.
                    if (isPublicPath) {
                        router.replace('/home');
                    }
                    
                    // The sync should only happen once per session, typically after login.
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
                                const errorBody = await response.text();
                                console.error('Failed to sync user to Firestore. Status:', response.status, 'Body:', errorBody);
                            }
                        } catch (error) {
                            console.error('Error calling sync-user API:', error);
                        }
                    }
                } else { // Email not verified
                    // If they are not on the verification page, send them there.
                    if (pathname !== '/verify-email') {
                         router.replace('/verify-email');
                    }
                }
            } else { // No user is logged in
                isSyncTriggeredRef.current = false;
                // If they are on a protected page, redirect to login.
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
