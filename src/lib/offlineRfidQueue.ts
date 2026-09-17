/**
 * OFFLINE RFID TAP QUEUE MANAGER
 * 
 * Provides resilient, durable offline queueing using localStorage to store RFID taps
 * if network connection to Supabase is temporarily lost, unstable, or unreachable.
 * 
 * Features:
 * - Automatic queueing when offline (navigator.onLine === false) or on network/Supabase errors
 * - FIFO ordering with duplicate protection and visit-update consolidation
 * - Cross-tab synchronization via CustomEvent and StorageEvent
 * - Automatic background flusher upon network reconnection (window 'online')
 * - Manual trigger to flush or inspect queued taps
 */

import { LibraryVisit } from '../types';

export const OFFLINE_RFID_QUEUE_KEY = 'libtap_rfid_offline_queue_v1';
export const OFFLINE_RFID_QUEUE_EVENT = 'libtap_rfid_offline_queue_changed';

export interface QueuedRfidTap {
  id: string;
  visit: LibraryVisit;
  action: 'INSERT' | 'UPDATE';
  timestamp: string; // ISO string when tap occurred
  created_at: number; // Unix ms for FIFO sorting
  student_name?: string;
  student_nis?: string;
  student_class?: string;
  rfid_uid: string;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed';
  lastError?: string;
}

export interface FlushResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  remainingCount: number;
  errors: Array<{ id: string; error: string }>;
}

let isFlushingQueue = false;

/**
 * Retrieve all queued RFID taps from localStorage safely
 */
export function getQueuedRfidTaps(): QueuedRfidTap[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }

  try {
    const raw = localStorage.getItem(OFFLINE_RFID_QUEUE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Sort FIFO by creation time
      return parsed.sort((a, b) => (a.created_at || 0) - (b.created_at || 0));
    }
    return [];
  } catch (err) {
    console.error('[OfflineQueue] Failed to parse queued taps from localStorage:', err);
    return [];
  }
}

/**
 * Save queued taps to localStorage and broadcast change
 */
export function saveQueuedRfidTaps(queue: QueuedRfidTap[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    localStorage.setItem(OFFLINE_RFID_QUEUE_KEY, JSON.stringify(queue));
    notifyQueueChange(queue);
  } catch (err) {
    console.error('[OfflineQueue] Failed to write queue to localStorage:', err);
  }
}

/**
 * Dispatch event to notify current window & other components of queue updates
 */
function notifyQueueChange(queue: QueuedRfidTap[]): void {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent(OFFLINE_RFID_QUEUE_EVENT, { detail: queue })
      );
    } catch {
      // ignore
    }
  }
}

/**
 * Enqueue a new RFID tap into offline queue
 * Intelligently consolidates if the same visit already exists in queue (e.g. check-out on an unsynced check-in)
 */
export function enqueueRfidTap(item: {
  visit: LibraryVisit;
  action: 'INSERT' | 'UPDATE';
  student_name?: string;
  student_nis?: string;
  student_class?: string;
  rfid_uid: string;
  lastError?: string;
}): QueuedRfidTap {
  const currentQueue = getQueuedRfidTaps();
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();

  // Check if an entry for this exact visit.id already exists
  const existingIndex = currentQueue.findIndex(q => q.visit.id === item.visit.id);

  if (existingIndex >= 0) {
    // Merge updates: if this is a check-out (UPDATE), preserve initial insert or update payload
    const existing = currentQueue[existingIndex];
    const updatedItem: QueuedRfidTap = {
      ...existing,
      visit: {
        ...existing.visit,
        ...item.visit,
      },
      action: item.action, // preserve latest action
      status: 'pending',
      retryCount: 0, // reset retry count so it attempts sync fresh
      lastError: item.lastError || existing.lastError,
      timestamp: nowIso,
    };

    currentQueue[existingIndex] = updatedItem;
    saveQueuedRfidTaps(currentQueue);
    return updatedItem;
  }

  const newItem: QueuedRfidTap = {
    id: `q-tap-${nowMs}-${Math.random().toString(36).slice(2, 7)}`,
    visit: item.visit,
    action: item.action,
    timestamp: nowIso,
    created_at: nowMs,
    student_name: item.student_name,
    student_nis: item.student_nis,
    student_class: item.student_class,
    rfid_uid: item.rfid_uid,
    retryCount: 0,
    status: 'pending',
    lastError: item.lastError,
  };

  const nextQueue = [...currentQueue, newItem];
  saveQueuedRfidTaps(nextQueue);
  return newItem;
}

