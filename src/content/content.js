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

  // State
  let preferredSpeed = DEFAULTS[STORAGE_KEYS.PREFERRED_SPEED];
  let overlayContainer = null;
  let overlayElement = null;
  let overlayTimer = null;
  let shadowRoot = null;
  let videoElements = new Set();
  let mutationObserver = null;

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
     * Change video playback speed
     */
    changeSpeed(video, delta) {
      if (!video) return null;
      
      const newSpeed = Math.max(MIN_SPEED, Math.min(MAX_SPEED, video.playbackRate + delta));
      video.playbackRate = newSpeed;
      return newSpeed;
    },

    /**
     * Set video playback speed to specific value
     */
    setSpeed(video, speed) {
      if (!video) return null;
      
      const clampedSpeed = Math.max(MIN_SPEED, Math.min(MAX_SPEED, speed));
      video.playbackRate = clampedSpeed;
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
    }
  };

  /**
   * Overlay UI Module
   * Manages the speed overlay display on top of video element
   */
  const OverlayUI = {
    currentVideo: null,
    positionUpdateInterval: null,

    /**
     * Create or update overlay for a specific video element
     */
    createForVideo(video) {
      if (!video) return;

      // If overlay already exists for this video, just ensure it's positioned correctly
      if (this.currentVideo === video && overlayContainer && overlayElement) {
        this.updateSpeed(video.playbackRate);
        return;
      }

      // Remove old overlay if video changed
      if (this.currentVideo !== video) {
        this.remove();
      }

      this.currentVideo = video;

      // Create container element (will be positioned over video)
      overlayContainer = document.createElement('div');
      overlayContainer.id = 'vsc-overlay-container';
      
      // Attach shadow DOM for style isolation
      shadowRoot = overlayContainer.attachShadow({ mode: 'closed' });

      // Create overlay element inside shadow DOM
      overlayElement = document.createElement('div');
      overlayElement.id = 'speed-overlay';
      overlayElement.className = 'vsc-overlay';

      // Create style element
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        .vsc-overlay {
          position: fixed;
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
          opacity: 0.5;
          visibility: visible;
          transition: opacity 0.2s ease;
          z-index: 999999;
          white-space: nowrap;
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

      shadowRoot.appendChild(styleElement);
      shadowRoot.appendChild(overlayElement);

      // Add to body (not video parent to avoid layout issues)
      document.body.appendChild(overlayContainer);

      // Position overlay over video
      this.positionOverlay(video);

      // Update initial speed display
      this.updateSpeed(video.playbackRate);

      console.log('[Video Speed Controller] Overlay created for video');
    },

    /**
     * Position overlay on top of video element
     */
    positionOverlay(video) {
      if (!video || !overlayContainer || !overlayElement) return;

      const updatePosition = () => {
        if (!video || !overlayContainer || !overlayElement) return;
        
        const rect = video.getBoundingClientRect();
        
        // Only show if video is visible on screen
        if (rect.width > 0 && rect.height > 0) {
          const left = rect.left + 10;
          const top = rect.top + 10;
          
          overlayElement.style.position = 'fixed';
          overlayElement.style.left = `${left}px`;
          overlayElement.style.top = `${top}px`;
          overlayElement.style.display = 'block';
        } else {
          overlayElement.style.display = 'none';
        }
      };

      // Initial position
      updatePosition();

      // Clear previous interval if exists
      if (this.positionUpdateInterval) {
        clearInterval(this.positionUpdateInterval);
      }

      // Update position periodically (for dynamic layouts)
      this.positionUpdateInterval = setInterval(updatePosition, 500);

      // Also update on scroll and resize
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    },

    /**
     * Update overlay with speed value
     */
    updateSpeed(speed, highlight = false) {
      if (!overlayElement) return;

      overlayElement.textContent = `${speed.toFixed(1)}x`;
      
      if (highlight) {
        overlayElement.classList.add('highlight');

        // Clear existing timer
        if (overlayTimer) {
          clearTimeout(overlayTimer);
        }

        // Remove highlight after timeout
        overlayTimer = setTimeout(() => {
          if (overlayElement) {
            overlayElement.classList.remove('highlight');
          }
        }, OVERLAY_TIMEOUT);
      }
    },

    /**
     * Remove overlay
     */
    remove() {
      if (this.positionUpdateInterval) {
        clearInterval(this.positionUpdateInterval);
        this.positionUpdateInterval = null;
      }
      
      if (overlayContainer && overlayContainer.parentNode) {
        overlayContainer.parentNode.removeChild(overlayContainer);
      }
      
      overlayContainer = null;
      overlayElement = null;
      shadowRoot = null;
      this.currentVideo = null;
    }
  };

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

    // Find active video element
    const video = VideoController.findActiveVideo();
    if (!video) return;

    let newSpeed = null;
    let shouldHandle = false;

    // Use event.code for more reliable key detection across keyboard layouts
    // Also support event.key as fallback
    const code = event.code;
    const key = event.key;

    // Decrease speed: Comma key
    if (code === 'Comma' || key === ',' || key === '<') {
      newSpeed = VideoController.changeSpeed(video, -SPEED_STEP);
      shouldHandle = true;
    }
    // Increase speed: Period key
    else if (code === 'Period' || key === '.' || key === '>') {
      newSpeed = VideoController.changeSpeed(video, SPEED_STEP);
      shouldHandle = true;
    }
    // Toggle preferred speed: R key
    else if (code === 'KeyR' || key === 'r' || key === 'R') {
      // Ignore if Command/Ctrl key is pressed (for refresh shortcuts)
      if (!event.metaKey && !event.ctrlKey && !event.shiftKey) {
        newSpeed = VideoController.togglePreferredSpeed(video, preferredSpeed);
        shouldHandle = true;
      }
    }

    if (shouldHandle && newSpeed !== null) {
      // Ensure overlay exists for current video
      OverlayUI.createForVideo(video);
      
      // Prevent default action and stop propagation to avoid site shortcut conflicts
      event.preventDefault();
      event.stopPropagation();
      
      // Update overlay with new speed (with highlight effect)
      OverlayUI.updateSpeed(newSpeed, true);
      
      console.log(`[Video Speed Controller] Speed changed to ${newSpeed.toFixed(1)}x`);
    }
  }

  /**
   * Track video elements using MutationObserver
   */
  function setupVideoTracking() {
    // Initial scan for video elements
    updateVideoElements();

    // Create overlay for first video if exists
    const initialVideo = VideoController.findActiveVideo();
    if (initialVideo) {
      OverlayUI.createForVideo(initialVideo);
    }

    // Watch for dynamically added video elements
    mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          const hasVideoElements = 
            Array.from(mutation.addedNodes).some(node => 
              node.nodeType === Node.ELEMENT_NODE && 
              (node.tagName === 'VIDEO' || node.querySelector('video'))
            );
          
          if (hasVideoElements) {
            updateVideoElements();
            // Update overlay for the active video
            const activeVideo = VideoController.findActiveVideo();
            if (activeVideo) {
              OverlayUI.createForVideo(activeVideo);
            }
          }
        }
      }
    });

    mutationObserver.observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    // Also watch for video play events to update overlay position
    document.addEventListener('play', (event) => {
      if (event.target.tagName === 'VIDEO') {
        OverlayUI.createForVideo(event.target);
      }
    }, true);
  }

  /**
   * Update the set of tracked video elements
   */
  function updateVideoElements() {
    const videos = VideoController.findAllVideos();
    videoElements = new Set(videos);
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
    OverlayUI.remove();
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

