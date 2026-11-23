/* Derivados mecánicos del arte oficial. Solo herramienta de desarrollo; sin dependencia del sitio. */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/tmp/iwave-qa001/node_modules/playwright');
const root = path.resolve(__dirname, '../..');
const zlib = require('node:zlib');
function compactPNG(buffer) {
  const chunks = [], data = []; let offset = 8;
  while (offset < buffer.length) { const length = buffer.readUInt32BE(offset), type = buffer.toString('ascii', offset + 4, offset + 8), chunk = buffer.subarray(offset, offset + length + 12); chunks.push({ type, chunk }); if (type === 'IDAT') data.push(buffer.subarray(offset + 8, offset + 8 + length)); offset += length + 12; }
  const packed = zlib.deflateSync(zlib.inflateSync(Buffer.concat(data)), { level: 9 });
  if (packed.length >= Buffer.concat(data).length) return buffer;
  const idat = Buffer.alloc(packed.length + 12); idat.writeUInt32BE(packed.length); idat.write('IDAT', 4); packed.copy(idat, 8); idat.writeUInt32BE(zlib.crc32(idat.subarray(4, 8 + packed.length)), 8 + packed.length);
  let inserted = false; return Buffer.concat([buffer.subarray(0, 8), ...chunks.flatMap(({ type, chunk }) => { if (type !== 'IDAT') return [chunk]; if (inserted) return []; inserted = true; return [idat]; })]);
}
(async () => {
  const browser = await chromium.launch({ env: { ...process.env, LD_LIBRARY_PATH: process.env.PLAYWRIGHT_LIBS || '/tmp/iwave-qa001/libs/root/usr/lib/x86_64-linux-gnu' }, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    const source = fs.readFileSync(path.join(root, 'img/logo/iwave.jpg')).toString('base64');
    const images = await page.evaluate(async source => {
      const logo = new Image(); logo.src = 'data:image/jpeg;base64,' + source; await logo.decode();
      const output = {};
      for (const size of [16, 32, 48, 180, 192, 512]) {
        const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d'); ctx.fillStyle = '#050B14'; ctx.fillRect(0, 0, size, size);
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
        // Emblema existente, sin redibujado, recoloración ni deformación; centrado y con margen.
        const crop = { x: 300, y: 275, w: 720, h: 365 }, width = size * .88, height = width * crop.h / crop.w;
        ctx.drawImage(logo, crop.x, crop.y, crop.w, crop.h, (size - width) / 2, (size - height) / 2, width, height);
        output[size] = canvas.toDataURL('image/png').split(',')[1];
      }
      return output;
    }, source);
    for (const size of [48, 192, 512]) fs.writeFileSync(path.join(root, `img/logo/favicon-${size}x${size}.png`), compactPNG(Buffer.from(images[size], 'base64')));
    fs.writeFileSync(path.join(root, 'img/logo/apple-touch-icon.png'), compactPNG(Buffer.from(images[180], 'base64')));
    const sizes = [16, 32, 48], frames = sizes.map(n => compactPNG(Buffer.from(images[n], 'base64')));
    const header = Buffer.alloc(6 + sizes.length * 16); header.writeUInt16LE(1, 2); header.writeUInt16LE(sizes.length, 4);
    let offset = header.length;
    sizes.forEach((n, i) => { const p = 6 + i * 16; header[p] = header[p + 1] = n; header.writeUInt16LE(1, p + 4); header.writeUInt16LE(32, p + 6); header.writeUInt32LE(frames[i].length, p + 8); header.writeUInt32LE(offset, p + 12); offset += frames[i].length; });
    fs.writeFileSync(path.join(root, 'favicon.ico'), Buffer.concat([header, ...frames]));
    console.log('Generados ICO 16/32/48, PNG 48/192/512, Apple 180; original preservado.');
  } finally { await browser.close(); }
})().catch(() => { console.error('No se pudieron generar los derivados del logo.'); process.exitCode = 1; });
