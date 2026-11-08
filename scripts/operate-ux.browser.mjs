// Chromium checks against the built standalone HTML, including actual PNG imports and GIF download.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, statSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { deflateSync } from 'node:zlib';

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


const html = readFileSync(resolve('dist/index.html'));
const server = createServer((req, res) => {
  if (req.url !== '/' && req.url !== '/index.html') { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(html);
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const baseUrl = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ headless: true });
mkdirSync('test-results/operate', { recursive: true });
const check = (condition, message) => { if (!condition) throw new Error(message); };

async function inspect(width, height) {
  const context = await browser.newContext({ viewport: { width, height }, locale: 'ja-JP', acceptDownloads: true });
  const page = await context.newPage();
  const errors = [];
  const externalRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    if (/^https?:/i.test(request.url()) && !request.url().startsWith(baseUrl)) {
      externalRequests.push(request.url());
    }
  });
  try {
    await page.goto(baseUrl, { waitUntil: 'load' });
    check(await page.locator('.main').getAttribute('data-workspace') === 'empty', width + ': initial workspace');
    check(await page.locator('#addImagesPanel').isVisible(), width + ': picker visible');
    for (const stage of ['#mobilePageFrames','#mobilePagePreview','#mobilePageExport']) {
      check(!(await page.locator(stage).isVisible()), width + ': empty stage hidden ' + stage);
    }
    await page.locator('#helpButton').click();
    const help = await page.locator('#helpDialog').evaluate(dialog => {
      const r = dialog.getBoundingClientRect();
      const p = dialog.querySelector('.dialog-body p');
      return { top:r.top,bottom:r.bottom,font:parseFloat(getComputedStyle(p).fontSize) };
    });
    check(help.top >= -1 && help.bottom <= height + 1 && help.font >= 14,
      width + ': Help geometry/readability ' + JSON.stringify(help));
    await page.locator('#helpDialog .dialog-body').evaluate(el => el.scrollTop = el.scrollHeight);
    await page.keyboard.press('Escape');
    check(!(await page.locator('#helpDialog').isVisible()), width + ': Help closes');

    await page.locator('#languageButton').click();
    check(await page.locator('html').getAttribute('lang') === 'en', width + ': English');
    await page.locator('#languageButton').click();
    check(await page.locator('html').getAttribute('lang') === 'ja', width + ': Japanese');
    await page.locator('#fileInput').setInputFiles([
      {name:'scene-one.png',mimeType:'image/png',buffer:createPng(48,32,11)},
      {name:'scene-two.png',mimeType:'image/png',buffer:createPng(32,48,12)}
    ]);
    await page.waitForFunction(() => document.querySelectorAll('.frame-card').length === 2);
    check(await page.locator('.main').getAttribute('data-workspace') === 'ready', width + ': ready workspace');
    check(!(await page.locator('#addImagesPanel').isVisible()), width + ': picker recedes after import');
    if (width <= 640) {
      check(await page.locator('#mobileWorkflowNav').isVisible(), width + ': mobile tabs visible');
      await page.locator('#mobileTabPreview').click();
      check(await page.locator('#mobilePagePreview').isVisible(), width + ': preview tab');
      await page.locator('#mobileTabFrames').click();
    } else {
      check(await page.locator('#mobilePagePreview').isVisible(), width + ': desktop preview visible');
      if (width >= 901) {
        const positions = await page.evaluate(() => ({
          frames:document.querySelector('#mobilePageFrames').getBoundingClientRect().toJSON(),
          preview:document.querySelector('#mobilePagePreview').getBoundingClientRect().toJSON()
        }));
        check(positions.preview.left > positions.frames.right - 1, width + ': desktop workspace side-by-side');
        check(Math.abs(positions.preview.top - positions.frames.top) <= 2, width + ': desktop columns aligned');
      }
    }
    // The partial-import notice must remain visible even after the picker has closed.
    await page.locator('#fileInput').setInputFiles([{name:'not-an-image.txt',mimeType:'text/plain',buffer:Buffer.from('invalid image')}]);
    await page.waitForFunction(() => !document.querySelector('#importReport')?.hidden);
    if (width <= 640) await page.locator('#mobileTabFrames').click();
    check(await page.locator('#importReport').isVisible(), width + ': import failures must be seen');

    const snapshot = await page.evaluate(() => ({
      scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth,
      buttons:[...document.querySelectorAll('button')].filter(x=>x.offsetParent!==null && !x.disabled).slice(0,15)
        .map(x=>({id:x.id,w:x.getBoundingClientRect().width,h:x.getBoundingClientRect().height}))
    }));
    check(snapshot.scrollWidth <= snapshot.viewport+1,width+': horizontal overflow '+JSON.stringify(snapshot));
    await page.screenshot({path:`test-results/operate/${width}-frames.png`,fullPage:true});
    if (width <= 640) await page.locator('#mobileTabExport').click();
    await page.locator('#createGifButton').click();
    await page.locator('#gifResultCard').waitFor({state:'visible',timeout:60000});
    await page.screenshot({path:`test-results/operate/${width}-result.png`,fullPage:true});
    const save = width <= 640 ? '#saveGifMobileButton' : '#saveGifButton';
    const downloadEvent=page.waitForEvent('download');
    await page.locator(save).click();
    const download=await downloadEvent;
    check(download.suggestedFilename().endsWith('.gif'),width+': GIF filename');
    const file=await download.path();
    check(statSync(file).size > 100,width+': nonempty GIF');
    check(errors.length===0,width+': script errors: '+errors.join(' | '));
    check(externalRequests.length===0,width+': external requests: '+externalRequests.join(' | '));
    console.log('[OK]',width,'px, ja/en, help, PNG import, errors, GIF save, no external requests');
  } finally { await context.close(); }
}
try {
  for(const [w,h] of [[320,700],[390,844],[768,960],[1440,900]]) await inspect(w,h);
} finally {
  await browser.close();
  await new Promise(done => server.close(done));
}
