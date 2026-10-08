import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { deflateSync } from 'node:zlib';

const root = process.cwd();
const distFile = resolve(root, 'dist/index.html');
const assetsDir = resolve(root, 'assets');
mkdirSync(assetsDir, { recursive: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 0);
  return Buffer.concat([length, typeBytes, data, crc]);
}

function createPng(width, height, seed = 0) {
  const signature = Buffer.from([137,80,78,71,13,10,26,10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const scanlines = Buffer.alloc((width * 4 + 1) * height);
  let offset = 0;
  for (let y = 0; y < height; y += 1) {
    scanlines[offset++] = 0;
    for (let x = 0; x < width; x += 1) {
      scanlines[offset++] = (x * 5 + seed * 43) & 255;
      scanlines[offset++] = (y * 7 + seed * 71) & 255;
      scanlines[offset++] = ((x + y) * 3 + seed * 29) & 255;
      scanlines[offset++] = (x + y + seed) % 11 === 0 ? 96 : 255;
    }
  }
  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(scanlines, { level: 6 })),
    pngChunk('IEND', Buffer.alloc(0))
  ]);
}

function filePayload(name, width, height, seed) {
  return { name, mimeType: 'image/png', buffer: createPng(width, height, seed) };
}

function parseWebP(buffer) {
  assert(buffer.subarray(0, 4).toString('ascii') === 'RIFF', 'WebP missing RIFF header');
  assert(buffer.subarray(8, 12).toString('ascii') === 'WEBP', 'WebP missing WEBP signature');
  assert(buffer.readUInt32LE(4) + 8 === buffer.length, 'WebP RIFF size mismatch');
  let offset = 12;
  let loop = null;
  let frames = 0;
  const durations = [];
  while (offset + 8 <= buffer.length) {
    const type = buffer.subarray(offset, offset + 4).toString('ascii');
    const size = buffer.readUInt32LE(offset + 4);
    const payload = offset + 8;
    if (type === 'ANIM' && size >= 6) loop = buffer.readUInt16LE(payload + 4);
    if (type === 'ANMF' && size >= 16) {
      frames += 1;
      durations.push(buffer[payload + 12] | (buffer[payload + 13] << 8) | (buffer[payload + 14] << 16));
    }
    offset = payload + size + (size & 1);
  }
  return { loop, frames, durations };
}

function gifRepeat(buffer) {
  assert(buffer.subarray(0, 6).toString('ascii') === 'GIF89a', 'GIF header is not GIF89a');
  const marker = Buffer.from('NETSCAPE2.0', 'ascii');
  const index = buffer.indexOf(marker);
  if (index < 0) return null;
  assert(buffer[index + 11] === 3 && buffer[index + 12] === 1, 'GIF Netscape loop extension malformed');
  return buffer[index + 13] | (buffer[index + 14] << 8);
}

async function visible(locator) {
  return locator.isVisible().catch(() => false);
}

async function waitFrames(page, count, timeout = 60_000) {
  await page.waitForFunction(
    expected => document.querySelectorAll('.frame-card').length === expected,
    count,
    { timeout }
  );
}

async function setNumber(locator, value) {
  await locator.evaluate((el, next) => {
    el.value = String(next);
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

async function makeContext(browser, viewport, locale = 'ja-JP') {
  const context = await browser.newContext({ viewport, locale, acceptDownloads: true });
  return context;
}

function watchNetwork(page, externalRequests, pageErrors) {
  page.on('request', request => {
    const url = request.url();
    if (/^https?:/i.test(url)) {
      const parsed = new URL(url);
      if (!['127.0.0.1', 'localhost'].includes(parsed.hostname)) externalRequests.push(url);
    }
  });
  page.on('pageerror', error => pageErrors.push(String(error)));
  page.on('console', message => {
    if (message.type() === 'error') pageErrors.push(`console: ${message.text()}`);
  });
}

async function loadFiles(page, files) {
  await page.locator('#fileInput').setInputFiles(files);
}

async function waitToastGone(page) {
  await page.waitForFunction(() => !document.querySelector('#appToast')?.classList.contains('show'), null, { timeout: 10_000 });
  await page.waitForTimeout(300);
}

async function saveDownload(page, buttonSelector, destination) {
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 30_000 }),
    page.locator(buttonSelector).click()
  ]);
  await download.saveAs(destination);
  return readFileSync(destination);
}

