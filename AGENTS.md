<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

# Drop Play Rules

- Use `vp run build` for a full production validation. `vp build` skips the
  project `build` script's Vue type-check step.
- `vp test` is not part of the normal workflow until this repo adds a Vitest
  suite.
- Production builds are single-file HTML and end at `dist/drop-play.html`; do
  not assume `dist/index.html` is the distributable artifact.
- This is a Vue Vapor app. Keep new app/component code on the existing
  `createVaporApp` and `<script setup vapor lang="ts">` path unless a task
  explicitly changes that direction.
- Keep the local-only privacy model: no backend, no upload flow, and no remote
  media service unless explicitly requested.
- Local video files are played through browser `Object URL`s. Revoke URLs when
  playlist items are removed or cleared.
- User-facing text goes through `useI18n`; add both `zh-CN` and `en-US` copy.
- `.vue` files and `index.html` are formatted by ESLint, not Vite+ `fmt`. Keep
  the existing 4-space, semicolon, single-quote style.
- Follow the existing `App.vue` / `widgets` / `composables` / `stores` split
  before adding new structure.
- For player behavior changes, browser-check the affected drag/drop, playlist,
  controls, shortcuts, screenshot, fullscreen, language, and build-output flows.
