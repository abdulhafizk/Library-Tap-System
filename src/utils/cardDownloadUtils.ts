import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { generateQrDataUrl } from './qrUtils';
import { Student, LibrarySettings } from '../types';

export interface CardExportOptions {
  fileName?: string;
  pixelRatio?: number;
  format?: 'png' | 'jpeg' | 'pdf';
  targetWidthMm?: number; // default: 85.6 mm (standard CR80 card width)
  targetHeightMm?: number; // default: 53.98 mm (standard CR80 card height)
}

/**
 * Standard ID Card Dimensions (ISO/IEC 7810 ID-1 / CR80)
 * Width: 85.60 mm (~3.37 inches)
 * Height: 53.98 mm (~2.125 inches)
 * Aspect Ratio: ~1.586
 * High-Res Pixel Dimensions at 300 DPI: ~1012 x 638 px
 */
export const CARD_DIMENSIONS = {
  widthMm: 85.6,
  heightMm: 53.98,
  aspectRatio: 1.5857,
  defaultCanvasWidth: 1012,
  defaultCanvasHeight: 638,
};

/**
 * Clean and normalize filename
 */
function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-]/g, '_').replace(/_+/g, '_');
}

/**
 * Download a DOM card preview element directly as high-resolution PNG
 */
export async function downloadCardElementAsPng(
  cardElement: HTMLElement,
  fileName: string = 'Kartu_Perpustakaan.png',
  pixelRatio: number = 3
): Promise<boolean> {
  try {
    const dataUrl = await toPng(cardElement, {
      quality: 1,
      pixelRatio: pixelRatio,
      cacheBust: true,
      skipAutoScale: false,
      skipFonts: true,
      fontEmbedCSS: '',
      style: {
        transform: 'none',
        margin: '0',
      }
    });

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (error) {
    console.error('Failed to capture card via html-to-image, attempting canvas fallback:', error);
    return false;
  }
}

/**
 * Download a DOM card preview element as standard ID Card PDF (85.6 x 54 mm)
 */
export async function downloadCardElementAsPdf(
  frontElement: HTMLElement,
  backElement?: HTMLElement | null,
  fileName: string = 'Kartu_Perpustakaan.pdf'
): Promise<boolean> {
  try {
    const frontDataUrl = await toPng(frontElement, {
      quality: 1,
      pixelRatio: 3,
      cacheBust: true,
      skipFonts: true,
      fontEmbedCSS: '',
      style: { transform: 'none', margin: '0' }
    });

    // Create jsPDF in landscape with exact CR80 size (85.6 mm x 54 mm)
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [CARD_DIMENSIONS.widthMm, CARD_DIMENSIONS.heightMm]
    });

    doc.addImage(frontDataUrl, 'PNG', 0, 0, CARD_DIMENSIONS.widthMm, CARD_DIMENSIONS.heightMm);

    if (backElement) {
      const backDataUrl = await toPng(backElement, {
        quality: 1,
        pixelRatio: 3,
        cacheBust: true,
        skipFonts: true,
        fontEmbedCSS: '',
        style: { transform: 'none', margin: '0' }
      });
      doc.addPage([CARD_DIMENSIONS.widthMm, CARD_DIMENSIONS.heightMm], 'landscape');
      doc.addImage(backDataUrl, 'PNG', 0, 0, CARD_DIMENSIONS.widthMm, CARD_DIMENSIONS.heightMm);
    }

    const safeName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    doc.save(safeName);
    return true;
  } catch (error) {
    console.error('Failed to export card to PDF:', error);
    return false;
  }
}

/**
 * Pure Canvas Fallback Renderer for ID Card (Front Side)
 * Produces crisp 1012x638 px PNG with zero external DOM dependencies
 */
