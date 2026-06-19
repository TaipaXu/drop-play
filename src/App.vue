<template>
    <div
    v-if="!videoUrl"
    class="app-shell drop-zone"
    :class="{ 'drop-zone--dragging': dragging }"
    @dragenter.prevent="onDragEnter"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeave"
    @drop.prevent="onDrop">
        <p>{{ t('dropPrompt') }}</p>
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
            :src="videoUrl"
            autoplay
            :style="hdrStyle"
            @timeupdate="onTimeUpdate"
            @durationchange="onDurationChange"
            @volumechange="onVolumeChange"
            @play="onPlay"
            @pause="onPause"
            @progress="updateBuffered"
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
    <PlaylistPanel
    :open="playlistOpen"
    :items="playlist.items"
    :current-index="playlist.currentIndex"
    :sort-key="playlist.sortKey"
    :visible="controlsVisible"
    @toggle="playlistOpen = !playlistOpen"
    @close="playlistOpen = false"
    @select="playlist.setCurrent"
    @remove="playlist.remove"
    @clear="playlist.clear"
    @sort="playlist.sort"
    @add-files="playlist.addFilesAndPlay"
    @move-item="playlist.moveItem" />
    <div class="app-tools" :class="{ 'app-tools--visible': toolsVisible }">
        <LanguageSwitcher :visible="toolsVisible" />
        <ThemeSwitcher :visible="toolsVisible" />
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
import { useI18n } from './composables/useI18n';
import { usePlayerShortcuts } from './composables/usePlayerShortcuts';
import { useVideoPlayer } from './composables/useVideoPlayer';
import { usePlaylistStore } from './stores/playlist';

const playlist = usePlaylistStore();
const playlistOpen = ref(false);
const { t } = useI18n();

const videoRef = ref<HTMLVideoElement | null>(null);
const playerContainerRef = ref<HTMLElement | null>(null);

const videoUrl = computed(() => playlist.currentItem?.url ?? null);
const videoFileName = computed(() => playlist.currentItem?.name ?? '');

const {
    buffered,
    currentTime,
    duration,
    hdrEnabled,
    isFullscreen,
    muted,
    onDurationChange,
    onPause,
    onPlay,
    onPlayerClick,
    onPlayerDblclick,
    onTimeUpdate,
    onVolumeChange,
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
const toolsVisible = computed(() => !videoUrl.value || controlsVisible.value);

usePlayerShortcuts({
    enabled: computed(() => videoUrl.value !== null),
    playNext: playlist.playNext,
    playPrev: playlist.playPrev,
    resetHideTimer,
    seekBy,
    takeScreenshot,
    togglePlay,
});

watch(videoUrl, resetPlaybackState);
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
</style>
