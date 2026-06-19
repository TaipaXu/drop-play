import { computed, readonly, ref, watch } from 'vue';

export type Locale = 'zh-CN' | 'en-US';
export type LanguagePreference = 'system' | Locale;

const languageStorageKey = 'drop-play-language';

const messages = {
    'zh-CN': {
        close: '关闭',
        clear: '清空',
        closePlaylist: '关闭列表',
        dropOverlay: '拖入视频文件立即播放',
        dropPrompt: '拖入视频文件播放（支持多文件）',
        fullscreenEnter: '全屏',
        fullscreenExit: '退出全屏',
        hdr: 'HDR',
        languageChinese: '中文',
        languageEnglish: 'English',
        languageEnglishShort: 'EN',
        languageSystem: '跟随系统',
        languageSystemShort: '系统',
        languageTitle: '切换语言',
        mute: '静音',
        openPlaylist: '打开列表',
        pause: '暂停',
        play: '播放',
        playlistEmpty: '拖入视频文件添加到列表',
        playlistTitle: '播放列表',
        remove: '移除',
        screenshot: '截屏',
        sort: '排序',
        sortAddedAsc: '添加时间 ↑',
        sortAddedDesc: '添加时间 ↓',
        sortCustom: '自定义顺序',
        sortNameAsc: '名称 A→Z',
        sortNameDesc: '名称 Z→A',
        speed: '倍速',
        unmute: '取消静音',
        volume: '音量',
    },
    'en-US': {
        close: 'Close',
        clear: 'Clear',
        closePlaylist: 'Close playlist',
        dropOverlay: 'Drop video files to play now',
        dropPrompt: 'Drop video files to play (multiple files supported)',
        fullscreenEnter: 'Enter fullscreen',
        fullscreenExit: 'Exit fullscreen',
        hdr: 'HDR',
        languageChinese: '中文',
        languageEnglish: 'English',
        languageEnglishShort: 'EN',
        languageSystem: 'Follow system',
        languageSystemShort: 'System',
        languageTitle: 'Switch language',
        mute: 'Mute',
        openPlaylist: 'Open playlist',
        pause: 'Pause',
        play: 'Play',
        playlistEmpty: 'Drop video files to add them to the playlist',
        playlistTitle: 'Playlist',
        remove: 'Remove',
        screenshot: 'Screenshot',
        sort: 'Sort',
        sortAddedAsc: 'Date added ↑',
        sortAddedDesc: 'Date added ↓',
        sortCustom: 'Custom order',
        sortNameAsc: 'Name A→Z',
        sortNameDesc: 'Name Z→A',
        speed: 'Speed',
        unmute: 'Unmute',
        volume: 'Volume',
    },
} as const;

export type MessageKey = keyof (typeof messages)['zh-CN'];

const isLanguagePreference = (value: string | null): value is LanguagePreference =>
    value === 'system' || value === 'zh-CN' || value === 'en-US';

const getSystemLocale = (): Locale => {
    if (typeof navigator === 'undefined') return 'zh-CN';

    const language = (navigator.languages?.[0] ?? navigator.language ?? 'zh-CN').toLowerCase();

    return language.startsWith('zh') ? 'zh-CN' : 'en-US';
};

const readStoredPreference = (): LanguagePreference => {
    if (typeof localStorage === 'undefined') return 'system';

    const stored = localStorage.getItem(languageStorageKey);

    return isLanguagePreference(stored) ? stored : 'system';
};

const writeStoredPreference = (value: LanguagePreference) => {
    if (typeof localStorage === 'undefined') return;

    localStorage.setItem(languageStorageKey, value);
};

const languagePreference = ref<LanguagePreference>(readStoredPreference());
const systemLocale = ref<Locale>(getSystemLocale());
const locale = computed<Locale>(() =>
    languagePreference.value === 'system' ? systemLocale.value : languagePreference.value,
);

const syncDocumentLanguage = (value: Locale) => {
    if (typeof document === 'undefined') return;

    document.documentElement.lang = value;
};

const setLanguagePreference = (value: LanguagePreference) => {
    languagePreference.value = value;
};

const t = (key: MessageKey) => messages[locale.value][key];

watch(languagePreference, writeStoredPreference);
watch(locale, syncDocumentLanguage, { immediate: true });

if (typeof window !== 'undefined') {
    window.addEventListener('languagechange', () => {
        systemLocale.value = getSystemLocale();
    });
}

export const useI18n = () => ({
    languagePreference: readonly(languagePreference),
    locale,
    setLanguagePreference,
    systemLocale: readonly(systemLocale),
    t,
});
