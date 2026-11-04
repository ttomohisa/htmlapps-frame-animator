'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('src/index.template.html', 'utf8');

test('mobile controls, preview transport, and Help have the v1.0.5 structure', () => {
  for (const marker of ['id="timingMode"', 'id="timingDisclosure"', 'id="timingExtras"', 'id="frameTools"', 'id="timingError"']) {
    assert.ok(source.includes(marker), marker);
  }
  assert.ok(source.includes('.preview-side{display:contents}'));
  assert.ok(source.includes('.preview-transport{order:1'));
  assert.ok(source.includes("setMobilePage('frames', { scroll: true })"));
  assert.ok(!source.includes('scrollToFrameImages'));
  assert.ok(source.includes("$('#addImagesPanel').hidden = isMobile && hasFrames && state.ui.mobilePage !== 'frames'"));
  assert.ok(source.includes('id="webpQualityRange"'));
  assert.ok(source.includes('webpQualityRange.addEventListener'));
  assert.ok(source.includes("webpEffort3:'3 · ふつう'"));
  assert.ok(!source.includes('id="helpOkButton"'));
  assert.ok(!source.includes('data-i18n="previewNote"'));
  assert.ok(source.includes('data-i18n="gifDitherHelp"'));
  assert.ok(source.includes('#mobilePageFrames{min-height:calc(100dvh'));
  assert.ok(source.includes('.timing-disclosure[open]>summary{border-bottom:1px solid var(--line)}'));
  assert.ok(source.includes('.timing-presets{display:none}'));
  assert.ok(!source.includes('.frame-tools #addMoreButton{display:none}'));
});

test('preview switches images only after the next image is ready', () => {
  const start = source.indexOf('async function renderNormalizedFrame(');
  const end = source.indexOf('async function renderSourceFrameImageData(', start);
  assert.ok(start >= 0 && end > start);
  const body = source.slice(start, end);
  const decoded = body.indexOf('await decodePreviewFrame(frame)');
  const visibleClear = body.indexOf('context.clearRect');
  assert.ok(decoded >= 0 && visibleClear > decoded, 'the visible preview must not be cleared before decoding');
  assert.ok(body.includes('context.drawImage(previewBuffer, 0, 0)'));
  assert.ok(body.includes('previewBuffer.getContext'));
  assert.ok(body.includes('bufferContext.clearRect'));
  assert.ok(source.includes('createImageBitmap(frame.file, options)'));
  assert.ok(source.includes('PREVIEW_DECODE_MAX_EDGE = 1600'));
  assert.ok(!source.includes('frame.thumbnailBlob || frame.file'));
  assert.ok(source.includes('webp-encoding-options'));
  assert.ok(source.includes('refreshWebpQualityCopy()'));
  assert.ok(source.includes("webpEffort6:'6 · 最も丁寧'"));
  assert.ok(source.includes('clearPreviewDecodeCache()'));
  assert.ok(body.includes('token !== state.canvas.renderToken'));
});

function runTotal(target, durations, order = 'forward') {
  const frames = durations.map((duration, index) => ({ id: String(index), duration }));
  const histories = [];
  const state = { frames, preview: { playing: false } };
  const sequence = () => order === 'pingpong' && frames.length > 2
    ? frames.concat(frames.slice(1, -1).reverse()) : frames;
  const timingError = { textContent: '', hidden: true };
  const globalDurationInput = { value: '', min: '', max: '', step: '', inputMode: '', setAttribute() {} };
  const context = {
    state, timingError, globalDurationInput, timingMode: { value: 'total' },
    globalDurationUnit: { textContent: '' }, document: { activeElement: null },
    MIN_FRAME_DURATION: 20, MAX_FRAME_DURATION: 10000, FRAME_DURATION_STEP: 10,
    DEFAULT_FRAME_DURATION: 500,
    playbackSequence: sequence, totalDurationMs: () => sequence().reduce((sum, f) => sum + f.duration, 0),
    isBusy: () => false, t: (key, vars = {}) => key === 'timingTotalRange' ? vars.min + '-' + vars.max : key,
    timingSnapshot: () => frames.map(f => ({ id: f.id, duration: f.duration })),
    recordTimingHistory: (before, after, label) => { histories.push({ before, after, label }); return true; },
    render() {}, showUndoToast() {}, playPreview() {}
  };
  const begin = source.indexOf('function setTimingError(');
  const end = source.indexOf('function applyGlobalTiming(', begin);
  assert.ok(begin >= 0 && end > begin, 'total-duration helpers must exist');
  vm.runInNewContext(source.slice(begin, end), context);
  context.applyTotalDuration(String(target));
  return { durations: frames.map(f => f.duration), totalMs: context.totalDurationMs(), error: timingError.textContent, histories };
}

test('total duration preserves relative timings and adds one Undo entry', () => {
  const result = runTotal(3.6, [300, 600, 900]);
  assert.equal(result.totalMs, 3600);
  assert.deepEqual(result.durations, [600, 1200, 1800]);
  assert.equal(result.histories.length, 1);
  assert.equal(result.histories[0].label, 'total-duration');
});

test('ping-pong counts interior frames twice while keeping 10 ms steps', () => {
  const result = runTotal(3.33, [300, 500, 700], 'pingpong');
  assert.equal(result.totalMs, 3330);
  for (const ms of result.durations) assert.ok(ms >= 20 && ms <= 10000 && ms % 10 === 0);
});

test('total length rejects out-of-range values without mutating frames', () => {
  const invalid = runTotal(0.07, [500, 500, 500], 'pingpong');
  assert.deepEqual(invalid.durations, [500, 500, 500]);
  assert.notEqual(invalid.error, '');
  assert.equal(invalid.histories.length, 0);
  const min = runTotal(0.08, [500, 500, 500], 'pingpong');
  assert.equal(min.totalMs, 80);
  const max = runTotal(40, [500, 500, 500], 'pingpong');
  assert.equal(max.totalMs, 40000);
});
