<template>
    <div
    v-if="showDropZone"
    class="app-shell drop-zone"
    :class="{ 'drop-zone--dragging': dragging, 'drop-zone--error': videoError }"
    @dragenter.prevent="onDragEnter"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeave"
    @drop.prevent="onDrop">
        <div class="drop-zone__content">
            <p
            class="drop-zone__prompt"
            :class="{ 'drop-zone__prompt--error': videoError }"
            :role="videoError ? 'alert' : undefined"
            :aria-live="videoError ? 'assertive' : undefined">
                {{ t(dropPromptKey) }}
            </p>
            <label class="drop-zone__select">
                <input
                class="drop-zone__input"
                type="file"
                multiple
                :accept="videoFileAccept"
                :aria-label="t('selectFiles')"
                @change="onFileInputChange" />
                <span class="drop-zone__select-inner">
                    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                        <path
                        d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm0 2.8L17.2 8H14V4.8zM7 13h3v-3h4v3h3l-5 5-5-5z"
                        fill="currentColor" />
                    </svg>
                    <span>{{ t('selectFiles') }}</span>
                </span>
            </label>
        </div>
    </div>
    <div
    v-else
    class="app-shell player-wrapper"
    :class="{ 'player-wrapper--dragging': dragging }"
    @dragenter.prevent="onDragEnter"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeave"
    @drop.prevent="onDrop">
        <div
        ref="playerContainerRef"
        class="player-wrapper__container"
        @click="onPlayerClick"
        @dblclick="onPlayerDblclick">
            <video
            ref="videoRef"
            class="player-wrapper__video"
            :src="activeVideoUrl ?? undefined"
            autoplay
            :style="hdrStyle"
            @timeupdate="onTimeUpdate"
            @durationchange="onDurationChange"
            @loadedmetadata="onVideoLoadedMetadata"
            @volumechange="onVolumeChange"
            @seeked="onSeeked"
            @play="onPlay"
            @pause="onPause"
            @progress="updateBuffered"
            @error="onVideoError"
            @ended="playlist.playNext"></video>
            <div v-if="dragging" class="player-wrapper__drop-overlay">
                <p>{{ t('dropOverlay') }}</p>
            </div>
            <VideoControls
            :playing="playing"
            :current-time="currentTime"
            :duration="duration"
            :volume="volume"
            :muted="muted"
            :speed="speed"
            :buffered="buffered"
            :video-url="videoUrl"
            :visible="controlsVisible"
            :fullscreen="isFullscreen"
            :hdr-enabled="hdrEnabled"
            @toggle-play="togglePlay"
            @toggle-mute="toggleMute"
            @update-volume="setVolume"
            @update-speed="setSpeed"
            @seek="seek"
            @toggle-fullscreen="toggleFullscreen"
            @toggle-hdr="hdrEnabled = !hdrEnabled"
            @take-screenshot="takeScreenshot" />
        </div>
    </div>
    <div
    v-if="shortcutHelpOpen"
    class="shortcut-help"
    role="presentation"
    @click="closeShortcutHelp">
        <section
        class="shortcut-help__panel"
        role="dialog"
        aria-modal="true"
        :aria-label="t('shortcutHelpTitle')"
        @click.stop>
            <div class="shortcut-help__header">
                <h2>{{ t('shortcutHelpTitle') }}</h2>
                <button
                class="shortcut-help__close"
                type="button"
                :title="t('close')"
                :aria-label="t('close')"
                @click="closeShortcutHelp">
                    <svg viewBox="0 0 24 24" width="18" height="18">
                        <path
                        d="M18.3 5.71 12 12l6.3 6.29-1.41 1.41L10.59 13.41 4.29 19.71 2.88 18.3 9.17 12 2.88 5.71 4.29 4.29 10.59 10.59 16.89 4.29l1.41 1.42z"
                        fill="currentColor" />
                    </svg>
                </button>
            </div>
            <div class="shortcut-help__list">
                <div
                v-for="row in shortcutRows"
                :key="row.label"
                class="shortcut-help__row">
                    <span class="shortcut-help__keys">
                        <kbd v-for="key in row.keys" :key="key">{{ key }}</kbd>
                    </span>
                    <span class="shortcut-help__label">{{ t(row.label) }}</span>
                </div>
            </div>
        </section>
    </div>
    <PlaylistPanel
    :open="playlistOpen"
    :items="playlist.items"
    :current-index="playlist.currentIndex"
    :sort-key="playlist.sortKey"
    :visible="chromeVisible"
    @toggle="playlistOpen = !playlistOpen"
    @close="playlistOpen = false"
    @select="playlist.setCurrent"
    @remove="playlist.remove"
    @clear="playlist.clear"
    @sort="playlist.sort"
    @add-files="playlist.addFilesAndPlay"
    @move-item="playlist.moveItem" />
    <div class="app-tools" :class="{ 'app-tools--visible': chromeVisible }">
        <button
        class="shortcut-help-toggle"
        :class="{ 'shortcut-help-toggle--active': shortcutHelpOpen }"
        type="button"
        :title="t('shortcutHelpTitle')"
        :aria-label="t('shortcutHelpTitle')"
        :aria-pressed="shortcutHelpOpen"
        @click="toggleShortcutHelp">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path
                d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 16.2a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4zm.02-3.05a1.05 1.05 0 1 1 0-2.1 1.05 1.05 0 0 1 0 2.1zm.05-9.45c-1.76 0-3.03 1.02-3.03 2.56h1.8c0-.57.48-.92 1.16-.92.72 0 1.13.38 1.13.98 0 .49-.29.79-.88 1.15-.94.57-1.33 1.13-1.33 2.25v.32h1.72v-.24c0-.52.2-.78.84-1.17.84-.51 1.48-1.15 1.48-2.34 0-1.54-1.22-2.59-2.89-2.59z"
                fill="currentColor" />
            </svg>
        </button>
        <LanguageSwitcher :visible="chromeVisible" />
        <ThemeSwitcher :visible="chromeVisible" />
    </div>
