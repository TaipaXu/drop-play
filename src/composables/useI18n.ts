import { computed, readonly, ref, watch } from 'vue';

import { safeLocalStorage } from './safeStorage';

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
        progress: '播放进度',
        remove: '移除',
        screenshot: '截屏',
        selectFiles: '选择文件',
        shortcutFullscreen: '全屏 / 退出全屏',
        shortcutHelp: '显示 / 隐藏快捷键',
        shortcutHelpTitle: '快捷键',
        shortcutMute: '静音 / 取消静音',
        shortcutNext: '下一集',
        shortcutPlayPause: '播放 / 暂停',
        shortcutPrev: '上一集',
        shortcutScreenshot: '截屏',
        shortcutSeekBackward: '后退 10 秒',
        shortcutSeekForward: '前进 10 秒',
        shortcutSpeedDown: '降低倍速',
        shortcutSpeedUp: '提高倍速',
        shortcutVolumeDown: '降低音量',
        shortcutVolumeUp: '提高音量',
        sort: '排序',
        sortAddedAsc: '添加时间 ↑',
        sortAddedDesc: '添加时间 ↓',
        sortCustom: '自定义顺序',
        sortNameAsc: '名称 A→Z',
        sortNameDesc: '名称 Z→A',
        speed: '倍速',
        speedCustomInput: '输入 0.1 到 10 之间的倍速',
        themeDark: '深色',
        themeDarkShort: '深色',
        themeLight: '浅色',
        themeLightShort: '浅色',
        themeSystem: '跟随系统',
        themeSystemShort: '系统',
        themeTitle: '切换主题',
        unmute: '取消静音',
        videoCodecUnsupported: '浏览器不支持此视频编码',
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
        progress: 'Playback progress',
        remove: 'Remove',
        screenshot: 'Screenshot',
        selectFiles: 'Choose files',
        shortcutFullscreen: 'Enter / exit fullscreen',
        shortcutHelp: 'Show / hide shortcuts',
        shortcutHelpTitle: 'Keyboard shortcuts',
        shortcutMute: 'Mute / unmute',
        shortcutNext: 'Next item',
        shortcutPlayPause: 'Play / pause',
        shortcutPrev: 'Previous item',
        shortcutScreenshot: 'Screenshot',
        shortcutSeekBackward: 'Seek back 10 seconds',
        shortcutSeekForward: 'Seek forward 10 seconds',
        shortcutSpeedDown: 'Decrease speed',
        shortcutSpeedUp: 'Increase speed',
        shortcutVolumeDown: 'Volume down',
        shortcutVolumeUp: 'Volume up',
        sort: 'Sort',
        sortAddedAsc: 'Date added ↑',
        sortAddedDesc: 'Date added ↓',
        sortCustom: 'Custom order',
        sortNameAsc: 'Name A→Z',
        sortNameDesc: 'Name Z→A',
        speed: 'Speed',
        speedCustomInput: 'Enter a speed from 0.1 to 10',
        themeDark: 'Dark',
        themeDarkShort: 'Dark',
        themeLight: 'Light',
        themeLightShort: 'Light',
        themeSystem: 'Follow system',
        themeSystemShort: 'System',
        themeTitle: 'Switch theme',
        unmute: 'Unmute',
        videoCodecUnsupported: 'This browser does not support this video codec.',
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
    const stored = safeLocalStorage.getItem(languageStorageKey);

    return isLanguagePreference(stored) ? stored : 'system';
};

const writeStoredPreference = (value: LanguagePreference) => {
    safeLocalStorage.setItem(languageStorageKey, value);
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
