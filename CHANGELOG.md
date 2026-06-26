# Changelog

## Unreleased

## 0.4.0 - 2026-06-26

- Clean up global language and theme system listeners during HMR and explicit disposal.
- Keep the expanded playlist above the top toolbar so it is not covered by app controls.
- Keep top toolbar language and theme menus touch-friendly and close them on outside clicks or taps.
- Add a local file picker entry on the first screen for touch and accessibility-friendly video selection.
- Show a localized unsupported codec error in the drop zone and keep recovery actions available.
- Remove files from the playlist when browser playback reports them as unsupported.
- Align file picker video extensions with playlist filtering, including Ogg and other common containers.
- Add touch and pen-friendly progress seeking with Pointer Events.
- Expose the progress bar as a keyboard-operable slider with localized screen reader text.
- Keep the app running when local storage is unavailable by gracefully skipping persisted preferences.

## 0.3.0 - 2026-06-25

- Add custom playback speed input with a 0.1x to 10x supported range.
- Close the playback speed menu when clicking outside it or when player controls hide.
- Keep the selected playback speed applied when dropping or switching to another video.
- Keep progress and time display stable while seeking so the controls no longer flicker back to the previous position.

## 0.2.0 - 2026-06-21

- Add system media controls with Media Session metadata, hardware media key support, and playlist navigation.
- Request browser screen Wake Lock during playback and release it when playback pauses or the page unloads.
- Expand player keyboard shortcuts with fullscreen, mute, volume, playback speed, and an app toolbar shortcut help button.
- Add theme switching with system, light, and dark modes, and remember the local preference.

## 0.1.0 - 2026-06-19

- Initial release.
- Add local video playback with drag-and-drop file selection.
- Add playlist management, playback controls, fullscreen mode, screenshots, and keyboard shortcuts.
- Add Chinese and English interface language support.
