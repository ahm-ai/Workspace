import { useEffect } from 'react';

function useEventEmitter<T = any>(event: EmitterType, listener: (data: T) => void) {
    useEffect(() => {
        const subscriber: (data: T) => void = (data) => { listener(data) };
        eventEmitter.on(event, subscriber);

        return () => {
            eventEmitter.off(event, subscriber);
        };
    }, [event, listener]);
}

export default useEventEmitter;
