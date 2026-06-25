import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

export interface PlaylistItem {
    id: string;
    manualOrder: number;
    name: string;
    order: number;
    url: string;
}

export type SortKey = 'custom' | 'name-asc' | 'name-desc' | 'added-asc' | 'added-desc';

const videoExtensionList = [
    '3g2',
    '3gp',
    'avi',
    'flv',
    'm2ts',
    'm4v',
    'mkv',
    'mov',
    'mp4',
    'mpeg',
    'mpg',
    'mts',
    'ogg',
    'ogv',
    'ts',
    'webm',
    'wmv',
] as const;

export const videoFileAccept = [
    'video/*',
    ...videoExtensionList.map((extension) => `.${extension}`),
].join(',');

const videoExtensions = new Set<string>(videoExtensionList);

const isVideoFile = (file: File) => {
    if (file.type.startsWith('video/')) return true;
    const extension = file.name.toLowerCase().split('.').pop();
    return extension ? videoExtensions.has(extension) : false;
};

const createPlaylistId = () => {
    if (crypto.randomUUID) return crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

export const usePlaylistStore = defineStore('playlist', () => {
    const items = ref<PlaylistItem[]>([]);
    const currentId = ref<string | null>(null);
    const sortKey = ref<SortKey>('added-asc');
    let nextOrder = 0;

    const currentIndex = computed(() =>
        currentId.value ? items.value.findIndex((item) => item.id === currentId.value) : -1,
    );

    const currentItem = computed(
        () => items.value.find((item) => item.id === currentId.value) ?? null,
    );

    const applySort = () => {
        switch (sortKey.value) {
            case 'custom':
                items.value.sort((a, b) => a.manualOrder - b.manualOrder);
                break;
            case 'name-asc':
                items.value.sort((a, b) => a.name.localeCompare(b.name, 'zh'));
                break;
            case 'name-desc':
                items.value.sort((a, b) => b.name.localeCompare(a.name, 'zh'));
                break;
            case 'added-asc':
                items.value.sort((a, b) => a.order - b.order);
                break;
            case 'added-desc':
                items.value.sort((a, b) => b.order - a.order);
                break;
        }
    };

    const syncManualOrder = () => {
        items.value.forEach((item, index) => {
            item.manualOrder = index;
        });
    };

    const appendFiles = (files: File[]) => {
        const newItems: PlaylistItem[] = files.filter(isVideoFile).map((f) => ({
            id: createPlaylistId(),
            manualOrder: nextOrder,
            name: f.name.replace(/\.[^.]+$/, ''),
            order: nextOrder++,
            url: URL.createObjectURL(f),
        }));
        if (newItems.length === 0) return null;
        items.value.push(...newItems);
        applySort();
        return newItems[0]?.id ?? null;
    };

    const addFiles = (files: File[]) => {
        const firstNewId = appendFiles(files);
        if (firstNewId === null) return;
        if (currentId.value === null) {
            currentId.value = firstNewId;
        }
    };

    const addFilesAndPlay = (files: File[]) => {
        const firstNewId = appendFiles(files);
        if (firstNewId === null) return;
        currentId.value = firstNewId;
    };

    const removeItem = (id: string, selectFallback: boolean) => {
        const idx = items.value.findIndex((i) => i.id === id);
        if (idx === -1) return;
        const item = items.value[idx];
        const wasCurrent = currentId.value === id;
        if (item) URL.revokeObjectURL(item.url);
        items.value.splice(idx, 1);

        if (items.value.length === 0) {
            currentId.value = null;
        } else if (wasCurrent && selectFallback) {
            currentId.value = items.value[Math.min(idx, items.value.length - 1)]?.id ?? null;
        } else if (wasCurrent) {
            currentId.value = null;
        }
    };

    const remove = (id: string) => {
        removeItem(id, true);
    };

    const removeRejected = (id: string) => {
        removeItem(id, false);
    };

    const clear = () => {
        for (const item of items.value) {
            URL.revokeObjectURL(item.url);
        }
        items.value = [];
        currentId.value = null;
    };

    const setCurrent = (id: string) => {
        if (items.value.some((i) => i.id === id)) currentId.value = id;
    };

    const playNext = () => {
        if (items.value.length === 0) return;
        const nextIndex =
            currentIndex.value === -1 ? 0 : (currentIndex.value + 1) % items.value.length;
        currentId.value = items.value[nextIndex]?.id ?? null;
    };

    const playPrev = () => {
        if (items.value.length === 0) return;
        const nextIndex =
            currentIndex.value === -1
                ? items.value.length - 1
                : (currentIndex.value - 1 + items.value.length) % items.value.length;
        currentId.value = items.value[nextIndex]?.id ?? null;
    };

    const moveItem = (fromId: string, toId: string) => {
        const from = items.value.findIndex((i) => i.id === fromId);
        const to = items.value.findIndex((i) => i.id === toId);
        if (from === -1 || to === -1 || from === to) return;
        const [moved] = items.value.splice(from, 1);
        if (!moved) return;
        items.value.splice(to, 0, moved);
        syncManualOrder();
        sortKey.value = 'custom';
    };

    const sort = (key: SortKey) => {
        sortKey.value = key;
        applySort();
    };

    return {
        items,
        currentIndex,
        currentItem,
        sortKey,
        addFiles,
        addFilesAndPlay,
        remove,
        removeRejected,
        clear,
        setCurrent,
        playNext,
        playPrev,
        moveItem,
        sort,
    };
});
