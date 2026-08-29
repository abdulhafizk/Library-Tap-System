// WhatsApp Messaging & Webhook Integration Utilities

export interface WhatsAppNotificationConfig {
  enabled: boolean;
  provider?: 'direct_link' | 'webhook' | 'fonnte' | 'wablas' | 'whacenter' | 'starsender' | 'ultramsg';
  notify_on_check_in: boolean;
  notify_on_check_out: boolean;
  notify_on_book_loan: boolean;
  notify_on_book_return: boolean;
  notify_schedule_reminder: boolean; // Reminder before opening/closing
  reminder_minutes_before: number; // e.g. 15 or 30 minutes before
  admin_phone: string; // Target WA admin/pustakawan (e.g. 6281234567890)
  use_student_parent_phone: boolean; // Also send to student's registered phone
  auto_open_direct_link?: boolean; // Automatically trigger WhatsApp link on tap if supported
  webhook_url?: string; // Optional custom gateway (Fonnte, Wablas, Whacenter, Baileys, etc.)
  webhook_api_key?: string; // Optional token / API key
  open_reminder_template?: string;
  close_reminder_template?: string;
  check_in_template?: string;
  check_out_template?: string;
  book_loan_template?: string;
  book_return_template?: string;
  loan_reminder_template?: string;
}

export interface WhatsAppLog {
  id: string;
  timestamp: string;
  type: 'check_in' | 'check_out' | 'book_loan' | 'book_return' | 'loan_reminder' | 'open_reminder' | 'close_reminder' | 'award_congrats' | 'test';
  recipient_name: string;
  recipient_phone: string;
  message: string;
  status: 'sent' | 'queued' | 'simulated' | 'failed';
  gateway_response?: string;
  direct_wa_link?: string;
}

