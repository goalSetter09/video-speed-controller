# Code Guideline: Video Speed Controller Chrome Extension

## 1. Project Overview

This document establishes the official coding standards for the Video Speed Controller, a lightweight Chrome Extension built with Manifest V3. The project's architecture is centered around three isolated components: a **Content Script module set** (`src/content/*.js`) for DOM manipulation and event handling, a **Popup UI** (`popup.js`) for user configuration, and a minimal **Background Service Worker** (`background.js`).

The core technology stack consists of pure JavaScript (ES6), HTML5, and CSS3, with `chrome.storage.local` serving as the sole persistence layer. The primary architectural goals are performance, minimal footprint, and clear separation of concerns between the extension's components.

## 2. Core Principles

- **Simplicity Over Complexity**: Write clear, straightforward, and self-documenting code.
- **Performance First**: Prioritize efficient DOM access, event handling, and minimal resource consumption.
- **Clear Separation of Concerns**: Each script (`content`, `popup`, `background`) must have a distinct and non-overlapping responsibility.
- **Defensive Coding**: Assume the web page environment is unpredictable; handle potential null elements and API errors gracefully.

## 3. Language-Specific Guidelines

### File Organization and Directory Structure

All source code **MUST** reside within the `/src` directory, following the structure defined in the TRD. This separation ensures a clean distinction between the extension's functional domains.

```
/src/
├── shared/
│   ├── config.js       # Shared constants and defaults
│   ├── messages.js     # Shared message/command types
│   └── storage.js      # Shared Chrome storage helpers
├── content/
│   ├── state.js        # Runtime state container
│   ├── video-controller.js
│   ├── overlay-manager.js
│   ├── video-tracker.js
│   ├── keyboard-handler.js
│   └── bootstrap.js
├── popup/
│   ├── popup.html      # Markup for the popup
│   ├── popup.js        # Logic for the popup UI and storage
│   └── popup.css       # Styles for the popup
└── background/
    └── background.js   # Background service worker (minimal)
```

### Import/Dependency Management

This project **MUST NOT** use any external JavaScript libraries or frameworks to maintain a minimal footprint and optimal performance.

Communication between the extension's components (e.g., `popup.js` and `bootstrap.js`) **MUST** be achieved asynchronously via `chrome.storage` API, not direct function calls or shared state.

### Error Handling Patterns

All interactions with the Chrome API and potentially failing DOM queries **MUST** be wrapped in appropriate error handling blocks.

- **Chrome API Calls**: Use `async/await` with `try...catch` blocks. The Chrome Extension APIs in Manifest V3 return Promises, which simplifies asynchronous code.
- **DOM Manipulation**: Before manipulating a DOM element, **MUST** check if it exists to prevent runtime errors on pages without video elements.

```javascript
// MUST: Use async/await and check for elements before use.
async function getPreferredSpeed() {
  try {
    const data = await chrome.storage.local.get('preferredSpeed');
    return data.preferredSpeed || 1.8; // Return default if not set
  } catch (error) {
    console.error('Error retrieving preferred speed:', error);
    return 1.8; // Fallback to default on error
  }
}

function updateVideoSpeed(videoElement, newSpeed) {
  if (!videoElement) {
    // Defensively exit if the video element is not found.
    return;
  }
  videoElement.playbackRate = newSpeed;
}
```

## 4. Code Style Rules

### MUST Follow:

1.  **Use `const` by default, `let` only if a variable must be reassigned.**
    *   *Rationale*: This prevents accidental reassignment and makes the code's intent clearer.

2.  **Use `async/await` for all asynchronous operations (e.g., `chrome.storage`).**
    *   *Rationale*: It improves readability and maintainability compared to callback chains or `.then()`.

3.  **Adhere to a consistent naming convention.**
    *   `camelCase` for variables and functions (e.g., `preferredSpeed`, `updateOverlay`).
    *   `UPPER_SNAKE_CASE` for constants (e.g., `DEFAULT_SPEED`, `OVERLAY_TIMEOUT`).
    *   Prefix DOM element variables with `$` or end with `Element` (e.g., `$speedInput` or `speedInputElement`).

4.  **Encapsulate logic within Immediately Invoked Function Expressions (IIFE) in content scripts.**
    *   *Rationale*: This prevents polluting the global `window` object of the host page, avoiding conflicts with the page's own scripts.

    ```javascript
    // MUST: Wrap content script logic in an IIFE.
    (() => {
      const PREFERRED_SPEED_KEY = 'preferredSpeed';
      // All your content script logic goes here...
    })();
    ```

