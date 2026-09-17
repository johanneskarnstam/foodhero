import { useEffect, useState, useCallback } from 'react';
import {
    collection,
    onSnapshot,
    doc,
    setDoc,
    deleteDoc,
    DocumentData,
    QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';
import { SavedDebugInfo } from '../types';

interface UseSavedDebugInfoResult {
    savedDebugInfos: SavedDebugInfo[];
    loading: boolean;
    error: string | null;
    saveDebugInfo: (userId: string, title: string, deviceInfo: SavedDebugInfo['deviceInfo']) => Promise<void>;
    deleteSavedDebugInfo: (id: string) => Promise<void>;
}

/**
 * Custom hook for managing saved debug info in Firestore
 * @returns Object with saved debug infos, loading state, error, and CRUD operations
 */
export function useSavedDebugInfo(userId: string | null | undefined): UseSavedDebugInfoResult {
    const [savedDebugInfos, setSavedDebugInfos] = useState<SavedDebugInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) {
            setSavedDebugInfos([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const path = `users/${userId}/savedDebugInfos`;
        const collectionRef = collection(db, path);

        const unsubscribe = onSnapshot(
            collectionRef,
            { includeMetadataChanges: true },
            (snapshot) => {
                const items: SavedDebugInfo[] = [];
                snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
                    const data = doc.data() as SavedDebugInfo;
                    items.push({
                        ...data,
                        id: data.id || doc.id,
                        isPending: doc.metadata?.hasPendingWrites || false
                    } as SavedDebugInfo);
                });
                setSavedDebugInfos(items);
                setLoading(false);
            },
            (err) => {
                console.error(`Firestore sync error for savedDebugInfos:`, err);
                if (err.code === 'resource-exhausted') {
                    setError('Firebase Quota Exceeded. Please try again tomorrow or upgrade your plan.');
                } else {
                    setError(err.message);
                }
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [userId]);

    const saveDebugInfo = useCallback(async (userId: string, title: string, deviceInfo: SavedDebugInfo['deviceInfo']) => {
        if (!userId) throw new Error('User not authenticated');

        const id = doc(collection(db, `users/${userId}/savedDebugInfos`)).id;
        const newDebugInfo: SavedDebugInfo = {
            id,
            userId,
            title,
            deviceInfo,
            createdAt: new Date().toISOString()
        };

        setSavedDebugInfos(current => [
            ...current,
            { ...newDebugInfo, isPending: true }
        ]);

        try {
            const docRef = doc(db, `users/${userId}/savedDebugInfos`, id);
            await setDoc(docRef, newDebugInfo);
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'code' in err && err.code === 'resource-exhausted') {
                console.error('Firebase Quota Exceeded during saveDebugInfo');
            }
            throw err;
        }
    }, []);

    const deleteSavedDebugInfo = useCallback(async (id: string) => {
        if (!userId) throw new Error('User not authenticated');

        const path = `users/${userId}/savedDebugInfos`;
        const docRef = doc(db, path, id);
        setSavedDebugInfos(current => current.filter(item => item.id !== id));

        try {
            await deleteDoc(docRef);
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'code' in err && err.code === 'resource-exhausted') {
                console.error('Firebase Quota Exceeded during deleteSavedDebugInfo');
            }
            throw err;
        }
    }, [userId]);

    return {
        savedDebugInfos,
        loading,
        error,
        saveDebugInfo,
        deleteSavedDebugInfo
    };
}