export const defaultWhatsAppConfig: WhatsAppNotificationConfig = {
  enabled: true,
  notify_on_check_in: true,
  notify_on_check_out: true,
  notify_on_book_loan: true,
  notify_on_book_return: true,
  notify_schedule_reminder: true,
  reminder_minutes_before: 15,
  admin_phone: '6281234567890',
  use_student_parent_phone: true,
  webhook_url: '',
  webhook_api_key: '',
  book_loan_template: `📚 *BUKTI PEMINJAMAN BUKU / KITAB*
Perpustakaan: *{LIBRARY_NAME}*
Pesantren: *{INSTITUTION_NAME}*

Assalamu'alaikum Wr. Wb.
Telah tercatat peminjaman buku:
🏷️ *Kode Pinjam:* {LOAN_CODE}
👤 *Peminjam:* {STUDENT_NAME} ({STUDENT_CLASS} - NIS: {STUDENT_NIS})
📖 *Judul Buku:* *{BOOK_TITLE}*
✍️ *Pengarang:* {BOOK_AUTHOR}
📍 *Kode Buku:* {BOOK_CODE}
📅 *Tanggal Pinjam:* {BORROW_DATE}
⏳ *Batas Pengembalian:* *{DUE_DATE}*

_Harap menjaga kebersihan kitab/buku dan mengembalikan tepat waktu. Selamat membaca!_ 🌟`,

  book_return_template: `✅ *BUKTI PENGEMBALIAN BUKU / KITAB*
Perpustakaan: *{LIBRARY_NAME}*
Pesantren: *{INSTITUTION_NAME}*

Assalamu'alaikum Wr. Wb.
Buku/kitab telah berhasil *DIKEMBALIKAN*:
🏷️ *Kode Pinjam:* {LOAN_CODE}
👤 *Santri:* {STUDENT_NAME} ({STUDENT_CLASS})
📖 *Judul Buku:* *{BOOK_TITLE}*
📅 *Tanggal Kembali:* {RETURN_DATE}
📌 *Status:* {STATUS_TEXT}

_Jazakumullahu Khairan Katsiran telah mematuhi tata tertib perpustakaan._ 🤲📚`,

  loan_reminder_template: `⚠️ *PENGINGAT JATUH TEMPO PEMINJAMAN BUKU*
Perpustakaan: *{LIBRARY_NAME}*
Pesantren: *{INSTITUTION_NAME}*

Assalamu'alaikum Wr. Wb.
Kepada Yth. *{STUDENT_NAME}* ({STUDENT_CLASS}):
Buku/kitab yang Anda pinjam:
📖 *Judul Buku:* *{BOOK_TITLE}*
🏷️ *Kode Pinjam:* {LOAN_CODE}
⏳ *Batas Pengembalian:* *{DUE_DATE}* ({REMAINING_DAYS_TEXT})

Mohon segera mengembalikan buku atau mengajukan perpanjangan ke meja sirkulasi perpustakaan. Terima kasih. 📚✨`,
  open_reminder_template: `📢 *PENGINGAT PERPUSTAKAAN AKAN SEGERA BUKA*
Pesantren: *{INSTITUTION_NAME}*
Perpustakaan: *{LIBRARY_NAME}*

Assalamu'alaikum Warahmatullahi Wabarakatuh.
Diberitahukan kepada seluruh santri dan asatidz, *Perpustakaan {LIBRARY_NAME}* akan dibuka dalam waktu *{REMINDER_MINUTES} menit lagi* (pukul {OPEN_TIME} WIB).

Mari manfaatkan waktu untuk membaca, muthola'ah kitab, dan menambah ilmu di perpustakaan. 📚✨

_Wassalamu'alaikum Wr. Wb._
_Admin Perpustakaan_`,

  close_reminder_template: `⚠️ *PENGINGAT PERPUSTAKAAN AKAN SEGERA TUTUP*
Pesantren: *{INSTITUTION_NAME}*
Perpustakaan: *{LIBRARY_NAME}*

Assalamu'alaikum Warahmatullahi Wabarakatuh.
Diberitahukan bahwa *Perpustakaan {LIBRARY_NAME}* akan segera *DITUTUP dalam waktu {REMINDER_MINUTES} menit lagi* (pukul {CLOSE_TIME} WIB).

Saat ini terdapat *{ACTIVE_VISITORS_COUNT} santri* yang masih berada di dalam ruangan.
Mohon bagi seluruh santri yang masih berada di perpustakaan untuk:
1. Merapikan kembali kitab & buku ke rak semula.
2. Melakukan *Tap Kartu RFID Check-Out* di mesin terminal sebelum keluar.

_Wassalamu'alaikum Wr. Wb._
_Admin Perpustakaan_`,

  check_in_template: `🟢 *NOTIFIKASI SANTRI MASUK PERPUSTAKAAN*
Perpustakaan: *{LIBRARY_NAME}*
Pesantren: *{INSTITUTION_NAME}*

Assalamu'alaikum Wr. Wb.
Santri berikut telah *MASUK* ke perpustakaan:
👤 *Nama:* {STUDENT_NAME}
🆔 *NIS:* {STUDENT_NIS}
🏫 *Kelas:* {STUDENT_CLASS}
⏰ *Waktu Masuk:* {TIME_IN} WIB
💳 *RFID Card:* {CARD_UID}

_Semoga berkah dan mendapatkan ilmu yang bermanfaat._ 📖✨`,

  check_out_template: `🔴 *NOTIFIKASI SANTRI KELUAR PERPUSTAKAAN*
Perpustakaan: *{LIBRARY_NAME}*
Pesantren: *{INSTITUTION_NAME}*

Assalamu'alaikum Wr. Wb.
Santri berikut telah *SELESAI & CHECK-OUT* dari perpustakaan:
👤 *Nama:* {STUDENT_NAME}
🆔 *NIS:* {STUDENT_NIS}
🏫 *Kelas:* {STUDENT_CLASS}
⏰ *Waktu Masuk:* {TIME_IN} WIB
🚪 *Waktu Keluar:* {TIME_OUT} WIB
⏱️ *Total Durasi Membaca:* *{DURATION_TEXT}*

_Terima kasih atas kunjungannya. Terus semangat menuntut ilmu!_ 📚🌟`
};

