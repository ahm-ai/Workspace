import { EventEmitter } from '../EventEmitter';

describe('EventEmitter', () => {
  let eventEmitter: EventEmitter;

  beforeEach(() => {
    eventEmitter = EventEmitter.getInstance();
  });

  test('test 1', () => {
    const listener = jest.fn();
    eventEmitter.on('CHANNEL1', listener);

    eventEmitter.emit('CHANNEL1', { });
    expect(listener).toHaveBeenCalledWith({ });
  });

});
