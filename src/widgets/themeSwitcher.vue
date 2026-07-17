<template>
    <div ref="switcherRef" class="theme-switcher" @keydown.escape.stop.prevent="open = false">
        <button
        class="theme-switcher__button"
        type="button"
        :title="t('themeTitle')"
        :aria-label="t('themeTitle')"
        :aria-expanded="open"
        @click="open = !open">
            <svg
            v-if="themePreference === 'system'"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            aria-hidden="true">
                <rect
                x="3.5"
                y="4.5"
                width="17"
                height="12"
                rx="2"
                fill="none"
                stroke="currentColor"
                stroke-linejoin="round"
                stroke-width="1.8" />
                <path
                d="M8.5 20h7M12 16.5V20"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-width="1.8" />
            </svg>
            <svg
            v-else-if="theme === 'dark'"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            aria-hidden="true">
                <path
                d="M20.5 14.2A7.6 7.6 0 0 1 9.8 3.5 8.7 8.7 0 1 0 20.5 14.2Z"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.8" />
            </svg>
            <svg v-else viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <circle
                cx="12"
                cy="12"
                r="4"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8" />
                <path
                d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-width="1.8" />
            </svg>
            <span>{{ activeLabel }}</span>
        </button>
        <div v-if="open" class="theme-switcher__menu">
            <button
            v-for="option in themeOptions"
            :key="option.value"
            class="theme-switcher__option"
            :class="{ 'theme-switcher__option--active': themePreference === option.value }"
            type="button"
            :aria-pressed="themePreference === option.value"
            @click="selectTheme(option.value)">
                {{ option.label }}
            </button>
        </div>
    </div>
</template>

<script setup vapor lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from '../composables/useI18n';
import { useTheme, type ThemePreference } from '../composables/useTheme';

const props = defineProps<{
    visible: boolean;
}>();

const open = ref(false);
const switcherRef = ref<HTMLElement | null>(null);
const { t } = useI18n();
const { setThemePreference, systemTheme, theme, themePreference } = useTheme();

const activeLabel = computed(() => {
    if (themePreference.value === 'system') return t('themeSystemShort');

    return theme.value === 'dark' ? t('themeDarkShort') : t('themeLightShort');
});

const themeOptions = computed<{ label: string; value: ThemePreference }[]>(() => [
    {
        label: `${t('themeSystem')} (${systemTheme.value === 'dark' ? t('themeDark') : t('themeLight')})`,
        value: 'system',
    },
    { label: t('themeLight'), value: 'light' },
    { label: t('themeDark'), value: 'dark' },
]);

const selectTheme = (value: ThemePreference) => {
    setThemePreference(value);
    open.value = false;
};

const closeOnOutsidePointerDown = (event: PointerEvent) => {
    if (!open.value) return;

    const switcher = switcherRef.value;
    if (switcher && event.composedPath().includes(switcher)) return;

    open.value = false;
};

onMounted(() => {
    document.addEventListener('pointerdown', closeOnOutsidePointerDown);
});

onBeforeUnmount(() => {
    document.removeEventListener('pointerdown', closeOnOutsidePointerDown);
});

watch(
    () => props.visible,
    (visible) => {
        if (!visible) open.value = false;
    },
);
</script>

<style lang="scss">
.theme-switcher {
    position: relative;

    &__button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        min-width: 72px;
        height: 36px;
        padding: 0 10px;
        border: 1px solid var(--color-floating-border);
        border-radius: 8px;
        background: var(--color-floating-bg);
        color: var(--color-floating-text);
        cursor: pointer;
        font: inherit;
        font-size: 13px;
        transition:
            background 0.2s,
            border-color 0.2s,
            box-shadow 0.2s;

        &:hover {
            background: var(--color-floating-bg-hover);
            border-color: var(--color-floating-border-hover);
            box-shadow: var(--shadow-floating-hover);
        }

        &:focus-visible {
            outline: 2px solid var(--color-focus-ring);
            outline-offset: 2px;
        }
    }

    &__menu {
        position: absolute;
        top: calc(100% + 8px);
        left: 0;
        min-width: 140px;
        max-width: calc(100vw - 24px);
        padding: 4px 0;
        border: 1px solid var(--color-floating-border);
        border-radius: 8px;
        background: var(--color-menu-bg);
        backdrop-filter: blur(12px);
        box-shadow: var(--shadow-menu);
    }

    &__option {
        display: block;
        width: 100%;
        padding: 8px 14px;
        border: none;
        background: none;
        color: var(--color-floating-muted);
        cursor: pointer;
        font: inherit;
        font-size: 13px;
        text-align: left;
        white-space: nowrap;

        &:hover {
            background: var(--color-floating-hover);
            color: var(--color-floating-text);
        }

        &--active {
            color: var(--color-accent-text);
            font-weight: 600;
        }
    }
}

@media (max-width: 560px) {
    .theme-switcher {
        &__button {
            min-width: 64px;
            padding: 0 8px;
        }

        &__menu {
            left: auto;
            right: 0;
        }

        &__option {
            white-space: normal;
            overflow-wrap: anywhere;
        }
    }
}
</style>
