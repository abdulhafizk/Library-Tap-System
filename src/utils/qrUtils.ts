import QRCode from 'qrcode';

export interface QrOptions {
  width?: number;
  margin?: number;
  color?: {
    dark: string;
    light: string;
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

/**
 * Generate QR code as Data URL (PNG base64)
 */
export async function generateQrDataUrl(
  text: string, 
  options: QrOptions = {}
): Promise<string> {
  const {
    width = 300,
    margin = 1,
    color = { dark: '#0f172a', light: '#ffffff' },
    errorCorrectionLevel = 'M'
  } = options;

  return QRCode.toDataURL(text, {
    width,
    margin,
    color,
    errorCorrectionLevel
  });
}

/**
 * Generate QR code as SVG string
 */
export async function generateQrSvgString(
  text: string,
  options: QrOptions = {}
): Promise<string> {
  const {
    margin = 1,
    color = { dark: '#0f172a', light: '#ffffff' },
    errorCorrectionLevel = 'M'
  } = options;

  return QRCode.toString(text, {
    type: 'svg',
    margin,
    color,
    errorCorrectionLevel
  });
}

/**
 * Generate unique UID for QR Card
 * Format: e.g. "QR-7A-8942" or "LIB-20240701"
 */
export function generateRandomCardUid(prefix: string = 'QR'): string {
  const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${randomHex}`;
}
