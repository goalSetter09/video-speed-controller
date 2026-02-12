(() => {
  const root = globalThis;
  const VSC = root.__VSC__ || (root.__VSC__ = {});
  const { CONFIG } = VSC;

  let isTopFrame = false;
  try {
    isTopFrame = window === window.top;
  } catch (error) {
    isTopFrame = false;
  }

  VSC.ContentState = {
    preferredSpeed: CONFIG.DEFAULTS[CONFIG.STORAGE_KEYS.PREFERRED_SPEED],
    isTopFrame,
    videoElements: new Set(),
    mutationObserver: null,
    lastRateByVideo: new WeakMap(),
    overlayByVideo: new WeakMap(),
    overlayHideTimerByVideo: new WeakMap(),
    listenerAbortByVideo: new WeakMap(),
    onFullscreenChange: null,
    onDocumentPlay: null,
    onLoadedMetadata: null,
    onKeydown: null,
    onRuntimeMessage: null,
    onStorageChanged: null,
    onBeforeUnload: null
  };
})();
