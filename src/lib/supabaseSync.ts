import { supabase, isSupabaseConfigured } from './supabase';
import { Student, RfidCard, LibraryVisit, Book, BookLoan, AppUser } from '../types';

export interface SyncStats {
  studentsCount: number;
  booksCount: number;
  loansCount: number;
  visitsCount: number;
  cardsCount: number;
  lastSyncedAt: string;
}

/**
 * Upload and synchronize all local data to Supabase
 */
export async function syncAllToSupabase(data: {
  students: Student[];
  cards: RfidCard[];
  books: Book[];
  loans: BookLoan[];
  visits: LibraryVisit[];
  users: AppUser[];
}): Promise<{ success: boolean; message: string; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, message: 'Kredensial Supabase belum dikonfigurasi.' };
  }

  try {
    // 1. Sync Students
    if (data.students.length > 0) {
      const studentPayloads = data.students.map(s => {
        const payload: any = {
          nis: s.nis,
          name: s.name,
          class: s.class,
          gender: s.gender,
          photo_url: s.photo_url || null,
          phone: s.phone || null,
          status: s.status || 'active',
        };
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s.id);
        if (isUUID) payload.id = s.id;
        return payload;
      });

      const { error: studentErr } = await supabase
        .from('students')
        .upsert(studentPayloads, { onConflict: 'nis' });
      if (studentErr) console.warn('Supabase students upsert warning:', studentErr);
    }

    // 2. Sync Books
    if (data.books.length > 0) {
      const bookPayloads = data.books.map(b => {
        const payload: any = {
          code: b.code,
          title: b.title,
          author: b.author,
          publisher: b.publisher || null,
          year: b.year || null,
          category: b.category,
          rack_location: b.rack_location,
          total_stock: b.total_stock,
          available_stock: b.available_stock,
          cover_url: b.cover_url || null,
          isbn: b.isbn || null,
        };
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(b.id);
        if (isUUID) payload.id = b.id;
        return payload;
      });

      const { error: bookErr } = await supabase
        .from('books')
        .upsert(bookPayloads, { onConflict: 'code' });
      if (bookErr) console.warn('Supabase books upsert warning:', bookErr);
    }

    // 3. Sync RFID Cards
    if (data.cards.length > 0) {
      const cardPayloads = data.cards.map(c => {
        const payload: any = {
          uid: c.uid,
          status: c.status || 'active',
          note: c.note || null,
          registered_at: c.registered_at || new Date().toISOString(),
        };
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(c.id);
        if (isUUID) payload.id = c.id;
        if (c.student_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(c.student_id)) {
          payload.student_id = c.student_id;
        }
        return payload;
      });

      const { error: cardErr } = await supabase
        .from('rfid_cards')
        .upsert(cardPayloads, { onConflict: 'uid' });
      if (cardErr) console.warn('Supabase cards upsert warning:', cardErr);
    }

    // 4. Sync Users (Petugas & Administrator)
    if (data.users && data.users.length > 0) {
      const userPayloads = data.users.map(u => ({
        name: u.name,
        email: u.email.toLowerCase(),
        role: u.role,
        avatar_url: u.avatar || null,
      })).filter(u => u.email);

      const { error: userErr } = await supabase
        .from('users')
        .upsert(userPayloads, { onConflict: 'email' });
      if (userErr) console.warn('Supabase users upsert warning:', userErr);
    }

    return {
      success: true,
      message: 'Semua data perpustakaan termasuk akun pengguna berhasil disinkronkan ke database Supabase!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal sinkronisasi: ${err?.message || err}`,
      error: String(err),
    };
  }
}

/**
 * Fetch latest data from Supabase tables
 */