</template>

<script setup vapor lang="ts">
import { computed, ref, watch, onBeforeUnmount } from 'vue';
import LanguageSwitcher from './widgets/languageSwitcher.vue';
import ThemeSwitcher from './widgets/themeSwitcher.vue';
import VideoControls from './widgets/videoControls.vue';
import PlaylistPanel from './widgets/playlistPanel.vue';
import { useControlsVisibility } from './composables/useControlsVisibility';
import { useDropFiles } from './composables/useDropFiles';
import { useI18n, type MessageKey } from './composables/useI18n';
import { usePlayerShortcuts } from './composables/usePlayerShortcuts';
import { useSystemPlaybackControls } from './composables/useSystemPlaybackControls';
import { playbackSpeeds, useVideoPlayer } from './composables/useVideoPlayer';
import { usePlaylistStore, videoFileAccept } from './stores/playlist';

const playlist = usePlaylistStore();
const playlistOpen = ref(false);
const shortcutHelpOpen = ref(false);
const { t } = useI18n();

type ShortcutRow = {
    keys: string[];
    label: MessageKey;
};

const shortcutRows: ShortcutRow[] = [
    { keys: ['Space'], label: 'shortcutPlayPause' },
    { keys: ['←'], label: 'shortcutSeekBackward' },
    { keys: ['→'], label: 'shortcutSeekForward' },
    { keys: ['↑'], label: 'shortcutVolumeUp' },
    { keys: ['↓'], label: 'shortcutVolumeDown' },
    { keys: ['['], label: 'shortcutSpeedDown' },
    { keys: [']'], label: 'shortcutSpeedUp' },
    { keys: ['P'], label: 'shortcutPrev' },
    { keys: ['N'], label: 'shortcutNext' },
    { keys: ['M'], label: 'shortcutMute' },
    { keys: ['F'], label: 'shortcutFullscreen' },
    { keys: ['S'], label: 'shortcutScreenshot' },
    { keys: ['?'], label: 'shortcutHelp' },
];