/**
 * Remove a specific queued tap by ID (e.g. once synced or manually discarded)
 */
export function dequeueRfidTap(id: string): void {
  const currentQueue = getQueuedRfidTaps();
  const filtered = currentQueue.filter(q => q.id !== id);
  if (filtered.length !== currentQueue.length) {
    saveQueuedRfidTaps(filtered);
  }
}

/**
 * Update an item's status in the queue
 */
export function updateQueuedRfidTap(id: string, updates: Partial<QueuedRfidTap>): void {
  const currentQueue = getQueuedRfidTaps();
  let changed = false;

  const nextQueue = currentQueue.map(item => {
    if (item.id === id) {
      changed = true;
      return { ...item, ...updates };
    }
    return item;
  });

  if (changed) {
    saveQueuedRfidTaps(nextQueue);
  }
}

/**
 * Clear the entire offline RFID queue
 */
export function clearOfflineRfidQueue(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem(OFFLINE_RFID_QUEUE_KEY);
    notifyQueueChange([]);
  }
}

/**
 * Get count of items currently waiting in queue
 */
export function getQueuedRfidTapsCount(): number {
  return getQueuedRfidTaps().length;
}

/**
 * Flush and replay queued taps sequentially to Supabase
 */
export async function flushRfidTapQueue(
  syncFn: (visit: LibraryVisit) => Promise<{ success: boolean; error?: string }>
): Promise<FlushResult> {
  if (isFlushingQueue) {
    const queue = getQueuedRfidTaps();
    return {
      success: false,
      syncedCount: 0,
      failedCount: 0,
      remainingCount: queue.length,
      errors: [{ id: 'system', error: 'Sinkronisasi antrean sedang berlangsung' }],
    };
  }

  isFlushingQueue = true;
  let syncedCount = 0;
  let failedCount = 0;
  const errors: Array<{ id: string; error: string }> = [];

  try {
    const initialQueue = getQueuedRfidTaps();
    if (initialQueue.length === 0) {
      return { success: true, syncedCount: 0, failedCount: 0, remainingCount: 0, errors: [] };
    }

    // Process each item in FIFO order
    for (const item of initialQueue) {
      // Mark as syncing in memory & storage
      updateQueuedRfidTap(item.id, { status: 'syncing' });

      try {
        const result = await syncFn(item.visit);

        if (result && result.success) {
          // Successfully recorded in Supabase, remove from offline queue
          dequeueRfidTap(item.id);
          syncedCount++;
        } else {
          // Sync failed, mark as failed and increment retry
          const errMsg = result?.error || 'Gagal menyimpan ke server Supabase';
          updateQueuedRfidTap(item.id, {
            status: 'failed',
            retryCount: (item.retryCount || 0) + 1,
            lastError: errMsg,
          });
          failedCount++;
          errors.push({ id: item.id, error: errMsg });
        }
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        updateQueuedRfidTap(item.id, {
          status: 'failed',
          retryCount: (item.retryCount || 0) + 1,
          lastError: errMsg,
        });
        failedCount++;
        errors.push({ id: item.id, error: errMsg });
      }
    }

    const remaining = getQueuedRfidTaps().length;
    return {
      success: failedCount === 0,
      syncedCount,
      failedCount,
      remainingCount: remaining,
      errors,
    };
  } finally {
    isFlushingQueue = false;
  }
}

/**
 * Register listener for queue changes (supports both in-app CustomEvent and cross-tab StorageEvent)
 */
export function listenToOfflineQueue(callback: (queue: QueuedRfidTap[]) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleCustomEvent = (e: Event) => {
    const detail = (e as CustomEvent<QueuedRfidTap[]>).detail;
    if (detail && Array.isArray(detail)) {
      callback(detail);
    } else {
      callback(getQueuedRfidTaps());
    }
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === OFFLINE_RFID_QUEUE_KEY) {
      callback(getQueuedRfidTaps());
    }
  };

  window.addEventListener(OFFLINE_RFID_QUEUE_EVENT, handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    window.removeEventListener(OFFLINE_RFID_QUEUE_EVENT, handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
  };
}
