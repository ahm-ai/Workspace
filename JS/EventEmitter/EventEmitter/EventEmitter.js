
class EventEmitter {
  constructor() {
    if (EventEmitter.instance) {
      return EventEmitter.instance;
    }
    this.events = {};
    this.store = new Map();
    EventEmitter.instance = this;
  }

  on(channel, listener) {
    if (!this.events[channel]) {
      this.events[channel] = [];
    }
    this.events[channel].push(listener);
    if (this.store.has(channel)) {
      listener(this.store.get(channel));
    }
    return () => {
      this.off(channel, listener);
    };
  }

  off(channel, listener) {
    if (!this.events[channel]) return;
    this.events[channel] = this.events[channel].filter(l => l !== listener);
  }

  emit(channel, data, cache = true) {
    if (cache) {
      const prev = this.store.get(channel) || {};
      const newData = { ...prev, ...data };
      
      // Compare the new data with the existing data in the cache
      if (JSON.stringify(newData) === JSON.stringify(prev)) {
        return; // Stop emitting if the data is the same
      }
      
      this.store.set(channel, newData);
    }
    if (!this.events[channel]) return;
    this.events[channel].forEach(listener => listener(this.store.get(channel)));
  }

  clear(channel) {
    if (this.store.has(channel)) {
      this.store.delete(channel);
    }
  }
}

export const eventEmitter = new EventEmitter();