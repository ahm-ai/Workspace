

export type EmitterType = 'notification' 
export enum NotificationType {
  ERROR = 'ERROR',
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
}

export class EventEmitter {
  private static instance: EventEmitter;
  private events: Record<string, Function[]> = {};

  private constructor () {}

  public static getInstance (): EventEmitter {
    if (!EventEmitter.instance) {
      EventEmitter.instance = new EventEmitter();
    }
    return EventEmitter.instance;
  }

  on (event: EmitterType, listener: Function) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  off (event: EmitterType, listener: Function) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listener);
  }

  emit (event: EmitterType, data?: any) {
    if (!this.events[event]) return;
    this.events[event].forEach(listener => listener(data));
  }
}

export const eventEmitter = EventEmitter.getInstance();
