import { computed, readonly, ref, watch } from 'vue';

import { safeLocalStorage } from './safeStorage';

export type Theme = 'light' | 'dark';
export type ThemePreference = 'system' | Theme;

const themeStorageKey = 'drop-play-theme';
const darkSchemeQuery = '(prefers-color-scheme: dark)';

const isThemePreference = (value: string | null): value is ThemePreference =>
    value === 'system' || value === 'light' || value === 'dark';

const getSystemTheme = (): Theme => {
    if (typeof window === 'undefined' || typeof window.matchMedia === 'undefined') return 'light';

    return window.matchMedia(darkSchemeQuery).matches ? 'dark' : 'light';
};

const readStoredPreference = (): ThemePreference => {
    const stored = safeLocalStorage.getItem(themeStorageKey);

    return isThemePreference(stored) ? stored : 'system';
};

const writeStoredPreference = (value: ThemePreference) => {
    safeLocalStorage.setItem(themeStorageKey, value);
};

const themePreference = ref<ThemePreference>(readStoredPreference());
const systemTheme = ref<Theme>(getSystemTheme());
const theme = computed<Theme>(() =>
    themePreference.value === 'system' ? systemTheme.value : themePreference.value,
);

const syncDocumentTheme = (value: Theme) => {
    if (typeof document === 'undefined') return;

    document.documentElement.dataset.theme = value;
    document.documentElement.style.colorScheme = value;
};

const setThemePreference = (value: ThemePreference) => {
    themePreference.value = value;
};

let disposeThemeEffects: (() => void) | undefined;

const setupThemeEffects = () => {
    if (disposeThemeEffects) return;

    systemTheme.value = getSystemTheme();

    const stopPreferenceWatch = watch(themePreference, writeStoredPreference);
    const stopThemeWatch = watch(theme, syncDocumentTheme, { immediate: true });
    const media =
        typeof window !== 'undefined' && typeof window.matchMedia !== 'undefined'
            ? window.matchMedia(darkSchemeQuery)
            : undefined;
    const updateSystemTheme = (event: MediaQueryListEvent) => {
        systemTheme.value = event.matches ? 'dark' : 'light';
    };

    if (media) {
        if (typeof media.addEventListener === 'function') {
            media.addEventListener('change', updateSystemTheme);
        } else {
            media.addListener(updateSystemTheme);
        }
    }

    disposeThemeEffects = () => {
        stopPreferenceWatch();
        stopThemeWatch();

        if (media) {
            if (typeof media.removeEventListener === 'function') {
                media.removeEventListener('change', updateSystemTheme);
            } else {
                media.removeListener(updateSystemTheme);
            }
        }

        disposeThemeEffects = undefined;
    };
};

export const disposeTheme = () => {
    disposeThemeEffects?.();
};

setupThemeEffects();

if (import.meta.hot) {
    import.meta.hot.dispose(disposeTheme);
}

export const useTheme = () => {
    setupThemeEffects();

    return {
        setThemePreference,
        systemTheme: readonly(systemTheme),
        theme,
        themePreference: readonly(themePreference),
    };
};
