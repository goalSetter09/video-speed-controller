/**
 * Video Speed Controller - Content Script
 * 
 * This script runs on all web pages and controls HTML5 video playback speed
 * using keyboard shortcuts.
 */

(() => {
  // Constants
  const STORAGE_KEYS = {
    PREFERRED_SPEED: 'preferredSpeed'
  };

  const DEFAULTS = {
    [STORAGE_KEYS.PREFERRED_SPEED]: 1.8
  };

  const SPEED_STEP = 0.1;
  const OVERLAY_TIMEOUT = 1200; // 1.2 seconds
  const MIN_SPEED = 0.1;
  const MAX_SPEED = 16.0;

  // Cross-frame message types for iframe keyboard forwarding
  const MESSAGE_TYPES = {
    FORWARD_SPEED_COMMAND: 'FORWARD_SPEED_COMMAND'
  };

  const COMMANDS = {
    DECREASE: 'decrease',
    INCREASE: 'increase',
    TOGGLE: 'toggle'
  };

  // State
  let preferredSpeed = DEFAULTS[STORAGE_KEYS.PREFERRED_SPEED];
  let overlayContainer = null;
  let overlayElement = null;
  let overlayTimer = null;
  let shadowRoot = null;
  let videoElements = new Set();
  let mutationObserver = null;
  
  // Per-video state management using WeakMap to prevent memory leaks
  const lastRateByVideo = new WeakMap();
  const overlayByVideo = new WeakMap();
  const listenerAbortByVideo = new WeakMap();

  /**
   * Video Controller Module
   * Handles video element detection and speed manipulation
   */
  const VideoController = {
    /**
     * Find all video elements on the page
     */
    findAllVideos() {
      return document.querySelectorAll('video');
    },

    /**
     * Find the currently playing or focused video element
     */
    findActiveVideo() {
      const videos = Array.from(this.findAllVideos());
      
      if (videos.length === 0) return null;
      if (videos.length === 1) return videos[0];

      // Prioritize: focused > playing > paused > first
      const focusedVideo = videos.find(v => document.activeElement === v || v.contains(document.activeElement));
      if (focusedVideo) return focusedVideo;

      const playingVideo = videos.find(v => !v.paused);
      if (playingVideo) return playingVideo;

      return videos[0];
    },

    /**
     * Change video playback speed and store it
     */
    changeSpeed(video, delta) {
      if (!video) return null;
      
      const newSpeed = Math.max(MIN_SPEED, Math.min(MAX_SPEED, video.playbackRate + delta));
      video.playbackRate = newSpeed;
      lastRateByVideo.set(video, newSpeed);
      return newSpeed;
    },

    /**
     * Set video playback speed to specific value and store it
     */
    setSpeed(video, speed) {
      if (!video) return null;
      
      const clampedSpeed = Math.max(MIN_SPEED, Math.min(MAX_SPEED, speed));
      video.playbackRate = clampedSpeed;
      lastRateByVideo.set(video, clampedSpeed);
      return clampedSpeed;
    },

    /**
     * Toggle between current speed and preferred speed
     */
    togglePreferredSpeed(video, preferred) {
      if (!video) return null;

      const currentSpeed = video.playbackRate;
      // If already at preferred speed (within 0.05 tolerance), go to 1.0x
      if (Math.abs(currentSpeed - preferred) < 0.05) {
        return this.setSpeed(video, 1.0);
      } else {
        return this.setSpeed(video, preferred);
      }
    },

    /**
     * Restore last playback rate for a video
     */
    restoreSpeed(video) {
      if (!video) return;
      
      const lastRate = lastRateByVideo.get(video);
      if (typeof lastRate === 'number' && video.playbackRate !== lastRate) {
        video.playbackRate = lastRate;
        console.log(`[Video Speed Controller] Restored speed to ${lastRate.toFixed(1)}x`);
      }
    }
  };

  /**
   * Overlay UI Module
   * Manages the speed overlay display on top of video element
   * Now supports per-video overlays with fullscreen compatibility
   */
  const OverlayUI = {
    /**
     * Get or create overlay root element for a specific video
     */
    ensureOverlay(video) {
      if (!video) return null;

      let overlayRoot = overlayByVideo.get(video);
      const isNewOverlay = !overlayRoot;
      
      if (!overlayRoot) {
        overlayRoot = this.createOverlayRoot();
        overlayByVideo.set(video, overlayRoot);
      }

      // Ensure overlay is attached to the correct container (handles fullscreen)
      const container = this.getFullscreenContainer(video);
      if (container && overlayRoot.parentNode !== container) {
        container.appendChild(overlayRoot);
      }

      this.positionOverlay(overlayRoot, video);
      
      // Initialize overlay with current speed if newly created
      if (isNewOverlay && overlayRoot._overlayElement) {
        overlayRoot._overlayElement.textContent = `${video.playbackRate.toFixed(1)}x`;
      }
      
      return overlayRoot;
    },

    /**
     * Create a new overlay root element with shadow DOM
     */
    createOverlayRoot() {
      const container = document.createElement('div');
      container.className = 'vsc-overlay-root';
      
      const shadow = container.attachShadow({ mode: 'closed' });
      
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        .vsc-overlay {
          position: absolute;
          top: 10px;
          left: 10px;
          background-color: rgba(0, 0, 0, 0.6);
          color: #ffffff;
          padding: 4px 8px;
          border-radius: 4px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          font-size: 13px;
          font-weight: 600;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
          pointer-events: none;
          user-select: none;
          z-index: 2147483647;
          white-space: nowrap;
          opacity: 0.5;
          visibility: visible;
          transition: opacity 0.2s ease;
        }

        .vsc-overlay.highlight {
          opacity: 0.85;
          transform: scale(1.05);
          transition: opacity 0.2s ease, transform 0.2s ease;
        }

        @media (prefers-color-scheme: dark) {
          .vsc-overlay {
            background-color: rgba(255, 255, 255, 0.6);
            color: #000000;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
          }
        }
      `;
      
      const overlayDiv = document.createElement('div');
      overlayDiv.className = 'vsc-overlay';
      
      shadow.appendChild(styleElement);
      shadow.appendChild(overlayDiv);
      
      // Store reference to shadow root and overlay element
      container._shadow = shadow;
      container._overlayElement = overlayDiv;
      
      return container;
    },

    /**
     * Get the appropriate container for the overlay (handles fullscreen)
     */
    getFullscreenContainer(video) {
      // Check for fullscreen element (with vendor prefix fallback)
      const fullscreenElement = document.fullscreenElement || 
                                document.webkitFullscreenElement || 
                                document.mozFullScreenElement || 
                                document.msFullscreenElement;
      
      if (fullscreenElement) {
        // If video itself is fullscreen, use it
        if (fullscreenElement === video) {
          return video.parentElement || document.body;
        }
        // If a parent container is fullscreen, use it
        if (fullscreenElement.contains(video)) {
          return fullscreenElement;
        }
      }
      
      // Fallback: find nearest positioned ancestor
      let parent = video.parentElement;
      while (parent && parent !== document.body) {
        const position = window.getComputedStyle(parent).position;
        if (position === 'relative' || position === 'absolute' || position === 'fixed') {
          return parent;
        }
        parent = parent.parentElement;
      }
      
      return video.parentElement || document.body;
    },

    /**
     * Position overlay at top-left of video
     */
    positionOverlay(overlayRoot, video) {
      if (!overlayRoot || !video) return;

      const container = this.getFullscreenContainer(video);
      const isFullscreen = !!(document.fullscreenElement || 
                              document.webkitFullscreenElement || 
                              document.mozFullScreenElement || 
                              document.msFullscreenElement);

      if (isFullscreen) {
        // In fullscreen, use fixed positioning relative to viewport
        overlayRoot.style.position = 'fixed';
        overlayRoot.style.top = '10px';
        overlayRoot.style.left = '10px';
      } else {
        // Normal mode: position relative to video
        overlayRoot.style.position = 'absolute';
        overlayRoot.style.top = '0';
        overlayRoot.style.left = '0';
      }
      
      overlayRoot.style.pointerEvents = 'none';
      overlayRoot.style.zIndex = '2147483647';
    },

    /**
     * Update overlay with speed value
     */
    updateSpeed(video, speed, highlight = false) {
      if (!video) return;

      const overlayRoot = this.ensureOverlay(video);
      if (!overlayRoot || !overlayRoot._overlayElement) return;

      const overlayElement = overlayRoot._overlayElement;
      
      // Get the actual current speed from the video element
      const currentSpeed = typeof speed === 'number' ? speed : video.playbackRate;
      overlayElement.textContent = `${currentSpeed.toFixed(1)}x`;
      
      if (highlight) {
        overlayElement.classList.add('highlight');
        
        // Clear any existing timeout
        if (overlayRoot._hideTimer) {
          clearTimeout(overlayRoot._hideTimer);
        }
        
        // Auto-remove highlight after timeout
        overlayRoot._hideTimer = setTimeout(() => {
          if (overlayElement) {
            overlayElement.classList.remove('highlight');
          }
        }, OVERLAY_TIMEOUT);
      }
    },

    /**
     * Handle fullscreen changes for all videos
     */
    handleFullscreenChange() {
      videoElements.forEach(video => {
        const overlayRoot = overlayByVideo.get(video);
        if (overlayRoot) {
          this.ensureOverlay(video);
        }
      });
    },

    /**
     * Remove overlay for a specific video
     */
    removeOverlay(video) {
      const overlayRoot = overlayByVideo.get(video);
      if (overlayRoot && overlayRoot.parentNode) {
        overlayRoot.parentNode.removeChild(overlayRoot);
      }
      overlayByVideo.delete(video);
    }
  };

  /**
   * Attach event handlers to a video element
   */
  function attachVideoHandlers(video) {
    if (!video) return;
    
    // Prevent duplicate listeners
    if (listenerAbortByVideo.has(video)) return;
    
    const controller = new AbortController();
    listenerAbortByVideo.set(video, controller);
    const signal = controller.signal;

    // Track rate changes
    video.addEventListener('ratechange', () => {
      const currentRate = video.playbackRate;
      lastRateByVideo.set(video, currentRate);
      OverlayUI.updateSpeed(video, currentRate, false);
    }, { signal, passive: true });

    // Restore speed on play
    video.addEventListener('play', () => {
      VideoController.restoreSpeed(video);
      OverlayUI.updateSpeed(video, video.playbackRate, false);
    }, { signal });

    // Keep overlay updated on pause
    video.addEventListener('pause', () => {
      OverlayUI.updateSpeed(video, video.playbackRate, false);
    }, { signal, passive: true });

    // Initialize last rate if not set
    if (!lastRateByVideo.has(video)) {
      lastRateByVideo.set(video, video.playbackRate);
    }
    
    // Update overlay with current speed
    OverlayUI.updateSpeed(video, video.playbackRate, false);

    console.log('[Video Speed Controller] Event handlers attached to video');
  }

  /**
   * Detach event handlers from a video element
   */
  function detachVideoHandlers(video) {
    const controller = listenerAbortByVideo.get(video);
    if (controller) {
      controller.abort();
      listenerAbortByVideo.delete(video);
    }
  }

  // Check if this script is running in the top frame (safe for cross-origin iframes)
  let isTopFrame;
  try {
    isTopFrame = window === window.top;
  } catch (e) {
    isTopFrame = false;
  }

  /**
   * Execute a speed command on a video element
   */
  function executeCommand(video, command) {
    if (command === COMMANDS.DECREASE) {
      return VideoController.changeSpeed(video, -SPEED_STEP);
    } else if (command === COMMANDS.INCREASE) {
      return VideoController.changeSpeed(video, SPEED_STEP);
    } else if (command === COMMANDS.TOGGLE) {
      return VideoController.togglePreferredSpeed(video, preferredSpeed);
    }
    return null;
  }

  /**
   * Handle keyboard events for speed control
   */
  function handleKeydown(event) {
    // Don't interfere if user is typing in an input field
    const target = event.target;
    if (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable) {
      return;
    }

    // Use event.code for more reliable key detection across keyboard layouts
    const code = event.code;
    const key = event.key;

    // CRITICAL: Check for browser shortcuts first and exit immediately
    // Command+R (Mac) / Ctrl+R (Windows) for refresh
    if ((code === 'KeyR' || key === 'r' || key === 'R') && (event.metaKey || event.ctrlKey)) {
      // Let the browser handle refresh shortcuts - do NOT interfere
      return;
    }

    // Map key to command
    let command = null;
    if (code === 'Comma' || key === ',' || key === '<') {
      command = COMMANDS.DECREASE;
    } else if (code === 'Period' || key === '.' || key === '>') {
      command = COMMANDS.INCREASE;
    } else if ((code === 'KeyR' || key === 'r' || key === 'R') && !event.shiftKey && !event.altKey) {
      command = COMMANDS.TOGGLE;
    }

    if (!command) return;

    // Try to find a local video in this frame
    const video = VideoController.findActiveVideo();

    if (video) {
      // Handle locally - video exists in this frame
      const newSpeed = executeCommand(video, command);

      if (newSpeed !== null) {
        event.preventDefault();
        event.stopPropagation();
        OverlayUI.updateSpeed(video, newSpeed, true);
        console.log(`[Video Speed Controller] Speed changed to ${newSpeed.toFixed(1)}x`);
      }
    } else if (!isTopFrame) {
      // No local video AND we're in a child frame - forward to top frame
      event.preventDefault();
      event.stopPropagation();

      try {
        chrome.runtime.sendMessage({
          type: MESSAGE_TYPES.FORWARD_SPEED_COMMAND,
          command: command
        });
      } catch (error) {
        console.warn('[Video Speed Controller] Failed to forward command:', error);
      }
    }
  }

  /**
   * Handle fullscreen changes
   */
  function handleFullscreenChange() {
    // Re-position overlays for all tracked videos
    OverlayUI.handleFullscreenChange();
    
    console.log('[Video Speed Controller] Fullscreen state changed');
  }

  /**
   * Track video elements using MutationObserver
   */
  function setupVideoTracking() {
    // Initial scan for video elements
    updateVideoElements();

    // Setup fullscreen change listener
    document.addEventListener('fullscreenchange', handleFullscreenChange, { passive: true });
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange, { passive: true });
    document.addEventListener('mozfullscreenchange', handleFullscreenChange, { passive: true });
    document.addEventListener('msfullscreenchange', handleFullscreenChange, { passive: true });

    // Watch for dynamically added video elements (with optimized observer)
    mutationObserver = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          const hasVideoElements = 
            Array.from(mutation.addedNodes).some(node => 
              node.nodeType === Node.ELEMENT_NODE && 
              (node.tagName === 'VIDEO' || node.querySelector('video'))
            );
          
          if (hasVideoElements) {
            shouldUpdate = true;
            break;
          }
        }
      }
      
      if (shouldUpdate) {
        updateVideoElements();
      }
    });

    // Observe only necessary changes to minimize performance impact
    mutationObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
      // Minimize observer scope - only watch for added/removed nodes
      attributes: false,
      characterData: false
    });

    // Handle video play events
    document.addEventListener('play', (event) => {
      if (event.target.tagName === 'VIDEO') {
        const video = event.target;
        attachVideoHandlers(video);
        OverlayUI.ensureOverlay(video);
        VideoController.restoreSpeed(video);
      }
    }, true);

    // Handle video loadedmetadata to catch initial video setup
    document.addEventListener('loadedmetadata', (event) => {
      if (event.target.tagName === 'VIDEO') {
        const video = event.target;
        attachVideoHandlers(video);
      }
    }, true);
  }

  /**
   * Update the set of tracked video elements
   */
  function updateVideoElements() {
    const videos = VideoController.findAllVideos();
    const newVideos = new Set(videos);
    
    // Attach handlers to new videos
    newVideos.forEach(video => {
      if (!videoElements.has(video)) {
        attachVideoHandlers(video);
        OverlayUI.ensureOverlay(video);
      }
    });
    
    // Clean up removed videos
    videoElements.forEach(video => {
      if (!newVideos.has(video)) {
        detachVideoHandlers(video);
        OverlayUI.removeOverlay(video);
      }
    });
    
    videoElements = newVideos;
  }

  /**
   * Initialize the content script
   */
  async function initialize() {
    try {
      // Load preferred speed from storage
      const data = await chrome.storage.local.get(DEFAULTS);
      preferredSpeed = data[STORAGE_KEYS.PREFERRED_SPEED];

      // Setup video element tracking
      setupVideoTracking();

      // Add keyboard listener
      document.addEventListener('keydown', handleKeydown, true); // Use capture phase

      // In the top frame, listen for forwarded commands from child frames (iframes)
      if (isTopFrame) {
        chrome.runtime.onMessage.addListener((request) => {
          if (request.type !== MESSAGE_TYPES.FORWARD_SPEED_COMMAND) return;

          const video = VideoController.findActiveVideo();
          if (!video) return;

          const newSpeed = executeCommand(video, request.command);

          if (newSpeed !== null) {
            OverlayUI.updateSpeed(video, newSpeed, true);
            console.log(`[Video Speed Controller] Speed changed to ${newSpeed.toFixed(1)}x (from child frame)`);
          }
        });
      }

      console.log('[Video Speed Controller] Initialized');
    } catch (error) {
      console.error('[Video Speed Controller] Initialization error:', error);
    }
  }

  /**
   * Cleanup function
   */
  function cleanup() {
    if (mutationObserver) {
      mutationObserver.disconnect();
    }
    
    document.removeEventListener('keydown', handleKeydown, true);
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    
    // Clean up all video handlers and overlays
    videoElements.forEach(video => {
      detachVideoHandlers(video);
      OverlayUI.removeOverlay(video);
    });
    
    videoElements.clear();
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', cleanup);
})();