async function exerciseDesktop(browser, baseUrl) {
  const context = await makeContext(browser, { width: 1440, height: 1000 });
  const page = await context.newPage();
  const external = [];
  const errors = [];
  watchNetwork(page, external, errors);
  await page.goto(baseUrl, { waitUntil: 'load' });

  const files = [
    filePayload('frame10.png', 96, 64, 1),
    filePayload('frame2.png', 64, 96, 2),
    filePayload('長いファイル名_テスト_abcdefghijklmnopqrstuvwxyz_0123456789.png', 120, 72, 3),
    filePayload('alpha-gradient.png', 88, 88, 4)
  ];
  await loadFiles(page, files);
  await waitFrames(page, 4);
  assert(await page.locator('#dropZone').evaluate(el => el.classList.contains('is-compact')), 'Drop zone did not compact after import');
  assert(!(await visible(page.locator('#emptyState'))), 'Frames empty state remained visible after importing frames');
  await waitToastGone(page);

  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: join(assetsDir, 'screenshot.png'), fullPage: false });

  await page.locator('#languageButton').click();
  assert((await page.locator('#languageButton').textContent()).trim() === 'JA', 'English mode did not expose JA switch label');
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: join(assetsDir, 'screenshot-en.png'), fullPage: false });
  await page.locator('#languageButton').click();

  const broken = { name: 'broken-zero-byte.png', mimeType: 'image/png', buffer: Buffer.alloc(0) };
  const corrupt = { name: 'corrupt-nonzero.png', mimeType: 'image/png', buffer: Buffer.from('not-a-valid-png') };
  await loadFiles(page, [broken, corrupt, filePayload('追加画像.png', 80, 60, 5)]);
  await waitFrames(page, 5);
  assert(await visible(page.locator('#importReport')), 'Partial import failure report is not visible');
  assert((await page.locator('#importReport').textContent()).length > 0, 'Partial import failure report is empty');

  await page.locator('#sortSelect').selectOption('asc');
  const names = await page.locator('.frame-name').allTextContents();
  assert(names.indexOf('frame2.png') < names.indexOf('frame10.png'), 'Natural filename sorting did not place frame2 before frame10');

  const durationInputs = page.locator('.frame-duration-input');
  await setNumber(durationInputs.nth(0), 20);
  await setNumber(durationInputs.nth(1), 10000);
  assert(await durationInputs.nth(0).inputValue() === '20', '20ms duration was not accepted');
  assert(await durationInputs.nth(1).inputValue() === '10000', '10000ms duration was not accepted');

  const initialFormat = await page.evaluate(() => ({
    gifVisible: !document.querySelector('#gifExportPanel').hidden,
    webpHidden: document.querySelector('#webpExportPanel').hidden
  }));
  assert(initialFormat.gifVisible && initialFormat.webpHidden, 'Export format did not default to GIF');

  await page.locator('#playbackOrder').selectOption('pingpong');
  await page.locator('#playbackLoopMode').selectOption('custom');
  await setNumber(page.locator('#playbackLoopCount'), 3);
  assert((await page.locator('#playbackSummary').textContent()).trim().startsWith('8 '), '5-frame Ping-pong should derive 8 playback frames');

  await page.locator('#createGifButton').click();
  await page.locator('#gifResultCard').waitFor({ state: 'visible', timeout: 60_000 });
  assert((await page.locator('#gifResultFrames').textContent()).trim() === '8', 'Generated GIF frame count did not match Ping-pong sequence');

  const gifPath = resolve(root, 'dist/rc-download.gif');
  const gifBytes = await saveDownload(page, '#saveGifButton', gifPath);
  assert(gifRepeat(gifBytes) === 2, 'GIF custom play count 3 should store Netscape repeat count 2');

  await page.locator('#exportWebpTab').click();
  assert(await visible(page.locator('#webpExportPanel')) && !(await visible(page.locator('#gifExportPanel'))), 'WebP format selection did not hide GIF settings');
  await page.locator('#createWebpButton').click();
  await page.locator('#webpResultCard').waitFor({ state: 'visible', timeout: 60_000 });
  assert((await page.locator('#webpResultFrames').textContent()).trim() === '8', 'Generated WebP frame count did not match Ping-pong sequence');

  const webpPath = resolve(root, 'dist/rc-download.webp');
  const webpBytes = await saveDownload(page, '#saveWebpButton', webpPath);
  const webp = parseWebP(webpBytes);
  assert(webp.frames === 8, `Expected 8 ANMF frames, got ${webp.frames}`);
  assert(webp.loop === 3, `Expected WebP loop count 3, got ${webp.loop}`);

  const decoded = await page.evaluate(async data => {
    if (typeof ImageDecoder === 'undefined') return { supported: false };
    const decoder = new ImageDecoder({ data: new Uint8Array(data), type: 'image/webp' });
    await decoder.tracks.ready;
    const count = decoder.tracks.selectedTrack.frameCount;
    const signatures = [];
    for (let index = 0; index < Math.min(count, 4); index += 1) {
      const { image } = await decoder.decode({ frameIndex: index });
      const canvas = document.createElement('canvas');
      canvas.width = image.displayWidth;
      canvas.height = image.displayHeight;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(image, 0, 0);
      image.close();
      const rgba = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let checksum = 2166136261;
      for (let pixel = 0; pixel < rgba.length; pixel += 37) {
        checksum = Math.imul((checksum ^ rgba[pixel]) >>> 0, 16777619) >>> 0;
      }
      signatures.push(checksum);
    }
    decoder.close();
    return { supported: true, count, unique: new Set(signatures).size };
  }, Array.from(webpBytes));
  assert(decoded.supported, 'Chromium ImageDecoder is unavailable for Animated WebP visual verification');
  assert(decoded.count === 8, `Chromium decoded ${decoded.count} WebP frames, expected 8`);
  assert(decoded.unique > 1, 'Animated WebP frames decoded to identical visual content');
  console.log(`[OK] Animated WebP pixels: ${decoded.count} frames, ${decoded.unique} distinct sample hashes.`);

  await page.locator('#exportGifTab').click();
  assert(await visible(page.locator('#gifExportPanel')) && !(await visible(page.locator('#webpExportPanel'))), 'GIF format selection did not restore GIF settings');
  await page.locator('#playbackOrder').selectOption('forward');
  await page.waitForFunction(() => {
    const gifCard = document.querySelector('#gifResultCard');
    const webpCard = document.querySelector('#webpResultCard');
    const gifSave = document.querySelector('#saveGifButton');
    const webpSave = document.querySelector('#saveWebpButton');
    return gifCard?.hidden && webpCard?.hidden && gifSave?.disabled && webpSave?.disabled;
  }, null, { timeout: 10_000 });
  assert(/もう一度|again/i.test(await page.locator('#gifResultEmpty').textContent()), 'GIF stale-result message did not appear');
  assert(/もう一度|again/i.test(await page.locator('#webpResultEmpty').textContent()), 'WebP stale-result message did not appear');

  assert(external.length === 0, `External runtime requests detected: ${external.join(', ')}`);
  assert(errors.length === 0, `Desktop page errors: ${errors.join(' | ')}`);
  await context.close();
}

