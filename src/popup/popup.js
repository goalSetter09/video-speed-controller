(() => {
  const root = globalThis;
  const VSC = root.__VSC__ || (root.__VSC__ = {});
  const { CONFIG, Storage } = VSC;

  const preferredSpeedInput = document.getElementById('preferred-speed');
  const saveButton = document.getElementById('save-button');
  const statusMessage = document.getElementById('status-message');

  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    statusMessage.style.display = 'block';

    setTimeout(() => {
      statusMessage.style.display = 'none';
    }, 3000);
  }

  function parseAndValidatePreferredSpeed() {
    const parsed = Number.parseFloat(preferredSpeedInput.value);
    if (!Number.isFinite(parsed)) {
      return { valid: false, reason: 'Please enter a valid number.' };
    }

    if (parsed < CONFIG.POPUP_MIN_PREFERRED_SPEED || parsed > CONFIG.POPUP_MAX_PREFERRED_SPEED) {
      return {
        valid: false,
        reason: `Please enter a speed between ${CONFIG.POPUP_MIN_PREFERRED_SPEED.toFixed(1)} and ${CONFIG.POPUP_MAX_PREFERRED_SPEED.toFixed(1)}.`
      };
    }

    return { valid: true, value: parsed };
  }

  async function saveSettings() {
    try {
      const result = parseAndValidatePreferredSpeed();
      if (!result.valid) {
        showStatus(result.reason, 'error');
        return;
      }

      const saved = await Storage.setPreferredSpeed(result.value);
      preferredSpeedInput.value = saved.toFixed(1);
      showStatus('Settings saved!', 'success');
    } catch (error) {
      console.error(`${CONFIG.LOG_PREFIX} Error saving settings:`, error);
      showStatus('Error saving settings', 'error');
    }
  }

  async function initialize() {
    try {
      const preferredSpeed = await Storage.getPreferredSpeed();
      preferredSpeedInput.value = preferredSpeed.toFixed(1);

      saveButton.addEventListener('click', saveSettings);
      preferredSpeedInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          saveSettings();
        }
      });
    } catch (error) {
      console.error(`${CONFIG.LOG_PREFIX} Popup initialization error:`, error);
      showStatus('Error loading settings', 'error');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
