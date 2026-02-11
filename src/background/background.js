/**
 * Video Speed Controller - Background Service Worker
 * 
 * Minimal background script for Manifest V3 compatibility.
 * Handles extension lifecycle events.
 */

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[Video Speed Controller] Extension installed');
    
    // Set default preferred speed on first install
    chrome.storage.local.set({
      preferredSpeed: 1.8
    });
  } else if (details.reason === 'update') {
    console.log('[Video Speed Controller] Extension updated');
  }
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Forward speed commands from child frames (iframes) to the top frame
  if (request.type === 'FORWARD_SPEED_COMMAND') {
    if (sender.tab && sender.tab.id != null) {
      chrome.tabs.sendMessage(
        sender.tab.id,
        request,
        { frameId: 0 }
      ).catch((error) => {
        console.warn('[Video Speed Controller] Failed to relay command to top frame:', error);
      });
    }
    return false;
  }

  return false;
});

console.log('[Video Speed Controller] Background service worker initialized');






