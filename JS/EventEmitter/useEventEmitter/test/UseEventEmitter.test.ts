import { renderHook } from '@testing-library/react-hooks';

import useEventEmitter from '../UseEventEmitter';
import { EmitterType, eventEmitter } from '../../EventEmitter/EventEmitter';

jest.mock('../eventEmitter', () => ({
  eventEmitter: {
    on: jest.fn(),
    off: jest.fn(),
  },
}));

describe('TEST', () => {
  const event = 'CHANNEL1';
  const listener = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('TEST', () => {
    renderHook(() => { useEventEmitter(event, listener); });
    expect(eventEmitter.on).toHaveBeenCalledWith(event, expect.any(Function));
  });

  test('TEST2', () => {
    const { unmount } = renderHook(() => { useEventEmitter(event, listener); });

    unmount();

    expect(eventEmitter.off).toHaveBeenCalledWith(event, expect.any(Function));
  });

  test('TEST3', () => {
    const listenerSub = jest.fn();
    const { rerender } = renderHook(({ event, listener }) => { useEventEmitter(event as EmitterType, listener); }, {
      initialProps: { event: 'CHANNEL1' as EmitterType, listener },
    });

    rerender({ event: '', listener: listenerSub });

    expect(eventEmitter.off).toHaveBeenCalledWith('CHANNEL1', expect.any(Function));
  });
});
