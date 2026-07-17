import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue';

const controlsHideDelay = 4000;
const playerChromeSelector = '[data-player-chrome]';

const isPlayerChromeTarget = (target: EventTarget | null) =>
    target instanceof Element && target.closest(playerChromeSelector) !== null;

export const useControlsVisibility = (playing: Ref<boolean>) => {
    const controlsVisible = ref(true);
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    const clearHideTimer = () => {
        if (hideTimer) {
            clearTimeout(hideTimer);
            hideTimer = null;
        }
    };

    const resetHideTimer = () => {
        clearHideTimer();
        controlsVisible.value = true;

        if (playing.value) {
            hideTimer = setTimeout(() => {
                hideTimer = null;
                if (isPlayerChromeTarget(document.activeElement)) return;

                controlsVisible.value = false;
            }, controlsHideDelay);
        }
    };

    const hideControlsWhenMouseLeavesDocument = (event: MouseEvent) => {
        if (event.relatedTarget !== null) return;

        clearHideTimer();
        if (isPlayerChromeTarget(document.activeElement)) return;

        controlsVisible.value = false;
    };

    const keepControlsVisibleWhileFocused = (event: FocusEvent) => {
        if (isPlayerChromeTarget(event.target)) resetHideTimer();
    };

    const restartHideTimerAfterFocusLeaves = (event: FocusEvent) => {
        if (!isPlayerChromeTarget(event.target) || isPlayerChromeTarget(event.relatedTarget))
            return;

        resetHideTimer();
    };

    watch(playing, (isPlaying) => {
        if (isPlaying) {
            resetHideTimer();
            return;
        }

        clearHideTimer();
        controlsVisible.value = true;
    });

    onMounted(() => {
        document.addEventListener('mousemove', resetHideTimer);
        document.addEventListener('mouseleave', hideControlsWhenMouseLeavesDocument);
        document.addEventListener('mouseenter', resetHideTimer);
        document.addEventListener('focusin', keepControlsVisibleWhileFocused);
        document.addEventListener('focusout', restartHideTimerAfterFocusLeaves);
    });

    onBeforeUnmount(() => {
        document.removeEventListener('mousemove', resetHideTimer);
        document.removeEventListener('mouseleave', hideControlsWhenMouseLeavesDocument);
        document.removeEventListener('mouseenter', resetHideTimer);
        document.removeEventListener('focusin', keepControlsVisibleWhileFocused);
        document.removeEventListener('focusout', restartHideTimerAfterFocusLeaves);
        clearHideTimer();
    });

    return {
        controlsVisible,
        resetHideTimer,
    };
};
