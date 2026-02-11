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
  console.log('[Video Speed Controller] Message received:', request);
  
  // Handle future message-based features here
  // For now, this is a placeholder for future enhancements
  
  return true; // Keep the message channel open for async response
});

console.log('[Video Speed Controller] Background service worker initialized');






