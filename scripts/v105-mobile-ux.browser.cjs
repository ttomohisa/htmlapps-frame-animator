'use strict';
// Dedicated v1.0.5 phone regression: scrolling, controls, timing and preview.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require('playwright');

async function sampleImage(page, color) {
  const base64 = await page.evaluate(value => {
    const canvas = document.createElement('canvas');
    canvas.width = 96;
    canvas.height = 72;
    const context = canvas.getContext('2d');
    context.fillStyle = value;
    context.fillRect(0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png').split(',')[1];
  }, color);
  return Buffer.from(base64, 'base64');
}

async function runCase(browser, language, width, height) {
  const context = await browser.newContext({
    viewport: {width, height}, locale: language === 'ja' ? 'ja-JP' : 'en-US',
    reducedMotion: 'reduce'
  });
  const page = await context.newPage();
  const errors = [];
  const requests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('request', request => {
    if (/^https?:/.test(request.url())) requests.push(request.url());
  });
  const label = language + ' ' + width + 'x' + height;
  try {
    await page.goto(pathToFileURL(path.resolve('dist/index.html')).href);
    await page.locator('#chooseButton').waitFor();
    assert.equal(await page.locator('html').getAttribute('lang'), language);

    const first = await sampleImage(page, '#16624f');
    await page.locator('#fileInput').setInputFiles([
      {name: 'frame-1.png', mimeType: 'image/png', buffer: first}
    ]);
    await page.waitForFunction(() => document.querySelector('#frameCount').textContent === '1');

    // Match the Preview tab: the Frames panel border sits beneath the
    // sticky app header with the panel title and timing controls still visible.
    await page.waitForFunction(() => {
      const panel = document.querySelector('#mobilePageFrames > .panel');
      const header = document.querySelector('.app-header');
      if (!panel || !header) return false;
      const gap = panel.getBoundingClientRect().top - header.getBoundingClientRect().bottom;
      return gap >= 4 && gap <= 32;
    }, null, {timeout: 5000});
    const panel = await page.locator('#mobilePageFrames > .panel').boundingBox();
    const header = await page.locator('.app-header').boundingBox();
    const gap = panel.y - (header.y + header.height);
    assert.ok(gap >= 4 && gap <= 32, label + ': Frames panel matches Preview alignment ' + gap);
    assert.equal(await page.locator('#addImagesPanel').isVisible(), true, label + ': add-images section available in Frames');
    assert.equal(await page.locator('#frameTools').evaluate(el => el.open), false);
    if (width === 390) {
      fs.mkdirSync(path.resolve('test-results/mobile-layout'), {recursive: true});
      await page.screenshot({path: path.resolve('test-results/mobile-layout', 'frames-after-import-' + language + '.png')});
    }
    assert.equal(await page.locator('#timingDisclosure').evaluate(el => el.open), false);

    await page.locator('#timingDisclosure > summary').click();
    const styles = await page.evaluate(() => {
      const outer = getComputedStyle(document.querySelector('#timingDisclosure'));
      const content = getComputedStyle(document.querySelector('#timingToolbar'));
      const title = getComputedStyle(document.querySelector('#timingDisclosure > summary'));
      return {
        outerBorder: outer.borderTopWidth, outerRadius: outer.borderTopLeftRadius,
        innerBorder: content.borderTopWidth, innerRadius: content.borderTopLeftRadius,
        summaryBorderBottom: title.borderBottomWidth
      };
    });
    assert.notEqual(styles.outerBorder, '0px', label + ': outer timing outline');
    assert.notEqual(styles.outerRadius, '0px', label + ': outer corners');
    assert.equal(styles.innerBorder, '0px', label + ': no inner border');
    assert.equal(styles.innerRadius, '0px', label + ': no nested rounded box');
    assert.notEqual(styles.summaryBorderBottom, '0px', label + ': header divider');
    if (width === 390) {
      fs.mkdirSync(path.resolve('test-results/mobile-layout'), {recursive: true});
      await page.screenshot({path: path.resolve('test-results/mobile-layout', 'timing-' + language + '-' + width + '.png')});
    }

    assert.equal(await page.locator('.timing-presets').isVisible(), false, label + ': no phone presets');
    await page.locator('#timingExtras > summary').click();
    assert.equal(await page.locator('[data-speed="0.5"]').isVisible(), true, label + ': slower option preserved');
    assert.equal(await page.locator('[data-speed="2"]').isVisible(), true, label + ': faster option preserved');
    assert.equal(await page.locator('[data-duration-preset]').first().isVisible(), false);

    await page.locator('#timingMode').selectOption('total');
    assert.equal((await page.locator('#timingMode option:checked').textContent()).trim(), language === 'ja' ? '1回分の長さ' : 'One-pass length');
    await page.locator('#globalDurationInput').fill('2.40');
    await page.locator('#applyDurationButton').click();
    assert.equal(await page.locator('.frame-duration-input').first().inputValue(), '2400');
    assert.equal((await page.locator('#totalDuration').textContent()).trim(), '2.4 s');
    await page.locator('#undoButton').count();

    await page.locator('#frameTools > summary').click();
    assert.equal(await page.locator('#addMoreButton').isVisible(), true, label + ': add more remains in Frame tools');
    await page.locator('#frameTools > summary').click();

    await page.locator('#mobileTabPreview').click();
    assert.equal(await page.locator('#addImagesPanel').isVisible(), false, label + ': image-add section hidden in Preview');
    const geometry = await page.evaluate(() => {
      const preview = document.querySelector('#previewStage').getBoundingClientRect();
      const transport = document.querySelector('.preview-transport').getBoundingClientRect();
      return {delta: transport.top - preview.bottom, width: transport.width};
    });
    assert.ok(geometry.delta >= -1 && geometry.delta <= 20, label + ': playback directly below preview ' + JSON.stringify(geometry));
    assert.equal(await page.locator('#previewPlayButton').isEnabled(), true);
    if (width === 390) {
      await page.screenshot({path: path.resolve('test-results/mobile-layout', 'preview-' + language + '-' + width + '.png')});
    }

    if (width === 390) {
      const second = await sampleImage(page, '#e77c36');
      await page.locator('#fileInput').setInputFiles([
        {name: 'frame-2.png', mimeType: 'image/png', buffer: second}
      ]);
      await page.waitForFunction(() => document.querySelector('#frameCount').textContent === '2');
      await page.locator('#timingMode').selectOption('frame');
      await page.locator('#globalDurationInput').fill('100');
      await page.locator('#applyDurationButton').click();
      await page.locator('#mobileTabPreview').click();
      await page.waitForFunction(() => {
        const canvas = document.querySelector('#previewCanvas');
        const pixel = canvas.getContext('2d').getImageData(canvas.width / 2, canvas.height / 2, 1, 1).data;
        return pixel[3] > 0;
      });
      await page.locator('#previewPlayButton').click();
      const blankSamples = await page.evaluate(() => new Promise(resolve => {
        const canvas = document.querySelector('#previewCanvas');
        const ctx = canvas.getContext('2d');
        let count = 0, blanks = 0;
        const inspect = () => {
          const rgba = ctx.getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1).data;
          if (rgba[3] === 0) blanks++;
          if (++count >= 24) resolve(blanks);
          else requestAnimationFrame(inspect);
        };
        requestAnimationFrame(inspect);
      }));
      assert.equal(blankSamples, 0, label + ': preview should not flash blank while playing');
      await page.locator('#previewPlayButton').click();

      // A detailed source image must be decoded from the original file, not
      // from the tiny thumbnail made for the frame cards.
      const highDetail = await page.evaluate(() => {
        const c = document.createElement('canvas');
        c.width = 1080;
        c.height = 2244;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 1080, 2244);
        ctx.fillStyle = '#0b251e';
        for (let y = 12; y < 2244; y += 12) ctx.fillRect(0, y, 1080, 3);
        ctx.font = 'bold 48px sans-serif';
        ctx.fillText('Preview source detail', 50, 180);
        return c.toDataURL('image/png').split(',')[1];
      });
      const bitmapCalls = await page.evaluate(() => {
        const calls = [];
        const original = createImageBitmap;
        window.createImageBitmap = function(...args) {
          if (args[0] instanceof File && args[0].name === 'detailed-source.png') {
            calls.push({width: args[1]?.resizeWidth || 0, height: args[1]?.resizeHeight || 0});
          }
          return original.apply(this, args);
        };
        window.__previewSourceCalls = calls;
        return true;
      });
      assert.equal(bitmapCalls, true);
      await page.locator('#fileInput').setInputFiles([
        {name: 'detailed-source.png', mimeType: 'image/png', buffer: Buffer.from(highDetail, 'base64')}
      ]);
      await page.waitForFunction(() => document.querySelector('#frameCount').textContent === '3');
      await page.locator('#mobileTabPreview').click();
      await page.locator('#previewNextButton').click();
      await page.locator('#previewNextButton').click();
      await page.waitForFunction(() => window.__previewSourceCalls.some(call => call.height >= 1000));
      assert.ok((await page.evaluate(() => window.__previewSourceCalls)).some(call => call.height >= 1000),
        label + ': preview decodes high-quality source rather than thumbnail');

      // The fixed bottom navigation must never cover the last image controls.
      await page.locator('#mobileTabFrames').click();
      assert.equal(await page.locator('#addImagesPanel').isVisible(), true, label + ': image-add section restored in Frames');
      await page.evaluate(() => scrollTo({top: document.documentElement.scrollHeight, behavior: 'instant'}));
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const dockCheck = await page.evaluate(() => {
        const last = document.querySelector('#frameGrid .frame-card:last-child').getBoundingClientRect();
        const bottomBar = document.querySelector('#mobileWorkflowNav').getBoundingClientRect();
        return {lastBottom:last.bottom, dockTop:bottomBar.top, lastTop:last.top};
      });
      assert.ok(dockCheck.lastBottom <= dockCheck.dockTop - 8, label + ': last frame clear of dock ' + JSON.stringify(dockCheck));
      await page.screenshot({path: path.resolve('test-results/mobile-layout', 'frames-bottom-' + language + '.png')});

      await page.locator('#mobileTabExport').click();
      assert.equal(await page.locator('#addImagesPanel').isVisible(), false, label + ': image-add section hidden in Export');
      await page.locator('#exportWebpTab').click();
      assert.equal(await page.locator('#webpQuality').inputValue(), '80', label + ': quality default');
      assert.equal(await page.locator('#webpQualityRange').inputValue(), '80', label + ': slider matches default');
      await page.locator('#webpQualityRange').evaluate(el => {
        el.value = '65';
        el.dispatchEvent(new Event('input', {bubbles:true}));
      });
      assert.equal(await page.locator('#webpQuality').inputValue(), '65', label + ': slider updates number');
      await page.locator('#webpQuality').fill('73');
      await page.locator('#webpQuality').dispatchEvent('change');
      assert.equal(await page.locator('#webpQualityRange').inputValue(), '73', label + ': number updates slider');
      assert.equal(await page.locator('#webpEffort').inputValue(), '4', label + ': method default');
      assert.equal(await page.locator('#webpEffort option').count(), 7, label + ': retain methods 0 to 6');
      assert.equal((await page.locator('#webpEffort option[value="3"]').textContent()).trim(), language === 'ja' ? '3 · やや速め' : '3 · Moderate');
      assert.equal((await page.locator('#webpQualityLabel').textContent()).trim(), language === 'ja' ? '画質' : 'Quality');
      await page.locator('#webpLossless').check();
      assert.equal((await page.locator('#webpQualityLabel').textContent()).trim(), language === 'ja' ? '圧縮の強さ' : 'Compression level');
      await page.locator('#webpLossless').uncheck();
      assert.equal((await page.locator('#webpQualityLabel').textContent()).trim(), language === 'ja' ? '画質' : 'Quality');
      assert.equal(await page.locator('#webpQuality').inputValue(), '73', label + ': quality remains 73 after toggles');
      assert.ok(await page.evaluate(() => document.querySelector('#webpExportPanel').scrollWidth <= document.querySelector('#webpExportPanel').clientWidth + 1), label + ': WebP no overflow');
      await page.screenshot({path: path.resolve('test-results/mobile-layout', 'webp-options-' + language + '.png')});
      await page.evaluate(() => scrollTo({top: document.documentElement.scrollHeight, behavior: 'instant'}));
      const exportDock = await page.evaluate(() => {
        const save = document.querySelector('#createGifButton').getBoundingClientRect();
        const dock = document.querySelector('#mobileWorkflowNav').getBoundingClientRect();
        return {buttonBottom:save.bottom, dockTop:dock.top};
      });
      assert.ok(exportDock.buttonBottom < exportDock.dockTop, label + ': GIF export control clear of dock ' + JSON.stringify(exportDock));
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, label + ': no horizontal overflow');
    assert.deepEqual(errors, [], label + ': no console/page errors');
    assert.deepEqual(requests, [], label + ': no external requests');
    console.log('PASS ' + label);
  } finally {
    await context.close();
  }
}

(async () => {
  const browser = await chromium.launch();
  try {
    for (const lang of ['ja', 'en']) {
      for (const [width, height] of [[320, 568], [360, 640], [390, 844]]) {
        await runCase(browser, lang, width, height);
      }
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
