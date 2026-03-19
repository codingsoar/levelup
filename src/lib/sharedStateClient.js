const SHARED_STATE_ENDPOINT = '/api/app-state';

const pendingTimers = new Map();

const cloneValue = (value) => {
    if (value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value));
};

export async function fetchSharedStateBootstrap() {
    try {
        const response = await fetch(SHARED_STATE_ENDPOINT);
        if (!response.ok) {
            throw new Error(`Failed to fetch shared state: ${response.status}`);
        }

        const data = await response.json();
        return data?.state || {};
    } catch (error) {
        console.error('Failed to fetch shared state bootstrap:', error);
        return {};
    }
}

export function scheduleSharedStateSave(key, value, delay = 300) {
    if (!key) return;

    const nextValue = cloneValue(value);

    if (pendingTimers.has(key)) {
        clearTimeout(pendingTimers.get(key));
    }

    const timer = setTimeout(async () => {
        pendingTimers.delete(key);

        try {
            await fetch(`${SHARED_STATE_ENDPOINT}/${encodeURIComponent(key)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ value: nextValue }),
            });
        } catch (error) {
            console.error(`Failed to save shared state for ${key}:`, error);
        }
    }, delay);

    pendingTimers.set(key, timer);
}
