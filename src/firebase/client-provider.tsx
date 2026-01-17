'use client';

import React, { ReactNode } from 'react';
import { initializeFirebase } from './index';
import { FirebaseProvider } from './provider';

export default function FirebaseClientProvider({ children }: { children: ReactNode }) {
    const firebase = initializeFirebase();
    return (
        <FirebaseProvider value={firebase}>
            {children}
        </FirebaseProvider>
    );
}
