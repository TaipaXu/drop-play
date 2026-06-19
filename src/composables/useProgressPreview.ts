import { computed, onBeforeUnmount, ref, type Ref } from 'vue';

const previewSeekThrottle = 100;

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
    let lastSeekTime = 0;
    let stopDocumentDragListeners: (() => void) | null = null;

    const hasSeekableDuration = computed(
        () => Number.isFinite(duration.value) && duration.value > 0,
    );

    const playedPercent = computed(() => {
        if (!hasSeekableDuration.value) return 0;

        const time = dragging.value ? dragTime.value : currentTime.value;
        const safeTime = Math.max(0, Math.min(duration.value, time));

        return (safeTime / duration.value) * 100;
    });

    const getTimeFromEvent = (event: MouseEvent) => {
        const progressBar = progressBarRef.value;
        if (!progressBar || !hasSeekableDuration.value) return null;

        const rect = progressBar.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));

        return ratio * duration.value;
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

    const onProgressHover = (event: MouseEvent) => {
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

    const onProgressMouseDown = (event: MouseEvent) => {
        const time = getTimeFromEvent(event);
        if (time === null) return;

        event.preventDefault();
        dragging.value = true;
        dragTime.value = time;
        setHoverTime(time);
        seek(time);

        const onMove = (moveEvent: MouseEvent) => {
            const nextTime = getTimeFromEvent(moveEvent);
            if (nextTime === null) return;

            dragTime.value = nextTime;
            setHoverTime(nextTime);
            seek(nextTime);
            seekPreviewVideo(nextTime);
        };

        const onUp = () => {
            dragging.value = false;
            clearHoverTime();
            stopDocumentDragListeners?.();
            stopDocumentDragListeners = null;
        };

        stopDocumentDragListeners?.();
        stopDocumentDragListeners = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    };

    const onProgressLeave = () => {
        if (!dragging.value) {
            clearHoverTime();
        }
    };

    onBeforeUnmount(() => {
        stopDocumentDragListeners?.();
    });

    return {
        dragging,
        drawThumbnail,
        hoverPercent,
        hoverTime,
        onProgressHover,
        onProgressLeave,
        onProgressMouseDown,
        playedPercent,
        previewVideoRef,
        progressBarRef,
        thumbnailRef,
    };
};
