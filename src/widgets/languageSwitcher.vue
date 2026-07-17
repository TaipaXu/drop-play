<template>
    <div ref="switcherRef" class="language-switcher" @keydown.escape.stop.prevent="open = false">
        <button
        class="language-switcher__button"
        type="button"
        :title="t('languageTitle')"
        :aria-label="t('languageTitle')"
        :aria-expanded="open"
        @click="open = !open">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path
                d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 0c2.2 2.3 3.3 5.3 3.3 9S14.2 18.7 12 21m0-18C9.8 5.3 8.7 8.3 8.7 12s1.1 6.7 3.3 9M3.6 9h16.8M3.6 15h16.8"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.8" />
            </svg>
            <span>{{ activeLabel }}</span>
        </button>
        <div v-if="open" class="language-switcher__menu">
            <button
            v-for="option in languageOptions"
            :key="option.value"
            class="language-switcher__option"
            :class="{ 'language-switcher__option--active': languagePreference === option.value }"
            type="button"
            :aria-pressed="languagePreference === option.value"
            @click="selectLanguage(option.value)">
                {{ option.label }}
            </button>
        </div>
    </div>
</template>

<script setup vapor lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n, type LanguagePreference } from '../composables/useI18n';

const props = defineProps<{
    visible: boolean;
}>();

const open = ref(false);
const switcherRef = ref<HTMLElement | null>(null);
const { languagePreference, locale, setLanguagePreference, systemLocale, t } = useI18n();

const activeLabel = computed(() => {
    if (languagePreference.value === 'system') return t('languageSystemShort');

    return locale.value === 'zh-CN' ? t('languageChinese') : t('languageEnglishShort');
});

const languageOptions = computed<{ label: string; value: LanguagePreference }[]>(() => [
    {
        label: `${t('languageSystem')} (${systemLocale.value === 'zh-CN' ? t('languageChinese') : t('languageEnglish')})`,
        value: 'system',
    },
    { label: t('languageChinese'), value: 'zh-CN' },
    { label: t('languageEnglish'), value: 'en-US' },
]);

const selectLanguage = (value: LanguagePreference) => {
    setLanguagePreference(value);
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
.language-switcher {
    position: relative;

    &__button {
        display: flex;
        align-items: center;
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
        justify-content: center;
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
    .language-switcher {
        &__button {
            min-width: 64px;
            padding: 0 8px;
        }

        &__option {
            white-space: normal;
            overflow-wrap: anywhere;
        }
    }
}
</style>
