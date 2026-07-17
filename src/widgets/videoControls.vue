<template>
    <div
    class="controls"
    :class="{ 'controls--visible': visible }"
    :inert="!visible"
    :aria-hidden="!visible"
    data-player-chrome>
        <!-- progress bar -->
        <div
        class="controls__progress-bar"
        :class="{ 'controls__progress-bar--dragging': dragging }"
        role="slider"
        :tabindex="hasSeekableDuration ? 0 : -1"
        :aria-label="t('progress')"
        :aria-valuemin="0"
        :aria-valuemax="progressValueMax"
        :aria-valuenow="progressValueNow"
        :aria-valuetext="progressValueText"
        :aria-disabled="!hasSeekableDuration"
        @blur="onProgressBlur"
        @focus="onProgressFocus"
        @keydown="onProgressKeydown"
        @pointercancel="onProgressPointerCancel"
        @pointerdown="onProgressPointerDown"
        @pointerleave="onProgressPointerLeave"
        @pointermove="onProgressPointerMove"
        ref="progressBarRef">
            <div class="controls__progress-bg"></div>
            <div class="controls__progress-buffered" :style="{ width: buffered + '%' }"></div>
            <div class="controls__progress-played" :style="{ width: playedPercent + '%' }"></div>
            <div class="controls__progress-thumb" :style="{ left: playedPercent + '%' }"></div>
            <div
            v-if="hoverTime !== null"
            class="controls__hover-preview"
            :style="{ left: hoverPercent + '%' }">
                <canvas
                ref="thumbnailRef"
                class="controls__thumbnail"
                width="160"
                height="90"></canvas>
                <span class="controls__hover-time">{{ formatTime(hoverTime) }}</span>
            </div>
        </div>

        <div class="controls__bar">
            <div class="controls__left">
                <!-- play / pause -->
                <button
                class="controls__btn controls__btn--play"
                :title="playing ? t('pause') : t('play')"
                :aria-label="playing ? t('pause') : t('play')"
                @click="$emit('togglePlay')">
                    <svg v-if="!playing" viewBox="0 0 24 24" width="22" height="22">
                        <polygon points="6,3 20,12 6,21" fill="currentColor" />
                    </svg>
                    <svg v-else viewBox="0 0 24 24" width="22" height="22">
                        <rect x="5" y="3" width="4" height="18" fill="currentColor" />
                        <rect x="15" y="3" width="4" height="18" fill="currentColor" />
                    </svg>
                </button>

                <!-- time -->
                <span class="controls__time">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
            </div>

            <div class="controls__right">
                <!-- volume -->
                <div class="controls__volume-wrap" @wheel.prevent="onVolumeWheel">
                    <button
                    class="controls__btn"
                    :title="muted || volume === 0 ? t('unmute') : t('mute')"
                    :aria-label="muted || volume === 0 ? t('unmute') : t('mute')"
                    @click="$emit('toggleMute')">
                        <svg viewBox="0 0 24 24" width="20" height="20">
                            <path
                            v-if="muted || volume === 0"
                            d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"
                            fill="currentColor" />
                            <path
                            v-else
                            d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"
                            fill="currentColor" />
                        </svg>
                    </button>
                    <div class="controls__volume-slider-wrap">
                        <input
                        type="range"
                        class="controls__volume-slider"
                        min="0"
                        max="1"
                        step="0.01"
                        :value="volume"
                        :aria-label="t('volume')"
                        @input="
                            $emit('updateVolume', +($event.target as HTMLInputElement).value)
                        " />
                    </div>
                </div>

                <!-- speed -->
                <div ref="speedWrapRef" class="controls__speed-wrap">
                    <button
                    class="controls__btn controls__btn--speed"
                    :title="t('speed')"
                    :aria-label="t('speed')"
                    :aria-expanded="showSpeed"
                    @click="toggleSpeedMenu">
                        {{ speedLabel }}
                    </button>
                    <div v-if="showSpeed" class="controls__speed-menu">
                        <label class="controls__speed-custom">
                            <span class="controls__speed-input-wrap">
                                <input
                                type="number"
                                class="controls__speed-input"
                                :value="customSpeedInput"
                                :min="playbackSpeedMin"
                                :max="playbackSpeedMax"
                                step="0.1"
                                inputmode="decimal"
                                :aria-label="t('speedCustomInput')"
                                @input="onCustomSpeedInput"
                                @change="commitCustomSpeedInput"
                                @keydown.enter.prevent="commitCustomSpeedInput" />
                                <span class="controls__speed-input-suffix">x</span>
                            </span>
                        </label>
                        <button
                        v-for="s in speeds"
                        :key="s"
                        class="controls__speed-option"
                        :class="{ 'controls__speed-option--active': speed === s }"
                        @click="
                            $emit('updateSpeed', s);
                            showSpeed = false;
                        ">
                            {{ s }}x
                        </button>
                    </div>
                </div>

                <!-- screenshot -->
                <button
                class="controls__btn"
                @click="$emit('takeScreenshot')"
                :title="t('screenshot')"
                :aria-label="t('screenshot')">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                        <path
                        d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"
                        fill="currentColor" />
                    </svg>
                </button>

                <!-- hdr -->
                <button
                class="controls__btn controls__btn--hdr"
                :class="{ 'controls__btn--active': hdrEnabled }"
                :title="t('hdr')"
                :aria-label="t('hdr')"
                @click="$emit('toggleHdr')">
                    {{ t('hdr') }}
                </button>

                <!-- fullscreen -->
                <button
                class="controls__btn"
                :title="fullscreen ? t('fullscreenExit') : t('fullscreenEnter')"
                :aria-label="fullscreen ? t('fullscreenExit') : t('fullscreenEnter')"
                @click="$emit('toggleFullscreen')">
                    <svg v-if="!fullscreen" viewBox="0 0 24 24" width="20" height="20">
                        <path
                        d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"
                        fill="currentColor" />
                    </svg>
                    <svg v-else viewBox="0 0 24 24" width="20" height="20">
                        <path
                        d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"
                        fill="currentColor" />
                    </svg>
                </button>
            </div>
        </div>
    </div>
    <video
    v-if="videoUrl"
    ref="previewVideoRef"
    :src="videoUrl"
    preload="auto"
    muted
    class="controls__preview-video"
    @seeked="drawThumbnail"></video>
