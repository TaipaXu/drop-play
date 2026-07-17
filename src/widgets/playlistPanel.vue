<template>
    <div
    class="playlist"
    :class="{ 'playlist--open': open }"
    :inert="!open"
    :aria-hidden="!open"
    ref="panelRef"
    data-player-chrome>
        <div class="playlist__header">
            <h2 id="playlist-title" class="playlist__title">
                {{ t('playlistTitle') }} ({{ items.length }})
            </h2>
            <div class="playlist__actions">
                <!-- add files -->
                <button
                class="playlist__action-btn playlist__add-files"
                type="button"
                :title="t('addFiles')"
                :aria-label="t('addFiles')"
                @click="openFilePicker">
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                        <path
                        d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm0 2.8L17.2 8H14V4.8zM13 11h-2v3H8v2h3v3h2v-3h3v-2h-3v-3z"
                        fill="currentColor" />
                    </svg>
                </button>
                <input
                ref="fileInputRef"
                class="playlist__file-input"
                type="file"
                hidden
                multiple
                :accept="videoFileAccept"
                @change="onFileInputChange" />
                <!-- sort -->
                <div class="playlist__sort-wrap">
                    <button
                    class="playlist__action-btn"
                    type="button"
                    @click="showSort = !showSort"
                    :title="t('sort')"
                    :aria-label="t('sort')"
                    :aria-expanded="showSort">
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
                        type="button"
                        :class="{ 'playlist__sort-option--active': sortKey === opt.key }"
                        :aria-pressed="sortKey === opt.key"
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
                type="button"
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
                type="button"
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
        <ol
        v-else
        class="playlist__list"
        aria-labelledby="playlist-title"
        @dragover.prevent
        @drop.prevent="onDrop">
            <li
            v-for="(item, index) in items"
            :key="item.id"
            class="playlist__item"
            :data-playlist-id="item.id"
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
            ">
                <button
                class="playlist__select"
                type="button"
                :aria-current="index === currentIndex ? 'true' : undefined"
                @click="$emit('select', item.id)">
                    <span class="playlist__index">
                        <span
                        v-if="index === currentIndex"
                        class="playlist__current-marker"
                        aria-hidden="true">▶</span>
                        <span v-else>{{ index + 1 }}</span>
                    </span>
                    <span class="playlist__name" :title="item.name">{{ item.name }}</span>
                </button>
                <div class="playlist__item-actions">
                    <button
                    class="playlist__item-action"
                    type="button"
                    :disabled="index === 0"
                    :title="t('moveUp')"
                    :aria-label="itemActionLabel('moveUp', item.name)"
                    @click="moveItem(index, -1)">
                        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                            <path d="M7 14l5-5 5 5H7z" fill="currentColor" />
                        </svg>
                    </button>
                    <button
                    class="playlist__item-action"
                    type="button"
                    :disabled="index === items.length - 1"
                    :title="t('moveDown')"
                    :aria-label="itemActionLabel('moveDown', item.name)"
                    @click="moveItem(index, 1)">
                        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                            <path d="M7 10l5 5 5-5H7z" fill="currentColor" />
                        </svg>
                    </button>
                    <button
                    class="playlist__item-action playlist__remove"
                    type="button"
                    :title="t('remove')"
                    :aria-label="itemActionLabel('remove', item.name)"
                    @click="removeItem(item.id, index)">
                        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                            <path
                            d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                            fill="currentColor" />
                        </svg>
                    </button>
                </div>
            </li>
        </ol>
    </div>
    <!-- toggle button -->
    <button
    class="playlist-toggle"
    :class="{ 'playlist-toggle--visible': visible }"
    :inert="!visible"
    :aria-hidden="!visible"
    data-player-chrome
    type="button"
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
import { computed, nextTick, ref } from 'vue';
import { useI18n } from '../composables/useI18n';
import { videoFileAccept, type PlaylistItem, type SortKey } from '../stores/playlist';

const props = defineProps<{
    open: boolean;
    items: PlaylistItem[];
    currentIndex: number;
    sortKey: SortKey;
    visible: boolean;
}>();

const showSort = ref(false);
const dragId = ref<string | null>(null);
const dragOverId = ref<string | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);
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

const openFilePicker = () => {
    fileInputRef.value?.click();
};

const onFileInputChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);

    if (files.length > 0) emit('addFiles', files);

    input.value = '';
};

const itemActionLabel = (action: 'moveDown' | 'moveUp' | 'remove', name: string) =>
    `${t(action)}: ${name}`;

const findItemElement = (id: string) =>
    Array.from(panelRef.value?.querySelectorAll<HTMLElement>('.playlist__item') ?? []).find(
        (element) => element.dataset.playlistId === id,
    );

const moveItem = async (index: number, direction: -1 | 1) => {
    const item = props.items[index];
    const target = props.items[index + direction];

    if (!item || !target) return;

    emit('moveItem', item.id, target.id);
    await nextTick();

    const movedItem = findItemElement(item.id);
    const actionIndex = direction === -1 ? 0 : 1;
    const action = movedItem?.querySelectorAll<HTMLButtonElement>('.playlist__item-action')[
        actionIndex
    ];

    if (action && !action.disabled) action.focus();
    else movedItem?.querySelector<HTMLButtonElement>('.playlist__select')?.focus();
};