async function exerciseFrameDragging(browser, baseUrl) {
  const context = await makeContext(browser, { width: 1280, height: 900 });
  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: 'load' });
  await loadFiles(page, [1, 2, 3, 4].map(i => filePayload(`drag-${i}.png`, 80, 64, i)));
  await waitFrames(page, 4);
  await page.waitForFunction(() => !document.querySelector('#frameGrid [data-action="drag"]')?.disabled);
  const before = await page.locator('.frame-name').allTextContents();
  await page.locator('.frame-card').first().locator('[data-action="drag"]').scrollIntoViewIfNeeded();
  const handle = await page.locator('.frame-card').first().locator('[data-action="drag"]').boundingBox();
  const target = await page.locator('.frame-card').nth(2).boundingBox();
  assert(handle && target, 'Frame drag bounds unavailable');
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  assert(await page.locator('.frame-card.is-dragging').count() === 1, 'Dragged frame did not lift on pointerdown');
  const lift = await page.evaluate(() => {
    const card = document.querySelector('.frame-card.is-dragging');
    const slot = document.querySelector('#frameGrid .frame-drag-placeholder');
    return { liftedToBody: card?.parentElement === document.body, position: card && getComputedStyle(card).position, placeholders: document.querySelectorAll('.frame-drag-placeholder').length, occupiedSlot: Boolean(slot?.offsetWidth && slot?.offsetHeight) };
  });
  assert(lift.liftedToBody && lift.position === 'fixed' && lift.placeholders === 1 && lift.occupiedSlot,
    'Dragging must lift the card from the grid and reserve exactly one stable slot');
  await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 12 });
  assert(await page.locator('.frame-card.is-dragging').count() === 1, 'Dragged frame did not stay lifted during reorder');
  // Cross the same cells again: ongoing shift animations must not steal the hit target or duplicate slots.
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2, { steps: 12 });
  await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 12 });
  assert(await page.locator('#frameGrid .frame-drag-placeholder').count() === 1, 'Drag placeholder became unstable on reverse movement');
  assert(await page.locator('#frameGrid .frame-card').count() === 3, 'Neighboring cards were lost or duplicated during drag');
  await page.mouse.up();
  assert(await page.locator('.frame-drag-placeholder, .frame-card.is-dragging').count() === 0, 'Drag overlay or placeholder was left behind after release');
  assert(await page.locator('#frameGrid .frame-card').count() === 4, 'Dropped card did not rejoin the grid');
  const after = await page.locator('.frame-name').allTextContents();
  assert(before.join('|') !== after.join('|'), 'Pointer dragging did not reorder frame cards');
  await context.close();
}

