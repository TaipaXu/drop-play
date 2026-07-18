import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { usePlaylistStore } from '@/stores/playlist';

const videoFile = (name: string, type = 'video/mp4') => new File(['video'], name, { type });

describe('playlist store', () => {
    let revokeObjectURL: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        setActivePinia(createPinia());
        let objectUrlId = 0;
        vi.spyOn(URL, 'createObjectURL').mockImplementation(() => `blob:video-${objectUrlId++}`);
        revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    });

    it('accepts video MIME types and known extensions while reporting rejected files', () => {
        const store = usePlaylistStore();
        const result = store.addFiles([
            videoFile('typed.custom'),
            videoFile('extension.MKV', ''),
            videoFile('notes.txt', 'text/plain'),
        ]);

        expect(result).toEqual({
            accepted: ['typed.custom', 'extension.MKV'],
            rejected: ['notes.txt'],
        });
        expect(store.items.map((item) => item.name)).toEqual(['typed', 'extension']);
        expect(store.currentItem?.fileName).toBe('typed.custom');
    });

    it('keeps the current item when appending and selects the first new item when asked to play', () => {
        const store = usePlaylistStore();
        store.addFiles([videoFile('first.mp4')]);
        const firstId = store.currentItem?.id;

        store.addFiles([videoFile('second.mp4')]);
        expect(store.currentItem?.id).toBe(firstId);

        store.addFilesAndPlay([videoFile('third.mp4'), videoFile('fourth.mp4')]);
        expect(store.currentItem?.fileName).toBe('third.mp4');
    });

    it('wraps next and previous navigation around the playlist', () => {
        const store = usePlaylistStore();
        store.addFiles([videoFile('one.mp4'), videoFile('two.mp4')]);

        store.playPrev();
        expect(store.currentItem?.fileName).toBe('two.mp4');
        store.playNext();
        expect(store.currentItem?.fileName).toBe('one.mp4');
    });

    it('switches to custom ordering when items are moved in either direction', () => {
        const store = usePlaylistStore();
        store.addFiles([videoFile('one.mp4'), videoFile('two.mp4'), videoFile('three.mp4')]);
        const [one, two, three] = store.items;

        expect(one && two && three).toBeTruthy();
        store.moveItem(one!.id, three!.id);
        expect(store.items.map((item) => item.fileName)).toEqual([
            'two.mp4',
            'three.mp4',
            'one.mp4',
        ]);
        expect(store.sortKey).toBe('custom');

        store.moveItem(one!.id, two!.id);
        expect(store.items.map((item) => item.fileName)).toEqual([
            'one.mp4',
            'two.mp4',
            'three.mp4',
        ]);
    });

    it('sorts names naturally for the requested locale', () => {
        const store = usePlaylistStore();
        store.addFiles([
            videoFile('episode-10.mp4'),
            videoFile('episode-2.mp4'),
            videoFile('episode-1.mp4'),
        ]);

        store.sort('name-asc', 'en-US');
        expect(store.items.map((item) => item.name)).toEqual([
            'episode-1',
            'episode-2',
            'episode-10',
        ]);
    });

    it('revokes Object URLs when items are removed or cleared', () => {
        const store = usePlaylistStore();
        store.addFiles([videoFile('one.mp4'), videoFile('two.mp4'), videoFile('three.mp4')]);
        const [one, two, three] = store.items;

        expect(one && two && three).toBeTruthy();
        store.setCurrent(two!.id);
        store.remove(two!.id);

        expect(revokeObjectURL).toHaveBeenCalledWith(two!.url);
        expect(store.currentItem?.id).toBe(three!.id);

        store.clear();
        expect(revokeObjectURL).toHaveBeenCalledWith(one!.url);
        expect(revokeObjectURL).toHaveBeenCalledWith(three!.url);
        expect(revokeObjectURL).toHaveBeenCalledTimes(3);
        expect(store.items).toEqual([]);
        expect(store.currentItem).toBeNull();
    });
});