export async function generateCardCanvasPng(options: {
  student?: Student | null;
  cardUid: string;
  note?: string;
  settings?: Partial<LibrarySettings>;
  qrColor?: string;
}): Promise<string> {
  const {
    student,
    cardUid,
    note,
    settings,
    qrColor = '#0f172a'
  } = options;

  const canvas = document.createElement('canvas');
  const width = CARD_DIMENSIONS.defaultCanvasWidth;
  const height = CARD_DIMENSIONS.defaultCanvasHeight;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 1. Draw Card Background with Smooth Dark Blue / Indigo Gradient
  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  bgGradient.addColorStop(0, '#1e3a8a'); // blue-900
  bgGradient.addColorStop(0.5, '#1e1b4b'); // indigo-950
  bgGradient.addColorStop(1, '#0f172a'); // slate-900
  
  // Rounded Card shape
  const cornerRadius = 36;
  ctx.beginPath();
  ctx.moveTo(cornerRadius, 0);
  ctx.lineTo(width - cornerRadius, 0);
  ctx.quadraticCurveTo(width, 0, width, cornerRadius);
  ctx.lineTo(width, height - cornerRadius);
  ctx.quadraticCurveTo(width, height, width - cornerRadius, height);
  ctx.lineTo(cornerRadius, height);
  ctx.quadraticCurveTo(0, height, 0, height - cornerRadius);
  ctx.lineTo(0, cornerRadius);
  ctx.quadraticCurveTo(0, 0, cornerRadius, 0);
  ctx.closePath();
  ctx.clip();

  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // Holographic ambient glows
  const radialGlow1 = ctx.createRadialGradient(width - 120, 100, 10, width - 120, 100, 260);
  radialGlow1.addColorStop(0, 'rgba(59, 130, 246, 0.35)');
  radialGlow1.addColorStop(1, 'rgba(59, 130, 246, 0)');
  ctx.fillStyle = radialGlow1;
  ctx.fillRect(0, 0, width, height);

  const radialGlow2 = ctx.createRadialGradient(100, height - 100, 10, 100, height - 100, 240);
  radialGlow2.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
  radialGlow2.addColorStop(1, 'rgba(99, 102, 241, 0)');
  ctx.fillStyle = radialGlow2;
  ctx.fillRect(0, 0, width, height);

  // Top color highlight bar
  const topBarGradient = ctx.createLinearGradient(0, 0, width, 0);
  topBarGradient.addColorStop(0, '#60a5fa');
  topBarGradient.addColorStop(0.5, '#34d399');
  topBarGradient.addColorStop(1, '#818cf8');
  ctx.fillStyle = topBarGradient;
  ctx.fillRect(0, 0, width, 10);

  // 2. Card Header
  const institutionName = (settings?.institution_name || 'PERPUSTAKAAN PESANTREN').toUpperCase();
  const librarySub = settings?.library_name || 'Kartu Anggota Perpustakaan Digital';

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(institutionName, 88, 56);

  ctx.fillStyle = '#93c5fd';
  ctx.font = '16px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(librarySub, 88, 80);

  // Header Shield Icon Badge Box
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 2;
  roundRect(ctx, 36, 32, 42, 42, 10);
  ctx.fill();
  ctx.stroke();

  // Shield Icon drawing
  ctx.fillStyle = '#60a5fa';
  ctx.font = '22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🛡️', 57, 61);
  ctx.textAlign = 'left';

  // Badge Status ("SANTRI" / "CADANGAN")
  const badgeText = student ? 'SANTRI' : 'CADANGAN';
  ctx.fillStyle = 'rgba(59, 130, 246, 0.35)';
  ctx.strokeStyle = 'rgba(96, 165, 250, 0.5)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, width - 150, 36, 114, 30, 15);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#bfdbfe';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(badgeText, width - 93, 56);
  ctx.textAlign = 'left';

  // Divider Line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(36, 96);
  ctx.lineTo(width - 36, 96);
  ctx.stroke();

  // 3. Middle Content: Photo/Avatar on Left, Student Info, QR Code on Right
  const photoX = 40;
  const photoY = 120;
  const photoW = 160;
  const photoH = 200;
  const photoRadius = 18;

  // Draw Photo or Placeholder
  if (student?.photo_url) {
    try {
      const img = await loadImage(student.photo_url);
      ctx.save();
      ctx.beginPath();
      roundRect(ctx, photoX, photoY, photoW, photoH, photoRadius);
      ctx.clip();
      ctx.drawImage(img, photoX, photoY, photoW, photoH);
      ctx.restore();

      // Border around photo
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 3;
      roundRect(ctx, photoX, photoY, photoW, photoH, photoRadius);
      ctx.stroke();
    } catch {
      drawPhotoPlaceholder(ctx, photoX, photoY, photoW, photoH, photoRadius, student ? 'SANTRI' : 'KARTU');
    }
  } else {
    drawPhotoPlaceholder(ctx, photoX, photoY, photoW, photoH, photoRadius, student ? 'SANTRI' : 'KARTU');
  }

  // Student Info Text in Center
  const infoX = photoX + photoW + 32;
  let textY = 155;

  if (student) {
    // Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px "Plus Jakarta Sans", system-ui, sans-serif';
    const truncatedName = student.name.length > 22 ? student.name.substring(0, 20) + '...' : student.name;
    ctx.fillText(truncatedName, infoX, textY);

    // NIS & Class
    textY += 38;
    ctx.fillStyle = '#93c5fd';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(`NIS: ${student.nis}`, infoX, textY);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '600 18px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText(`•   Kelas ${student.class}`, infoX + 210, textY);

    // Gender
    textY += 34;
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '17px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText(student.gender === 'L' ? 'Santri Putra' : 'Santri Putri', infoX, textY);
  } else {
    // Blank Card Info
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText('KARTU ANGGOTA CADANGAN', infoX, textY);

    textY += 36;
    ctx.fillStyle = '#6ee7b7';
    ctx.font = '18px "Plus Jakarta Sans", system-ui, sans-serif';
    const noteText = note || 'Kartu Cadangan Perpustakaan';
    ctx.fillText(noteText.length > 28 ? noteText.substring(0, 26) + '...' : noteText, infoX, textY);

    textY += 30;
    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText('Siap dihubungkan ke data santri baru', infoX, textY);
  }

  // Card UID Monospace Pill
  textY += 46;
  ctx.fillStyle = 'rgba(30, 58, 138, 0.6)';
  ctx.strokeStyle = 'rgba(147, 197, 253, 0.4)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, infoX, textY - 24, 280, 36, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#93c5fd';
  ctx.font = 'bold 15px monospace';
  ctx.fillText(`UID: ${cardUid}`, infoX + 16, textY);

  // 4. Sharp QR Code Container on Right
  const qrBoxSize = 200;
  const qrBoxX = width - qrBoxSize - 40;
  const qrBoxY = 120;

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 4;
  roundRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 20);
  ctx.fill();
  ctx.stroke();

  // Generate and draw QR
  try {
    const qrDataUrl = await generateQrDataUrl(cardUid, {
      width: 320,
      margin: 1,
      color: { dark: qrColor, light: '#ffffff' },
      errorCorrectionLevel: 'H'
    });
    const qrImg = await loadImage(qrDataUrl);
    ctx.drawImage(qrImg, qrBoxX + 12, qrBoxY + 12, qrBoxSize - 24, qrBoxSize - 36);

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SCAN TERMINAL', qrBoxX + qrBoxSize / 2, qrBoxY + qrBoxSize - 10);
    ctx.textAlign = 'left';
  } catch (err) {
    console.error('Error drawing QR on canvas:', err);
  }

  // 5. Card Footer Bar
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(36, height - 52);
  ctx.lineTo(width - 36, height - 52);
  ctx.stroke();

  ctx.fillStyle = '#93c5fd';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('SISTEM ABSENSI PERPUSTAKAAN DIGITAL', 40, height - 24);

  ctx.textAlign = 'right';
  ctx.fillText('TAP / SCAN VALID  •  CR80 FORMAT', width - 40, height - 24);
  ctx.textAlign = 'left';

  return canvas.toDataURL('image/png');
}

