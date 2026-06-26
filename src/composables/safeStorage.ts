const getLocalStorage = (): Storage | null => {
    if (typeof window === 'undefined') return null;

    try {
        return window.localStorage;
    } catch {
        return null;
    }
};

export const safeLocalStorage = {
    getItem(key: string) {
        const storage = getLocalStorage();
        if (!storage) return null;

        try {
            return storage.getItem(key);
        } catch {
            return null;
        }
    },
    setItem(key: string, value: string) {
        const storage = getLocalStorage();
        if (!storage) return;

        try {
            storage.setItem(key, value);
        } catch {
            // Storage can be unavailable or blocked even after it is detected.
        }
    },
};
