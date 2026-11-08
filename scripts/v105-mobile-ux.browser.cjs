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
    assert.equal(await page.locator('#addImagesPanel').isVisible(), true, label + ': entry picker visible before images');
    assert.equal(await page.locator('.page-intro').isVisible(), true, label + ': intro visible before images');
    assert.equal(await page.locator('.local-badge').isVisible(), false, label + ': local processing badge hidden on phones');

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
    assert.equal(await page.locator('#addImagesPanel').isVisible(), false, label + ': first import hides large add panel');
    assert.equal(await page.locator('.page-intro').isVisible(), false, label + ': first import hides intro');
    assert.equal(await page.locator('#quickAddButton').isVisible(), true, label + ': re-add button inside Frames');
    assert.ok((await page.evaluate(() => scrollY)) <= 2, label + ': first import starts at document top');
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
    assert.equal(await page.locator('#quickAddButton').isVisible(), false, label + ': quick add hidden in Preview');
    const geometry = await page.evaluate(() => {
      const preview = document.querySelector('#previewStage').getBoundingClientRect();
      const timeline = document.querySelector('#previewProgress').getBoundingClientRect();
      const transportNode = document.querySelector('.preview-transport');
      const transport = transportNode.getBoundingClientRect();
      return {timelineGap: timeline.top - preview.bottom, transportGap: transport.top - timeline.bottom,
        width: transport.width, group: document.querySelector('.preview-player')?.contains(transportNode)};
    });
    assert.ok(geometry.group && geometry.timelineGap >= 0 && geometry.timelineGap <= 12
      && geometry.transportGap >= 0 && geometry.transportGap <= 12,
      label + ': timeline and playback must directly follow preview ' + JSON.stringify(geometry));
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
      assert.equal(await page.locator('#addImagesPanel').isVisible(), false, label + ': large import panel stays collapsed');
      assert.equal(await page.locator('#quickAddButton').isVisible(), true, label + ': quick add remains accessible');
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
      assert.equal(await page.locator('#quickAddButton').isVisible(), false, label + ': quick add hidden in Export');
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
      assert.equal((await page.locator('#webpEffort option[value="3"]').textContent()).trim(), language === 'ja' ? '3 · やや速い' : '3 · Moderate');
      const qualityLabel = (await page.locator('#webpQualityLabel').textContent()).trim();
      const qualityHelp = (await page.locator('#webpQualityHelp').textContent()).trim();
      assert.equal(qualityLabel, language === 'ja' ? '画質' : 'Quality');
      assert.equal(qualityHelp, language === 'ja'
        ? '通常は画質、劣化なしでは圧縮を調整します。'
        : 'Adjusts image quality normally, or compression in lossless mode.');
      await page.locator('#webpLossless').check();
      assert.equal((await page.locator('#webpQualityLabel').textContent()).trim(), qualityLabel,
        label + ': label stays unchanged when lossless is enabled');
      assert.equal((await page.locator('#webpQualityHelp').textContent()).trim(), qualityHelp,
        label + ': help stays unchanged when lossless is enabled');
      await page.locator('#webpLossless').uncheck();
      assert.equal((await page.locator('#webpQualityLabel').textContent()).trim(), qualityLabel);
      assert.equal((await page.locator('#webpQualityHelp').textContent()).trim(), qualityHelp,
        label + ': help stays unchanged when lossless is disabled');
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

