(() => {
  const root = globalThis;
  const VSC = root.__VSC__ || (root.__VSC__ = {});
  const { CONFIG, MESSAGES, ContentState, Storage, VideoTracker, KeyboardHandler } = VSC;

  async function initialize() {
    try {
      ContentState.preferredSpeed = await Storage.getPreferredSpeed();

      VideoTracker.setupVideoTracking();
      KeyboardHandler.bindKeyboard();

      if (ContentState.isTopFrame) {
        ContentState.onRuntimeMessage = (request) => {
          if (request?.type !== MESSAGES.FORWARD_SPEED_COMMAND) return;
          KeyboardHandler.handleForwardedCommand(request);
        };

        chrome.runtime.onMessage.addListener(ContentState.onRuntimeMessage);
      }

      ContentState.onStorageChanged = (changes, area) => {
        if (area !== 'local') return;

        const speedChange = changes[CONFIG.STORAGE_KEYS.PREFERRED_SPEED];
        if (!speedChange) return;

        const nextValue = speedChange.newValue;
        if (typeof nextValue === 'number' && Number.isFinite(nextValue)) {
          ContentState.preferredSpeed = Storage.clamp(
            nextValue,
            CONFIG.MIN_PLAYBACK_SPEED,
            CONFIG.MAX_PLAYBACK_SPEED
          );
        }
      };

      chrome.storage.onChanged.addListener(ContentState.onStorageChanged);
    } catch (error) {
      console.error(`${CONFIG.LOG_PREFIX} Initialization error:`, error);
    }
  }

  function cleanup() {
    KeyboardHandler.unbindKeyboard();
    VideoTracker.cleanupVideoTracking();

    if (ContentState.onRuntimeMessage) {
      chrome.runtime.onMessage.removeListener(ContentState.onRuntimeMessage);
      ContentState.onRuntimeMessage = null;
    }

    if (ContentState.onStorageChanged) {
      chrome.storage.onChanged.removeListener(ContentState.onStorageChanged);
      ContentState.onStorageChanged = null;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }

  ContentState.onBeforeUnload = cleanup;
  window.addEventListener('beforeunload', ContentState.onBeforeUnload);
})();
