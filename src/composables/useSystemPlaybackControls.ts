import { onBeforeUnmount, onMounted, watch, type Ref } from 'vue';

type ReadonlyRef<T> = Readonly<Ref<T>>;

export interface SystemPlaybackControlsOptions {
    currentTime: ReadonlyRef<number>;
    duration: ReadonlyRef<number>;
    pause: () => void;
    play: () => void;
    playing: ReadonlyRef<boolean>;
    playNext: () => void;
    playPrev: () => void;
    seek: (time: number) => void;
    seekBy: (delta: number) => void;
    speed: ReadonlyRef<number>;
    title: ReadonlyRef<string>;
    videoUrl: ReadonlyRef<string | null>;
}

const setMediaAction = (action: MediaSessionAction, handler: MediaSessionActionHandler) => {
    try {
        navigator.mediaSession.setActionHandler(action, handler);
    } catch {
        // Some browsers expose Media Session but not every action.
    }
};

const clearMediaAction = (action: MediaSessionAction) => {
    try {
        navigator.mediaSession.setActionHandler(action, null);
    } catch {
        // Some browsers expose Media Session but not every action.
    }
};

const setMediaPositionState = (state?: MediaPositionState) => {
    try {
        navigator.mediaSession.setPositionState(state);
    } catch {
        // Position state is optional in some Media Session implementations.
    }
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const useSystemPlaybackControls = ({
    currentTime,
    duration,
    pause,
    play,
    playing,
    playNext,
    playPrev,
    seek,
    seekBy,
    speed,
    title,
    videoUrl,
}: SystemPlaybackControlsOptions) => {
    let wakeLock: WakeLockSentinel | null = null;
    let wakeLockReconcile: Promise<void> | null = null;
    let wakeLockSyncPending = false;
    let wakeLockActive = false;

    const hasMediaSession = () => typeof navigator !== 'undefined' && 'mediaSession' in navigator;

    const hasWakeLock = () => typeof navigator !== 'undefined' && 'wakeLock' in navigator;

    const shouldHoldWakeLock = () =>
        wakeLockActive &&
        videoUrl.value !== null &&
        playing.value &&
        document.visibilityState === 'visible';

    const syncMediaMetadata = () => {
        if (!hasMediaSession()) return;

        if (!videoUrl.value || !title.value || typeof MediaMetadata === 'undefined') {
            navigator.mediaSession.metadata = null;
            return;
        }

        navigator.mediaSession.metadata = new MediaMetadata({
            artist: 'Drop Play',
            title: title.value,
        });
    };

    const syncMediaPlaybackState = () => {
        if (!hasMediaSession()) return;

        navigator.mediaSession.playbackState =
            videoUrl.value === null ? 'none' : playing.value ? 'playing' : 'paused';
    };

    const syncMediaPositionState = () => {
        if (!hasMediaSession()) return;

        if (!videoUrl.value || !Number.isFinite(duration.value) || duration.value <= 0) {
            setMediaPositionState();
            return;
        }

        setMediaPositionState({
            duration: duration.value,
            playbackRate: Number.isFinite(speed.value) && speed.value > 0 ? speed.value : 1,
            position: clamp(currentTime.value, 0, duration.value),
        });
    };

    const setupMediaSession = () => {
        if (!hasMediaSession()) return;

        const handlers: Array<[MediaSessionAction, MediaSessionActionHandler]> = [
            ['play', play],
            ['pause', pause],
            ['stop', pause],
            ['previoustrack', playPrev],
            ['nexttrack', playNext],
            [
                'seekbackward',
                ({ seekOffset }) => {
                    seekBy(-(seekOffset ?? 10));
                },
            ],
            [
                'seekforward',
                ({ seekOffset }) => {
                    seekBy(seekOffset ?? 10);
                },
            ],
            [
                'seekto',
                ({ seekTime }) => {
                    if (typeof seekTime === 'number') seek(seekTime);
                },
            ],
        ];

        for (const [action, handler] of handlers) {
            setMediaAction(action, handler);
        }

        syncMediaMetadata();
        syncMediaPlaybackState();
        syncMediaPositionState();
    };

    const clearMediaSession = () => {
        if (!hasMediaSession()) return;

        const actions: MediaSessionAction[] = [
            'play',
            'pause',
            'stop',
            'previoustrack',
            'nexttrack',
            'seekbackward',
            'seekforward',
            'seekto',
        ];

        for (const action of actions) {
            clearMediaAction(action);
        }

        navigator.mediaSession.metadata = null;
        navigator.mediaSession.playbackState = 'none';
        setMediaPositionState();
    };

    const onWakeLockRelease = (event: Event) => {
        const lock = wakeLock;
        if (!lock || event.target !== lock) return;

        lock.removeEventListener('release', onWakeLockRelease);
        wakeLock = null;
        syncWakeLock();
    };

    const releaseWakeLock = async (lock: WakeLockSentinel) => {
        lock.removeEventListener('release', onWakeLockRelease);

        if (lock.released) return;

        try {
            await lock.release();
        } catch {
            // Wake lock release can fail if the browser already revoked it.
        }
    };

    const reconcileWakeLock = async () => {
        while (wakeLockSyncPending) {
            wakeLockSyncPending = false;

            if (!hasWakeLock() || !shouldHoldWakeLock()) {
                const lock = wakeLock;
                wakeLock = null;
                if (lock) await releaseWakeLock(lock);
                continue;
            }

            if (wakeLock && !wakeLock.released) continue;

            if (wakeLock) {
                wakeLock.removeEventListener('release', onWakeLockRelease);
                wakeLock = null;
            }

            try {
                const lock = await navigator.wakeLock.request('screen');

                if (!shouldHoldWakeLock()) {
                    await releaseWakeLock(lock);
                    continue;
                }

                wakeLock = lock;
                lock.addEventListener('release', onWakeLockRelease);
            } catch {
                // Browsers can deny Wake Lock due to permissions, power state, or visibility.
            }
        }
    };

    function syncWakeLock() {
        // Serialize request/release work and reconcile again if state changes while it is pending.
        wakeLockSyncPending = true;
        if (wakeLockReconcile) return;

        wakeLockReconcile = reconcileWakeLock().finally(() => {
            wakeLockReconcile = null;
            if (wakeLockSyncPending) syncWakeLock();
        });
    }

    const onVisibilityChange = () => {
        syncWakeLock();
    };

    watch([title, videoUrl], syncMediaMetadata, { immediate: true });
    watch([playing, videoUrl], syncMediaPlaybackState, { immediate: true });
    watch([currentTime, duration, speed, videoUrl], syncMediaPositionState, { immediate: true });
    watch([playing, videoUrl], syncWakeLock);

    onMounted(() => {
        wakeLockActive = true;
        setupMediaSession();
        document.addEventListener('visibilitychange', onVisibilityChange);
        syncWakeLock();
    });

    onBeforeUnmount(() => {
        wakeLockActive = false;
        document.removeEventListener('visibilitychange', onVisibilityChange);
        clearMediaSession();
        syncWakeLock();
    });
};