async function exerciseMobile(browser, baseUrl) {
  const context = await makeContext(browser, { width: 390, height: 844 });
  const page = await context.newPage();
  const external = [];
  const errors = [];
  watchNetwork(page, external, errors);
  await page.goto(baseUrl, { waitUntil: 'load' });
  await loadFiles(page, [
    filePayload('mobile-1.png', 80, 120, 11),
    filePayload('mobile-2.png', 120, 80, 12),
    filePayload('mobile-3.png', 96, 96, 13)
  ]);
  await waitFrames(page, 3);

  assert(await visible(page.locator('#mobileWorkflowNav')), 'Mobile workflow navigation is not visible at 390px');
  const mobileNavGeometry = await page.evaluate(() => {
    const nav = document.querySelector('#mobileWorkflowNav');
    const rect = nav.getBoundingClientRect();
    return { position: getComputedStyle(nav).position, bottomGap: window.innerHeight - rect.bottom, top: rect.top };
  });
  assert(mobileNavGeometry.position === 'fixed' && Math.abs(mobileNavGeometry.bottomGap) <= 1 && mobileNavGeometry.top > 0,
    'Mobile workflow navigation must stay fixed at the bottom, not above the cards');
  assert(await visible(page.locator('#mobilePageFrames')), 'Frames mobile page should be visible initially');
  assert(!(await visible(page.locator('#mobilePagePreview'))), 'Preview mobile page should be hidden initially');

  await page.locator('#mobileTabPreview').click();
  assert(await visible(page.locator('#mobilePagePreview')), 'Preview mobile page did not activate');
  assert(!(await visible(page.locator('#mobilePageFrames'))), 'Frames mobile page remained visible after tab switch');

  const widths = [390, 360, 320];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 844 });
    await page.waitForTimeout(50);
    const geometry = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth
    }));
    assert(geometry.scrollWidth <= geometry.innerWidth, `Horizontal overflow at ${width}px: ${JSON.stringify(geometry)}`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#mobileTabPreview').click();
  await waitToastGone(page);
  await page.screenshot({ path: join(assetsDir, 'screenshot-mobile.png'), fullPage: false });

  assert(external.length === 0, `External runtime requests detected on mobile: ${external.join(', ')}`);
  assert(errors.length === 0, `Mobile page errors: ${errors.join(' | ')}`);
  await context.close();
}

