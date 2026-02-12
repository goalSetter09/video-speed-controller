(() => {
  const root = globalThis;
  const VSC = root.__VSC__ || (root.__VSC__ = {});

  VSC.MESSAGES = Object.freeze({
    FORWARD_SPEED_COMMAND: 'FORWARD_SPEED_COMMAND'
  });

  VSC.COMMANDS = Object.freeze({
    DECREASE: 'decrease',
    INCREASE: 'increase',
    TOGGLE: 'toggle'
  });
})();