/**
 * Format string phone number to standard international format (e.g. 0812... -> 62812...)
 */
export function formatPhoneNumberToWA(phone: string): string {
  let clean = phone.replace(/[^0-9]/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.substring(1);
  } else if (!clean.startsWith('62') && clean.length > 5) {
    clean = '62' + clean;
  }
  return clean;
}

/**
 * Generate direct wa.me link with encoded text
 */
export function createWhatsAppDirectLink(phone: string, message: string): string {
  const formattedPhone = formatPhoneNumberToWA(phone);
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedText}`;
}

/**
 * Replace template variables with actual values
 */
export function renderWhatsAppTemplate(template: string, vars: Record<string, string | number>): string {
  let result = template;
  for (const [key, val] of Object.entries(vars)) {
    const pattern = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(pattern, String(val));
  }
  return result;
}

/**
 * Safely open direct WhatsApp link
 */
export function openWhatsAppDirect(phone: string, message: string): boolean {
  try {
    const link = createWhatsAppDirectLink(phone, message);
    const win = window.open(link, '_blank', 'noopener,noreferrer');
    return Boolean(win);
  } catch (err) {
    console.warn('Failed to open WhatsApp window directly', err);
    return false;
  }
}

/**
 * Send WhatsApp message using custom Webhook or Fallback Direct wa.me link
 */
export async function sendWhatsAppMessage(
  targetPhone: string,
  targetName: string,
  message: string,
  type: WhatsAppLog['type'],
  config: WhatsAppNotificationConfig
): Promise<WhatsAppLog> {
  const formattedPhone = formatPhoneNumberToWA(targetPhone);
  const directLink = createWhatsAppDirectLink(formattedPhone, message);
  const logId = `wa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const logEntry: WhatsAppLog = {
    id: logId,
    timestamp: new Date().toISOString(),
    type,
    recipient_name: targetName,
    recipient_phone: formattedPhone,
    message,
    status: 'simulated',
    direct_wa_link: directLink,
  };

  const webhookUrl = config.webhook_url?.trim();
  const apiKey = config.webhook_api_key?.trim();

  // If a custom webhook/gateway endpoint is configured, attempt HTTP POST
  if (webhookUrl && (webhookUrl.startsWith('http://') || webhookUrl.startsWith('https://'))) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (apiKey) {
        headers['Authorization'] = apiKey;
        headers['api-key'] = apiKey;
        headers['token'] = apiKey;
      }

      // Format payload supporting multiple popular providers
      const payload: Record<string, any> = {
        target: formattedPhone,
        phone: formattedPhone,
        number: formattedPhone,
        message: message,
        text: message,
        name: targetName,
        type: type,
        timestamp: new Date().toISOString()
      };

      // Fonnte special support
      if (config.provider === 'fonnte' || webhookUrl.includes('fonnte.com')) {
        payload['countryCode'] = '62';
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const resText = await response.text();
        logEntry.status = 'sent';
        logEntry.gateway_response = `HTTP ${response.status}: ${resText.substring(0, 100)}`;
      } else {
        logEntry.status = 'failed';
        logEntry.gateway_response = `HTTP Error ${response.status}: ${response.statusText}`;
      }
    } catch (err: any) {
      logEntry.status = 'failed';
      logEntry.gateway_response = `Network / CORS: ${err?.message || 'Gateway belum mengizinkan CORS langsung atau offline'}. Link wa.me siap digunakan manual.`;
    }
  } else {
    // Direct Link / Simulation Mode with ready-to-click wa.me link
    logEntry.status = 'simulated';
    logEntry.gateway_response = 'Siap dikirim via WhatsApp Web / App (1-Klik wa.me)';
  }

  // If auto open is enabled and direct link is ready, attempt open
  if (config.auto_open_direct_link && typeof window !== 'undefined') {
    try {
      openWhatsAppDirect(formattedPhone, message);
    } catch (e) {
      // ignore popup blocker
    }
  }

  return logEntry;
}