async function exerciseClipboardPaste(browser, baseUrl) {
  const context = await makeContext(browser, { width: 1100, height: 800 });
  const page = await context.newPage();
  const external = [];
  const errors = [];
  watchNetwork(page, external, errors);
  await page.goto(baseUrl, { waitUntil: 'load' });

  const png = createPng(48, 32, 19);
  const bytes = Array.from(png);
  await page.evaluate(payload => {
    const data = new Uint8Array(payload);
    const file = new File([data], 'clipboard-source.png', { type: 'image/png', lastModified: Date.now() });
    const transfer = new DataTransfer();
    transfer.items.add(file);
    const event = new ClipboardEvent('paste', { clipboardData: transfer, bubbles: true, cancelable: true });
    document.dispatchEvent(event);
  }, bytes);

  await waitFrames(page, 1);
  const name = (await page.locator('.frame-name').first().textContent()) || '';
  assert(/^clipboard-\d{14}-1\.png$/.test(name), `Clipboard import filename was not normalized: ${name}`);

  const input = page.locator('#outputFilename');
  await input.fill('clipboard.gif');
  await input.blur();
  assert(await input.inputValue() === 'clipboard', 'GIF filename extension sanitization did not strip .gif');

  assert(external.length === 0, `External runtime requests detected during clipboard test: ${external.join(', ')}`);
  assert(errors.length === 0, `Clipboard page errors: ${errors.join(' | ')}`);
  await context.close();
}

async function exerciseLargeList(browser, baseUrl) {
  const context = await makeContext(browser, { width: 1280, height: 900 });
  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: 'load' });
  const tiny = createPng(8, 8, 21);
  const files = Array.from({ length: 200 }, (_, index) => ({
    name: `tiny-${String(index + 1).padStart(3, '0')}.png`,
    mimeType: 'image/png',
    buffer: tiny
  }));
  const started = Date.now();
  await loadFiles(page, files);
  await waitFrames(page, 200, 120_000);
  const elapsed = Date.now() - started;
  assert((await page.locator('#frameCount').textContent()).replace(/\D/g, '') === '200', '200-frame count did not render');
  assert(await page.locator('.frame-card').count() === 200, '200 frame cards were not retained');
  assert(elapsed < 120_000, `200-frame import exceeded 120s: ${elapsed}ms`);

  const first = page.locator('.frame-duration-input').first();
  await setNumber(first, 1230);
  assert(await page.locator('.frame-card').count() === 200, 'Single timing edit changed frame-card count');
  assert((await first.inputValue()) === '1230', 'Single timing edit did not persist at 200 frames');
  await context.close();
}

async function exerciseCancelAndRetry(browser, baseUrl) {
  const context = await makeContext(browser, { width: 1100, height: 800 });
  const page = await context.newPage();
  await page.addInitScript(() => {
    const NativeWorker = window.Worker;
    window.Worker = class SlowWorker extends NativeWorker {
      postMessage(message, transfer) {
        if (message && message.type === 'frame') {
          setTimeout(() => super.postMessage(message, transfer), 120);
          return;
        }
        super.postMessage(message, transfer);
      }
    };
  });
  await page.goto(baseUrl, { waitUntil: 'load' });
  await loadFiles(page, Array.from({ length: 8 }, (_, i) => filePayload(`cancel-${i + 1}.png`, 128, 96, 30 + i)));
  await waitFrames(page, 8);
  await page.waitForFunction(() => !document.querySelector('#createGifButton')?.disabled, null, { timeout: 10_000 });

  await page.locator('#createGifButton').click();
  await page.locator('#cancelGifButton').waitFor({ state: 'visible', timeout: 10_000 });
  await page.locator('#cancelGifButton').click();
  await page.waitForFunction(() => !document.querySelector('#createGifButton').disabled, null, { timeout: 10_000 });
  assert(await page.locator('.frame-card').count() === 8, 'GIF cancellation lost source frames');

  await page.locator('#createGifButton').click();
  await page.locator('#gifResultCard').waitFor({ state: 'visible', timeout: 60_000 });
  assert(await page.locator('#saveGifButton').isEnabled(), 'GIF retry after cancellation did not recover');
  await context.close();
}

