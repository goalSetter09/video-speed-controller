(() => {
  const root = globalThis;
  const VSC = root.__VSC__ || (root.__VSC__ = {});
  const { CONFIG, Storage } = VSC;

  const preferredSpeedInput = document.getElementById('preferred-speed');
  const decreaseShortcutInput = document.getElementById('shortcut-decrease');
  const increaseShortcutInput = document.getElementById('shortcut-increase');
  const toggleShortcutInput = document.getElementById('shortcut-toggle');
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

  function parseAndValidateShortcutKeys() {
    const shortcutKeys = {
      decrease: Storage.normalizeShortcutKey(decreaseShortcutInput.value, ''),
      increase: Storage.normalizeShortcutKey(increaseShortcutInput.value, ''),
      toggle: Storage.normalizeShortcutKey(toggleShortcutInput.value, '')
    };

    if (!shortcutKeys.decrease || !shortcutKeys.increase || !shortcutKeys.toggle) {
      return {
        valid: false,
        reason: 'Each shortcut must be exactly one key.'
      };
    }

    const uniqueSize = new Set(Object.values(shortcutKeys)).size;
    if (uniqueSize !== 3) {
      return {
        valid: false,
        reason: 'Each shortcut must use a different key.'
      };
    }

    return { valid: true, value: shortcutKeys };
  }

  function applyShortcutInputs(shortcutKeys) {
    decreaseShortcutInput.value = shortcutKeys.decrease;
    increaseShortcutInput.value = shortcutKeys.increase;
    toggleShortcutInput.value = shortcutKeys.toggle;
  }

  function bindShortcutCapture(inputElement) {
    inputElement.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') return;

      event.preventDefault();

      if (event.key === 'Backspace' || event.key === 'Delete') {
        inputElement.value = '';
        return;
      }

      const normalized = Storage.normalizeShortcutKey(event.key, '');
      if (!normalized) return;
      inputElement.value = normalized;
    });
  }

  async function saveSettings() {
    try {
      const preferredSpeedResult = parseAndValidatePreferredSpeed();
      if (!preferredSpeedResult.valid) {
        showStatus(preferredSpeedResult.reason, 'error');
        return;
      }

      const shortcutResult = parseAndValidateShortcutKeys();
      if (!shortcutResult.valid) {
        showStatus(shortcutResult.reason, 'error');
        return;
      }

      const savedSpeed = await Storage.setPreferredSpeed(preferredSpeedResult.value);
      const savedShortcuts = await Storage.setShortcutKeys(shortcutResult.value);

      preferredSpeedInput.value = savedSpeed.toFixed(1);
      applyShortcutInputs(savedShortcuts);
      showStatus('Settings saved!', 'success');
    } catch (error) {
      console.error(`${CONFIG.LOG_PREFIX} Error saving settings:`, error);
      showStatus('Error saving settings', 'error');
    }
  }

  async function initialize() {
    try {
      const preferredSpeed = await Storage.getPreferredSpeed();
      const shortcutKeys = await Storage.getShortcutKeys();

      preferredSpeedInput.value = preferredSpeed.toFixed(1);
      applyShortcutInputs(shortcutKeys);

      saveButton.addEventListener('click', saveSettings);
      bindShortcutCapture(decreaseShortcutInput);
      bindShortcutCapture(increaseShortcutInput);
      bindShortcutCapture(toggleShortcutInput);

      preferredSpeedInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          saveSettings();
        }
      });

      decreaseShortcutInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          saveSettings();
        }
      });

      increaseShortcutInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          saveSettings();
        }
      });

      toggleShortcutInput.addEventListener('keydown', (event) => {
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
