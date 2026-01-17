'use client';
import { useState, useEffect } from 'react';
import { onSnapshot, type DocumentReference, type DocumentData } from 'firebase/firestore';

export const useDoc = <T extends DocumentData>(ref: DocumentReference<T> | null) => {
    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!ref) {
            setData(null);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        const unsubscribe = onSnapshot(ref, (snapshot) => {
            setData(snapshot.exists() ? snapshot.data() : null);
            setIsLoading(false);
        }, (error) => {
            console.error("useDoc error:", error);
            setData(null);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [ref]);

    return { data, isLoading };
};
