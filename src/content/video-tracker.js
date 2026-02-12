(() => {
  const root = globalThis;
  const VSC = root.__VSC__ || (root.__VSC__ = {});
  const { ContentState, VideoController, OverlayManager } = VSC;

  function attachVideoHandlers(video) {
    if (!video || ContentState.listenerAbortByVideo.has(video)) return;

    const controller = new AbortController();
    ContentState.listenerAbortByVideo.set(video, controller);
    const options = { signal: controller.signal };

    video.addEventListener('ratechange', () => {
      const currentRate = video.playbackRate;
      ContentState.lastRateByVideo.set(video, currentRate);
      OverlayManager.updateSpeed(video, currentRate, false);
    }, { ...options, passive: true });

    video.addEventListener('play', () => {
      VideoController.restoreSpeed(video);
      OverlayManager.updateSpeed(video, video.playbackRate, false);
    }, options);

    video.addEventListener('pause', () => {
      OverlayManager.updateSpeed(video, video.playbackRate, false);
    }, { ...options, passive: true });

    if (!ContentState.lastRateByVideo.has(video)) {
      ContentState.lastRateByVideo.set(video, video.playbackRate);
    }

    OverlayManager.updateSpeed(video, video.playbackRate, false);
  }

  function detachVideoHandlers(video) {
    const controller = ContentState.listenerAbortByVideo.get(video);
    if (controller) {
      controller.abort();
      ContentState.listenerAbortByVideo.delete(video);
    }
  }

  function updateVideoElements() {
    const videos = VideoController.findAllVideos();
    const nextVideos = new Set(videos);

    nextVideos.forEach((video) => {
      if (!ContentState.videoElements.has(video)) {
        attachVideoHandlers(video);
        OverlayManager.ensureOverlay(video);
      }
    });

    ContentState.videoElements.forEach((video) => {
      if (!nextVideos.has(video)) {
        detachVideoHandlers(video);
        OverlayManager.removeOverlay(video);
      }
    });

    ContentState.videoElements = nextVideos;
  }

  function hasVideoNode(nodes) {
    return Array.from(nodes).some((node) => (
      node.nodeType === Node.ELEMENT_NODE
      && (node.tagName === 'VIDEO' || !!node.querySelector?.('video'))
    ));
  }

  function setupVideoTracking() {
    updateVideoElements();

    ContentState.onFullscreenChange = () => {
      OverlayManager.handleFullscreenChange();
    };

    document.addEventListener('fullscreenchange', ContentState.onFullscreenChange, { passive: true });
    document.addEventListener('webkitfullscreenchange', ContentState.onFullscreenChange, { passive: true });
    document.addEventListener('mozfullscreenchange', ContentState.onFullscreenChange, { passive: true });
    document.addEventListener('msfullscreenchange', ContentState.onFullscreenChange, { passive: true });

    ContentState.mutationObserver = new MutationObserver((mutations) => {
      const shouldUpdate = mutations.some((mutation) => (
        mutation.type === 'childList'
        && (hasVideoNode(mutation.addedNodes) || hasVideoNode(mutation.removedNodes))
      ));

      if (shouldUpdate) {
        updateVideoElements();
      }
    });

    ContentState.mutationObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    });

    ContentState.onDocumentPlay = (event) => {
      if (event.target?.tagName !== 'VIDEO') return;

      const video = event.target;
      attachVideoHandlers(video);
      OverlayManager.ensureOverlay(video);
      VideoController.restoreSpeed(video);
    };

    ContentState.onLoadedMetadata = (event) => {
      if (event.target?.tagName !== 'VIDEO') return;
      attachVideoHandlers(event.target);
    };

    document.addEventListener('play', ContentState.onDocumentPlay, true);
    document.addEventListener('loadedmetadata', ContentState.onLoadedMetadata, true);
  }

  function cleanupVideoTracking() {
    if (ContentState.mutationObserver) {
      ContentState.mutationObserver.disconnect();
      ContentState.mutationObserver = null;
    }

    if (ContentState.onFullscreenChange) {
      document.removeEventListener('fullscreenchange', ContentState.onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', ContentState.onFullscreenChange);
      document.removeEventListener('mozfullscreenchange', ContentState.onFullscreenChange);
      document.removeEventListener('msfullscreenchange', ContentState.onFullscreenChange);
      ContentState.onFullscreenChange = null;
    }

    if (ContentState.onDocumentPlay) {
      document.removeEventListener('play', ContentState.onDocumentPlay, true);
      ContentState.onDocumentPlay = null;
    }

    if (ContentState.onLoadedMetadata) {
      document.removeEventListener('loadedmetadata', ContentState.onLoadedMetadata, true);
      ContentState.onLoadedMetadata = null;
    }

    ContentState.videoElements.forEach((video) => {
      detachVideoHandlers(video);
      OverlayManager.removeOverlay(video);
    });

    ContentState.videoElements.clear();
  }

  VSC.VideoTracker = {
    setupVideoTracking,
    cleanupVideoTracking
  };
})();
