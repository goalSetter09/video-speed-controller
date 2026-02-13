(() => {
  const root = globalThis;
  const VSC = root.__VSC__ || (root.__VSC__ = {});
  const { CONFIG, ContentState } = VSC;

  function getFullscreenElement() {
    return document.fullscreenElement
      || document.webkitFullscreenElement
      || document.mozFullScreenElement
      || document.msFullscreenElement
      || null;
  }

  function createOverlayRoot() {
    const overlayRoot = document.createElement('div');
    overlayRoot.className = 'vsc-overlay-root';

    const shadowRoot = overlayRoot.attachShadow({ mode: 'closed' });

    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .vsc-overlay {
        position: absolute;
        top: 10px;
        left: 10px;
        background: rgba(30, 58, 95, 0.52);
        color: rgba(255, 255, 255, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.22);
        padding: 3px 7px;
        border-radius: 4px;
        font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0;
        text-transform: none;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.16);
        pointer-events: none;
        user-select: none;
        z-index: 2147483647;
        white-space: nowrap;
        opacity: 0.42;
        visibility: visible;
        transform: translate(0, 0);
        transition: opacity 0.16s ease, transform 0.16s ease;
      }

      .vsc-overlay.highlight {
        opacity: 0.66;
        transform: translate(0, -1px);
      }
    `;

    const overlayElement = document.createElement('div');
    overlayElement.className = 'vsc-overlay';

    shadowRoot.appendChild(styleElement);
    shadowRoot.appendChild(overlayElement);

    return { overlayRoot, overlayElement };
  }

  function getContainerForVideo(video) {
    const fullscreenElement = getFullscreenElement();

    if (fullscreenElement) {
      if (fullscreenElement === video) {
        return video.parentElement || document.body;
      }
      if (fullscreenElement.contains(video)) {
        return fullscreenElement;
      }
    }

    let parent = video.parentElement;
    while (parent && parent !== document.body) {
      const position = window.getComputedStyle(parent).position;
      if (position === 'relative' || position === 'absolute' || position === 'fixed') {
        return parent;
      }
      parent = parent.parentElement;
    }

    return video.parentElement || document.body;
  }

  function applyPosition(overlayRoot, video) {
    if (!overlayRoot || !video) return;

    if (getFullscreenElement()) {
      overlayRoot.style.position = 'fixed';
      overlayRoot.style.top = '10px';
      overlayRoot.style.left = '10px';
    } else {
      overlayRoot.style.position = 'absolute';
      overlayRoot.style.top = '0';
      overlayRoot.style.left = '0';
    }

    overlayRoot.style.pointerEvents = 'none';
    overlayRoot.style.zIndex = '2147483647';
  }

  function ensureOverlay(video) {
    if (!video) return null;

    let overlay = ContentState.overlayByVideo.get(video);
    if (!overlay) {
      overlay = createOverlayRoot();
      ContentState.overlayByVideo.set(video, overlay);
    }

    const container = getContainerForVideo(video);
    if (container && overlay.overlayRoot.parentNode !== container) {
      container.appendChild(overlay.overlayRoot);
    }

    applyPosition(overlay.overlayRoot, video);
    return overlay;
  }

  function updateSpeed(video, speed, highlight) {
    if (!video) return;

    const overlay = ensureOverlay(video);
    if (!overlay) return;

    const displaySpeed = typeof speed === 'number' ? speed : video.playbackRate;
    overlay.overlayElement.textContent = `${displaySpeed.toFixed(1)}x`;

    if (!highlight) return;

    overlay.overlayElement.classList.add('highlight');

    const previousTimer = ContentState.overlayHideTimerByVideo.get(video);
    if (previousTimer) {
      clearTimeout(previousTimer);
    }

    const timer = setTimeout(() => {
      overlay.overlayElement.classList.remove('highlight');
      ContentState.overlayHideTimerByVideo.delete(video);
    }, CONFIG.OVERLAY_TIMEOUT_MS);

    ContentState.overlayHideTimerByVideo.set(video, timer);
  }

  function removeOverlay(video) {
    const overlay = ContentState.overlayByVideo.get(video);
    if (overlay && overlay.overlayRoot.parentNode) {
      overlay.overlayRoot.parentNode.removeChild(overlay.overlayRoot);
    }

    const timer = ContentState.overlayHideTimerByVideo.get(video);
    if (timer) {
      clearTimeout(timer);
      ContentState.overlayHideTimerByVideo.delete(video);
    }

    ContentState.overlayByVideo.delete(video);
  }

  function handleFullscreenChange() {
    ContentState.videoElements.forEach((video) => {
      ensureOverlay(video);
    });
  }

  VSC.OverlayManager = {
    ensureOverlay,
    updateSpeed,
    removeOverlay,
    handleFullscreenChange
  };
})();
