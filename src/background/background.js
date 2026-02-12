self.importScripts('../shared/config.js', '../shared/messages.js', '../shared/storage.js');

(() => {
  const root = globalThis;
  const VSC = root.__VSC__ || (root.__VSC__ = {});
  const { CONFIG, MESSAGES, Storage } = VSC;

  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason !== 'install') return;

    (async () => {
      try {
        await Storage.setPreferredSpeed(CONFIG.DEFAULTS[CONFIG.STORAGE_KEYS.PREFERRED_SPEED]);
      } catch (error) {
        console.warn(`${CONFIG.LOG_PREFIX} Failed to initialize preferred speed:`, error);
      }
    })();
  });

  chrome.runtime.onMessage.addListener((request, sender) => {
    if (request?.type !== MESSAGES.FORWARD_SPEED_COMMAND) {
      return false;
    }

    if (sender.tab?.id == null) {
      return false;
    }

    chrome.tabs.sendMessage(sender.tab.id, request, { frameId: 0 }).catch((error) => {
      console.warn(`${CONFIG.LOG_PREFIX} Failed to relay command to top frame:`, error);
    });

    return false;
  });
})();
