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
