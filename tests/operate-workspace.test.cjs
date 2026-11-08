'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync('src/index.template.html','utf8');

test('task-first workspace gates empty stages in both layouts', () => {
  assert.match(source,/const showEntry = !hasFrames;/);
  assert.match(source,/dataset\.workspace = hasFrames \? 'ready' : 'empty'/);
  assert.match(source,/const active = hasFrames && \(!isMobile \|\| page\.dataset\.mobilePage === state\.ui\.mobilePage\)/);
  assert.match(source,/\.main\[data-workspace="ready"\]\{display:grid/);
  assert.match(source,/#mobilePagePreview \.preview-layout\{grid-template-columns:minmax\(0,1fr\)\}/);
  assert.match(source,/const destination = state\.frames\.length/);
  assert.match(source,/destination\.insertBefore\(importReport, destination\.firstChild\)/);
});

test('Operate accessibility and restrained presentation remain explicit', () => {
  assert.ok(source.includes('connect-src \'none\''));
  assert.match(source,/dialog::backdrop\{background:rgba\(18,20,18,\.35\);backdrop-filter:none\}/);
  assert.match(source,/\.dialog-body p,\.dialog-body li\{font-size:14px;line-height:1\.7\}/);
  assert.match(source,/\.mobile-workflow-tab\[aria-selected="true"\]\{border:0;background:var\(--accent-soft\);color:var\(--accent\)\}/);
  assert.ok(source.includes('env(safe-area-inset-bottom)'));
  assert.ok(source.includes('aria-live="polite"'));
  assert.ok(source.includes('id="appConfirmDialog"'));
  assert.ok(source.includes('id="saveGifMobileButton"'));
  assert.ok(source.includes('id="saveWebpMobileButton"'));
});


test('preview transport is in the same player as the canvas, ahead of settings', () => {
  const preview = source.slice(source.indexOf('<div class="preview-layout">'),
    source.indexOf('<div id="mobilePageExport"'));
  const stage = preview.indexOf('id="previewStage"');
  const progress = preview.indexOf('id="previewProgress"');
  const transport = preview.indexOf('class="preview-transport"');
  const settings = preview.indexOf('class="preview-side"');
  assert.ok(stage >= 0 && stage < progress && progress < transport && transport < settings,
    'preview stage -> timeline -> transport must precede output settings in DOM order');
  assert.ok(preview.indexOf('class="preview-player"') < stage);
  assert.match(preview, /id="previewProgress" data-i18n-aria-label="previewTimeLabel"/);
  assert.match(source, /\.preview-controls\{display:grid;gap:8px/);
});

test('Impeccable findings do not regress: images, dialog insets, type scale and placeholder copy', () => {
  const sourceImages = source.match(/<img[^>]*>/g) || [];
  assert.ok(sourceImages.length > 0);
  assert.ok(sourceImages.every(tag => tag.includes('src=')), 'never declare a broken empty-source image');
  assert.ok(source.includes("renderEncodedPreview('#gifResultPreview', 'gifResultImage'"));
  assert.ok(source.includes("renderEncodedPreview('#webpResultPreview', 'webpResultImage'"));
  assert.ok(source.includes('max-height:min(82vh,720px);padding:10px'), 'dialog content has a real inset');
  assert.ok(source.includes('.dialog-head h2{margin:0;font-size:22px'));
  assert.ok(source.includes('.panel-head h3{font-size:18px'));
  assert.ok(!source.includes('—'), 'use meaningful localizable missing-value text, not dash placeholders');
});
