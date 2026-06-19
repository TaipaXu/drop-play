<template>
    <div class="playlist" :class="{ 'playlist--open': open }">
        <div class="playlist__header">
            <span class="playlist__title">{{ t('playlistTitle') }} ({{ items.length }})</span>
            <div class="playlist__actions">
                <!-- sort -->
                <div class="playlist__sort-wrap">
                    <button
                    class="playlist__action-btn"
                    @click="showSort = !showSort"
                    :title="t('sort')"
                    :aria-label="t('sort')">
                        <svg viewBox="0 0 24 24" width="18" height="18">
                            <path
                            d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z"
                            fill="currentColor" />
                        </svg>
                    </button>
                    <div v-if="showSort" class="playlist__sort-menu">
                        <button
                        v-for="opt in sortOptions"
                        :key="opt.key"
                        class="playlist__sort-option"
                        :class="{ 'playlist__sort-option--active': sortKey === opt.key }"
                        @click="
                            $emit('sort', opt.key);
                            showSort = false;
                        ">
                            {{ opt.label }}
                        </button>
                    </div>
                </div>
                <!-- clear -->
                <button
                class="playlist__action-btn"
                @click="$emit('clear')"
                :title="t('clear')"
                :aria-label="t('clear')"
                :disabled="items.length === 0">
                    <svg viewBox="0 0 24 24" width="18" height="18">
                        <path
                        d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                        fill="currentColor" />
                    </svg>
                </button>
                <!-- close -->
                <button
                class="playlist__action-btn"
                @click="$emit('close')"
                :title="t('close')"
                :aria-label="t('close')">
                    <svg viewBox="0 0 24 24" width="18" height="18">
                        <path
                        d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                        fill="currentColor" />
                    </svg>
                </button>
            </div>
        </div>
        <div
        v-if="items.length === 0"
        class="playlist__empty"
        @dragover.prevent
        @drop.prevent="onDrop">
            {{ t('playlistEmpty') }}
        </div>
        <div v-else class="playlist__list" @dragover.prevent @drop.prevent="onDrop">
            <div
            v-for="(item, index) in items"
            :key="item.id"
            class="playlist__item"
            :class="{
                'playlist__item--active': index === currentIndex,
                'playlist__item--drag-over': dragOverId === item.id,
            }"
            draggable="true"
            @dragstart="onDragStart($event, item.id)"
            @dragover.prevent="onDragOverItem($event, item.id)"
            @dragleave="dragOverId = null"
            @drop.prevent="onDropItem($event, item.id)"
            @dragend="
                dragId = null;
                dragOverId = null;
            "
            @click="$emit('select', item.id)">
                <span class="playlist__index">{{ index + 1 }}</span>
                <span class="playlist__name" :title="item.name">{{ item.name }}</span>
                <button
                class="playlist__remove"
                @click.stop="$emit('remove', item.id)"
                :title="t('remove')"
                :aria-label="t('remove')">
                    <svg viewBox="0 0 24 24" width="14" height="14">
                        <path
                        d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                        fill="currentColor" />
                    </svg>
                </button>
            </div>
        </div>
    </div>
    <!-- toggle button -->
    <button
    class="playlist-toggle"
    :class="{ 'playlist-toggle--visible': visible }"
    @click="$emit('toggle')"
    :title="open ? t('closePlaylist') : t('openPlaylist')"
    :aria-label="open ? t('closePlaylist') : t('openPlaylist')">
        <svg viewBox="0 0 24 24" width="22" height="22">
            <path
            d="M4 10h12v2H4v-2zm0-4h12v2H4V6zm0 8h8v2H4v-2zm10 0v6l5-3-5-3z"
            fill="currentColor" />
        </svg>
    </button>
</template>

<script setup vapor lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from '../composables/useI18n';
import type { PlaylistItem, SortKey } from '../stores/playlist';

defineProps<{
    open: boolean;
    items: PlaylistItem[];
    currentIndex: number;
    sortKey: SortKey;
    visible: boolean;
}>();

const showSort = ref(false);
const dragId = ref<string | null>(null);
const dragOverId = ref<string | null>(null);
const { t } = useI18n();

const sortOptions = computed<{ key: SortKey; label: string }[]>(() => [
    { key: 'custom', label: t('sortCustom') },
    { key: 'name-asc', label: t('sortNameAsc') },
    { key: 'name-desc', label: t('sortNameDesc') },
    { key: 'added-asc', label: t('sortAddedAsc') },
    { key: 'added-desc', label: t('sortAddedDesc') },
]);