// Reproduce the reported failure: two frames chosen in the *first* picker
// on a fresh page, compared with the second picker in the same session.
async function runFirstBatchCase(browser, language, width, height) {
  const context = await browser.newContext({
    viewport: {width, height},
    locale: language === 'ja' ? 'ja-JP' : 'en-US',
    reducedMotion: 'no-preference'
  });
  const page = await context.newPage();
  const label = 'fresh-batch ' + language + ' ' + width + 'x' + height;
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  const checkPanel = async step => {
    const position = await page.evaluate(() => {
      const panel = document.querySelector('#mobilePageFrames > .panel');
      const header = document.querySelector('.app-header');
      return {
        gap: panel.getBoundingClientRect().top - header.getBoundingClientRect().bottom,
        scrollY: window.scrollY,
        count: document.querySelector('#frameCount').textContent
      };
    });
    assert.ok(position.gap >= 5 && position.gap <= 30,
      label + ' ' + step + ' must show the full Frames heading, got ' + JSON.stringify(position));
    return position;
  };
  try {
    await page.goto(pathToFileURL(path.resolve('dist/index.html')).href);
    const first = await sampleImage(page, '#16624f');
    const second = await sampleImage(page, '#7f81b6');
    // Choose from the actual button so the browser scrolls the original
    // picker into view before import (the Android-specific first-use path).
    const [initialChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.locator('#chooseButton').click()
    ]);
    await initialChooser.setFiles([
      {name:'initial-1.png', mimeType:'image/png', buffer:first},
      {name:'initial-2.png', mimeType:'image/png', buffer:second}
    ]);
    await page.waitForFunction(() => document.querySelector('#frameCount').textContent === '2');
    await page.waitForTimeout(520);
    const firstPosition = await checkPanel('first import');
    assert.ok(firstPosition.scrollY <= 2, label + ': first import lands at document top');
    assert.equal(await page.locator('.page-intro').isVisible(), false, label + ': intro removed from editing layout');
    assert.equal(await page.locator('#addImagesPanel').isVisible(), false, label + ': large add panel removed from editing layout');
    assert.equal(await page.locator('#quickAddButton').isVisible(), true, label + ': compact add button visible');

    // The address bar can change the visual viewport after the native picker.
    await page.setViewportSize({width, height:height - 30});
    await checkPanel('after viewport change');
    const third = await sampleImage(page, '#f6b447');
    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.locator('#quickAddButton').click()
    ]);
    await chooser.setFiles([{name:'subsequent-3.png', mimeType:'image/png', buffer:third}]);
    await page.waitForFunction(() => document.querySelector('#frameCount').textContent === '3');
    await page.waitForTimeout(550);
    const secondPosition = await checkPanel('second import');
    assert.equal(await page.locator('#quickAddButton').isVisible(), true, label + ': add remains usable after second import');
    assert.ok(Math.abs(firstPosition.gap - secondPosition.gap) <= 22,
      label + ': first and second picker alignment differ: ' + JSON.stringify({firstPosition,secondPosition}));
    if (width === 390) {
      fs.mkdirSync(path.resolve('test-results/mobile-layout'), {recursive:true});
      await page.screenshot({path:path.resolve('test-results/mobile-layout','fresh-batch-' + language + '.png')});
    }
    await page.locator('#frameTools > summary').click();
    await page.locator('#clearAllButton').click();
    await page.locator('#appConfirmDialog').waitFor({ state: 'visible' });
    await page.locator('#appConfirmOk').click();
    await page.waitForFunction(() => document.querySelector('#frameCount').textContent === '0');
    assert.equal(await page.locator('.page-intro').isVisible(), true, label + ': reset restores intro');
    assert.equal(await page.locator('#addImagesPanel').isVisible(), true, label + ': reset restores initial image picker');
    assert.deepEqual(pageErrors, [], label + ': no page errors');
    console.log('PASS ' + label);
  } finally { await context.close(); }
}