const videoRef = ref<HTMLVideoElement | null>(null);
const playerContainerRef = ref<HTMLElement | null>(null);
const videoError = ref(false);

const videoUrl = computed(() => playlist.currentItem?.url ?? null);
const activeVideoUrl = computed(() => (videoError.value ? null : videoUrl.value));
const videoFileName = computed(() => playlist.currentItem?.name ?? '');
const showDropZone = computed(() => videoUrl.value === null || videoError.value);
const dropPromptKey = computed<MessageKey>(() =>
    videoError.value ? 'videoCodecUnsupported' : 'dropPrompt',
);

const {
    buffered,
    currentTime,
    duration,
    hdrEnabled,
    isFullscreen,
    muted,
    onDurationChange,
    onLoadedMetadata,
    onPause,
    onPlay,
    onPlayerClick,
    onPlayerDblclick,
    onSeeked,
    onTimeUpdate,
    onVolumeChange,
    pause,
    play,
    playing,
    resetPlaybackState,
    seek,
    seekBy,
    setSpeed,
    setVolume,
    speed,
    takeScreenshot,
    toggleFullscreen,
    toggleMute,
    togglePlay,
    updateBuffered,
    volume,
} = useVideoPlayer({
    getScreenshotBaseName: () => videoFileName.value,
    playerContainerRef,
    videoRef,
});

const hdrStyle = computed(() =>
    hdrEnabled.value ? { filter: 'contrast(1.12) saturate(1.15) brightness(1.05)' } : undefined,
);

const { dragging, onDragEnter, onDragLeave, onDragOver, onDrop } = useDropFiles(
    playlist.addFilesAndPlay,
);
const { controlsVisible, resetHideTimer } = useControlsVisibility(playing);
const chromeVisible = computed(
    () => showDropZone.value || controlsVisible.value || shortcutHelpOpen.value,
);

const closeShortcutHelp = () => {
    shortcutHelpOpen.value = false;
};

const toggleShortcutHelp = () => {
    shortcutHelpOpen.value = !shortcutHelpOpen.value;
};

const onVideoLoadedMetadata = () => {
    videoError.value = false;
    onLoadedMetadata();
};

const onVideoError = () => {
    const failedItemId = playlist.currentItem?.id ?? null;

    videoError.value = true;
    playlistOpen.value = false;
    closeShortcutHelp();
    resetPlaybackState();

    if (failedItemId) playlist.removeRejected(failedItemId);
};

const onFileInputChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);

    if (files.length > 0) {
        playlist.addFilesAndPlay(files);
    }

    input.value = '';
};

const changeVolume = (delta: number) => {
    const nextVolume = Math.round(Math.max(0, Math.min(1, volume.value + delta)) * 100) / 100;

    setVolume(nextVolume);
};

const changeSpeed = (direction: -1 | 1) => {
    const nextSpeed =
        direction > 0
            ? playbackSpeeds.find((value) => value > speed.value)
            : [...playbackSpeeds].reverse().find((value) => value < speed.value);

    if (nextSpeed !== undefined) setSpeed(nextSpeed);
};

usePlayerShortcuts({
    changeSpeed,
    changeVolume,
    closeShortcutHelp,
    enabled: computed(() => true),
    pause,
    play,
    playNext: playlist.playNext,
    playPrev: playlist.playPrev,
    playerEnabled: computed(() => activeVideoUrl.value !== null),
    resetHideTimer,
    seekBy,
    shortcutHelpOpen,
    takeScreenshot,
    toggleFullscreen,
    toggleMute,
    togglePlay,
    toggleShortcutHelp,
});

