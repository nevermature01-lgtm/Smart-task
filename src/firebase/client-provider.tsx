'use client';
import React, { ReactNode } from 'react';

// This component is now a pass-through and does nothing.
// It is left here to prevent breaking imports during the migration.
export default function FirebaseClientProvider({ children }: { children: ReactNode }) {
    return <>{children}</>;
}
