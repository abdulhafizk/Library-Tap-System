import { BookWishlist, ReadingJournalEntry } from '../types';

export const WISHLIST_STORAGE_KEY = 'libtap_santri_wishlist_v1';
export const JOURNAL_STORAGE_KEY = 'libtap_santri_journal_v1';

// Clean State: Tidak menggunakan data dummy/palsu
const INITIAL_WISHLISTS: BookWishlist[] = [];
const INITIAL_JOURNALS: ReadingJournalEntry[] = [];

// ==========================================
// WISHLIST STORAGE HELPERS
// ==========================================

export function getWishlistsFromStorage(): BookWishlist[] {
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(INITIAL_WISHLISTS));
      return INITIAL_WISHLISTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return INITIAL_WISHLISTS;
    // Filter out any legacy dummy wishlists
    const cleaned = parsed.filter(w => 
      w.id !== 'wish-001' && 
      w.id !== 'wish-002' && 
      w.student_id !== 'std-demo-01'
    );
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch (err) {
    console.error('Failed to parse wishlists from storage:', err);
    return INITIAL_WISHLISTS;
  }
}

export function saveWishlistsToStorage(wishlists: BookWishlist[]): void {
  try {
    // Filter out dummy items before saving
    const cleaned = wishlists.filter(w => 
      w.id !== 'wish-001' && 
      w.id !== 'wish-002' && 
      w.student_id !== 'std-demo-01'
    );
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(cleaned));
  } catch (err) {
    console.error('Failed to save wishlists to storage:', err);
  }
}

export function addWishlistToStorage(
  wishlistData: Omit<BookWishlist, 'id' | 'created_at' | 'status'>
): BookWishlist {
  const current = getWishlistsFromStorage();
  const newEntry: BookWishlist = {
    ...wishlistData,
    id: `wish-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    status: 'pending',
    created_at: new Date().toISOString()
  };
  const updated = [newEntry, ...current];
  saveWishlistsToStorage(updated);
  return newEntry;
}

export function updateWishlistInStorage(
  id: string,
  updates: Partial<BookWishlist>
): BookWishlist | null {
  const current = getWishlistsFromStorage();
  let updatedItem: BookWishlist | null = null;
  const next = current.map(item => {
    if (item.id === id) {
      updatedItem = {
        ...item,
        ...updates,
        updated_at: new Date().toISOString()
      };
      return updatedItem;
    }
    return item;
  });
  if (updatedItem) {
    saveWishlistsToStorage(next);
  }
  return updatedItem;
}

export function deleteWishlistFromStorage(id: string): boolean {
  const current = getWishlistsFromStorage();
  const filtered = current.filter(w => w.id !== id);
  if (filtered.length !== current.length) {
    saveWishlistsToStorage(filtered);
    return true;
  }
  return false;
}

// ==========================================
// READING JOURNAL STORAGE HELPERS
// ==========================================

export function getJournalsFromStorage(): ReadingJournalEntry[] {
  try {
    const raw = localStorage.getItem(JOURNAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(INITIAL_JOURNALS));
      return INITIAL_JOURNALS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return INITIAL_JOURNALS;
    const cleaned = parsed.filter(j =>
      j.id !== 'jrnl-001' &&
      j.id !== 'jrnl-002' &&
      j.student_id !== 'std-demo-01'
    );
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch (err) {
    console.error('Failed to parse journals from storage:', err);
    return INITIAL_JOURNALS;
  }
}

export function saveJournalsToStorage(journals: ReadingJournalEntry[]): void {
  try {
    localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(journals));
  } catch (err) {
    console.error('Failed to save journals to storage:', err);
  }
}

export function addJournalToStorage(
  journalData: Omit<ReadingJournalEntry, 'id' | 'created_at'>
): ReadingJournalEntry {
  const current = getJournalsFromStorage();
  const newEntry: ReadingJournalEntry = {
    ...journalData,
    id: `jrnl-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    created_at: new Date().toISOString()
  };
  const updated = [newEntry, ...current];
  saveJournalsToStorage(updated);
  return newEntry;
}

export function updateJournalInStorage(
  id: string,
  updates: Partial<ReadingJournalEntry>
): ReadingJournalEntry | null {
  const current = getJournalsFromStorage();
  const idx = current.findIndex(j => j.id === id);
  if (idx === -1) return null;

  const updatedEntry = {
    ...current[idx],
    ...updates,
    updated_at: new Date().toISOString()
  };
  current[idx] = updatedEntry;
  saveJournalsToStorage([...current]);
  return updatedEntry;
}

export function deleteJournalFromStorage(id: string): boolean {
  const current = getJournalsFromStorage();
  const filtered = current.filter(j => j.id !== id);
  if (filtered.length !== current.length) {
    saveJournalsToStorage(filtered);
    return true;
  }
  return false;
}
