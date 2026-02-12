(() => {
  const root = globalThis;
  const VSC = root.__VSC__ || (root.__VSC__ = {});

  const STORAGE_KEYS = Object.freeze({
    PREFERRED_SPEED: 'preferredSpeed'
  });

  const DEFAULTS = Object.freeze({
    [STORAGE_KEYS.PREFERRED_SPEED]: 1.8
  });

  VSC.CONFIG = Object.freeze({
    STORAGE_KEYS,
    DEFAULTS,
    SPEED_STEP: 0.1,
    MIN_PLAYBACK_SPEED: 0.1,
    MAX_PLAYBACK_SPEED: 16.0,
    POPUP_MIN_PREFERRED_SPEED: 0.1,
    POPUP_MAX_PREFERRED_SPEED: 5.0,
    OVERLAY_TIMEOUT_MS: 1200,
    TOGGLE_EPSILON: 0.05,
    NORMAL_SPEED: 1.0,
    LOG_PREFIX: '[Video Speed Controller]'
  });
})();
