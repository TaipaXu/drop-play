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
    <LanguageSwitcher :visible="!videoUrl || controlsVisible" />
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
</template>

<script setup vapor lang="ts">
import { computed, ref, watch, onBeforeUnmount } from 'vue';
import LanguageSwitcher from './widgets/languageSwitcher.vue';
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

.drop-zone {
    border: 3px dashed #666;
    color: #999;
    font-size: 1.25rem;
    transition:
        border-color 0.2s,
        color 0.2s;
    user-select: none;

    &--dragging {
        border-color: #409eff;
        color: #409eff;
    }
}

.player-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100vw;
    height: 100vh;
    background: #111;

    &--dragging {
        outline: 3px dashed #409eff;
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
        color: #409eff;
        font-size: 1.25rem;
        z-index: 10;
        pointer-events: none;
        user-select: none;
    }
}
</style>