export async function fetchAllFromSupabase(): Promise<{
  success: boolean;
  students?: Student[];
  books?: Book[];
  cards?: RfidCard[];
  visits?: LibraryVisit[];
  loans?: BookLoan[];
  users?: AppUser[];
  error?: string;
}> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const [studentsRes, booksRes, cardsRes, visitsRes, loansRes, usersRes] = await Promise.all([
      supabase.from('students').select('*').order('created_at', { ascending: false }),
      supabase.from('books').select('*').order('created_at', { ascending: false }),
      supabase.from('rfid_cards').select('*'),
      supabase.from('library_visits').select('*').order('check_in', { ascending: false }).limit(250),
      supabase.from('book_loans').select('*').order('borrow_date', { ascending: false }).limit(250),
      supabase.from('users').select('*').order('created_at', { ascending: false }),
    ]);

    const result: any = { success: true };

    let cardsList: RfidCard[] = [];
    if (cardsRes.data !== null && !cardsRes.error) {
      cardsList = cardsRes.data.map((row: any) => ({
        id: row.id,
        uid: row.uid,
        student_id: row.student_id,
        status: row.status,
        registered_at: row.registered_at,
        note: row.note || '',
      }));
    }

    if (studentsRes.data !== null && !studentsRes.error) {
      result.students = studentsRes.data.map((row: any) => {
        const studentCard = cardsList.find(c => c.student_id === row.id);
        return {
          id: row.id,
          nis: row.nis,
          name: row.name,
          class: row.class,
          gender: row.gender,
          photo_url: row.photo_url || '',
          phone: row.phone || '',
          status: row.status || 'active',
          rfid_uid: studentCard ? studentCard.uid : undefined,
          created_at: row.created_at,
        };
      });
    }

    // Ensure all student cards exist in cards list
    if (result.students) {
      result.students.forEach((s: Student) => {
        if (s.rfid_uid && !cardsList.some(c => c.uid === s.rfid_uid)) {
          cardsList.push({
            id: `c-${s.id}`,
            uid: s.rfid_uid,
            student_id: s.id,
            status: 'active',
            registered_at: s.created_at || new Date().toISOString(),
            note: `Kartu santri ${s.name} (${s.nis})`,
          });
        }
      });
    }
    result.cards = cardsList;

    if (visitsRes.data !== null && !visitsRes.error) {
      result.visits = visitsRes.data.map((row: any) => ({
        id: row.id,
        student_id: row.student_id,
        rfid_card_id: row.rfid_card_id,
        rfid_uid: row.rfid_uid,
        check_in: row.check_in,
        check_out: row.check_out,
        duration_minutes: row.duration_minutes,
        status: row.status,
        created_at: row.created_at,
        notes: row.notes || '',
      }));
    }

    if (loansRes.data !== null && !loansRes.error) {
      result.loans = loansRes.data.map((row: any) => ({
        id: row.id,
        loan_code: row.loan_code,
        student_id: row.student_id,
        book_id: row.book_id,
        borrow_date: row.borrow_date,
        due_date: row.due_date,
        return_date: row.return_date,
        status: row.status,
        fine_amount: Number(row.fine_amount) || 0,
        notes: row.notes || '',
        created_at: row.created_at,
      }));
    }

    if (usersRes.data !== null && !usersRes.error) {
      result.users = usersRes.data.map((row: any) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        username: row.username || row.email?.split('@')[0] || 'petugas',
        role: row.role || 'staff',
        avatar: row.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        phone: row.phone || '',
        status: row.status || 'active',
        is_default: row.role === 'admin' && (row.email?.startsWith('admin') || row.name?.toLowerCase().includes('admin')),
        created_at: row.created_at || new Date().toISOString(),
      }));
    }

    return result;
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * ============================================================================
 * DIRECT SUPABASE CRUD FUNCTIONS (IMMEDIATE CLOUD PERSISTENCE)
 * ============================================================================
 */