/**
 * Pure Canvas Fallback Renderer for ID Card (Back Side: Rules & Info)
 */
export async function generateCardBackCanvasPng(options: {
  settings?: Partial<LibrarySettings>;
}): Promise<string> {
  const { settings } = options;
  const canvas = document.createElement('canvas');
  const width = CARD_DIMENSIONS.defaultCanvasWidth;
  const height = CARD_DIMENSIONS.defaultCanvasHeight;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  bgGradient.addColorStop(0, '#0f172a');
  bgGradient.addColorStop(1, '#1e1b4b');

  const cornerRadius = 36;
  ctx.beginPath();
  ctx.moveTo(cornerRadius, 0);
  ctx.lineTo(width - cornerRadius, 0);
  ctx.quadraticCurveTo(width, 0, width, cornerRadius);
  ctx.lineTo(width, height - cornerRadius);
  ctx.quadraticCurveTo(width, height, width - cornerRadius, height);
  ctx.lineTo(cornerRadius, height);
  ctx.quadraticCurveTo(0, height, 0, height - cornerRadius);
  ctx.lineTo(0, cornerRadius);
  ctx.quadraticCurveTo(0, 0, cornerRadius, 0);
  ctx.closePath();
  ctx.clip();

  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // Top bar
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(0, 0, width, 10);

  // Header Title
  ctx.fillStyle = '#60a5fa';
  ctx.font = 'bold 24px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('KETENTUAN PENGGUNAAN KARTU PERPUSTAKAAN', 50, 60);

  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(50, 76);
  ctx.lineTo(width - 50, 76);
  ctx.stroke();

  // Rules List
  const rules = [
    '1. Kartu ini wajib dibawa setiap kali berkunjung ke ruang perpustakaan.',
    '2. Lakukan tap atau scan pada terminal scanner saat masuk dan saat keluar.',
    '3. Kartu ini merupakan identitas resmi dan tidak boleh dipinjamkan kepada orang lain.',
    '4. Jaga kebersihan dan keutuhan kartu; hindari tertekuk, tergores, atau terkena air.',
    '5. Jika kartu hilang atau rusak, segera laporkan ke bagian administrasi perpustakaan.',
    `6. Maksimal durasi baca per sesi kunjungan: ${settings?.max_visit_minutes || 180} menit.`
  ];

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '17px "Plus Jakarta Sans", system-ui, sans-serif';
  let ruleY = 120;
  rules.forEach(rule => {
    ctx.fillText(rule, 50, ruleY);
    ruleY += 38;
  });

  // Footer Box
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(50, height - 80);
  ctx.lineTo(width - 50, height - 80);
  ctx.stroke();

  ctx.fillStyle = '#94a3b8';
  ctx.font = '14px monospace';
  ctx.fillText(settings?.institution_name || 'PERPUSTAKAAN PESANTREN', 50, height - 40);

  ctx.textAlign = 'right';
  ctx.fillText(`JAM BUKA: ${settings?.open_time || '07:30'} - ${settings?.close_time || '17:00'} WIB`, width - 50, height - 40);
  ctx.textAlign = 'left';

  return canvas.toDataURL('image/png');
}

/**
 * Helper to download raw Data URL as file
 */
export function downloadDataUrl(dataUrl: string, fileName: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Helper: draw rounded rectangle path
 */
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Helper: draw avatar placeholder on canvas
 */
function drawPhotoPlaceholder(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, label: string) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, r);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = '40px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('👤', x + w / 2, y + h / 2 - 10);

  ctx.fillStyle = '#93c5fd';
  ctx.font = 'bold 14px monospace';
  ctx.fillText(label, x + w / 2, y + h / 2 + 30);
  ctx.textAlign = 'left';
}

/**
 * Helper: safely load image
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}
