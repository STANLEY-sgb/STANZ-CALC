// Procedurally renders the Stanz Calc retro app icon at every required size.
// No image dependency: builds raw PNG bytes directly (IHDR/IDAT/IEND) via zlib.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const STONE_TOP = [234, 232, 225];
const STONE_BOTTOM = [213, 211, 202];
const SCREEN = [5, 5, 5];
const AMBER = [255, 140, 0];
const AMBER_DIM = [255, 149, 0];
const SLATE = [109, 111, 113];
const ORANGE = [255, 122, 0];

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function mixColor(c1, c2, t) {
  return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
}

function roundedRectMask(x, y, w, h, r, px, py) {
  if (px < x || py < y || px >= x + w || py >= y + h) return false;
  const dx = px < x + r ? x + r - px : px > x + w - r ? px - (x + w - r) : 0;
  const dy = py < y + r ? y + r - py : py > y + h - r ? py - (y + h - r) : 0;
  if (dx === 0 || dy === 0) return true;
  return dx * dx + dy * dy <= r * r;
}

function renderIcon(size, opaqueSquare = false) {
  const pixels = new Uint8Array(size * size * 4);
  const outerR = opaqueSquare ? 0 : size * 0.22;
  const screenPad = size * 0.1;
  const screenH = size * 0.4;
  const screenR = size * 0.1;
  const keyTop = screenPad + screenH + size * 0.05;
  const keySize = size * 0.14;
  const keyGap = size * 0.045;
  const keyCols = [
    screenPad,
    screenPad + keySize + keyGap,
    screenPad + (keySize + keyGap) * 2,
    screenPad + (keySize + keyGap) * 3,
  ];
  const keyColors = [SLATE, SLATE, SLATE, ORANGE];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const inChassis = opaqueSquare || roundedRectMask(0, 0, size, size, outerR, x + 0.5, y + 0.5);
      if (!inChassis) {
        pixels[i + 3] = 0;
        continue;
      }
      let rgb = mixColor(STONE_TOP, STONE_BOTTOM, y / size);

      const inScreen = roundedRectMask(screenPad, screenPad, size - screenPad * 2, screenH, screenR, x + 0.5, y + 0.5);
      if (inScreen) {
        rgb = SCREEN;
        const localY = (y - screenPad) / screenH;
        const barH = screenH * 0.12;
        const barMargin = size * 0.08;
        const bars = [0.28, 0.5, 0.72];
        for (const by of bars) {
          const barTop = by * screenH - barH / 2;
          if (y - screenPad >= barTop && y - screenPad <= barTop + barH) {
            const barWidthFrac = by === 0.72 ? 0.82 : by === 0.5 ? 0.62 : 0.42;
            const barRight = screenPad + barMargin + (size - screenPad * 2 - barMargin * 2) * barWidthFrac;
            if (x >= screenPad + barMargin && x <= barRight) {
              rgb = by === 0.72 ? AMBER : AMBER_DIM;
            }
          }
        }
        void localY;
      } else {
        for (let k = 0; k < keyCols.length; k++) {
          const kx = keyCols[k];
          if (roundedRectMask(kx, keyTop, keySize, keySize, keySize * 0.28, x + 0.5, y + 0.5)) {
            rgb = keyColors[k];
            const cx = kx + keySize / 2;
            const cy = keyTop + keySize / 2;
            const dist = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
            if (dist < keySize * 0.22) {
              rgb = mixColor(rgb, [0, 0, 0], 0.25);
            }
          }
        }
      }

      pixels[i] = Math.round(rgb[0]);
      pixels[i + 1] = Math.round(rgb[1]);
      pixels[i + 2] = Math.round(rgb[2]);
      pixels[i + 3] = 255;
    }
  }
  return pixels;
}

function crc32(buf) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c;
    }
    return t;
  })());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([lenBuf, body, crcBuf]);
}

