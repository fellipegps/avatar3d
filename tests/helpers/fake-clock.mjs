/** Relógio determinístico: nenhum timer real é criado nesta suíte. */
export class FakeClock {
  now = 0;
  nextId = 0;
  tasks = new Map();
  schedule = (callback, delayMs) => {
    const id = ++this.nextId;
    this.tasks.set(id, { at: this.now + delayMs, callback });
    return () => this.tasks.delete(id);
  };
  advance(ms) {
    const target = this.now + ms;
    while (true) {
      const next = [...this.tasks.entries()].filter(([, task]) => task.at <= target)
        .sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
      if (!next) break;
      this.now = next[1].at; this.tasks.delete(next[0]); next[1].callback();
    }
    this.now = target;
  }
}

export function trackAbortListeners(signal) {
  const listeners = new Set();
  const add = signal.addEventListener.bind(signal), remove = signal.removeEventListener.bind(signal);
  signal.addEventListener = (type, callback, options) => {
    if (type === 'abort') listeners.add(callback);
    add(type, callback, options);
  };
  signal.removeEventListener = (type, callback, options) => {
    if (type === 'abort') listeners.delete(callback);
    remove(type, callback, options);
  };
  return listeners;
}
