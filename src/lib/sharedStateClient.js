const SHARED_STATE_ENDPOINT = '/api/app-state';

const pendingTimers = new Map();
const pendingPayloads = new Map();

const cloneValue = (value) => {
    if (value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value));
};

async function putSharedState(key, value, options = {}) {
    const response = await fetch(`${SHARED_STATE_ENDPOINT}/${encodeURIComponent(key)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
        ...options,
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Failed to save shared state for ${key}: ${response.status}${errorText ? ` ${errorText}` : ''}`);
    }
}

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
    pendingPayloads.set(key, nextValue);

    if (pendingTimers.has(key)) {
        clearTimeout(pendingTimers.get(key));
    }

    const timer = setTimeout(async () => {
        pendingTimers.delete(key);

        try {
            await putSharedState(key, nextValue);
            pendingPayloads.delete(key);
        } catch (error) {
            console.error(`Failed to save shared state for ${key}:`, error);
        }
    }, delay);

    pendingTimers.set(key, timer);
}

export async function flushPendingSharedStateSaves() {
    const entries = [...pendingPayloads.entries()];
    if (entries.length === 0) return;

    entries.forEach(([key]) => {
        if (pendingTimers.has(key)) {
            clearTimeout(pendingTimers.get(key));
            pendingTimers.delete(key);
        }
    });

    await Promise.all(entries.map(async ([key, value]) => {
        try {
            await putSharedState(key, value, { keepalive: true });
            pendingPayloads.delete(key);
        } catch (error) {
            console.error(`Failed to flush shared state for ${key}:`, error);
        }
    }));
}
