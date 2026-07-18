import { nextTick, ref } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import {
    useSystemPlaybackControls,
    type SystemPlaybackControlsOptions,
} from '@/composables/useSystemPlaybackControls';
import { mountComposable } from './helpers/mountComposable';

class TestWakeLock extends EventTarget implements WakeLockSentinel {
    onrelease: WakeLockSentinel['onrelease'] = null;
    released = false;
    readonly type: WakeLockType = 'screen';
    readonly release = vi.fn(async (): Promise<void> => {
        this.released = true;
    });
}

const createWakeLock = () => new TestWakeLock();

const createOptions = () =>
    ({
        currentTime: ref(0),
        duration: ref(120),
        pause: vi.fn(),
        play: vi.fn(),
        playing: ref(true),
        playNext: vi.fn(),
        playPrev: vi.fn(),
        seek: vi.fn(),
        seekBy: vi.fn(),
        speed: ref(1),
        title: ref('Example'),
        videoUrl: ref('blob:example'),
    }) satisfies SystemPlaybackControlsOptions;

const flushReconciliation = async () => {
    await nextTick();
    await Promise.resolve();
    await Promise.resolve();
};

describe('Wake Lock reconciliation', () => {
    let unmount: (() => void) | undefined;

    beforeEach(() => {
        vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    });

    afterEach(() => {
        unmount?.();
        unmount = undefined;
        Reflect.deleteProperty(navigator, 'wakeLock');
        Reflect.deleteProperty(navigator, 'mediaSession');
    });

    const mountControls = (options: SystemPlaybackControlsOptions) => {
        const mounted = mountComposable(() => useSystemPlaybackControls(options));
        unmount = mounted.unmount;
    };

    const setWakeLockRequest = (request: ReturnType<typeof vi.fn>) => {
        Object.defineProperty(navigator, 'wakeLock', {
            configurable: true,
            value: { request },
        });
    };

    it('holds a screen lock only while visible video is playing', async () => {
        const lock = createWakeLock();
        const request = vi.fn(async () => lock);
        const options = createOptions();
        setWakeLockRequest(request);

        mountControls(options);
        await flushReconciliation();
        expect(request).toHaveBeenCalledWith('screen');
        expect(lock.release).not.toHaveBeenCalled();

        options.playing.value = false;
        await flushReconciliation();
        expect(lock.release).toHaveBeenCalledTimes(1);
    });

    it('releases a request that resolves after playback has paused', async () => {
        const lock = createWakeLock();
        let resolveRequest: ((lock: WakeLockSentinel) => void) | undefined;
        const request = vi.fn(
            () =>
                new Promise<WakeLockSentinel>((resolve) => {
                    resolveRequest = resolve;
                }),
        );
        const options = createOptions();
        setWakeLockRequest(request);

        mountControls(options);
        await nextTick();
        expect(request).toHaveBeenCalledTimes(1);

        options.playing.value = false;
        await nextTick();
        resolveRequest?.(lock);
        await flushReconciliation();

        expect(lock.release).toHaveBeenCalledTimes(1);
    });

    it('releases a request that resolves after the component unmounts', async () => {
        const lock = createWakeLock();
        let resolveRequest: ((lock: WakeLockSentinel) => void) | undefined;
        const request = vi.fn(
            () =>
                new Promise<WakeLockSentinel>((resolve) => {
                    resolveRequest = resolve;
                }),
        );
        const options = createOptions();
        setWakeLockRequest(request);

        mountControls(options);
        await nextTick();
        unmount?.();
        unmount = undefined;

        resolveRequest?.(lock);
        await flushReconciliation();

        expect(lock.release).toHaveBeenCalledTimes(1);
    });

    it('does not request a lock for a hidden document', async () => {
        vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
        const request = vi.fn(async () => createWakeLock());
        const options = createOptions();
        setWakeLockRequest(request);

        mountControls(options);
        await flushReconciliation();

        expect(request).not.toHaveBeenCalled();
    });
});