async function exerciseForcedFailure(browser, baseUrl) {
  const context = await makeContext(browser, { width: 1100, height: 800 });
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.Worker = class ForcedWorkerFailure {
      constructor() { throw new Error('forced RC worker failure'); }
    };
  });
  await page.goto(baseUrl, { waitUntil: 'load' });
  await loadFiles(page, [filePayload('failure-test.png', 64, 64, 50)]);
  await waitFrames(page, 1);

  await page.locator('#createGifButton').click();
  await page.waitForFunction(() => {
    const button = document.querySelector('#createGifButton');
    const empty = document.querySelector('#gifResultEmpty');
    return button && !button.disabled && empty && /もう一度|try again/i.test(empty.textContent || '');
  }, null, { timeout: 10_000 });
  assert(await page.locator('.frame-card').count() === 1, 'GIF failure recovery lost frames');

  await page.locator('#exportWebpTab').click();
  await page.locator('#createWebpButton').click();
  await page.waitForFunction(() => {
    const button = document.querySelector('#createWebpButton');
    const empty = document.querySelector('#webpResultEmpty');
    return button && !button.disabled && empty && /もう一度|try again/i.test(empty.textContent || '');
  }, null, { timeout: 15_000 });
  assert(await page.locator('.frame-card').count() === 1, 'WebP failure recovery lost frames');
  await context.close();
}

async function exerciseFileUrl(browser) {
  const context = await makeContext(browser, { width: 1000, height: 760 });
  const page = await context.newPage();
  const external = [];
  const errors = [];
  watchNetwork(page, external, errors);
  await page.goto(pathToFileURL(distFile).href, { waitUntil: 'load' });
  await loadFiles(page, [
    filePayload('file-a.png', 32, 24, 61),
    filePayload('file-b.png', 32, 24, 62)
  ]);
  await waitFrames(page, 2);
  await page.locator('#createGifButton').click();
  await page.locator('#gifResultCard').waitFor({ state: 'visible', timeout: 30_000 });
  await page.locator('#exportWebpTab').click();
  await page.locator('#createWebpButton').click();
  try {
    await page.locator('#webpResultCard').waitFor({ state: 'visible', timeout: 15_000 });
  } catch (error) {
    const diagnostic = await page.evaluate(() => ({
      resultText: document.querySelector('#webpResultEmpty')?.textContent || '',
      createDisabled: Boolean(document.querySelector('#createWebpButton')?.disabled),
      progressText: document.querySelector('#webpProgressText')?.textContent || '',
      progressHidden: Boolean(document.querySelector('#webpProgressWrap')?.hidden)
    }));
    console.error('FILE_WEBP_DIAGNOSTIC', JSON.stringify({ diagnostic, pageErrors: errors }));
    throw error;
  }
  assert(external.length === 0, `External runtime requests from file://: ${external.join(', ')}`);
  assert(errors.length === 0, `file:// page errors: ${errors.join(' | ')}`);
  await context.close();
}

async function main() {
  assert(existsSync(distFile), 'dist/index.html is missing; run build-standalone.ps1 first');

  const server = createServer((req, res) => {
    if (req.url === '/' || req.url === '/index.html') {
      const html = readFileSync(distFile);
      res.writeHead(200, {
        'content-type': 'text/html; charset=utf-8',
        'content-length': html.length,
        'cache-control': 'no-store'
      });
      res.end(html);
      return;
    }
    res.writeHead(404);
    res.end('not found');
  });

  await new Promise((resolveListen, rejectListen) => {
    server.once('error', rejectListen);
    server.listen(0, '127.0.0.1', resolveListen);
  });
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/`;

  const browser = await chromium.launch({ headless: true });
  try {
    await exerciseDesktop(browser, baseUrl);
    await exerciseFrameDragging(browser, baseUrl);
    await exerciseMobile(browser, baseUrl);
    await exerciseClipboardPaste(browser, baseUrl);
    await exerciseLargeList(browser, baseUrl);
    await exerciseCancelAndRetry(browser, baseUrl);
    await exerciseForcedFailure(browser, baseUrl);
    await exerciseFileUrl(browser);
    console.log('[OK] Frame Animator RC browser regression passed.');
  } finally {
    await browser.close();
    await new Promise(resolveClose => server.close(resolveClose));
  }
}

await main();