// The active Save action must appear beside Create after a real export.
// On phones the old Save control below the preview stays hidden.
async function runMobileSaveCase(browser, language) {
  const context = await browser.newContext({
    viewport: {width:390, height:844},
    locale: language === 'ja' ? 'ja-JP' : 'en-US',
    acceptDownloads: true,
    reducedMotion:'reduce'
  });
  const page = await context.newPage();
  const label = language + ' mobile export/save';
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(pathToFileURL(path.resolve('dist/index.html')).href);
    const first = await sampleImage(page, '#16624f');
    const second = await sampleImage(page, '#cba06a');
    await page.locator('#fileInput').setInputFiles([
      {name:'small-1.png',mimeType:'image/png',buffer:first},
      {name:'small-2.png',mimeType:'image/png',buffer:second}
    ]);
    await page.waitForFunction(() => document.querySelector('#frameCount').textContent === '2');
    await page.locator('#mobileTabExport').click();
    assert.equal(await page.locator('#saveGifMobileButton').isVisible(),false,label + ': Save hidden before GIF export');
    assert.equal(await page.locator('#saveWebpMobileButton').isVisible(),false,label + ': Save hidden before WebP export');
    assert.equal(await page.locator('#saveGifButton').isVisible(),false,label + ': old GIF Save is not shown on phones');
    await page.locator('#createGifButton').click();
    await page.locator('#gifResultCard').waitFor({state:'visible',timeout:60_000});
    await page.waitForFunction(() => document.querySelector('#saveGifButton')?.disabled === false);
    assert.equal(await page.locator('#saveGifMobileButton').isVisible(),false,label + ': do not place Save before the generated result');
    assert.equal(await page.locator('#saveGifButton').isVisible(),true,label + ': GIF Save stays alongside generated preview');
    const gifPosition = await page.evaluate(() => {
      const result = document.querySelector('#gifResultCard').getBoundingClientRect();
      const settings = document.querySelector('#gifExportPanel .gif-settings').getBoundingClientRect();
      const preview = document.querySelector('#gifResultPreview').getBoundingClientRect();
      const save = document.querySelector('#saveGifButton').getBoundingClientRect();
      const header = document.querySelector('.app-header').getBoundingClientRect();
      return {resultTop:result.top,settingsTop:settings.top,previewBottom:preview.bottom,
        saveTop:save.top,saveWidth:save.width,headerBottom:header.bottom};
    });
    assert.ok(gifPosition.resultTop < gifPosition.settingsTop &&
      gifPosition.saveTop >= gifPosition.previewBottom &&
      gifPosition.saveWidth >= 80,
      label + ': result then Save, ahead of encoder settings '+JSON.stringify(gifPosition));
    await page.screenshot({path:path.resolve('test-results/mobile-layout','review-gif-' + language + '.png')});
    const [gifDownload] = await Promise.all([
      page.waitForEvent('download'),page.locator('#saveGifButton').click()
    ]);
    assert.ok(gifDownload.suggestedFilename().endsWith('.gif'),label + ': GIF download works');
    await page.screenshot({path:path.resolve('test-results/mobile-layout','save-gif-' + language + '.png')});
    await page.locator('#gifDither').uncheck();
    assert.equal(await page.locator('#saveGifButton').isVisible(),false,label + ': stale GIF result hides Save');
    await page.locator('#exportWebpTab').click();
    await page.locator('#createWebpButton').click();
    await page.locator('#webpResultCard').waitFor({state:'visible',timeout:60_000});
    await page.waitForFunction(() => document.querySelector('#saveWebpButton')?.disabled === false);
    assert.equal(await page.locator('#saveWebpMobileButton').isVisible(),false,label + ': do not place WebP Save ahead of generated result');
    assert.equal(await page.locator('#saveWebpButton').isVisible(),true,label + ': WebP Save is beside result');
    const webpPosition = await page.evaluate(() => ({
      result:document.querySelector('#webpResultCard').getBoundingClientRect().top,
      settings:document.querySelector('#webpExportPanel .gif-settings').getBoundingClientRect().top
    }));
    assert.ok(webpPosition.result < webpPosition.settings,label+': WebP result precedes settings');
    const [webpDownload] = await Promise.all([
      page.waitForEvent('download'),page.locator('#saveWebpButton').click()
    ]);
    assert.ok(webpDownload.suggestedFilename().endsWith('.webp'),label + ': WebP download works');
    await page.screenshot({path:path.resolve('test-results/mobile-layout','save-webp-' + language + '.png')});
    await page.locator('#webpLossless').check();
    assert.equal(await page.locator('#saveWebpButton').isVisible(),false,label + ': WebP Save hides when result is stale');
    assert.deepEqual(errors,[],label + ': page errors');
    console.log('PASS '+label);
  } finally {await context.close();}
}

(async () => {
  const browser = await chromium.launch();
  try {
    for (const lang of ['ja', 'en']) {
      for (const [width, height] of [[320, 568], [360, 640], [390, 844]]) {
        await runCase(browser, lang, width, height);
      }
      for (const [width, height] of [[320, 568], [390, 844]]) {
        await runFirstBatchCase(browser, lang, width, height);
      }
      await runMobileSaveCase(browser, lang);
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
