import { useState, useEffect, useCallback } from 'react';
import { Commit } from '../types';
import commitsJson from '../../public/commits.json';

const STORAGE_KEY = 'foodhero:whats-new-last-seen';
const LEGACY_STORAGE_KEY = 'buymilk:whats-new-last-seen';

export function useWhatsNew() {
    const [showModal, setShowModal] = useState(false);
    const [newCommits, setNewCommits] = useState<Commit[]>([]);

    useEffect(() => {
        let lastSeenHash = localStorage.getItem(STORAGE_KEY);
        
        // Bakåtkompatibel migrering från tidigare BuyMilk-nyckel
        if (!lastSeenHash) {
            const legacyHash = localStorage.getItem(LEGACY_STORAGE_KEY);
            if (legacyHash) {
                lastSeenHash = legacyHash;
                localStorage.setItem(STORAGE_KEY, legacyHash);
            }
        }

        // Ensure commits are typed correctly. Since files property is optional on Commit but might be missing in json, as unknown as Commit[] is safest.
        const commits: Commit[] = commitsJson as unknown as Commit[];

        if (!lastSeenHash) {
            // First visit — mark as seen, do not show
            if (commits.length > 0) {
                localStorage.setItem(STORAGE_KEY, commits[0].hash);
            }
            return;
        }

        const idx = commits.findIndex(c => c.hash === lastSeenHash);
        
        // If hash not found, show all. Otherwise show everything up to the found hash.
        const unseen = idx === -1 ? commits : commits.slice(0, idx);

        if (unseen.length > 0) {
            setNewCommits(unseen);
            setShowModal(true);
        }
    }, []);

    const dismiss = useCallback(() => {
        if (newCommits.length > 0) {
            localStorage.setItem(STORAGE_KEY, newCommits[0].hash);
        }
        setShowModal(false);
    }, [newCommits]);

    return { showModal, newCommits, dismiss };
}
