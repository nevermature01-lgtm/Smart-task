'use client';
import { useState, useEffect } from 'react';
import { onSnapshot, type Query, type DocumentData, type CollectionReference } from 'firebase/firestore';

export const useCollection = <T extends DocumentData>(ref: CollectionReference<T> | Query<T> | null) => {
    const [data, setData] = useState<T[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!ref) {
            setData(null);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        const unsubscribe = onSnapshot(ref, (snapshot) => {
            const result: T[] = [];
            snapshot.forEach((doc) => {
                result.push({ ...doc.data(), id: doc.id });
            });
            setData(result);
            setIsLoading(false);
        }, (error) => {
            console.error("useCollection error:", error);
            setData(null);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [ref]);

    return { data, isLoading };
};
