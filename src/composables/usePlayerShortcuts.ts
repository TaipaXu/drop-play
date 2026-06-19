import { onBeforeUnmount, onMounted, type Ref } from 'vue';

const isEditableTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    if (target.isContentEditable) return true;

    return !!target.closest('input, textarea, select, button, [contenteditable="true"]');
};

export interface PlayerShortcutsOptions {
    enabled: Ref<boolean>;
    playNext: () => void;
    playPrev: () => void;
    resetHideTimer: () => void;
    seekBy: (delta: number) => void;
    takeScreenshot: () => void;
    togglePlay: () => void;
}

export const usePlayerShortcuts = ({
    enabled,
    playNext,
    playPrev,
    resetHideTimer,
    seekBy,
    takeScreenshot,
    togglePlay,
}: PlayerShortcutsOptions) => {
    const onKeydown = (event: KeyboardEvent) => {
        if (!enabled.value || isEditableTarget(event.target)) return;

        switch (event.code) {
            case 'Space':
                event.preventDefault();
                togglePlay();
                break;
            case 'ArrowLeft':
                event.preventDefault();
                seekBy(-10);
                resetHideTimer();
                break;
            case 'ArrowRight':
                event.preventDefault();
                seekBy(10);
                resetHideTimer();
                break;
            case 'KeyS':
                event.preventDefault();
                takeScreenshot();
                break;
            case 'KeyN':
                event.preventDefault();
                playNext();
                break;
            case 'KeyP':
                event.preventDefault();
                playPrev();
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
