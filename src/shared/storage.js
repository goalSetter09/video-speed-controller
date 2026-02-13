(() => {
  const root = globalThis;
  const VSC = root.__VSC__ || (root.__VSC__ = {});
  const { CONFIG } = VSC;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function toNumber(value, fallback) {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  }

  function normalizeShortcutKey(value, fallback) {
    if (typeof value !== 'string') return fallback;

    const trimmed = value.trim();
    if (trimmed.length !== 1) return fallback;

    const lower = trimmed.toLowerCase();
    if (lower === '<') return ',';
    if (lower === '>') return '.';
    return lower;
  }

  function areShortcutKeysUnique(shortcutKeys) {
    const values = [
      shortcutKeys.decrease,
      shortcutKeys.increase,
      shortcutKeys.toggle
    ];

    return new Set(values).size === values.length;
  }

  function createShortcutKeys(rawValues) {
    const shortcutKeys = {
      decrease: normalizeShortcutKey(
        rawValues?.decrease,
        CONFIG.DEFAULTS[CONFIG.STORAGE_KEYS.DECREASE_SHORTCUT]
      ),
      increase: normalizeShortcutKey(
        rawValues?.increase,
        CONFIG.DEFAULTS[CONFIG.STORAGE_KEYS.INCREASE_SHORTCUT]
      ),
      toggle: normalizeShortcutKey(
        rawValues?.toggle,
        CONFIG.DEFAULTS[CONFIG.STORAGE_KEYS.TOGGLE_SHORTCUT]
      )
    };

    if (!areShortcutKeysUnique(shortcutKeys)) {
      return {
        decrease: CONFIG.DEFAULTS[CONFIG.STORAGE_KEYS.DECREASE_SHORTCUT],
        increase: CONFIG.DEFAULTS[CONFIG.STORAGE_KEYS.INCREASE_SHORTCUT],
        toggle: CONFIG.DEFAULTS[CONFIG.STORAGE_KEYS.TOGGLE_SHORTCUT]
      };
    }

    return shortcutKeys;
  }

  async function getPreferredSpeed() {
    try {
      const data = await chrome.storage.local.get(CONFIG.DEFAULTS);
      const raw = data[CONFIG.STORAGE_KEYS.PREFERRED_SPEED];
      const value = toNumber(raw, CONFIG.DEFAULTS[CONFIG.STORAGE_KEYS.PREFERRED_SPEED]);
      return clamp(value, CONFIG.MIN_PLAYBACK_SPEED, CONFIG.MAX_PLAYBACK_SPEED);
    } catch (error) {
      console.error(`${CONFIG.LOG_PREFIX} Failed to load preferred speed:`, error);
      return CONFIG.DEFAULTS[CONFIG.STORAGE_KEYS.PREFERRED_SPEED];
    }
  }

  async function setPreferredSpeed(speed) {
    const value = clamp(
      toNumber(speed, CONFIG.DEFAULTS[CONFIG.STORAGE_KEYS.PREFERRED_SPEED]),
      CONFIG.MIN_PLAYBACK_SPEED,
      CONFIG.MAX_PLAYBACK_SPEED
    );

    await chrome.storage.local.set({
      [CONFIG.STORAGE_KEYS.PREFERRED_SPEED]: value
    });

    return value;
  }

  async function getShortcutKeys() {
    try {
      const data = await chrome.storage.local.get(CONFIG.DEFAULTS);
      return createShortcutKeys({
        decrease: data[CONFIG.STORAGE_KEYS.DECREASE_SHORTCUT],
        increase: data[CONFIG.STORAGE_KEYS.INCREASE_SHORTCUT],
        toggle: data[CONFIG.STORAGE_KEYS.TOGGLE_SHORTCUT]
      });
    } catch (error) {
      console.error(`${CONFIG.LOG_PREFIX} Failed to load shortcut keys:`, error);
      return createShortcutKeys();
    }
  }

  async function setShortcutKeys(shortcutKeys) {
    const normalized = createShortcutKeys(shortcutKeys);

    await chrome.storage.local.set({
      [CONFIG.STORAGE_KEYS.DECREASE_SHORTCUT]: normalized.decrease,
      [CONFIG.STORAGE_KEYS.INCREASE_SHORTCUT]: normalized.increase,
      [CONFIG.STORAGE_KEYS.TOGGLE_SHORTCUT]: normalized.toggle
    });

    return normalized;
  }

  VSC.Storage = {
    clamp,
    toNumber,
    normalizeShortcutKey,
    createShortcutKeys,
    getPreferredSpeed,
    setPreferredSpeed,
    getShortcutKeys,
    setShortcutKeys
  };
})();
