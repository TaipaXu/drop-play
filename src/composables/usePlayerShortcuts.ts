import { onBeforeUnmount, onMounted, type Ref } from 'vue';

const isEditableTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    if (target.isContentEditable) return true;

    return !!target.closest('input, textarea, select, button, [contenteditable="true"]');
};

export interface PlayerShortcutsOptions {
    changeSpeed: (direction: -1 | 1) => void;
    changeVolume: (delta: number) => void;
    closeShortcutHelp: () => void;
    enabled: Ref<boolean>;
    pause: () => void;
    play: () => void;
    playNext: () => void;
    playPrev: () => void;
    playerEnabled: Ref<boolean>;
    resetHideTimer: () => void;
    seekBy: (delta: number) => void;
    shortcutHelpOpen: Ref<boolean>;
    takeScreenshot: () => void;
    toggleFullscreen: () => void;
    toggleMute: () => void;
    togglePlay: () => void;
    toggleShortcutHelp: () => void;
}

export const usePlayerShortcuts = ({
    changeSpeed,
    changeVolume,
    closeShortcutHelp,
    enabled,
    pause,
    play,
    playNext,
    playPrev,
    playerEnabled,
    resetHideTimer,
    seekBy,
    shortcutHelpOpen,
    takeScreenshot,
    toggleFullscreen,
    toggleMute,
    togglePlay,
    toggleShortcutHelp,
}: PlayerShortcutsOptions) => {
    const runShortcut = (event: KeyboardEvent, action: () => void, showControls = true) => {
        event.preventDefault();
        action();
        if (showControls) resetHideTimer();
    };

    const hasMediaKey = (event: KeyboardEvent, key: string) =>
        event.key === key || event.code === key;

    const runMediaKeyShortcut = (event: KeyboardEvent) => {
        if (!playerEnabled.value || event.ctrlKey || event.metaKey || event.altKey) return false;

        if (hasMediaKey(event, 'MediaPlayPause')) {
            runShortcut(event, togglePlay, false);
            return true;
        }

        if (hasMediaKey(event, 'MediaPlay')) {
            runShortcut(event, play, false);
            return true;
        }

        if (hasMediaKey(event, 'MediaPause') || hasMediaKey(event, 'MediaStop')) {
            runShortcut(event, pause, false);
            return true;
        }

        if (hasMediaKey(event, 'MediaTrackNext')) {
            runShortcut(event, playNext);
            return true;
        }

        if (hasMediaKey(event, 'MediaTrackPrevious')) {
            runShortcut(event, playPrev);
            return true;
        }

        return false;
    };

    const onKeydown = (event: KeyboardEvent) => {
        if (!enabled.value) return;
        if (runMediaKeyShortcut(event)) return;

        if (event.code === 'Escape' && shortcutHelpOpen.value) {
            runShortcut(event, closeShortcutHelp, false);
            return;
        }

        if (isEditableTarget(event.target) || event.ctrlKey || event.metaKey || event.altKey)
            return;

        if (event.key === '?' || (event.code === 'Slash' && event.shiftKey)) {
            runShortcut(event, toggleShortcutHelp, false);
            return;
        }

        if (shortcutHelpOpen.value) return;
        if (!playerEnabled.value) return;

        switch (event.code) {
            case 'Space':
                runShortcut(event, togglePlay, false);
                break;
            case 'ArrowLeft':
                runShortcut(event, () => seekBy(-10));
                break;
            case 'ArrowRight':
                runShortcut(event, () => seekBy(10));
                break;
            case 'ArrowUp':
                runShortcut(event, () => changeVolume(0.05));
                break;
            case 'ArrowDown':
                runShortcut(event, () => changeVolume(-0.05));
                break;
            case 'BracketLeft':
                runShortcut(event, () => changeSpeed(-1));
                break;
            case 'BracketRight':
                runShortcut(event, () => changeSpeed(1));
                break;
            case 'KeyF':
                runShortcut(event, toggleFullscreen);
                break;
            case 'KeyM':
                runShortcut(event, toggleMute);
                break;
            case 'KeyS':
                runShortcut(event, takeScreenshot, false);
                break;
            case 'KeyN':
                runShortcut(event, playNext);
                break;
            case 'KeyP':
                runShortcut(event, playPrev);
                break;
        }
    };

    onMounted(() => {
        document.addEventListener('keydown', onKeydown);
    });

    onBeforeUnmount(() => {
        document.removeEventListener('keydown', onKeydown);
    });
};