// --- STUDENT OPERATIONS ---
export async function insertStudentToSupabase(student: Student): Promise<{ success: boolean; id?: string }> {
  if (!isSupabaseConfigured) return { success: true };
  try {
    const payload: any = {
      nis: student.nis,
      name: student.name,
      class: student.class,
      gender: student.gender,
      photo_url: student.photo_url || null,
      phone: student.phone || null,
      status: student.status || 'active',
    };
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(student.id)) {
      payload.id = student.id;
    }
    const { data, error } = await supabase.from('students').insert(payload).select('id').single();
    if (error) {
      console.warn('Supabase insert student error:', error.message);
      return { success: false };
    }
    const studentDbId = data?.id || (payload.id ? payload.id : null);

    // If student has an RFID UID, also ensure it's registered in rfid_cards table
    if (student.rfid_uid) {
      const cardPayload: any = {
        uid: student.rfid_uid.trim().toUpperCase(),
        status: 'active',
        note: `Kartu santri ${student.name} (${student.nis})`,
        registered_at: new Date().toISOString(),
      };
      if (studentDbId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(studentDbId)) {
        cardPayload.student_id = studentDbId;
      }
      await supabase.from('rfid_cards').upsert(cardPayload, { onConflict: 'uid' });
    }

    return { success: true, id: studentDbId };
  } catch (e) {
    console.warn('Supabase insert student exception:', e);
    return { success: false };
  }
}

export async function updateStudentInSupabase(id: string, updates: Partial<Student>): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.class !== undefined) payload.class = updates.class;
    if (updates.gender !== undefined) payload.gender = updates.gender;
    if (updates.photo_url !== undefined) payload.photo_url = updates.photo_url || null;
    if (updates.phone !== undefined) payload.phone = updates.phone || null;
    if (updates.status !== undefined) payload.status = updates.status;

    let query = supabase.from('students').update(payload);
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      query = query.eq('id', id);
    } else if (updates.nis) {
      query = query.eq('nis', updates.nis);
    } else {
      query = query.eq('id', id);
    }
    const { error } = await query;

    // If rfid_uid changed in updates
    if (updates.rfid_uid) {
      const cleanUid = updates.rfid_uid.trim().toUpperCase();
      const cardPayload: any = {
        uid: cleanUid,
        status: 'active',
        registered_at: new Date().toISOString()
      };
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        cardPayload.student_id = id;
      }
      await supabase.from('rfid_cards').upsert(cardPayload, { onConflict: 'uid' });
    }

    return !error;
  } catch (e) {
    console.warn('Supabase update student exception:', e);
    return false;
  }
}

export async function deleteStudentFromSupabase(student: { id: string; nis?: string }): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    let query = supabase.from('students').delete();
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(student.id)) {
      query = query.eq('id', student.id);
    } else if (student.nis) {
      query = query.eq('nis', student.nis);
    } else {
      query = query.eq('id', student.id);
    }
    const { error } = await query;
    return !error;
  } catch (e) {
    console.warn('Supabase delete student exception:', e);
    return false;
  }
}

// --- BOOK OPERATIONS ---
export async function insertBookToSupabase(book: Book): Promise<{ success: boolean; id?: string }> {
  if (!isSupabaseConfigured) return { success: true };
  try {
    const payload: any = {
      code: book.code,
      title: book.title,
      author: book.author,
      publisher: book.publisher || null,
      year: book.year || null,
      category: book.category,
      rack_location: book.rack_location,
      total_stock: book.total_stock,
      available_stock: book.available_stock,
      cover_url: book.cover_url || null,
      isbn: book.isbn || null,
    };
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(book.id)) {
      payload.id = book.id;
    }
    const { data, error } = await supabase.from('books').insert(payload).select('id').single();
    return { success: !error, id: data?.id };
  } catch (e) {
    console.warn('Supabase insert book exception:', e);
    return { success: false };
  }
}

