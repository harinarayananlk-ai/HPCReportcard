import { useEffect, useRef, useCallback } from 'react';
import { API_URL } from '../context/GlobalContext';

/**
 * useAutoSave — saves form data to backend on page exit.
 * Rule: empty fields NEVER overwrite filled ones (filtered client-side + server-side).
 *
 * @param {number} targetUserId - The user ID to save for
 * @param {function} getPayload - Function returning the current form data as a dict
 * @param {object} deps - Dependency values that trigger marking as dirty
 */
export default function useAutoSave(targetUserId, getPayload, deps = []) {
    const isDirty = useRef(false);
    const payloadRef = useRef(getPayload);

    // Keep ref updated
    useEffect(() => {
        payloadRef.current = getPayload;
    }, [getPayload]);

    // Mark dirty when deps change
    useEffect(() => {
        isDirty.current = true;
    }, deps);

    const save = useCallback(async () => {
        if (!isDirty.current || !targetUserId) return;
        isDirty.current = false;

        try {
            const payload = payloadRef.current();
            if (!payload) return;

            // Client-side: strip empty string values so they don't overwrite
            const cleaned = { userId: targetUserId };
            for (const [key, value] of Object.entries(payload)) {
                if (key === 'userId') continue;
                if (value === null || value === undefined) continue;
                if (typeof value === 'string' && value.trim() === '') continue;
                if (typeof value === 'object' && value !== null) {
                    // For nested objects, strip empty values too
                    const obj = {};
                    let hasContent = false;
                    for (const [k, v] of Object.entries(value)) {
                        if (v !== null && v !== undefined && !(typeof v === 'string' && v.trim() === '')) {
                            obj[k] = v;
                            hasContent = true;
                        }
                    }
                    if (hasContent) cleaned[key] = obj;
                } else {
                    cleaned[key] = value;
                }
            }

            // Only save if there's something beyond just userId
            if (Object.keys(cleaned).length <= 1) return;

            await fetch(`${API_URL}/students/autosave`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cleaned),
            });
        } catch (e) {
            console.warn('[useAutoSave] Save failed:', e);
        }
    }, [targetUserId]);

    // Save on unmount (page exit)
    useEffect(() => {
        return () => { save(); };
    }, [save]);

    // Return manual save trigger
    return { triggerSave: save };
}