function encodePng(size, pixels) {
  const raw = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (1 + size * 4);
    raw[rowStart] = 0; // no filter
    for (let x = 0; x < size * 4; x++) {
      raw[rowStart + 1 + x] = pixels[y * size * 4 + x];
    }
  }
  const idatData = zlib.deflateSync(raw, { level: 9 });
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idatData),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function renderMaskable(size) {
  // Maskable icons need safe-zone padding (icon content within the inner ~80%).
  const full = new Uint8Array(size * size * 4);
  const innerSize = Math.round(size * 0.78);
  const inner = renderIconFlat(innerSize);
  const offset = Math.round((size - innerSize) / 2);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      full[i] = STONE_BOTTOM[0];
      full[i + 1] = STONE_BOTTOM[1];
      full[i + 2] = STONE_BOTTOM[2];
      full[i + 3] = 255;
    }
  }
  for (let y = 0; y < innerSize; y++) {
    for (let x = 0; x < innerSize; x++) {
      const si = (y * innerSize + x) * 4;
      const dx = x + offset;
      const dy = y + offset;
      if (dx < 0 || dy < 0 || dx >= size || dy >= size) continue;
      const di = (dy * size + dx) * 4;
      if (inner[si + 3] === 0) continue;
      full[di] = inner[si];
      full[di + 1] = inner[si + 1];
      full[di + 2] = inner[si + 2];
      full[di + 3] = 255;
    }
  }
  return full;
}

function renderIconFlat(size) {
  // Same as renderIcon but without rounded-corner transparency (square-cropped) for maskable safe zone use.
  const px = renderIcon(size);
  for (let i = 3; i < px.length; i += 4) px[i] = 255;
  return px;
}

function renderRoundCrop(size) {
  // Circle-cropped variant for legacy Android ic_launcher_round.png.
  const px = renderIcon(size, true);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const dist = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (dist > r) px[i + 3] = 0;
    }
  }
  return px;
}

function renderAdaptiveForeground(size) {
  // Transparent canvas with icon content confined to the ~66% adaptive-icon safe zone.
  const full = new Uint8Array(size * size * 4);
  const innerSize = Math.round(size * 0.62);
  const inner = renderIcon(innerSize, true);
  const offset = Math.round((size - innerSize) / 2);
  for (let y = 0; y < innerSize; y++) {
    for (let x = 0; x < innerSize; x++) {
      const si = (y * innerSize + x) * 4;
      const dx = x + offset;
      const dy = y + offset;
      if (dx < 0 || dy < 0 || dx >= size || dy >= size) continue;
      const di = (dy * size + dx) * 4;
      full[di] = inner[si];
      full[di + 1] = inner[si + 1];
      full[di + 2] = inner[si + 2];
      full[di + 3] = 255;
    }
  }
  return full;
}

const outDir = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(outDir, { recursive: true });

const targets = [
  { name: 'icon-192.png', size: 192, maskable: false },
  { name: 'icon-512.png', size: 512, maskable: false },
  { name: 'icon-192-maskable.png', size: 192, maskable: true },
  { name: 'icon-512-maskable.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180, maskable: false },
  { name: 'favicon-32.png', size: 32, maskable: false },
];

for (const t of targets) {
  const pixels = t.maskable ? renderMaskable(t.size) : renderIcon(t.size);
  const png = encodePng(t.size, pixels);
  fs.writeFileSync(path.join(outDir, t.name), png);
  console.log('wrote', t.name, png.length, 'bytes');
}

// --- Android native mipmaps (legacy square, round, and adaptive foreground) ---
const androidResDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
const densities = [
  { dir: 'mipmap-mdpi', legacy: 48, foreground: 108 },
  { dir: 'mipmap-hdpi', legacy: 72, foreground: 162 },
  { dir: 'mipmap-xhdpi', legacy: 96, foreground: 216 },
  { dir: 'mipmap-xxhdpi', legacy: 144, foreground: 324 },
  { dir: 'mipmap-xxxhdpi', legacy: 192, foreground: 432 },
];

if (fs.existsSync(androidResDir)) {
  for (const d of densities) {
    const dir = path.join(androidResDir, d.dir);
    if (!fs.existsSync(dir)) continue;
    fs.writeFileSync(path.join(dir, 'ic_launcher.png'), encodePng(d.legacy, renderIcon(d.legacy, true)));
    fs.writeFileSync(path.join(dir, 'ic_launcher_round.png'), encodePng(d.legacy, renderRoundCrop(d.legacy)));
    fs.writeFileSync(path.join(dir, 'ic_launcher_foreground.png'), encodePng(d.foreground, renderAdaptiveForeground(d.foreground)));
    console.log('wrote android', d.dir);
  }
} else {
  console.log('skipped android mipmaps (android/ platform not present)');
}

// --- iOS App Store icon (single 1024x1024, fully opaque — no alpha channel allowed) ---
const iosIconPath = path.join(__dirname, '..', 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset', 'AppIcon-512@2x.png');
if (fs.existsSync(path.dirname(iosIconPath))) {
  fs.writeFileSync(iosIconPath, encodePng(1024, renderIcon(1024, true)));
  console.log('wrote ios AppIcon-512@2x.png');
} else {
  console.log('skipped ios AppIcon (ios/ platform not present)');
}