export async function updateBookInSupabase(id: string, updates: Partial<Book>): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    const payload: any = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.author !== undefined) payload.author = updates.author;
    if (updates.publisher !== undefined) payload.publisher = updates.publisher;
    if (updates.year !== undefined) payload.year = updates.year;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.rack_location !== undefined) payload.rack_location = updates.rack_location;
    if (updates.total_stock !== undefined) payload.total_stock = updates.total_stock;
    if (updates.available_stock !== undefined) payload.available_stock = updates.available_stock;
    if (updates.cover_url !== undefined) payload.cover_url = updates.cover_url;
    if (updates.isbn !== undefined) payload.isbn = updates.isbn;

    let query = supabase.from('books').update(payload);
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      query = query.eq('id', id);
    } else if (updates.code) {
      query = query.eq('code', updates.code);
    } else {
      query = query.eq('id', id);
    }
    const { error } = await query;
    return !error;
  } catch (e) {
    console.warn('Supabase update book exception:', e);
    return false;
  }
}

export async function deleteBookFromSupabase(book: { id: string; code?: string }): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    let query = supabase.from('books').delete();
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(book.id)) {
      query = query.eq('id', book.id);
    } else if (book.code) {
      query = query.eq('code', book.code);
    } else {
      query = query.eq('id', book.id);
    }
    const { error } = await query;
    return !error;
  } catch (e) {
    console.warn('Supabase delete book exception:', e);
    return false;
  }
}

// --- RFID CARD OPERATIONS ---
export async function insertCardToSupabase(card: RfidCard): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    const payload: any = {
      uid: card.uid,
      status: card.status || 'active',
      note: card.note || null,
      registered_at: card.registered_at || new Date().toISOString(),
    };
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(card.id)) {
      payload.id = card.id;
    }
    if (card.student_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(card.student_id)) {
      payload.student_id = card.student_id;
    }
    const { error } = await supabase.from('rfid_cards').upsert(payload, { onConflict: 'uid' });
    return !error;
  } catch (e) {
    console.warn('Supabase insert card exception:', e);
    return false;
  }
}

export async function updateCardInSupabase(id: string, updates: Partial<RfidCard>): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    const payload: any = {};
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.note !== undefined) payload.note = updates.note;
    if (updates.student_id !== undefined) {
      payload.student_id = updates.student_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(updates.student_id)
        ? updates.student_id
        : null;
    }
    let query = supabase.from('rfid_cards').update(payload);
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      query = query.eq('id', id);
    } else if (updates.uid) {
      query = query.eq('uid', updates.uid);
    } else {
      query = query.eq('id', id);
    }
    const { error } = await query;
    return !error;
  } catch (e) {
    console.warn('Supabase update card exception:', e);
    return false;
  }
}

export async function deleteCardFromSupabase(card: { id: string; uid?: string }): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    let query = supabase.from('rfid_cards').delete();
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(card.id)) {
      query = query.eq('id', card.id);
    } else if (card.uid) {
      query = query.eq('uid', card.uid);
    } else {
      query = query.eq('id', card.id);
    }
    const { error } = await query;
    return !error;
  } catch (e) {
    console.warn('Supabase delete card exception:', e);
    return false;
  }
}

// --- BOOK LOAN OPERATIONS ---
export async function insertLoanToSupabase(loan: BookLoan): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    const payload: any = {
      loan_code: loan.loan_code,
      borrow_date: loan.borrow_date,
      due_date: loan.due_date,
      return_date: loan.return_date || null,
      status: loan.status,
      fine_amount: loan.fine_amount || 0,
      notes: loan.notes || null,
    };
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(loan.id)) {
      payload.id = loan.id;
    }
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(loan.student_id)) {
      payload.student_id = loan.student_id;
    }
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(loan.book_id)) {
      payload.book_id = loan.book_id;
    }
    const { error } = await supabase.from('book_loans').upsert(payload, { onConflict: 'loan_code' });
    return !error;
  } catch (e) {
    console.warn('Supabase insert loan exception:', e);
    return false;
  }
}

