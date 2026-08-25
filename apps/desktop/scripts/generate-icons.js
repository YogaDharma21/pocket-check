import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple CRC32 implementation
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i];
    crc ^= byte;
    for (let j = 0; j < 8; j++) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcData = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(crcData);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([lenBuf, crcData, crcBuf]);
}

function createPng(width, height, pixelShader) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8 bit depth
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10); // deflate
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // no interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Scanlines: width * 4 + 1 (filter byte = 0) per row
  const rawData = Buffer.alloc(height * (width * 4 + 1));
  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData.writeUInt8(0, offset++); // Filter type 0: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelShader(x, y, width, height);
      rawData.writeUInt8(r, offset++);
      rawData.writeUInt8(g, offset++);
      rawData.writeUInt8(b, offset++);
      rawData.writeUInt8(a, offset++);
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Shader for Main PocketCheck App Icon (Emerald green #10B981 rounded icon with white checkmark)
function appIconShader(x, y, width, height) {
  const nx = (x / width) * 2 - 1; // -1 to 1
  const ny = (y / height) * 2 - 1; // -1 to 1

  // Rounded rectangle SDF
  const radius = 0.78;
  const corner = 0.28;
  const dx = Math.max(Math.abs(nx) - (radius - corner), 0);
  const dy = Math.max(Math.abs(ny) - (radius - corner), 0);
  const dist = Math.sqrt(dx * dx + dy * dy);
  const insideCard = dist <= corner;

  if (!insideCard) {
    return [0, 0, 0, 0]; // Transparent outside
  }

  // Emerald green gradient background (#059669 -> #10B981)
  const grad = (ny + 1) / 2;
  const bgR = Math.round(5 + grad * (16 - 5));
  const bgG = Math.round(150 + grad * (185 - 150));
  const bgB = Math.round(105 + grad * (129 - 105));

  // Draw Checkmark
  // Line segment 1: (-0.35, 0.05) to (-0.08, 0.35)
  // Line segment 2: (-0.08, 0.35) to (0.42, -0.28)
  function distToSegment(px, py, x1, y1, x2, y2) {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }

  const d1 = distToSegment(nx, ny, -0.32, 0.02, -0.08, 0.30);
  const d2 = distToSegment(nx, ny, -0.08, 0.30, 0.38, -0.26);
  const checkDist = Math.min(d1, d2);
  const thickness = 0.09;

  if (checkDist <= thickness) {
    return [255, 255, 255, 255]; // Crisp white checkmark
  }

  return [bgR, bgG, bgB, 255];
}

// Shader for Tray Icon (Crisp monochrome checkmark on transparent background)
function trayIconShader(x, y, width, height) {
  const nx = (x / width) * 2 - 1;
  const ny = (y / height) * 2 - 1;

  function distToSegment(px, py, x1, y1, x2, y2) {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }

  const d1 = distToSegment(nx, ny, -0.45, 0.05, -0.1, 0.45);
  const d2 = distToSegment(nx, ny, -0.1, 0.45, 0.55, -0.38);
  const checkDist = Math.min(d1, d2);
  const thickness = 0.16;

  if (checkDist <= thickness) {
    return [255, 255, 255, 255];
  }
  return [0, 0, 0, 0];
}

function createIco(pngBuffers) {
  // ICO header: 6 bytes
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type: 1 = ICO
  header.writeUInt16LE(count, 4); // Number of images

  let offset = 6 + count * 16;
  const directoryEntries = [];
  const imageBodies = [];

  for (const { width, height, buffer } of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(width >= 256 ? 0 : width, 0);
    entry.writeUInt8(height >= 256 ? 0 : height, 1);
    entry.writeUInt8(0, 2); // Color palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(buffer.length, 8); // Size of image data
    entry.writeUInt32LE(offset, 12); // Offset of image data

    directoryEntries.push(entry);
    imageBodies.push(buffer);
    offset += buffer.length;
  }

  return Buffer.concat([header, ...directoryEntries, ...imageBodies]);
}

// Generate all assets
const buildDir = path.resolve(__dirname, '../build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

console.log('Generating high-fidelity icon assets in:', buildDir);

// 1. icon.png (512x512)
const icon512 = createPng(512, 512, appIconShader);
fs.writeFileSync(path.join(buildDir, 'icon.png'), icon512);
console.log('Created build/icon.png (512x512)');

// 2. tray-icon.png (32x32)
const tray32 = createPng(32, 32, trayIconShader);
fs.writeFileSync(path.join(buildDir, 'tray-icon.png'), tray32);
console.log('Created build/tray-icon.png (32x32)');

// 3. icon.ico (multi-resolution 256, 64, 48, 32, 16)
const icon256 = createPng(256, 256, appIconShader);
const icon64 = createPng(64, 64, appIconShader);
const icon48 = createPng(48, 48, appIconShader);
const icon32 = createPng(32, 32, appIconShader);
const icon16 = createPng(16, 16, appIconShader);

const icoBuffer = createIco([
  { width: 256, height: 256, buffer: icon256 },
  { width: 64, height: 64, buffer: icon64 },
  { width: 48, height: 48, buffer: icon48 },
  { width: 32, height: 32, buffer: icon32 },
  { width: 16, height: 16, buffer: icon16 },
]);
fs.writeFileSync(path.join(buildDir, 'icon.ico'), icoBuffer);
console.log('Created build/icon.ico (multi-resolution ICO)');

// 4. icon.icns (as fallback placeholder png/icns for mac build)
fs.writeFileSync(path.join(buildDir, 'icon.icns'), icon512);
console.log('Created build/icon.icns');

console.log('All branding assets generated successfully.');
