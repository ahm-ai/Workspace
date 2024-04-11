import { useEffect, useState } from 'react';

function useEventEmitter<T = any>(event: any, listener: (data: T) => {}) {
    const [state, setState] = useState();

    useEffect(() => {
        const subscriber: (data: T) => void = (data) => { listener(data) };
        eventEmitter.on(event, subscriber);

        return () => {
            eventEmitter.off(event, subscriber);
        };
    }, [event]);

    return state
}

export default useEventEmitter;
