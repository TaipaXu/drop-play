# Drop Play

语言：[English](./README.md) | 中文

[在线体验](https://taipaxu.github.io/drop-play/)

Drop Play 是一个轻量的本地视频播放器。把视频文件拖进页面即可播放，也可以一次拖入多个文件形成播放列表。项目面向“无需上传、无需后端、打开即用”的本地观看场景。

## 功能特性

- 拖拽视频文件直接播放，支持一次添加多个文件。
- 播放列表面板支持切换、移除、清空、排序和拖拽调整顺序。
- 播放控件包含进度条、缓冲进度、悬停预览、音量、静音、倍速、全屏和 HDR 视觉增强开关。
- 支持截图，截图文件名会包含当前视频名和播放时间。
- 控件会在播放时自动隐藏，鼠标移动后重新显示。
- 支持中文、英文和跟随系统语言。
- 通过浏览器本地 `Object URL` 播放。

## 快捷键

| 快捷键       | 功能           |
| ------------ | -------------- |
| `Space`      | 播放 / 暂停    |
| `ArrowLeft`  | 后退 10 秒     |
| `ArrowRight` | 前进 10 秒     |
| `N`          | 播放下一个视频 |
| `P`          | 播放上一个视频 |
| `S`          | 截图           |

## 技术栈

- [Vite+](https://viteplus.dev/guide/) 作为统一 Web 工具链和 `vp` CLI。
- [Vue](https://vuejs.org/) 用于应用界面。
- [Pinia](https://pinia.vuejs.org/) 用于播放列表状态管理。
- [TypeScript](https://www.typescriptlang.org/) 用于类型化应用代码。
- [vite-plugin-singlefile](https://github.com/richardtallent/vite-plugin-singlefile) 用于构建单文件 HTML。

## 运行环境

- Node.js：`24.17.0`
- 包管理器：`pnpm@11.5.2`
- Vite+ 会从 `package.json` 读取这些设置。

首次运行时设置：

```bash
vp env setup
vp env on
vp env install
```

## 开发

安装依赖：

```bash
vp install
```

启动开发服务器：

```bash
vp dev
```

## 打包

通过 Vite+ 运行项目构建脚本。该命令会并行执行 Vue 类型检查和 Vite+ 生产构建：

```bash
vp run build
```

只有在需要直接运行 Vite+ 内置生产构建、跳过项目构建脚本时，才使用 `vp build`。

打包后本地预览生产构建：

```bash
vp preview
```

生产构建会内联资源并输出单文件 HTML：

```text
dist/drop-play.html
```

这使得 Drop Play 更适合以单个 HTML 文件分发和离线使用。

## 校验

```bash
vp check
```

也可以运行 `vp help` 查看 Vite+ 提供的完整命令列表，或运行 `vp <command> --help` 查看单个命令的帮助。

## 许可证

本项目使用 [MIT License](./LICENSE)。

## 兼容性说明

Drop Play 会按常见视频扩展名过滤文件，但最终能否播放仍取决于浏览器对具体封装格式和编码格式的支持。推荐优先使用浏览器原生支持较好的 `mp4`、`webm`、`mov` 等格式。
