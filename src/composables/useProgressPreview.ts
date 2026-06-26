import { computed, onBeforeUnmount, ref, type Ref } from 'vue';

const previewSeekThrottle = 100;
const keyboardSeekStep = 5;
const keyboardPageSeekStep = 30;

export interface ProgressPreviewOptions {
    currentTime: Readonly<Ref<number>>;
    duration: Readonly<Ref<number>>;
    seek: (time: number) => void;
}

export const useProgressPreview = ({ currentTime, duration, seek }: ProgressPreviewOptions) => {
    const dragging = ref(false);
    const dragTime = ref(0);
    const hoverTime = ref<number | null>(null);
    const hoverPercent = ref(0);
    const progressBarRef = ref<HTMLElement | null>(null);
    const thumbnailRef = ref<HTMLCanvasElement | null>(null);
    const previewVideoRef = ref<HTMLVideoElement | null>(null);
    let activePointerId: number | null = null;
    let activePointerTarget: HTMLElement | null = null;
    let lastSeekTime = 0;
    let stopDocumentDragListeners: (() => void) | null = null;

    const hasSeekableDuration = computed(
        () => Number.isFinite(duration.value) && duration.value > 0,
    );

    const clampTime = (time: number) => Math.max(0, Math.min(duration.value, time));

    const playedTime = computed(() => {
        if (!hasSeekableDuration.value) return 0;

        const time = dragging.value ? dragTime.value : currentTime.value;

        return clampTime(time);
    });

    const playedPercent = computed(() => {
        if (!hasSeekableDuration.value) return 0;

        return (playedTime.value / duration.value) * 100;
    });

    const getTimeFromEvent = (event: PointerEvent) => {
        const progressBar = progressBarRef.value;
        if (!progressBar || !hasSeekableDuration.value) return null;

        const rect = progressBar.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));

        return clampTime(ratio * duration.value);
    };

    const setHoverTime = (time: number) => {
        hoverTime.value = time;
        hoverPercent.value = (time / duration.value) * 100;
    };

    const clearHoverTime = () => {
        hoverTime.value = null;
        hoverPercent.value = 0;
    };

    const seekPreviewVideo = (time: number) => {
        const now = Date.now();
        const previewVideo = previewVideoRef.value;
        if (now - lastSeekTime <= previewSeekThrottle || !previewVideo) return;

        lastSeekTime = now;
        try {
            previewVideo.currentTime = time;
        } catch {
            lastSeekTime = 0;
        }
    };

    const updatePreviewFromPointer = (event: PointerEvent) => {
        const time = getTimeFromEvent(event);
        if (time === null) {
            clearHoverTime();
            return;
        }

        setHoverTime(time);
        seekPreviewVideo(time);
    };

    const drawThumbnail = () => {
        const video = previewVideoRef.value;
        const canvas = thumbnailRef.value;
        if (!video || !canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    };

    const stopDragging = () => {
        dragging.value = false;
        clearHoverTime();
        stopDocumentDragListeners?.();
        stopDocumentDragListeners = null;

        if (activePointerId !== null && activePointerTarget?.hasPointerCapture(activePointerId)) {
            activePointerTarget.releasePointerCapture(activePointerId);
        }

        activePointerId = null;
        activePointerTarget = null;
    };

    const onProgressPointerDown = (event: PointerEvent) => {
        if (event.button !== 0) return;

        const time = getTimeFromEvent(event);
        if (time === null) return;

        event.preventDefault();
        event.stopPropagation();
        dragging.value = true;
        dragTime.value = time;
        activePointerId = event.pointerId;
        activePointerTarget =
            event.currentTarget instanceof HTMLElement ? event.currentTarget : progressBarRef.value;
        activePointerTarget?.setPointerCapture(event.pointerId);
        setHoverTime(time);
        seek(time);
        seekPreviewVideo(time);

        const onMove = (moveEvent: PointerEvent) => {
            if (moveEvent.pointerId !== activePointerId) return;

            const nextTime = getTimeFromEvent(moveEvent);
            if (nextTime === null) return;

            moveEvent.preventDefault();
            dragTime.value = nextTime;
            setHoverTime(nextTime);
            seek(nextTime);
            seekPreviewVideo(nextTime);
        };

        const onUp = (upEvent: PointerEvent) => {
            if (upEvent.pointerId !== activePointerId) return;

            upEvent.preventDefault();
            stopDragging();
        };

        stopDocumentDragListeners?.();
        stopDocumentDragListeners = () => {
            document.removeEventListener('pointermove', onMove);
            document.removeEventListener('pointerup', onUp);
            document.removeEventListener('pointercancel', onUp);
        };

        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
        document.addEventListener('pointercancel', onUp);
    };

    const onProgressPointerMove = (event: PointerEvent) => {
        if (dragging.value || event.pointerType === 'touch') return;

        updatePreviewFromPointer(event);
    };

    const onProgressPointerCancel = (event: PointerEvent) => {
        if (event.pointerId === activePointerId) stopDragging();
    };

    const onProgressPointerLeave = () => {
        if (!dragging.value) {
            clearHoverTime();
        }
    };

    const onProgressFocus = () => {
        if (!hasSeekableDuration.value) return;

        setHoverTime(playedTime.value);
        seekPreviewVideo(playedTime.value);
    };

    const onProgressBlur = () => {
        if (!dragging.value) clearHoverTime();
    };

    const getKeyboardSeekTime = (event: KeyboardEvent) => {
        if (event.ctrlKey || event.metaKey || event.altKey) return null;

        switch (event.code) {
            case 'ArrowLeft':
            case 'ArrowDown':
                return clampTime(playedTime.value - keyboardSeekStep);
            case 'ArrowRight':
            case 'ArrowUp':
                return clampTime(playedTime.value + keyboardSeekStep);
            case 'PageDown':
                return clampTime(playedTime.value - keyboardPageSeekStep);
            case 'PageUp':
                return clampTime(playedTime.value + keyboardPageSeekStep);
            case 'Home':
                return 0;
            case 'End':
                return duration.value;
            default:
                return null;
        }
    };

    const onProgressKeydown = (event: KeyboardEvent) => {
        if (!hasSeekableDuration.value) return;

        const time = getKeyboardSeekTime(event);
        if (time === null) return;

        event.preventDefault();
        event.stopPropagation();
        setHoverTime(time);
        seek(time);
        seekPreviewVideo(time);
    };

    onBeforeUnmount(() => {
        stopDocumentDragListeners?.();
    });

    return {
        dragging,
        drawThumbnail,
        hasSeekableDuration,
        hoverPercent,
        hoverTime,
        onProgressBlur,
        onProgressFocus,
        onProgressKeydown,
        onProgressPointerCancel,
        onProgressPointerDown,
        onProgressPointerLeave,
        onProgressPointerMove,
        playedPercent,
        playedTime,
        previewVideoRef,
        progressBarRef,
        thumbnailRef,
    };
};