</template>

<script setup vapor lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, toRef, watch } from 'vue';
import { useI18n } from '../composables/useI18n';
import { useProgressPreview } from '../composables/useProgressPreview';
import {
    playbackSpeedMax,
    playbackSpeedMin,
    playbackSpeeds,
} from '../composables/useVideoPlayer';

const props = defineProps<{
    playing: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    muted: boolean;
    speed: number;
    buffered: number;
    videoUrl: string | null;
    visible: boolean;
    fullscreen: boolean;
    hdrEnabled: boolean;
}>();

const speeds = playbackSpeeds;
const showSpeed = ref(false);
const customSpeedInput = ref('');
const speedWrapRef = ref<HTMLElement | null>(null);
const { t } = useI18n();

const emit = defineEmits<{
    togglePlay: [];
    toggleMute: [];
    updateVolume: [v: number];
    updateSpeed: [v: number];
    seek: [time: number];
    toggleFullscreen: [];
    toggleHdr: [];
    takeScreenshot: [];
}>();

const {
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
} = useProgressPreview({
    currentTime: toRef(props, 'currentTime'),
    duration: toRef(props, 'duration'),
    seek: (time) => emit('seek', time),
});

const formatTime = (s: number) => {
    if (!s || !Number.isFinite(s)) return '00:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

const progressValueMax = computed(() => Math.max(0, Math.round(props.duration)));
const progressValueNow = computed(() => Math.round(playedTime.value));
const progressValueText = computed(
    () => `${formatTime(playedTime.value)} / ${formatTime(props.duration)}`,
);

const formatSpeedValue = (value: number) => (Number.isFinite(value) ? `${value}` : '1');

const speedLabel = computed(() => (props.speed === 1 ? t('speed') : `${formatSpeedValue(props.speed)}x`));

const syncCustomSpeedInput = () => {
    customSpeedInput.value = formatSpeedValue(props.speed);
};

const toggleSpeedMenu = () => {
    showSpeed.value = !showSpeed.value;
    if (showSpeed.value) syncCustomSpeedInput();
};

const onCustomSpeedInput = (event: Event) => {
    customSpeedInput.value = (event.target as HTMLInputElement).value;
};

const commitCustomSpeedInput = () => {
    const inputValue = customSpeedInput.value.trim();
    if (!inputValue) {
        syncCustomSpeedInput();
        return;
    }

    const nextSpeed = Number(inputValue);
    if (!Number.isFinite(nextSpeed)) {
        syncCustomSpeedInput();
        return;
    }

    const clampedSpeed = Math.max(playbackSpeedMin, Math.min(playbackSpeedMax, nextSpeed));
    customSpeedInput.value = formatSpeedValue(clampedSpeed);
    emit('updateSpeed', clampedSpeed);
};

const onVolumeWheel = (e: WheelEvent) => {
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    const newVolume = Math.max(0, Math.min(1, props.volume + delta));
    emit('updateVolume', Math.round(newVolume * 100) / 100);
};

const closeSpeedMenuOnOutsidePointerDown = (event: PointerEvent) => {
    if (!showSpeed.value) return;

    const speedWrap = speedWrapRef.value;
    if (speedWrap && event.composedPath().includes(speedWrap)) return;

    commitCustomSpeedInput();
    showSpeed.value = false;
};

onMounted(() => {
    document.addEventListener('pointerdown', closeSpeedMenuOnOutsidePointerDown);
});

onBeforeUnmount(() => {
    document.removeEventListener('pointerdown', closeSpeedMenuOnOutsidePointerDown);
});

watch(
    () => props.visible,
    (visible) => {
        if (!visible) showSpeed.value = false;
    },
);

watch(
    () => props.speed,
    () => {
        if (showSpeed.value) syncCustomSpeedInput();
    },
);
</script>

<style lang="scss">
.controls {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
    padding-top: 40px;
    opacity: 0;
    transition: opacity 0.3s;
    pointer-events: none;
    z-index: 10;

    &--visible {
        opacity: 1;
        pointer-events: auto;
    }

    // progress bar
    &__progress-bar {
        position: relative;
        height: 4px;
        cursor: pointer;
        margin: 0 12px;
        outline: none;
        touch-action: none;
        transition: height 0.15s;

        &::before {
            content: '';
            position: absolute;
            left: 0;
            right: 0;
            top: -10px;
            bottom: -10px;
        }

        &:focus-visible,
        &:hover,
        &--dragging {
            height: 8px;
        }

        &:focus-visible {
            box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.45);
            border-radius: 4px;
        }

        &--dragging {
            user-select: none;
        }

        &:focus-visible .controls__progress-thumb,
        &:hover .controls__progress-thumb,
        &--dragging .controls__progress-thumb {
            transform: translate(-50%, -50%) scale(1);
        }
    }

    &__progress-bg {
        position: absolute;
        inset: 0;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
    }

    &__progress-buffered {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        background: rgba(255, 255, 255, 0.35);
        border-radius: 4px;
    }

    &__progress-played {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        background: #00a1d6;
        border-radius: 4px;
    }

    &__progress-thumb {
        position: absolute;
        top: 50%;
        width: 14px;
        height: 14px;
        background: #00a1d6;
        border-radius: 50%;
        transform: translate(-50%, -50%) scale(0);
        transition: transform 0.15s;
        z-index: 5;
    }

    &__preview-video {
        position: absolute;
        width: 0;
        height: 0;
        opacity: 0;
        pointer-events: none;
    }

    &__hover-preview {
        position: absolute;
        bottom: 16px;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        pointer-events: none;
        z-index: 20;
    }

    &__thumbnail {
        width: 160px;
        height: 90px;
        background: #000;
        border: 2px solid #fff;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
    }

    &__hover-time {
        background: rgba(0, 0, 0, 0.85);
        color: #fff;
        font-size: 12px;
        padding: 2px 6px;
        border-radius: 4px;
        white-space: nowrap;
        margin-top: 4px;
    }

    // controls bar
    &__bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 40px;
        padding: 0 12px;
    }

    &__left,
    &__right {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    &__btn {
        background: none;
        border: none;
        color: #fff;
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
        border-radius: 4px;

        &:hover {
            background: rgba(255, 255, 255, 0.15);
        }

        &--play svg {
            width: 22px;
            height: 22px;
        }

        &--speed {
            justify-content: center;
            font-size: 13px;
            font-family: inherit;
            min-width: 48px;
        }

        &--hdr {
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.5px;
            font-family: inherit;
            opacity: 0.6;
        }

        &--active {
            opacity: 1;
            color: #f0c040;
        }
    }

    &__time {
        color: #fff;
        font-size: 13px;
        user-select: none;
        font-variant-numeric: tabular-nums;
    }

    // volume
    &__volume-wrap {
        display: flex;
        align-items: center;
        gap: 0;
    }

    &__volume-slider-wrap {
        width: 60px;
        overflow: hidden;
        display: flex;
        align-items: center;
        height: 20px;
    }

    &__volume-slider {
        width: 60px;
        height: 3px;
        accent-color: #00a1d6;
        cursor: pointer;
        margin: 0;
    }

    // speed
    &__speed-wrap {
        position: relative;
    }

    &__speed-menu {
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.9);
        border-radius: 8px;
        padding: 6px 0;
        margin-bottom: 8px;
        display: flex;
        flex-direction: column;
        min-width: 124px;
    }

    &__speed-custom {
        display: flex;
        justify-content: center;
        padding: 4px 10px 6px;
    }

    &__speed-input-wrap {
        position: relative;
        display: flex;
        align-items: center;
        width: 88px;
    }

    &__speed-input {
        box-sizing: border-box;
        width: 100%;
        height: 28px;
        border: 1px solid rgba(255, 255, 255, 0.26);
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.12);
        color: #fff;
        font-family: inherit;
        font-size: 13px;
        text-align: center;
        padding: 0 20px;
        outline: none;

        &:focus {
            border-color: #00a1d6;
        }
    }

    &__speed-input-suffix {
        position: absolute;
        right: 8px;
        color: rgba(255, 255, 255, 0.72);
        font-size: 12px;
        pointer-events: none;
    }

    &__speed-option {
        background: none;
        border: none;
        color: #fff;
        font-size: 13px;
        padding: 6px 16px;
        cursor: pointer;
        text-align: center;
        font-family: inherit;

        &:hover {
            background: rgba(255, 255, 255, 0.15);
        }

        &--active {
            color: #00a1d6;
        }
    }
}
</style>
