import { fileURLToPath, URL } from 'node:url';
import fs from 'node:fs/promises';
import path from 'node:path';

import { defineConfig } from 'vite-plus';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';
import { viteSingleFile } from 'vite-plugin-singlefile';

// https://vite.dev/config/
export default defineConfig({
    staged: {
        '*': 'vp check --fix',
        'index.html': 'eslint --fix',
        '**/*.vue': 'eslint --fix',
    },
    fmt: {
        ignorePatterns: [
            '**/*.vue',
            'index.html',
            'node_modules/**',
            'dist/**',
            'dist-ssr/**',
            '.vite/**',
            '.vscode/**',
        ],
        semi: true,
        singleQuote: true,
        indentStyle: 'space',
        indentWidth: 4,
    },
    lint: {
        plugins: ['eslint', 'typescript', 'unicorn', 'oxc', 'vue'],
        categories: {
            correctness: 'error',
        },
        env: {
            browser: true,
            builtin: true,
        },
        ignorePatterns: ['**/dist/**', '**/dist-ssr/**'],
        rules: {
            'no-array-constructor': 'error',
            'typescript/ban-ts-comment': 'error',
            'typescript/no-empty-object-type': 'error',
            'typescript/no-explicit-any': 'error',
            'typescript/no-namespace': 'error',
            'typescript/no-require-imports': 'error',
            'typescript/no-unnecessary-type-constraint': 'error',
            'typescript/no-unsafe-function-type': 'error',
            'vite-plus/prefer-vite-plus-imports': 'error',
        },
        overrides: [
            {
                files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts', '**/*.vue'],
                rules: {
                    'constructor-super': 'off',
                    'getter-return': 'off',
                    'no-class-assign': 'off',
                    'no-const-assign': 'off',
                    'no-dupe-class-members': 'off',
                    'no-dupe-keys': 'off',
                    'no-func-assign': 'off',
                    'no-import-assign': 'off',
                    'no-new-native-nonconstructor': 'off',
                    'no-obj-calls': 'off',
                    'no-redeclare': 'off',
                    'no-setter-return': 'off',
                    'no-this-before-super': 'off',
                    'no-undef': 'off',
                    'no-unreachable': 'off',
                    'no-unsafe-negation': 'off',
                    'no-var': 'error',
                    'no-with': 'off',
                    'prefer-const': 'error',
                    'prefer-rest-params': 'error',
                    'prefer-spread': 'error',
                },
            },
        ],
        options: {
            typeAware: true,
            typeCheck: true,
        },
        jsPlugins: [
            {
                name: 'vite-plus',
                specifier: 'vite-plus/oxlint-plugin',
            },
        ],
    },
    plugins: [
        vue(),
        vueDevTools(),
        viteSingleFile(),
        {
            name: 'rename-html-output',
            async closeBundle() {
                const dist = path.resolve(process.cwd(), 'dist');
                const src = path.join(dist, 'index.html');
                const dest = path.join(dist, 'drop-play.html');
                await fs.rename(src, dest);
                await fs.access(dest);
            },
            configurePreviewServer(server) {
                server.middlewares.use(async (req, res, next) => {
                    const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;
                    if (pathname !== '/' && pathname !== '/index.html') {
                        next();
                        return;
                    }

                    try {
                        const html = await fs.readFile(
                            path.resolve(process.cwd(), 'dist/drop-play.html'),
                        );
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'text/html; charset=utf-8');
                        res.end(html);
                    } catch {
                        next();
                    }
                });
            },
        },
    ],
    build: {
        cssCodeSplit: false,
        assetsInlineLimit: 100000000,
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
            vue: path.resolve(
                path.dirname(require.resolve('vue/package.json')),
                'dist/vue.runtime-with-vapor.esm-browser.js',
            ),
        },
    },
});
