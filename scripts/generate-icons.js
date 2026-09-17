import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Simple CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makePng(width, height, isMaskable = false) {
  // RGBA raw buffer with 1 filter byte per row
  const rowSize = 1 + width * 4;
  const raw = Buffer.alloc(height * rowSize);

  const cx = width / 2;
  const cy = height / 2;
  const r = width * (isMaskable ? 0.48 : 0.45); // Safe margin for maskable

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    raw[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background color: deep emerald gradient to slate-900 / indigo
      const t = y / height;
      const bgR = Math.round(15 + t * 5);    // 15 -> 20
      const bgG = Math.round(23 + t * 45);   // 23 -> 68
      const bgB = Math.round(42 + t * 55);   // 42 -> 97

      if (isMaskable) {
        // Full bleed background
        let rVal = bgR;
        let gVal = bgG;
        let bVal = bgB;
        let aVal = 255;

        // Draw central badge
        if (dist < r * 0.75) {
          // Emerald-600 circle
          rVal = 16;
          gVal = 185;
          bVal = 129;
          
          // Book pages inner shape
          const bdx = Math.abs(dx);
          const bdy = Math.abs(dy);
          if (bdx < r * 0.45 && bdy < r * 0.35) {
            // White book icon
            rVal = 255;
            gVal = 255;
            bVal = 255;
            if (bdx < r * 0.05) {
              // Book spine
              rVal = 16;
              gVal = 185;
              bVal = 129;
            }
          }
        }
        raw[pxOffset] = rVal;
        raw[pxOffset + 1] = gVal;
        raw[pxOffset + 2] = bVal;
        raw[pxOffset + 3] = aVal;
      } else {
        // Standard rounded rectangle icon
        const cornerR = width * 0.22;
        const cornerDx = Math.max(0, Math.abs(dx) - (cx - cornerR));
        const cornerDy = Math.max(0, Math.abs(dy) - (cy - cornerR));
        const inCornerDist = Math.sqrt(cornerDx * cornerDx + cornerDy * cornerDy);

        if (inCornerDist <= cornerR) {
          // Inside squircle
          let rVal = 5;
          let gVal = 150;
          let bVal = 105; // Emerald 600

          // Gradient effect
          const grad = (x + y) / (width + height);
          rVal = Math.round(5 + grad * 15);
          gVal = Math.round(150 + grad * 40);
          bVal = Math.round(105 + grad * 80);

          // Central white book symbol
          const bdx = Math.abs(dx);
          const bdy = dy; // book shape
          if (bdx < r * 0.55 && Math.abs(bdy + r * 0.05) < r * 0.38) {
            rVal = 255;
            gVal = 255;
            bVal = 255;
            // Spine groove
            if (bdx < r * 0.06) {
              rVal = 16;
              gVal = 185;
              bVal = 129;
            }
          }
          // RFID signal arcs at top
          if (bdy < -r * 0.45 && bdy > -r * 0.75) {
            const arcDist = Math.sqrt(dx * dx + (dy + r * 0.3) * (dy + r * 0.3));
            if (Math.abs(arcDist - r * 0.35) < r * 0.06 || Math.abs(arcDist - r * 0.5) < r * 0.06) {
              rVal = 255;
              gVal = 255;
              bVal = 255;
            }
          }

          raw[pxOffset] = rVal;
          raw[pxOffset + 1] = gVal;
          raw[pxOffset + 2] = bVal;
          raw[pxOffset + 3] = 255;
        } else {
          // Transparent outside
          raw[pxOffset] = 0;
          raw[pxOffset + 1] = 0;
          raw[pxOffset + 2] = 0;
          raw[pxOffset + 3] = 0;
        }
      }
    }
  }

  // Compress IDAT
  const compressed = zlib.deflateSync(raw);

  // PNG Signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8-bit depth
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);

  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(8 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  const crc = crc32(typeAndData);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), makePng(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), makePng(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), makePng(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), makePng(180, 180, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), makePng(64, 64, false));

console.log('Successfully generated all PWA icons in public/');