const removeItem = async (id: string, index: number) => {
    const fallbackId = props.items[index + 1]?.id ?? props.items[index - 1]?.id ?? null;

    emit('remove', id);
    await nextTick();

    if (fallbackId) {
        findItemElement(fallbackId)
            ?.querySelector<HTMLButtonElement>('.playlist__select')
            ?.focus();
        return;
    }

    panelRef.value?.querySelector<HTMLButtonElement>('.playlist__add-files')?.focus();
};

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
    background: var(--color-floating-bg);
    border: 1px solid var(--color-floating-border);
    color: var(--color-floating-text);
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
        background 0.2s,
        border-color 0.2s,
        box-shadow 0.2s;

    &--visible {
        opacity: 1;
        pointer-events: auto;
    }

    &:hover {
        background: var(--color-floating-bg-hover);
        border-color: var(--color-floating-border-hover);
        box-shadow: var(--shadow-floating-hover);
    }
}

.playlist {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 320px;
    background: var(--color-panel-bg);
    backdrop-filter: blur(12px);
    border-left: 1px solid var(--color-panel-border);
    z-index: 120;
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
        border-bottom: 1px solid var(--color-panel-border);
        flex-shrink: 0;
    }

    &__title {
        margin: 0;
        color: var(--color-panel-text);
        font-size: 14px;
        font-weight: 600;
    }

    &__actions {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    &__action-btn {
        position: relative;
        background: none;
        border: none;
        color: var(--color-panel-muted);
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        display: flex;
        align-items: center;

        &:hover:not(:disabled) {
            background: var(--color-panel-hover);
            color: var(--color-panel-text);
        }

        &:focus-within {
            background: var(--color-panel-hover);
            color: var(--color-panel-text);
            outline: 2px solid var(--color-focus-ring);
            outline-offset: 2px;
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
        background: var(--color-menu-bg);
        border: 1px solid var(--color-floating-border);
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
        color: var(--color-floating-muted);
        font-size: 13px;
        padding: 8px 14px;
        cursor: pointer;
        text-align: left;
        font-family: inherit;
        white-space: nowrap;

        &:hover {
            background: var(--color-floating-hover);
        }

        &--active {
            color: var(--color-accent-text);
            font-weight: 600;
        }
    }

    &__empty {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--color-panel-faint);
        font-size: 14px;
        padding: 24px;
        text-align: center;
    }

    &__list {
        flex: 1;
        overflow-y: auto;
        margin: 0;
        padding: 4px 0;
        list-style: none;

        &::-webkit-scrollbar {
            width: 6px;
        }

        &::-webkit-scrollbar-thumb {
            background: var(--color-scrollbar-thumb);
            border-radius: 3px;
        }
    }

    &__item {
        position: relative;
        display: flex;
        align-items: center;
        color: var(--color-panel-muted);
        font-size: 13px;
        transition: background 0.15s;
        user-select: none;

        &:hover {
            background: var(--color-panel-hover);
        }

        &:focus-within {
            background: var(--color-panel-hover);
        }

        &--active {
            background: var(--color-panel-active-bg);
            color: var(--color-accent-text);
            box-shadow: inset 3px 0 var(--color-accent-fill);
            font-weight: 600;

            .playlist__index {
                color: var(--color-accent-text);
            }
        }

        &--drag-over {
            box-shadow: inset 0 2px var(--color-accent-fill);
        }
    }

    &__select {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        min-width: 0;
        padding: 10px 102px 10px 16px;
        border: none;
        background: none;
        color: inherit;
        cursor: pointer;
        font: inherit;
        text-align: left;

        &:focus-visible {
            outline: 2px solid var(--color-focus-ring);
            outline-offset: -2px;
        }
    }

    &__index {
        flex-shrink: 0;
        width: 24px;
        text-align: center;
        font-size: 12px;
        color: var(--color-panel-faint);
        font-variant-numeric: tabular-nums;
    }

    &__current-marker {
        font-size: 10px;
    }

    &__name {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    &__item-actions {
        position: absolute;
        top: 50%;
        right: 10px;
        display: flex;
        gap: 2px;
        transform: translateY(-50%);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.15s;

        .playlist__item:hover &,
        .playlist__item:focus-within & {
            opacity: 1;
            pointer-events: auto;
        }
    }

    &__item-action {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 26px;
        height: 26px;
        padding: 0;
        background: none;
        border: none;
        color: var(--color-panel-faint);
        cursor: pointer;
        border-radius: 4px;
        transition: color 0.15s, background 0.15s;

        &:hover:not(:disabled) {
            background: var(--color-panel-hover);
            color: var(--color-panel-text);
        }

        &:focus-visible {
            outline: 2px solid var(--color-focus-ring);
            outline-offset: 1px;
        }

        &:disabled {
            cursor: default;
            opacity: 0.28;
        }
    }

    &__remove:hover:not(:disabled) {
        color: var(--color-danger);
    }
}

@media (hover: none), (pointer: coarse) {
    .playlist__item-actions {
        opacity: 1;
        pointer-events: auto;
    }
}
</style>
