# Video Speed Controller - Chrome Extension

A lightweight Chrome extension that lets online learners precisely control video playback speed with simple keyboard shortcuts and a minimal overlay.

## Features

- Fine-grained speed control in 0.1x increments
- Keyboard shortcuts:
  - `,` (comma): Decrease speed by 0.1x
  - `.` (period): Increase speed by 0.1x
  - `r`: Toggle between 1.0x and preferred speed
- Overlay feedback rendered above the active video
- Preferred speed persisted in `chrome.storage.local`
- No external network calls

## Installation (Development Mode)

1. Open `chrome://extensions/`
2. Enable Developer mode
3. Click Load unpacked
4. Select this project root directory

## Usage

1. Open any page with an HTML5 video
2. Use `,`, `.`, and `r` to control playback speed
3. Click the extension icon to set your preferred speed (0.1 to 5.0)

## Project Structure

```text
video-speed-controller/
├── manifest.json
├── icons/
└── src/
    ├── shared/
    │   ├── config.js            # Shared constants and defaults
    │   ├── messages.js          # Cross-context message and command types
    │   └── storage.js           # Shared storage helpers
    ├── content/
    │   ├── state.js             # Runtime state container
    │   ├── video-controller.js  # Video selection and speed control
    │   ├── overlay-manager.js   # Shadow DOM overlay lifecycle
    │   ├── video-tracker.js     # Video discovery and lifecycle listeners
    │   ├── keyboard-handler.js  # Shortcut parsing and command dispatch
    │   └── bootstrap.js         # Content script initialization/cleanup
    ├── popup/
    │   ├── popup.html
    │   ├── popup.css
    │   └── popup.js
    └── background/
        └── background.js
```

## Technical Details

- Manifest: V3
- Permissions: `storage`, `scripting`
- Host permissions: `*://*/*`
- Stack: JavaScript (ES6), HTML, CSS

## Regression Checklist

- `,` and `.` update speed in 0.1 steps
- `r` toggles between preferred speed and 1.0x
- `Cmd/Ctrl + R` continues to refresh page
- Shortcuts do not trigger while typing in inputs/textareas/contenteditable
- Overlay displays current speed and highlights briefly after changes
- Fullscreen entry/exit keeps overlay visible and correctly positioned
- Dynamic video elements are detected and handled
- Commands from child iframes are forwarded to top frame video
- Popup save updates preferred speed used by content scripts

## Debugging

- Content script: page DevTools console
- Popup: right-click extension icon -> Inspect popup
- Background worker: `chrome://extensions/` -> Inspect views: service worker
