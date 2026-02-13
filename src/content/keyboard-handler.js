(() => {
  const root = globalThis;
  const VSC = root.__VSC__ || (root.__VSC__ = {});
  const {
    CONFIG,
    MESSAGES,
    COMMANDS,
    ContentState,
    Storage,
    VideoController,
    OverlayManager
  } = VSC;

  function normalizeKeyFromCode(code) {
    if (typeof code !== 'string' || code.length === 0) return '';

    if (code === 'Comma') return ',';
    if (code === 'Period') return '.';

    if (code.startsWith('Key') && code.length === 4) {
      return code.slice(3).toLowerCase();
    }

    return '';
  }

  function getEventShortcutCandidates(event) {
    const byKey = Storage.normalizeShortcutKey(event.key, '');
    const byCode = normalizeKeyFromCode(event.code);

    if (byKey && byCode && byKey !== byCode) {
      return [byKey, byCode];
    }

    if (byKey) return [byKey];
    if (byCode) return [byCode];
    return [];
  }

  function parseCommand(event) {
    if (event.metaKey || event.ctrlKey) return null;

    const { shortcutKeys } = ContentState;
    const candidates = getEventShortcutCandidates(event);
    if (candidates.length === 0) return null;

    if (candidates.includes(shortcutKeys.decrease)) {
      return COMMANDS.DECREASE;
    }

    if (candidates.includes(shortcutKeys.increase)) {
      return COMMANDS.INCREASE;
    }

    if (candidates.includes(shortcutKeys.toggle)) {
      return COMMANDS.TOGGLE;
    }

    return null;
  }

  function shouldIgnoreTarget(target) {
    if (!target) return false;

    return target.tagName === 'INPUT'
      || target.tagName === 'TEXTAREA'
      || target.isContentEditable;
  }

  function executeCommand(video, command) {
    if (command === COMMANDS.DECREASE) {
      return VideoController.changeSpeed(video, -CONFIG.SPEED_STEP);
    }

    if (command === COMMANDS.INCREASE) {
      return VideoController.changeSpeed(video, CONFIG.SPEED_STEP);
    }

    if (command === COMMANDS.TOGGLE) {
      return VideoController.togglePreferredSpeed(video);
    }

    return null;
  }

  function applyCommandToActiveVideo(command, highlight) {
    const video = VideoController.findActiveVideo();
    if (!video) return false;

    const newSpeed = executeCommand(video, command);
    if (newSpeed === null) return false;

    OverlayManager.updateSpeed(video, newSpeed, highlight);
    return true;
  }

  function handleKeydown(event) {
    if (shouldIgnoreTarget(event.target)) return;

    const command = parseCommand(event);
    if (!command) return;

    if (applyCommandToActiveVideo(command, true)) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (ContentState.isTopFrame) return;

    event.preventDefault();
    event.stopPropagation();

    try {
      chrome.runtime.sendMessage({
        type: MESSAGES.FORWARD_SPEED_COMMAND,
        command
      });
    } catch (error) {
      console.warn(`${CONFIG.LOG_PREFIX} Failed to forward command:`, error);
    }
  }

  function handleForwardedCommand(request) {
    if (!request || request.type !== MESSAGES.FORWARD_SPEED_COMMAND) return;
    applyCommandToActiveVideo(request.command, true);
  }

  function bindKeyboard() {
    ContentState.onKeydown = handleKeydown;
    document.addEventListener('keydown', ContentState.onKeydown, true);
  }

  function unbindKeyboard() {
    if (!ContentState.onKeydown) return;
    document.removeEventListener('keydown', ContentState.onKeydown, true);
    ContentState.onKeydown = null;
  }

  VSC.KeyboardHandler = {
    bindKeyboard,
    unbindKeyboard,
    handleForwardedCommand
  };
})();