useSystemPlaybackControls({
    currentTime,
    duration,
    pause,
    play,
    playing,
    playNext: playlist.playNext,
    playPrev: playlist.playPrev,
    seek,
    seekBy,
    speed,
    title: videoFileName,
    videoUrl: activeVideoUrl,
});

watch(videoUrl, (url) => {
    if (url !== null) videoError.value = false;
    resetPlaybackState();
    closeShortcutHelp();
});
watch(
    () => playlist.currentItem?.name,
    (name) => {
        document.title = name ? `Drop Play - ${name}` : 'Drop Play';
    },
);

onBeforeUnmount(() => {
    playlist.clear();
});
</script>

<style lang="scss">
:root,
:root[data-theme='light'] {
    color-scheme: light;
    --color-accent: #00a1d6;
    --color-accent-strong: #409eff;
    --color-app-bg: #f6f8fb;
    --color-drop-border: #9aa7b5;
    --color-drop-text: #4b5563;
    --color-player-bg: #eef2f7;
    --color-floating-bg: rgba(255, 255, 255, 0.86);
    --color-floating-bg-hover: rgba(255, 255, 255, 0.98);
    --color-floating-border: rgba(15, 23, 42, 0.14);
    --color-floating-border-hover: rgba(15, 23, 42, 0.22);
    --color-floating-text: #172033;
    --color-floating-muted: rgba(23, 32, 51, 0.68);
    --color-floating-hover: rgba(15, 23, 42, 0.07);
    --color-menu-bg: rgba(255, 255, 255, 0.96);
    --color-panel-bg: rgba(255, 255, 255, 0.94);
    --color-panel-border: rgba(15, 23, 42, 0.1);
    --color-panel-text: #172033;
    --color-panel-muted: rgba(23, 32, 51, 0.64);
    --color-panel-faint: rgba(23, 32, 51, 0.4);
    --color-panel-hover: rgba(15, 23, 42, 0.06);
    --color-panel-active-bg: rgba(0, 161, 214, 0.12);
    --color-scrollbar-thumb: rgba(15, 23, 42, 0.18);
    --color-danger: #d93025;
    --shadow-floating-hover: 0 6px 16px rgba(15, 23, 42, 0.12);
    --shadow-menu: 0 8px 24px rgba(15, 23, 42, 0.16);
}

:root[data-theme='dark'] {
    color-scheme: dark;
    --color-app-bg: #0f1117;
    --color-drop-border: #4a5568;
    --color-drop-text: rgba(255, 255, 255, 0.64);
    --color-player-bg: #111;
    --color-floating-bg: rgba(0, 0, 0, 0.72);
    --color-floating-bg-hover: rgba(0, 0, 0, 0.9);
    --color-floating-border: rgba(255, 255, 255, 0.16);
    --color-floating-border-hover: rgba(255, 255, 255, 0.28);
    --color-floating-text: #fff;
    --color-floating-muted: rgba(255, 255, 255, 0.78);
    --color-floating-hover: rgba(255, 255, 255, 0.08);
    --color-menu-bg: rgba(20, 20, 20, 0.96);
    --color-panel-bg: rgba(20, 20, 20, 0.95);
    --color-panel-border: rgba(255, 255, 255, 0.08);
    --color-panel-text: #fff;
    --color-panel-muted: rgba(255, 255, 255, 0.68);
    --color-panel-faint: rgba(255, 255, 255, 0.35);
    --color-panel-hover: rgba(255, 255, 255, 0.06);
    --color-panel-active-bg: rgba(0, 161, 214, 0.15);
    --color-scrollbar-thumb: rgba(255, 255, 255, 0.15);
    --color-danger: #f44336;
    --shadow-floating-hover: none;
    --shadow-menu: 0 8px 24px rgba(0, 0, 0, 0.32);
}

