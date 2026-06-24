import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue';

const volumeStorageKey = 'player-volume';
const mutedStorageKey = 'player-muted';
const seekCompletionTolerance = 0.5;
const pendingSeekTimeout = 3000;

export const playbackSpeeds = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const readStoredVolume = () => {
    const storedVolume = Number(localStorage.getItem(volumeStorageKey) ?? 1);
    if (!Number.isFinite(storedVolume)) return 1;

    return clamp(storedVolume, 0, 1);
};

const formatTimeForFile = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    const parts = [h, m, s].map((value) => String(value).padStart(2, '0'));

    return `${parts.join('-')}.${String(ms).padStart(2, '0')}`;
};

export interface VideoPlayerOptions {
    getScreenshotBaseName: () => string;
    playerContainerRef: Ref<HTMLElement | null>;
    videoRef: Ref<HTMLVideoElement | null>;
}

export const useVideoPlayer = ({
    getScreenshotBaseName,
    playerContainerRef,
    videoRef,
}: VideoPlayerOptions) => {
    const playing = ref(false);
    const currentTime = ref(0);
    const duration = ref(0);
    const volume = ref(readStoredVolume());
    const muted = ref(localStorage.getItem(mutedStorageKey) === 'true');
    const speed = ref(1);
    const buffered = ref(0);
    const isFullscreen = ref(false);
    const hdrEnabled = ref(false);
    let clickTimer: ReturnType<typeof setTimeout> | null = null;
    let pendingSeekTime: number | null = null;
    let pendingSeekTimer: ReturnType<typeof setTimeout> | null = null;

    const clearPendingSeek = () => {
        pendingSeekTime = null;

        if (!pendingSeekTimer) return;

        clearTimeout(pendingSeekTimer);
        pendingSeekTimer = null;
    };

    const schedulePendingSeekFallback = () => {
        if (pendingSeekTimer) clearTimeout(pendingSeekTimer);

        pendingSeekTimer = setTimeout(() => {
            pendingSeekTimer = null;
            pendingSeekTime = null;
            currentTime.value = videoRef.value?.currentTime ?? currentTime.value;
        }, pendingSeekTimeout);
    };

    const commitSeekTarget = (time: number) => {
        pendingSeekTime = time;
        currentTime.value = time;
        schedulePendingSeekFallback();
    };

    const resetPlaybackState = () => {
        clearPendingSeek();
        currentTime.value = 0;
        duration.value = 0;
        buffered.value = 0;
        playing.value = false;
    };

    const syncPlaybackSpeed = (video: HTMLVideoElement, value = speed.value) => {
        video.defaultPlaybackRate = value;
        video.playbackRate = value;
    };

    const syncVideoSettings = (video: HTMLVideoElement) => {
        video.volume = volume.value;
        video.muted = muted.value;
        syncPlaybackSpeed(video);
    };

    const syncCurrentVideoSettings = () => {
        const video = videoRef.value;
        if (!video) return;

        syncVideoSettings(video);
    };

    const onTimeUpdate = () => {
        const time = videoRef.value?.currentTime ?? 0;
        if (
            pendingSeekTime !== null &&
            Math.abs(time - pendingSeekTime) > seekCompletionTolerance
        ) {
            return;
        }

        currentTime.value = time;
        if (pendingSeekTime !== null) clearPendingSeek();
    };

    const onDurationChange = () => {
        duration.value = videoRef.value?.duration ?? 0;
    };

    const onLoadedMetadata = () => {
        syncCurrentVideoSettings();
        onDurationChange();
    };

    const onSeeked = () => {
        clearPendingSeek();
        currentTime.value = videoRef.value?.currentTime ?? currentTime.value;
    };

    const onVolumeChange = () => {
        const video = videoRef.value;
        if (!video) return;

        volume.value = video.volume;
        muted.value = video.muted;
    };

    const onPlay = () => {
        const video = videoRef.value;
        if (video) syncPlaybackSpeed(video);

        playing.value = true;
    };

    const onPause = () => {
        playing.value = false;
    };

    const updateBuffered = () => {
        const video = videoRef.value;
        if (!video || video.buffered.length === 0 || !video.duration) return;

        buffered.value = (video.buffered.end(video.buffered.length - 1) / video.duration) * 100;
    };

    const play = () => {
        const video = videoRef.value;
        if (!video) return;

        void video.play();
    };

    const pause = () => {
        const video = videoRef.value;
        if (!video) return;

        video.pause();
    };

    const togglePlay = () => {
        const video = videoRef.value;
        if (!video) return;

        if (video.paused) {
            play();
        } else {
            pause();
        }
    };

    const toggleMute = () => {
        const video = videoRef.value;
        if (!video) return;

        video.muted = !video.muted;
    };

    const setVolume = (value: number) => {
        const video = videoRef.value;
        if (!video || !Number.isFinite(value)) return;

        video.volume = clamp(value, 0, 1);
    };

    const setSpeed = (value: number) => {
        if (!Number.isFinite(value)) return;

        speed.value = value;
        const video = videoRef.value;
        if (video) syncPlaybackSpeed(video, value);
    };

    const seek = (time: number) => {
        const video = videoRef.value;
        if (!video || !Number.isFinite(time) || !Number.isFinite(video.duration)) return;

        const nextTime = clamp(time, 0, video.duration);
        commitSeekTarget(nextTime);

        try {
            video.currentTime = nextTime;
        } catch {
            clearPendingSeek();
            currentTime.value = video.currentTime;
        }
    };

    const seekBy = (delta: number) => {
        const video = videoRef.value;
        if (!video || !Number.isFinite(video.duration)) return;

        const baseTime = pendingSeekTime ?? video.currentTime;
        const nextTime = clamp(baseTime + delta, 0, video.duration);
        commitSeekTarget(nextTime);

        try {
            video.currentTime = nextTime;
        } catch {
            clearPendingSeek();
            currentTime.value = video.currentTime;
        }
    };

    const toggleFullscreen = () => {
        const container = playerContainerRef.value;
        if (!container) return;

        if (document.fullscreenElement) {
            void document.exitFullscreen();
        } else {
            void container.requestFullscreen();
        }
    };

    const onFullscreenChange = () => {
        isFullscreen.value = !!document.fullscreenElement;
    };

    const isControlsClick = (event: MouseEvent) => {
        const target = event.target;

        return target instanceof HTMLElement && !!target.closest('.controls');
    };

    const onPlayerClick = (event: MouseEvent) => {
        if (isControlsClick(event)) return;

        if (clickTimer) {
            clearTimeout(clickTimer);
            clickTimer = null;
            return;
        }

        clickTimer = setTimeout(() => {
            clickTimer = null;
            togglePlay();
        }, 150);
    };

    const onPlayerDblclick = (event: MouseEvent) => {
        if (isControlsClick(event)) return;

        if (clickTimer) {
            clearTimeout(clickTimer);
            clickTimer = null;
        }

        toggleFullscreen();
    };

    const takeScreenshot = () => {
        const video = videoRef.value;
        if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
            if (!blob) return;

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const timestamp = formatTimeForFile(video.currentTime);
            const baseName = getScreenshotBaseName();

            link.href = url;
            link.download = `${baseName ? `${baseName}-${timestamp}` : `screenshot-${timestamp}`}.png`;
            link.click();
            URL.revokeObjectURL(url);
        }, 'image/png');
    };

    watch(volume, (value) => localStorage.setItem(volumeStorageKey, String(value)));
    watch(muted, (value) => localStorage.setItem(mutedStorageKey, String(value)));
    watch(videoRef, (video) => {
        if (video) syncVideoSettings(video);
    });

    onMounted(() => {
        document.addEventListener('fullscreenchange', onFullscreenChange);
    });

    onBeforeUnmount(() => {
        document.removeEventListener('fullscreenchange', onFullscreenChange);
        clearPendingSeek();

        if (clickTimer) {
            clearTimeout(clickTimer);
        }
    });

    return {
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
    };
};
