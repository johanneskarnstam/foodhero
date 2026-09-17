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

interface UseFirestoreSyncResult<T> {
    data: T[];
    loading: boolean;
    error: string | null;
    addItem: (item: T) => Promise<void>;
    updateItem: (id: string, item: Partial<T>) => Promise<void>;
    deleteItem: (id: string) => Promise<void>;
}

/**
 * Recursively removes undefined values from an object/array so Firestore
 * doesn't reject the write. Firestore supports null but not undefined.
 */
function stripUndefined<T>(value: T): T {
    if (Array.isArray(value)) {
        return value.map(stripUndefined) as unknown as T;
    }
    if (value !== null && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value)
                .filter(([, v]) => v !== undefined)
                .map(([k, v]) => [k, stripUndefined(v)])
        ) as T;
    }
    return value;
}

/**
 * Custom hook for syncing a Firestore collection with React state
 * @param collectionPath - Path to the Firestore collection (e.g., 'users/{uid}/categories')
 * @param userId - The authenticated user's ID
 * @returns Object with data, loading state, error, and CRUD operations
 */
export function useFirestoreSync<T extends { id: string }>(
    collectionPath: string,
    userId: string | null | undefined
): UseFirestoreSyncResult<T> {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) {
            setData([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const path = collectionPath.replace('{uid}', userId);
        const collectionRef = collection(db, path);

        const unsubscribe = onSnapshot(
            collectionRef,
            { includeMetadataChanges: true },
            (snapshot) => {
                const items: T[] = [];
                snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
                    const data = doc.data() as T;
                    // Use Firestore's built-in metadata to track pending writes
                    items.push({ 
                        ...data,
                        id: data.id || doc.id,
                        isPending: doc.metadata?.hasPendingWrites || false
                    } as T);
                });
                setData(items);
                setLoading(false);
            },
            (err) => {
                console.error(`Firestore sync error for ${path}:`, err);
                if (err.code === 'resource-exhausted') {
                    setError('Firebase Quota Exceeded. Please try again tomorrow or upgrade your plan.');
                } else {
                    setError(err.message);
                }
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [collectionPath, userId]);

    const addItem = useCallback(async (item: T) => {
        if (!userId) throw new Error('User not authenticated');
        const path = collectionPath.replace('{uid}', userId);
        const docRef = doc(db, path, item.id);
        setData(current => [
            ...current.filter(existing => existing.id !== item.id),
            { ...item, isPending: true } as T
        ]);
        try {
            await setDoc(docRef, stripUndefined(item));
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'code' in err && err.code === 'resource-exhausted') {
                console.error('Firebase Quota Exceeded during addItem');
            }
            throw err;
        }
    }, [collectionPath, userId]);

    const updateItem = useCallback(async (id: string, updates: Partial<T>) => {
        if (!userId) throw new Error('User not authenticated');
        const path = collectionPath.replace('{uid}', userId);
        const docRef = doc(db, path, id);
        setData(current => current.map(item => item.id === id
            ? { ...item, ...updates, isPending: true } as T
            : item
        ));
        try {
            await setDoc(docRef, stripUndefined(updates), { merge: true });
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'code' in err && err.code === 'resource-exhausted') {
                console.error('Firebase Quota Exceeded during updateItem');
            }
            throw err;
        }
    }, [collectionPath, userId]);

    const deleteItem = useCallback(async (id: string) => {
        if (!userId) throw new Error('User not authenticated');
        const path = collectionPath.replace('{uid}', userId);
        const docRef = doc(db, path, id);
        setData(current => current.filter(item => item.id !== id));
        try {
            await deleteDoc(docRef);
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'code' in err && err.code === 'resource-exhausted') {
                console.error('Firebase Quota Exceeded during deleteItem');
            }
            throw err;
        }
    }, [collectionPath, userId]);

    return {
        data,
        loading,
        error,
        addItem,
        updateItem,
        deleteItem
    };
}
