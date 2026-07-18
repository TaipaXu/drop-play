import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { safeLocalStorage } from '@/composables/safeStorage';

describe('safeLocalStorage', () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('reads and writes values when local storage is available', () => {
        safeLocalStorage.setItem('language', 'en-US');

        expect(safeLocalStorage.getItem('language')).toBe('en-US');
    });

    it('returns null when the local storage getter is blocked', () => {
        vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
            throw new DOMException('Blocked', 'SecurityError');
        });

        expect(safeLocalStorage.getItem('language')).toBeNull();
        expect(() => safeLocalStorage.setItem('language', 'en-US')).not.toThrow();
    });

    it('absorbs storage read and quota errors', () => {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new DOMException('Blocked', 'SecurityError');
        });
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new DOMException('Quota exceeded', 'QuotaExceededError');
        });

        expect(safeLocalStorage.getItem('language')).toBeNull();
        expect(() => safeLocalStorage.setItem('language', 'en-US')).not.toThrow();
    });

    it('is a no-op when no browser window exists', () => {
        vi.stubGlobal('window', undefined);

        expect(safeLocalStorage.getItem('language')).toBeNull();
        expect(() => safeLocalStorage.setItem('language', 'en-US')).not.toThrow();
    });
});