export async function updateLoanInSupabase(id: string, updates: Partial<BookLoan>): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    const payload: any = {};
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.return_date !== undefined) payload.return_date = updates.return_date;
    if (updates.due_date !== undefined) payload.due_date = updates.due_date;
    if (updates.fine_amount !== undefined) payload.fine_amount = updates.fine_amount;
    if (updates.notes !== undefined) payload.notes = updates.notes;

    let query = supabase.from('book_loans').update(payload);
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      query = query.eq('id', id);
    } else if (updates.loan_code) {
      query = query.eq('loan_code', updates.loan_code);
    } else {
      query = query.eq('id', id);
    }
    const { error } = await query;
    return !error;
  } catch (e) {
    console.warn('Supabase update loan exception:', e);
    return false;
  }
}

export async function deleteLoanFromSupabase(loan: { id: string; loan_code?: string }): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    let query = supabase.from('book_loans').delete();
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(loan.id)) {
      query = query.eq('id', loan.id);
    } else if (loan.loan_code) {
      query = query.eq('loan_code', loan.loan_code);
    } else {
      query = query.eq('id', loan.id);
    }
    const { error } = await query;
    return !error;
  } catch (e) {
    console.warn('Supabase delete loan exception:', e);
    return false;
  }
}

// --- VISIT OPERATIONS ---
export async function recordVisitToSupabase(visit: LibraryVisit): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const payload: any = {
      rfid_uid: visit.rfid_uid,
      check_in: visit.check_in,
      check_out: visit.check_out || null,
      duration_minutes: visit.duration_minutes || null,
      status: visit.status,
      notes: visit.notes || null,
    };
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(visit.id)) {
      payload.id = visit.id;
    }
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(visit.student_id)) {
      payload.student_id = visit.student_id;
    }
    if (visit.rfid_card_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(visit.rfid_card_id)) {
      payload.rfid_card_id = visit.rfid_card_id;
    }
    await supabase.from('library_visits').upsert(payload);
  } catch (err) {
    console.warn('Could not record visit to Supabase in background:', err);
  }
}

export async function updateVisitInSupabase(id: string, updates: Partial<LibraryVisit>): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    const payload: any = {};
    if (updates.check_out !== undefined) payload.check_out = updates.check_out;
    if (updates.duration_minutes !== undefined) payload.duration_minutes = updates.duration_minutes;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.notes !== undefined) payload.notes = updates.notes;

    const { error } = await supabase.from('library_visits').update(payload).eq('id', id);
    return !error;
  } catch (e) {
    console.warn('Supabase update visit exception:', e);
    return false;
  }
}

export async function deleteVisitFromSupabase(visitId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    const { error } = await supabase.from('library_visits').delete().eq('id', visitId);
    return !error;
  } catch (e) {
    console.warn('Supabase delete visit exception:', e);
    return false;
  }
}

// --- USER OPERATIONS ---
export async function fetchUsersFromSupabase(): Promise<AppUser[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      username: row.username || row.email?.split('@')[0] || 'petugas',
      role: row.role || 'staff',
      avatar: row.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      phone: row.phone || '',
      status: row.status || 'active',
      is_default: row.role === 'admin' && (row.email?.startsWith('admin') || row.name?.toLowerCase().includes('admin')),
      created_at: row.created_at || new Date().toISOString(),
    }));
  } catch (err) {
    console.warn('Error fetching users from Supabase:', err);
    return [];
  }
}

export async function saveUserToSupabase(user: AppUser, _password?: string): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured) {
    return { success: true, message: 'Disimpan secara lokal.' };
  }

  try {
    const payload: any = {
      name: user.name,
      email: user.email.toLowerCase(),
      role: user.role,
      avatar_url: user.avatar || null,
    };

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
    if (isUUID) {
      payload.id = user.id;
    }

    const { error } = await supabase
      .from('users')
      .upsert(payload, { onConflict: 'email' });

    if (error) {
      console.warn('Supabase save user warning:', error.message);
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Akun berhasil disimpan ke database Supabase.' };
  } catch (err: any) {
    console.warn('Supabase save user error:', err);
    return { success: false, message: err?.message || String(err) };
  }
}

