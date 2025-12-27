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

  // State
  let currentSpeed = 1.0;
  let preferredSpeed = DEFAULTS[STORAGE_KEYS.PREFERRED_SPEED];
  let overlayElement = null;
  let overlayTimer = null;

  /**
   * Initialize the content script
   */
  async function initialize() {
    try {
      // Load preferred speed from storage
      const data = await chrome.storage.local.get(DEFAULTS);
      preferredSpeed = data[STORAGE_KEYS.PREFERRED_SPEED];

      // Create overlay element
      createOverlay();

      // Add keyboard listeners
      document.addEventListener('keydown', handleKeydown);

      console.log('[Video Speed Controller] Initialized');
    } catch (error) {
      console.error('[Video Speed Controller] Initialization error:', error);
    }
  }

  /**
   * Find the active video element on the page
   */
  function findActiveVideoElement() {
    return document.querySelector('video');
  }

  /**
   * Handle keyboard events
   */
  function handleKeydown(event) {
    // Only process if a video element exists
    const video = findActiveVideoElement();
    if (!video) return;

    // Don't interfere if user is typing in an input field
    const target = event.target;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    let speedChanged = false;
    let newSpeed = video.playbackRate;

    switch (event.key) {
      case ',':
        // Decrease speed by 0.1x
        newSpeed = Math.max(0.1, video.playbackRate - SPEED_STEP);
        speedChanged = true;
        break;

      case '.':
        // Increase speed by 0.1x
        newSpeed = video.playbackRate + SPEED_STEP;
        speedChanged = true;
        break;

      case 'r':
        // Toggle between current speed and preferred speed
        if (Math.abs(video.playbackRate - preferredSpeed) < 0.01) {
          newSpeed = 1.0;
        } else {
          newSpeed = preferredSpeed;
        }
        speedChanged = true;
        break;
    }

    if (speedChanged) {
      video.playbackRate = newSpeed;
      currentSpeed = newSpeed;
      showOverlay(newSpeed);
      event.preventDefault();
    }
  }

  /**
   * Create the speed overlay element
   */
  function createOverlay() {
    overlayElement = document.createElement('div');
    overlayElement.id = 'vsc-speed-overlay';
    overlayElement.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999999;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s ease;
    `;
    document.body.appendChild(overlayElement);
  }

  /**
   * Show the overlay with the current speed
   */
  function showOverlay(speed) {
    if (!overlayElement) return;

    overlayElement.textContent = `${speed.toFixed(1)}x`;
    overlayElement.style.opacity = '1';
    overlayElement.style.visibility = 'visible';

    // Clear existing timer
    if (overlayTimer) {
      clearTimeout(overlayTimer);
    }

    // Auto-hide after timeout
    overlayTimer = setTimeout(() => {
      overlayElement.style.opacity = '0';
      setTimeout(() => {
        overlayElement.style.visibility = 'hidden';
      }, 300);
    }, OVERLAY_TIMEOUT);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();