const emit = defineEmits<{
    toggle: [];
    close: [];
    select: [id: string];
    remove: [id: string];
    clear: [];
    sort: [key: SortKey];
    addFiles: [files: File[]];
    moveItem: [fromId: string, toId: string];
}>();

const onDragStart = (e: DragEvent, id: string) => {
    dragId.value = id;
    if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', id);
    }
};

const onDragOverItem = (e: DragEvent, id: string) => {
    if (dragId.value && dragId.value !== id) {
        dragOverId.value = id;
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    }
};

const onDropItem = (e: DragEvent, toId: string) => {
    dragOverId.value = null;

    const files = Array.from(e.dataTransfer?.files ?? []);
    if (files.length > 0) {
        e.stopPropagation();
        emit('addFiles', files);
        dragId.value = null;
        return;
    }

    e.stopPropagation();
    if (dragId.value && dragId.value !== toId) {
        emit('moveItem', dragId.value, toId);
    }
    dragId.value = null;
};

const onDrop = (e: DragEvent) => {
    const files = Array.from(e.dataTransfer?.files ?? []);
    if (files.length > 0) {
        emit('addFiles', files);
    }
};
</script>

<style lang="scss">
.playlist-toggle {
    position: fixed;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 100;
    background: rgba(0, 0, 0, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #fff;
    cursor: pointer;
    padding: 10px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    pointer-events: none;
    transition:
        opacity 0.3s,
        background 0.2s;

    &--visible {
        opacity: 1;
        pointer-events: auto;
    }

    &:hover {
        background: rgba(0, 0, 0, 0.9);
    }
}

.playlist {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 320px;
    background: rgba(20, 20, 20, 0.95);
    backdrop-filter: blur(12px);
    border-left: 1px solid rgba(255, 255, 255, 0.08);
    z-index: 90;
    display: flex;
    flex-direction: column;
    transform: translateX(100%);
    transition: transform 0.3s ease;

    &--open {
        transform: translateX(0);
    }

    &__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        flex-shrink: 0;
    }

    &__title {
        color: #fff;
        font-size: 14px;
        font-weight: 600;
    }

    &__actions {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    &__action-btn {
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.6);
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        display: flex;
        align-items: center;

        &:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
        }

        &:disabled {
            opacity: 0.3;
            cursor: default;
        }
    }

    &__sort-wrap {
        position: relative;
    }

    &__sort-menu {
        position: absolute;
        top: 100%;
        right: 0;
        background: rgba(30, 30, 30, 0.98);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 8px;
        padding: 4px 0;
        margin-top: 4px;
        min-width: 120px;
        z-index: 10;
    }

    &__sort-option {
        display: block;
        width: 100%;
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.8);
        font-size: 13px;
        padding: 8px 14px;
        cursor: pointer;
        text-align: left;
        font-family: inherit;
        white-space: nowrap;

        &:hover {
            background: rgba(255, 255, 255, 0.08);
        }

        &--active {
            color: #00a1d6;
        }
    }

    &__empty {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(255, 255, 255, 0.35);
        font-size: 14px;
        padding: 24px;
        text-align: center;
    }

    &__list {
        flex: 1;
        overflow-y: auto;
        padding: 4px 0;

        &::-webkit-scrollbar {
            width: 6px;
        }

        &::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.15);
            border-radius: 3px;
        }
    }

    &__item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 16px;
        cursor: pointer;
        color: rgba(255, 255, 255, 0.75);
        font-size: 13px;
        transition: background 0.15s;
        user-select: none;

        &:hover {
            background: rgba(255, 255, 255, 0.06);
        }

        &--active {
            background: rgba(0, 161, 214, 0.15);
            color: #00a1d6;

            .playlist__index {
                color: #00a1d6;
            }
        }

        &--drag-over {
            border-top: 2px solid #00a1d6;
            padding-top: 8px;
        }
    }

    &__index {
        flex-shrink: 0;
        width: 24px;
        text-align: center;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.35);
        font-variant-numeric: tabular-nums;
    }

    &__name {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    &__remove {
        flex-shrink: 0;
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.3);
        cursor: pointer;
        padding: 2px;
        border-radius: 2px;
        display: flex;
        align-items: center;
        opacity: 0;
        transition:
            opacity 0.15s,
            color 0.15s;

        .playlist__item:hover & {
            opacity: 1;
        }

        &:hover {
            color: #f44336;
        }
    }
}
</style>
