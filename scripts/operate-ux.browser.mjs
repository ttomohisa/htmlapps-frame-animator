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

async function checkPreviewTransport(page, width, language) {
  const geometry = await page.evaluate(() => {
    const stage = document.querySelector('#previewStage');
    const progress = document.querySelector('#previewProgress');
    const transport = document.querySelector('.preview-transport');
    const previewPlayer = document.querySelector('.preview-player');
    const settings = document.querySelector('.preview-side');
    const a = stage.getBoundingClientRect(), b = progress.getBoundingClientRect();
    const c = transport.getBoundingClientRect(), d = settings.getBoundingClientRect();
    return {
      sameGroup: previewPlayer?.contains(stage) && previewPlayer?.contains(progress)
        && previewPlayer?.contains(transport) && !previewPlayer?.contains(settings),
      stageToProgress: b.top - a.bottom,
      progressToTransport: c.top - b.bottom,
      stageWidth: a.width, transportWidth: c.width,
      transportHeight: c.height, settingsTop: d.top, stageTop: a.top,
      enabledButtons: [...transport.querySelectorAll('button')].filter(button => !button.disabled).length
    };
  });
  check(geometry.sameGroup, width + ' ' + language + ': preview and transport must share the same viewer');
  check(geometry.stageToProgress >= 0 && geometry.stageToProgress <= 12,
    width + ' ' + language + ': progress separated from preview ' + JSON.stringify(geometry));
  check(geometry.progressToTransport >= 0 && geometry.progressToTransport <= 12,
    width + ' ' + language + ': transport separated from timeline ' + JSON.stringify(geometry));
  check(Math.abs(geometry.transportWidth - geometry.stageWidth) <= 3 && geometry.transportHeight >= 40,
    width + ' ' + language + ': transport tap area / alignment ' + JSON.stringify(geometry));
  check(geometry.enabledButtons >= 2, width + ' ' + language + ': transport should be usable after import');
}

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
    check(!(await page.locator('.page-intro').isVisible()), width + ': no duplicated introductory hero');
    await page.screenshot({path:`test-results/operate/${width}-empty-ja.png`});
    check(await page.locator('#gifResultPreview img, #webpResultPreview img').count() === 0,
      width + ': no result images or broken image elements before export');
    for (const stage of ['#mobilePageFrames','#mobilePagePreview','#mobilePageExport']) {
      check(!(await page.locator(stage).isVisible()), width + ': empty stage hidden ' + stage);
    }
    await page.locator('#helpButton').click();
    const inset = await page.locator('#helpDialog').evaluate(dialog => ({
      help: Number.parseFloat(getComputedStyle(dialog).paddingTop),
      confirm: Number.parseFloat(getComputedStyle(document.querySelector('#appConfirmDialog')).paddingTop)
    }));
    check(inset.help >= 8 && inset.confirm >= 8,
      width + ': dialog contents need a real container inset');
    const help = await page.locator('#helpDialog').evaluate(dialog => {
      const r = dialog.getBoundingClientRect();
      const p = dialog.querySelector('.dialog-body p');
      return { top:r.top,bottom:r.bottom,font:parseFloat(getComputedStyle(p).fontSize) };
    });
    check(help.top >= -1 && help.bottom <= height + 1 && help.font >= 14,
      width + ': Help geometry/readability ' + JSON.stringify(help));
    await page.locator('#helpDialog .dialog-body').evaluate(el => el.scrollTop = el.scrollHeight);
    check(await page.locator('#helpDialog .help-license-links').isVisible(),
      width + ': full license disclosure must remain visible and scrollable');
    await page.screenshot({path:`test-results/operate/${width}-help.png`});
    await page.keyboard.press('Escape');
    check(!(await page.locator('#helpDialog').isVisible()), width + ': Help closes');

    const buildVersionBefore = (await page.locator('#buildVersion').textContent()).trim();
    check(buildVersionBefore.length > 0, width + ': build version should be available');
    await page.locator('#languageButton').click();
    check(await page.locator('html').getAttribute('lang') === 'en', width + ': English');
    await page.screenshot({path:`test-results/operate/${width}-empty-en.png`});
    check((await page.locator('#buildVersion').textContent()).trim() === buildVersionBefore,
      width + ': changing language must not overwrite build metadata');
    await page.locator('#languageButton').click();
    check(await page.locator('html').getAttribute('lang') === 'ja', width + ': Japanese');
    await page.locator('#fileInput').setInputFiles([
      {name:'scene-one.png',mimeType:'image/png',buffer:createPng(48,32,11)},
      {name:'scene-two.png',mimeType:'image/png',buffer:createPng(32,48,12)}
    ]);
    await page.waitForFunction(() => document.querySelectorAll('.frame-card').length === 2);
    check(await page.locator('.main').getAttribute('data-workspace') === 'ready', width + ': ready workspace');
    check(!(await page.locator('#addImagesPanel').isVisible()), width + ': picker recedes after import');
    check(!(await page.locator('#gifResultEmpty').isVisible()), width + ': blank output placeholder must not consume space');
    check(!(await page.locator('#previewSettingsDisclosure').evaluate(el => el.open)),
      width + ': preview options are initially collapsed');
    check((await page.locator('#previewSettingsStatus').textContent()).includes('×'),
      width + ': compact settings summary shows the actual output size');
    if (width <= 640) {
      check(await page.locator('#mobileWorkflowNav').isVisible(), width + ': mobile tabs visible');
      await page.locator('#mobileTabPreview').click();
      check(await page.locator('#mobilePagePreview').isVisible(), width + ': preview tab');
      const mobileCanvas = await page.locator('#previewCanvas').boundingBox();
      check(mobileCanvas && mobileCanvas.width >= 200, width + ': small source preview is legible');
      await checkPreviewTransport(page, width, 'ja');
      await page.screenshot({path:`test-results/operate/${width}-preview-ja.png`,fullPage: width > 640});
      await page.locator('#languageButton').click();
      await checkPreviewTransport(page, width, 'en');
      await page.screenshot({path:`test-results/operate/${width}-preview-en.png`,fullPage: width > 640});
      await page.locator('#languageButton').click();
      check(!(await page.locator('#canvasSizeMode').isVisible()), width + ': settings hidden until requested');
      await page.locator('#previewSettingsDisclosure > summary').click();
      check(await page.locator('#canvasSizeMode').isVisible(), width + ': optional output controls reveal on request');
      await page.locator('#canvasSizeMode').selectOption('480');
      check((await page.locator('#previewSettingsStatus').textContent()).includes('480'),
        width + ': settings disclosure summarizes the actual selected output size');
      await page.locator('#canvasSizeMode').selectOption('auto');
      await page.locator('#previewSettingsDisclosure > summary').click();
      await page.locator('#goToExportButton').click();
      check(await page.locator('#mobilePageExport').isVisible(), width + ': direct Export next action works');
      check(await page.locator('#mobileTabExport').getAttribute('aria-selected') === 'true', width + ': export tab selected');
      await page.locator('#mobileTabFrames').click();
      const cardShape = await page.locator('.frame-card').first().evaluate(card => {
        const thumb = card.querySelector('.thumb-wrap').getBoundingClientRect();
        const info = card.querySelector('.frame-info').getBoundingClientRect();
        return {thumbRight:thumb.right, infoLeft:info.left};
      });
      check(cardShape.infoLeft >= cardShape.thumbRight - 1,
        width + ': horizontal frame rows leave room for filenames and duration');
    } else {
      check(await page.locator('#mobilePagePreview').isVisible(), width + ': desktop preview visible');
      const desktopCanvas = await page.locator('#previewCanvas').boundingBox();
      check(desktopCanvas && desktopCanvas.width >= 200, width + ': small source preview is legible');
      await checkPreviewTransport(page, width, 'ja');
      await page.screenshot({path:`test-results/operate/${width}-preview-ja.png`,fullPage: width > 640});
      await page.locator('#languageButton').click();
      await checkPreviewTransport(page, width, 'en');
      await page.screenshot({path:`test-results/operate/${width}-preview-en.png`,fullPage: width > 640});
      await page.locator('#languageButton').click();
      if (width >= 901) {
        const positions = await page.evaluate(() => ({
          frames:document.querySelector('#mobilePageFrames').getBoundingClientRect().toJSON(),
          preview:document.querySelector('#mobilePagePreview').getBoundingClientRect().toJSON(),
          export:document.querySelector('#mobilePageExport').getBoundingClientRect().toJSON()
        }));
        check(Math.abs(positions.preview.top - positions.frames.top) <= 2,
          width + ': desktop working areas share the same top edge');
        if (width >= 1260) {
          const firstFrame = await page.locator('.frame-card').first().boundingBox();
          check(firstFrame && firstFrame.y + firstFrame.height <= height - 8,
            width + ': at least one complete frame must be visible above the fold');
          check(!(await page.locator('#timingExtras').evaluate(el => el.open)),
            width + ': advanced speed/preset controls should start collapsed in the frame rail');
          await page.locator('#timingExtras > summary').click();
          check(await page.locator('[data-speed="2"]').isVisible(),
            width + ': advanced speed remains discoverable');
          await page.locator('#timingExtras > summary').click();
          check(positions.frames.right <= positions.preview.left + 1 &&
            positions.preview.right <= positions.export.left + 1,
            width + ': desktop editor, preview and export follow left-to-right task order');
          check(Math.abs(positions.export.top - positions.preview.top) <= 2,
            width + ': export form is visible beside canvas, without page scrolling');
          const primaryAction = await page.locator('#createGifButton').boundingBox();
          check(primaryAction && primaryAction.y + primaryAction.height < height,
            width + ': Generate is visible in the first desktop viewport');
        } else {
          check(positions.frames.left > positions.preview.right - 1,
            width + ': compact desktop retains the two-column layout');
          check(positions.export.left < positions.frames.left &&
            positions.export.top >= positions.preview.bottom - 1,
            width + ': compact desktop export follows the preview');
        }
      }
      await page.locator('#previewSettingsDisclosure > summary').click();
      check(await page.locator('#canvasSizeMode').isVisible(), width + ': advanced controls can be opened');
      await page.locator('#previewSettingsDisclosure > summary').click();
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
    await page.waitForFunction(() => { const img = document.querySelector('#gifResultImage'); return img?.complete && img.naturalWidth > 0; });
    check(await page.locator('#gifResultImage').getAttribute('src') !== null,
      width + ': generated GIF image has a real source');
    check((await page.locator('#gifResultImage').getAttribute('alt')) === '生成したGIFのプレビュー',
      width + ': Japanese GIF image alt text');
    await page.locator('#languageButton').click();
    check((await page.locator('#gifResultImage').getAttribute('alt')) === 'Generated GIF preview',
      width + ': English GIF image alt text');
    await page.locator('#languageButton').click();
    const resultImage = await page.locator('#gifResultImage').boundingBox();
    check(resultImage && resultImage.width >= 180, width + ': generated small GIF must be inspectable');
    const resultActions = await page.locator('#gifResultCard').evaluate(card => {
      const preview = card.querySelector('.gif-result-preview').getBoundingClientRect();
      const save = card.querySelector('.gif-result-actions .button').getBoundingClientRect();
      const stats = card.querySelector('.gif-result-stats').getBoundingClientRect();
      return {previewBottom:preview.bottom,previewWidth:preview.width,saveTop:save.top,
        saveBottom:save.bottom,saveWidth:save.width,statsTop:stats.top};
    });
    check(resultActions.saveTop >= resultActions.previewBottom - 1 &&
      resultActions.saveBottom <= resultActions.statsTop + 1 &&
      resultActions.saveWidth >= resultActions.previewWidth - 2,
      width + ': Save must directly follow the actual encoded preview at full width ' + JSON.stringify(resultActions));
    if (width >= 1260) {
      await page.waitForFunction(() => {
        const rail = document.querySelector('#mobilePageExport');
        const result = document.querySelector('#gifResultCard')?.getBoundingClientRect();
        const viewport = rail?.getBoundingClientRect();
        return rail && result && viewport && rail.scrollTop <= 1 &&
          result.top >= viewport.top - 1 && result.top < viewport.bottom;
      }, null, { timeout:5000 });
    }
    await page.screenshot({path:`test-results/operate/${width}-result.png`,fullPage:true});
    if (width <= 640) {
      const resultFirst = await page.evaluate(() => {
        const result = document.querySelector('#gifResultCard').getBoundingClientRect();
        const settings = document.querySelector('#gifExportPanel .gif-settings').getBoundingClientRect();
        const saveButton = document.querySelector('#saveGifButton').getBoundingClientRect();
        const image = document.querySelector('#gifResultImage').getBoundingClientRect();
        const headerButtons = [...document.querySelectorAll('.header-actions button')].map(button => {
          const r = button.getBoundingClientRect();
          return {width:r.width,height:r.height};
        });
        return {resultTop:result.top,settingsTop:settings.top,
          imageBottom:image.bottom,saveTop:saveButton.top,headerButtons};
      });
      check(resultFirst.resultTop < resultFirst.settingsTop, width + ': actual GIF result before encoder form');
      check(resultFirst.saveTop >= resultFirst.imageBottom, width + ': Save follows rendered GIF preview');
      await page.waitForFunction(() => {
        const save = document.querySelector('#saveGifButton')?.getBoundingClientRect();
        const nav = document.querySelector('#mobileWorkflowNav')?.getBoundingClientRect();
        const header = document.querySelector('.app-header')?.getBoundingClientRect();
        const preview = document.querySelector('#gifResultImage')?.getBoundingClientRect();
        return save && nav && header && preview && preview.top >= header.bottom - 2 &&
          save.bottom <= nav.top - 4;
      }, null, {timeout:5000});
      check(resultFirst.headerButtons.every(r => r.width >= 44 && r.height >= 44),
        width + ': phone header touch targets must be at least 44px');
    }
    const save = '#saveGifButton';
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
  for(const [w,h] of [[320,700],[390,844],[768,960],[1024,768],[1280,800],[1440,900]]) await inspect(w,h);
} finally {
  await browser.close();
  await new Promise(done => server.close(done));
}