5.  **Use single-responsibility functions.**
    *   *Rationale*: Small, focused functions are easier to understand, test, and reuse. A function should do one thing well.

    ```javascript
    // MUST: Break down complex logic into smaller functions.
    function initialize() {
      const video = findActiveVideoElement();
      if (video) {
        addKeyboardListeners(video);
      }
    }

    function findActiveVideoElement() {
      return document.querySelector('video');
    }

    function addKeyboardListeners(videoElement) {
      // ... listener logic
    }
    ```

### MUST NOT Do:

1.  **Do not use `var`.**
    *   *Rationale*: `var` has function-scoping rules that can lead to unexpected behavior. `let` and `const` provide block-scoping, which is more predictable.

2.  **Do not write large, monolithic files or functions.**
    *   *Rationale*: Large blocks of code are difficult to read, debug, and maintain. Break down content logic into dedicated modules such as `video-controller.js` and `keyboard-handler.js`.

3.  **Do not use inline styles or inline event handlers in HTML.**
    *   *Rationale*: This violates the separation of concerns (HTML, CSS, JS) and is blocked by Manifest V3's Content Security Policy (CSP). Always use `.css` files and `element.addEventListener()`.

    ```html
    <!-- MUST NOT: Inline styles and event handlers are prohibited. -->
    <button id="save" style="color: blue;" onclick="saveSettings()">Save</button>
    ```

    ```javascript
    // MUST: Separate concerns.
    // In popup.js
    const saveButton = document.getElementById('save');
    saveButton.addEventListener('click', saveSettings);

    // In popup.css
    #save {
      color: blue;
    }
    ```

4.  **Do not directly access the `window` object of the host page for storing data.**
    *   *Rationale*: This is insecure and can conflict with the host page's scripts. All persistent state **MUST** be stored in `chrome.storage`.

## 5. Architecture Patterns

### Component/Module Structure

Within content modules (e.g., `video-controller.js`), logic should be grouped into conceptual modules using plain objects or functions. This improves organization without adding complexity.

```javascript
// MUST: In content modules, group related logic into objects.
const VideoController = {
  get videoElement() {
    return document.querySelector('video');
  },
  changeSpeed(delta) {
    if (this.videoElement) {
      this.videoElement.playbackRate = Math.max(0.1, this.videoElement.playbackRate + delta);
      return this.videoElement.playbackRate;
    }
    return null;
  },
  // ... other video-related methods
};

const OverlayUI = {
  // ... methods to create, show, and hide the overlay
};

// Main execution logic
document.addEventListener('keydown', (event) => {
  // ... event handling logic using VideoController and OverlayUI
});
```

### Data Flow Pattern

The data flow for settings is unidirectional and asynchronous, ensuring a clear and predictable state management pattern.

1.  **Write**: The user interacts with `popup.html`. `popup.js` validates the input and writes the new setting to `chrome.storage.local`.
2.  **Read**: `bootstrap.js` reads the setting from `chrome.storage.local` during initialization and shares it with content modules.

### State Management

The single source of truth for all user-configurable settings (e.g., `preferredSpeed`) **MUST** be `chrome.storage.local`. No state should be shared or duplicated between the popup and content scripts.

```javascript
// MUST: Define a consistent key and structure for stored data.
const STORAGE_KEYS = {
  PREFERRED_SPEED: 'preferredSpeed'
};

const DEFAULTS = {
  [STORAGE_KEYS.PREFERRED_SPEED]: 1.8
};

// In popup.js - Writing to storage
async function savePreferredSpeed(speed) {
  await chrome.storage.local.set({ [STORAGE_KEYS.PREFERRED_SPEED]: speed });
}

// In bootstrap.js - Reading from storage
async function getPreferredSpeed() {
  const data = await chrome.storage.local.get(DEFAULTS);
  return data[STORAGE_KEYS.PREFERRED_SPEED];
}
```

### API Design Standards

Since this extension has no external API, "API Design" refers to the contract for data stored in `chrome.storage`.

-   Keys **MUST** be defined as constants in a shared location or duplicated consistently (given the project's small scale).
-   Stored values **MUST** be simple data types (numbers, strings, booleans). Avoid storing complex objects unless necessary.
-   Always provide a default value when reading from storage to handle the initial run case gracefully.
