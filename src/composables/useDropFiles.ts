import { ref } from 'vue';

export const useDropFiles = (onFiles: (files: File[]) => void) => {
    const dragging = ref(false);
    const dragDepth = ref(0);

    const hasFiles = (event: DragEvent) =>
        Array.from(event.dataTransfer?.types ?? []).includes('Files');

    const resetDragging = () => {
        dragDepth.value = 0;
        dragging.value = false;
    };

    const onDragEnter = (event: DragEvent) => {
        if (!hasFiles(event)) return;

        dragDepth.value += 1;
        dragging.value = true;
    };

    const onDragOver = (event: DragEvent) => {
        if (!hasFiles(event)) return;

        dragging.value = true;
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    };

    const onDragLeave = (event: DragEvent) => {
        if (!hasFiles(event)) return;

        dragDepth.value = Math.max(0, dragDepth.value - 1);
        dragging.value = dragDepth.value > 0;
    };

    const onDrop = (event: DragEvent) => {
        resetDragging();

        const files = Array.from(event.dataTransfer?.files ?? []);
        if (files.length > 0) {
            onFiles(files);
        }
    };

    return {
        dragging,
        onDragEnter,
        onDragOver,
        onDragLeave,
        onDrop,
    };
};
