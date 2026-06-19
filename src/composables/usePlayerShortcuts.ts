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
    shortcutHelpOpen: Ref<boolean>;
    playNext: () => void;
    playPrev: () => void;
    resetHideTimer: () => void;
    seekBy: (delta: number) => void;
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
    shortcutHelpOpen,
    playNext,
    playPrev,
    resetHideTimer,
    seekBy,
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

    const onKeydown = (event: KeyboardEvent) => {
        if (!enabled.value) return;

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
