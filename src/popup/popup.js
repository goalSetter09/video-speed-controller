/**
 * Video Speed Controller - Popup Script
 * 
 * Handles the popup UI for configuring the preferred speed setting.
 */

// Constants
const STORAGE_KEYS = {
  PREFERRED_SPEED: 'preferredSpeed'
};

const DEFAULTS = {
  [STORAGE_KEYS.PREFERRED_SPEED]: 1.8
};

// DOM Elements
const preferredSpeedInput = document.getElementById('preferred-speed');
const saveButton = document.getElementById('save-button');
const statusMessage = document.getElementById('status-message');

/**
 * Initialize the popup
 */
async function initialize() {
  try {
    // Load current preferred speed from storage
    const data = await chrome.storage.local.get(DEFAULTS);
    const preferredSpeed = data[STORAGE_KEYS.PREFERRED_SPEED];
    
    // Update input field
    preferredSpeedInput.value = preferredSpeed.toFixed(1);

    // Add event listeners
    saveButton.addEventListener('click', saveSettings);
    preferredSpeedInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        saveSettings();
      }
    });

    console.log('[Video Speed Controller] Popup initialized');
  } catch (error) {
    console.error('[Video Speed Controller] Popup initialization error:', error);
    showStatus('Error loading settings', 'error');
  }
}

/**
 * Save the preferred speed setting
 */
async function saveSettings() {
  try {
    const speed = parseFloat(preferredSpeedInput.value);

    // Validate input
    if (isNaN(speed) || speed < 0.1 || speed > 5.0) {
      showStatus('Please enter a speed between 0.1 and 5.0', 'error');
      return;
    }

    // Save to storage
    await chrome.storage.local.set({
      [STORAGE_KEYS.PREFERRED_SPEED]: speed
    });

    // Show success message
    showStatus('Settings saved!', 'success');
    
    console.log('[Video Speed Controller] Preferred speed saved:', speed);
  } catch (error) {
    console.error('[Video Speed Controller] Error saving settings:', error);
    showStatus('Error saving settings', 'error');
  }
}

/**
 * Show a status message
 */
function showStatus(message, type = 'info') {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  statusMessage.style.display = 'block';

  // Auto-hide after 3 seconds
  setTimeout(() => {
    statusMessage.style.display = 'none';
  }, 3000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

