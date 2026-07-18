import { createApp, defineComponent, h } from 'vue';

export const mountComposable = <T>(setup: () => T) => {
    let result: T | undefined;
    const host = document.createElement('div');
    const app = createApp(
        defineComponent({
            setup() {
                result = setup();
                return () => h('div');
            },
        }),
    );

    document.body.append(host);
    app.mount(host);

    const unmount = () => {
        app.unmount();
        host.remove();
    };

    return {
        result: result as T,
        unmount,
    };
};
