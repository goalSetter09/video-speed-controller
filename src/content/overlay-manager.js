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
        top: 12px;
        left: 12px;
        background: #ffd233;
        color: #101010;
        border: 3px solid #101010;
        padding: 6px 10px;
        border-radius: 0;
        font-family: 'Trebuchet MS', 'Segoe UI', Arial, sans-serif;
        font-size: 14px;
        font-weight: 900;
        letter-spacing: 0.03em;
        text-transform: uppercase;
        box-shadow: 4px 4px 0 #101010;
        pointer-events: none;
        user-select: none;
        z-index: 2147483647;
        white-space: nowrap;
        opacity: 0.62;
        visibility: visible;
        transform: translate(0, 0) rotate(-1deg);
        transition: opacity 0.16s ease, transform 0.16s ease, box-shadow 0.16s ease;
      }

      .vsc-overlay.highlight {
        opacity: 0.95;
        transform: translate(-1px, -1px) rotate(0deg);
        box-shadow: 6px 6px 0 #101010;
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
