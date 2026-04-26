/**
 * Offline Sync Service
 * 
 * Manages an outgoing request queue for actions performed while offline.
 * Persists the queue to localStorage and flushes it when connection is restored.
 */

const SYNC_QUEUE_KEY = 'unity_pending_sync_queue';

interface PendingRequest {
    id: string;
    url: string;
    method: 'POST' | 'PUT' | 'DELETE';
    body: any;
    timestamp: number;
}

/**
 * Adds a request to the offline queue.
 */
export function queueRequest(url: string, method: 'POST' | 'PUT' | 'DELETE', body: any) {
    const queue: PendingRequest[] = getQueue();
    const newRequest: PendingRequest = {
        id: crypto.randomUUID(),
        url,
        method,
        body,
        timestamp: Date.now()
    };
    
    queue.push(newRequest);
    saveQueue(queue);
    
    // Attempt sync immediately if possible
    if (navigator.onLine) {
        flushQueue();
    }
}

/**
 * Flushes all pending requests in the queue.
 */
export async function flushQueue() {
    if (!navigator.onLine) return;
    
    const queue = getQueue();
    if (queue.length === 0) return;
    
    console.log(`📡 Syncing ${queue.length} pending offline actions...`);
    
    const remainingQueue: PendingRequest[] = [];
    
    for (const req of queue) {
        try {
            const response = await fetch(req.url, {
                method: req.method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(req.body)
            });
            
            if (!response.ok) throw new Error('Sync failed for item');
            
            console.log(`✅ Successfully synced: ${req.url}`);
        } catch (err) {
            console.warn(`❌ Sync failed for ${req.url}, keeping in queue.`, err);
            remainingQueue.push(req);
        }
    }
    
    saveQueue(remainingQueue);
}

function getQueue(): PendingRequest[] {
    try {
        const data = localStorage.getItem(SYNC_QUEUE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

function saveQueue(queue: PendingRequest[]) {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
}

// Global listeners for automatic sync
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        console.log('🌐 Connection restored. Starting background sync...');
        flushQueue();
    });
    
    // Initial flush on load
    window.addEventListener('load', flushQueue);
}
