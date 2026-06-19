import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue';

const controlsHideDelay = 4000;

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
                controlsVisible.value = false;
            }, controlsHideDelay);
        }
    };

    const hideControlsWhenMouseLeavesDocument = (event: MouseEvent) => {
        if (event.relatedTarget !== null) return;

        clearHideTimer();
        controlsVisible.value = false;
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
    });

    onBeforeUnmount(() => {
        document.removeEventListener('mousemove', resetHideTimer);
        document.removeEventListener('mouseleave', hideControlsWhenMouseLeavesDocument);
        document.removeEventListener('mouseenter', resetHideTimer);
        clearHideTimer();
    });

    return {
        controlsVisible,
        resetHideTimer,
    };
};
