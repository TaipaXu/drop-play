import { computed, readonly, ref, watch } from 'vue';

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
    if (typeof localStorage === 'undefined') return 'system';

    const stored = localStorage.getItem(themeStorageKey);

    return isThemePreference(stored) ? stored : 'system';
};

const writeStoredPreference = (value: ThemePreference) => {
    if (typeof localStorage === 'undefined') return;

    localStorage.setItem(themeStorageKey, value);
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

watch(themePreference, writeStoredPreference);
watch(theme, syncDocumentTheme, { immediate: true });

if (typeof window !== 'undefined' && typeof window.matchMedia !== 'undefined') {
    const media = window.matchMedia(darkSchemeQuery);
    const updateSystemTheme = (event: MediaQueryListEvent) => {
        systemTheme.value = event.matches ? 'dark' : 'light';
    };

    if (typeof media.addEventListener === 'function') {
        media.addEventListener('change', updateSystemTheme);
    } else {
        media.addListener(updateSystemTheme);
    }
}

export const useTheme = () => ({
    setThemePreference,
    systemTheme: readonly(systemTheme),
    theme,
    themePreference: readonly(themePreference),
});