@media (prefers-color-scheme: dark) {
    :root:not([data-theme]) {
        color-scheme: dark;
        --color-app-bg: #0f1117;
        --color-drop-border: #4a5568;
        --color-drop-text: rgba(255, 255, 255, 0.64);
        --color-player-bg: #111;
        --color-floating-bg: rgba(0, 0, 0, 0.72);
        --color-floating-bg-hover: rgba(0, 0, 0, 0.9);
        --color-floating-border: rgba(255, 255, 255, 0.16);
        --color-floating-border-hover: rgba(255, 255, 255, 0.28);
        --color-floating-text: #fff;
        --color-floating-muted: rgba(255, 255, 255, 0.78);
        --color-floating-hover: rgba(255, 255, 255, 0.08);
        --color-menu-bg: rgba(20, 20, 20, 0.96);
        --color-panel-bg: rgba(20, 20, 20, 0.95);
        --color-panel-border: rgba(255, 255, 255, 0.08);
        --color-panel-text: #fff;
        --color-panel-muted: rgba(255, 255, 255, 0.68);
        --color-panel-faint: rgba(255, 255, 255, 0.35);
        --color-panel-hover: rgba(255, 255, 255, 0.06);
        --color-panel-active-bg: rgba(0, 161, 214, 0.15);
        --color-scrollbar-thumb: rgba(255, 255, 255, 0.15);
        --color-danger: #f44336;
        --shadow-floating-hover: none;
        --shadow-menu: 0 8px 24px rgba(0, 0, 0, 0.32);
    }
}

body {
    background: var(--color-app-bg);
    color: var(--color-panel-text);
}

.app-shell {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    width: 100vw;
    box-sizing: border-box;
    overflow: hidden;
}

.app-tools {
    position: fixed;
    top: 16px;
    left: 16px;
    z-index: 100;
    display: flex;
    align-items: center;
    gap: 8px;
    opacity: 0;
    pointer-events: none;
    transition:
        opacity 0.3s,
        transform 0.3s;
    transform: translateY(-4px);

    &--visible {
        opacity: 1;
        pointer-events: auto;
        transform: translateY(0);
    }
}

.shortcut-help-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 0;
    border: 1px solid var(--color-floating-border);
    border-radius: 8px;
    background: var(--color-floating-bg);
    color: var(--color-floating-text);
    cursor: pointer;
    transition:
        background 0.2s,
        border-color 0.2s,
        box-shadow 0.2s,
        color 0.2s;

    &:hover {
        background: var(--color-floating-bg-hover);
        border-color: var(--color-floating-border-hover);
        box-shadow: var(--shadow-floating-hover);
    }

    &--active {
        border-color: var(--color-accent);
        color: var(--color-accent);
    }
}

.shortcut-help {
    position: fixed;
    inset: 0;
    z-index: 130;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(0, 0, 0, 0.44);
    box-sizing: border-box;
    color: var(--color-panel-text);

    &__panel {
        width: min(460px, 100%);
        max-height: min(640px, calc(100vh - 48px));
        overflow: auto;
        background: var(--color-panel-bg);
        border: 1px solid var(--color-panel-border);
        border-radius: 8px;
        box-shadow: var(--shadow-menu);
        backdrop-filter: blur(18px);
    }

    &__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 16px 18px 12px;
        border-bottom: 1px solid var(--color-panel-border);

        h2 {
            margin: 0;
            font-size: 16px;
            font-weight: 700;
            line-height: 1.3;
        }
    }

    &__close {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        padding: 0;
        background: transparent;
        border: 0;
        border-radius: 4px;
        color: var(--color-panel-muted);
        cursor: pointer;

        &:hover {
            background: var(--color-panel-hover);
            color: var(--color-panel-text);
        }
    }

    &__list {
        display: grid;
        gap: 2px;
        padding: 8px;
    }

    &__row {
        display: grid;
        grid-template-columns: minmax(92px, auto) 1fr;
        align-items: center;
        gap: 14px;
        padding: 9px 10px;
        border-radius: 6px;

        &:hover {
            background: var(--color-panel-hover);
        }
    }

    &__keys {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
    }

    &__keys kbd {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 28px;
        height: 24px;
        padding: 0 7px;
        box-sizing: border-box;
        border: 1px solid var(--color-panel-border);
        border-radius: 5px;
        background: var(--color-floating-hover);
        color: var(--color-panel-text);
        font-family: inherit;
        font-size: 12px;
        font-weight: 700;
        line-height: 1;
        white-space: nowrap;
        box-shadow: inset 0 -1px 0 var(--color-panel-border);
    }

    &__label {
        min-width: 0;
        color: var(--color-panel-muted);
        font-size: 14px;
        line-height: 1.35;
        overflow-wrap: anywhere;
    }
}