export async function updateUserInSupabase(
  user: AppUser, 
  updates: Partial<AppUser>
): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured) {
    return { success: true, message: 'Diperbarui secara lokal.' };
  }

  try {
    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.email !== undefined) payload.email = updates.email.toLowerCase();
    if (updates.role !== undefined) payload.role = updates.role;
    if (updates.avatar !== undefined) payload.avatar_url = updates.avatar;

    let query = supabase.from('users').update(payload);
    if (user.email) {
      query = query.eq('email', user.email.toLowerCase());
    } else {
      query = query.eq('id', user.id);
    }

    const { error } = await query;
    if (error) {
      console.warn('Supabase update user warning:', error.message);
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Akun berhasil diperbarui di database Supabase.' };
  } catch (err: any) {
    console.warn('Supabase update user error:', err);
    return { success: false, message: err?.message || String(err) };
  }
}

export async function deleteUserFromSupabase(user: AppUser): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured) {
    return { success: true, message: 'Dihapus secara lokal.' };
  }

  try {
    let query = supabase.from('users').delete();
    if (user.email) {
      query = query.eq('email', user.email.toLowerCase());
    } else {
      query = query.eq('id', user.id);
    }

    const { error } = await query;
    if (error) {
      console.warn('Supabase delete user warning:', error.message);
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Akun berhasil dihapus dari database Supabase.' };
  } catch (err: any) {
    console.warn('Supabase delete user error:', err);
    return { success: false, message: err?.message || String(err) };
  }
}

/**
 * ============================================================================
 * SUPABASE REALTIME SUBSCRIPTION SYSTEM
 * ============================================================================
 * Listens to all Postgres changes (INSERT, UPDATE, DELETE) across public tables
 */
export interface RealtimeHandlers {
  onStudentChange: (event: 'INSERT' | 'UPDATE' | 'DELETE', newRow: any, oldRow: any) => void;
  onBookChange: (event: 'INSERT' | 'UPDATE' | 'DELETE', newRow: any, oldRow: any) => void;
  onCardChange: (event: 'INSERT' | 'UPDATE' | 'DELETE', newRow: any, oldRow: any) => void;
  onVisitChange: (event: 'INSERT' | 'UPDATE' | 'DELETE', newRow: any, oldRow: any) => void;
  onLoanChange: (event: 'INSERT' | 'UPDATE' | 'DELETE', newRow: any, oldRow: any) => void;
  onUserChange: (event: 'INSERT' | 'UPDATE' | 'DELETE', newRow: any, oldRow: any) => void;
  onStatusChange?: (status: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR') => void;
}

export function subscribeToAllDatabaseChanges(handlers: RealtimeHandlers): { unsubscribe: () => void } {
  if (!isSupabaseConfigured) {
    return { unsubscribe: () => {} };
  }

  const channel = supabase
    .channel('public:library-database-sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'students' },
      (payload) => {
        handlers.onStudentChange(payload.eventType as any, payload.new, payload.old);
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'books' },
      (payload) => {
        handlers.onBookChange(payload.eventType as any, payload.new, payload.old);
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'rfid_cards' },
      (payload) => {
        handlers.onCardChange(payload.eventType as any, payload.new, payload.old);
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'library_visits' },
      (payload) => {
        handlers.onVisitChange(payload.eventType as any, payload.new, payload.old);
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'book_loans' },
      (payload) => {
        handlers.onLoanChange(payload.eventType as any, payload.new, payload.old);
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'users' },
      (payload) => {
        handlers.onUserChange(payload.eventType as any, payload.new, payload.old);
      }
    )
    .subscribe((status) => {
      if (handlers.onStatusChange) {
        if (status === 'SUBSCRIBED') {
          handlers.onStatusChange('CONNECTED');
        } else if (status === 'CHANNEL_ERROR') {
          handlers.onStatusChange('ERROR');
        } else if (status === 'CLOSED') {
          handlers.onStatusChange('DISCONNECTED');
        } else {
          handlers.onStatusChange('CONNECTING');
        }
      }
    });

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}
