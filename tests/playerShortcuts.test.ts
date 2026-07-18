import { ref } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { usePlayerShortcuts, type PlayerShortcutsOptions } from '@/composables/usePlayerShortcuts';
import { mountComposable } from './helpers/mountComposable';

const createOptions = (): PlayerShortcutsOptions => ({
    changeSpeed: vi.fn(),
    changeVolume: vi.fn(),
    closeShortcutHelp: vi.fn(),
    enabled: ref(true),
    pause: vi.fn(),
    play: vi.fn(),
    playNext: vi.fn(),
    playPrev: vi.fn(),
    playerEnabled: ref(true),
    resetHideTimer: vi.fn(),
    seekBy: vi.fn(),
    shortcutHelpOpen: ref(false),
    takeScreenshot: vi.fn(),
    toggleFullscreen: vi.fn(),
    toggleMute: vi.fn(),
    togglePlay: vi.fn(),
    toggleShortcutHelp: vi.fn(),
});

const keydown = (init: KeyboardEventInit, target: EventTarget = document) => {
    const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
    target.dispatchEvent(event);
    return event;
};

describe('usePlayerShortcuts', () => {
    let unmount: (() => void) | undefined;

    beforeEach(() => {
        document.body.innerHTML = '';
    });

    afterEach(() => {
        unmount?.();
        unmount = undefined;
    });

    const mountShortcuts = (options: PlayerShortcutsOptions) => {
        const mounted = mountComposable(() => usePlayerShortcuts(options));
        unmount = mounted.unmount;
    };

    it('maps playback keys and resets the controls timer when appropriate', () => {
        const options = createOptions();
        mountShortcuts(options);

        const seekEvent = keydown({ code: 'ArrowRight' });
        expect(options.seekBy).toHaveBeenCalledWith(10);
        expect(options.resetHideTimer).toHaveBeenCalledTimes(1);
        expect(seekEvent.defaultPrevented).toBe(true);

        keydown({ code: 'Space' });
        expect(options.togglePlay).toHaveBeenCalledTimes(1);
        expect(options.resetHideTimer).toHaveBeenCalledTimes(1);
    });

    it('does not hijack editable controls or modified shortcuts', () => {
        const options = createOptions();
        mountShortcuts(options);
        const input = document.createElement('input');
        document.body.append(input);

        keydown({ code: 'Space' }, input);
        keydown({ code: 'KeyM', ctrlKey: true });

        expect(options.togglePlay).not.toHaveBeenCalled();
        expect(options.toggleMute).not.toHaveBeenCalled();
    });

    it('opens help before requiring a player and lets Escape close it', () => {
        const options = createOptions();
        options.playerEnabled.value = false;
        mountShortcuts(options);

        keydown({ code: 'Slash', key: '?', shiftKey: true });
        expect(options.toggleShortcutHelp).toHaveBeenCalledTimes(1);

        options.shortcutHelpOpen.value = true;
        keydown({ code: 'Escape' });
        expect(options.closeShortcutHelp).toHaveBeenCalledTimes(1);
    });

    it('handles hardware media keys without revealing the controls', () => {
        const options = createOptions();
        mountShortcuts(options);

        keydown({ code: 'MediaPlay' });
        keydown({ code: 'MediaTrackNext' });

        expect(options.play).toHaveBeenCalledTimes(1);
        expect(options.playNext).toHaveBeenCalledTimes(1);
        expect(options.resetHideTimer).toHaveBeenCalledTimes(1);
    });

    it('removes the document listener when its component unmounts', () => {
        const options = createOptions();
        mountShortcuts(options);
        unmount?.();
        unmount = undefined;

        keydown({ code: 'Space' });
        expect(options.togglePlay).not.toHaveBeenCalled();
    });
});