.drop-zone {
    background: var(--color-app-bg);
    border: 3px dashed var(--color-drop-border);
    color: var(--color-drop-text);
    font-size: 1.25rem;
    transition:
        background 0.2s,
        border-color 0.2s,
        color 0.2s;
    user-select: none;

    &--dragging {
        border-color: var(--color-accent-strong);
        color: var(--color-accent-strong);
    }

    &--error {
        border-color: var(--color-danger);
        color: var(--color-danger);
    }

    &__content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 18px;
        width: min(680px, 100%);
        padding: 0 24px;
        box-sizing: border-box;
        text-align: center;
    }

    &__prompt {
        width: 100%;
        max-width: 100%;
        min-width: 0;
        margin: 0;
        line-height: 1.5;
        overflow-wrap: anywhere;

        &--error {
            font-weight: 700;
        }
    }

    &__select {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 44px;
        border-radius: 8px;
        color: var(--color-floating-text);
        cursor: pointer;
    }

    &__select-inner {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-width: 132px;
        min-height: 44px;
        padding: 0 18px;
        box-sizing: border-box;
        border: 1px solid var(--color-floating-border);
        border-radius: 8px;
        background: var(--color-floating-bg);
        font-size: 15px;
        font-weight: 600;
        line-height: 1;
        transition:
            background 0.2s,
            border-color 0.2s,
            box-shadow 0.2s,
            color 0.2s;
    }

    &__select:hover &__select-inner,
    &__select:focus-within &__select-inner {
        background: var(--color-floating-bg-hover);
        border-color: var(--color-floating-border-hover);
        box-shadow: var(--shadow-floating-hover);
        color: var(--color-accent);
    }

    &__select:focus-within &__select-inner {
        outline: 2px solid var(--color-accent-strong);
        outline-offset: 2px;
    }

    &__input {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
        clip-path: inset(50%);
        white-space: nowrap;
    }
}

.player-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100vw;
    height: 100vh;
    background: var(--color-player-bg);

    &--dragging {
        outline: 3px dashed var(--color-accent-strong);
        outline-offset: -3px;
    }

    &__container {
        position: relative;
        width: 100%;
        background: #000;
        border-radius: 8px;
        overflow: hidden;

        &:fullscreen,
        &:-webkit-full-screen {
            border-radius: 0;

            .player-wrapper__video {
                max-height: none;
            }
        }
    }

    &__video {
        display: block;
        width: 100%;
        height: 100%;
        max-height: 80vh;
        object-fit: contain;
    }

    &__drop-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.6);
        color: var(--color-accent-strong);
        font-size: 1.25rem;
        z-index: 10;
        pointer-events: none;
        user-select: none;
    }

}

@media (max-width: 560px) {
    .app-tools {
        top: 12px;
        left: 12px;
        max-width: calc(100vw - 24px);
    }

    .drop-zone__prompt {
        max-width: 280px;
    }

    .shortcut-help {
        align-items: flex-end;
        padding: 12px;

        &__panel {
            max-height: min(560px, calc(100vh - 24px));
        }

        &__row {
            grid-template-columns: 1fr;
            gap: 6px;
        }
    }
}
</style>
