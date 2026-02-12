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

  VSC.Storage = {
    clamp,
    toNumber,
    getPreferredSpeed,
    setPreferredSpeed
  };
})();
