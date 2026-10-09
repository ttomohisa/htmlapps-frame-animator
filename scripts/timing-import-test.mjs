import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const html = readFileSync(process.env.FRAME_TEST_HTML || 'src/index.template.html', 'utf8');
function code(name) {
  return html.match(new RegExp(`^      (?:async )?function ${name}\\([\\s\\S]*?^      }`, 'm'))?.[0] || '';
}
function harness() {
  const state = {
    frames: [], framePool: new Map(), generation: 0, importBusy: false, failures: [],
    undoStack: [], redoStack: [], preview: { playing: false }, ui: {}
  };
  const effects = { invalidations: 0, renders: 0, renderBusy: [] };
  const context = vm.createContext({
    state, effects, File, Uint8Array, URL, setTimeout, console,
    LIMITS: { frames: 200, perFileBytes: 50 * 1024 ** 2, totalBytes: 500 * 1024 ** 2, pixels: 50000000 },
    DEFAULT_FRAME_DURATION: 500, MIN_FRAME_DURATION: 20, MAX_FRAME_DURATION: 10000, FRAME_DURATION_STEP: 10,
    isBusy: () => state.importBusy, totalSourceBytes: () => 0, updateBusy: () => {},
    t: key => key, AppToast: { show() {} }, makeId: (() => { let id = 0; return () => `frame-${++id}`; })(),
    decodeImage: async () => ({ width: 64, height: 48, close() {} }),
    makeThumbnail: async () => ({ blob: new Blob(), url: 'blob:fixture' }),
    render: () => { effects.renders++; effects.renderBusy.push(state.importBusy); }, fileInput: { value: '' }, releaseFrame() {},
    recordHistory: () => {}, invalidateAnimationResults: () => effects.invalidations++,
    pausePreview() {}, playPreview() {}, showUndoToast() {},
    pushHistory: entry => { state.undoStack.push(entry); state.redoStack = []; },
    $: () => ({ textContent: '' })
  });
  for (const name of ['isSupportedFile', 'isAnimatedWebP', 'isAnimatedPNG', 'failure', 'importFiles',
    'normalizeDuration', 'timingSnapshot', 'sameTiming', 'recordTimingHistory', 'applyTimingSnapshot',
    'applyHistorySide', 'undoHistory', 'redoHistory', 'scaleFrameDurations']) {
    const source = code(name);
    if (source) vm.runInContext(source, context);
  }
  return context;
}
function chunk(type, data = Buffer.alloc(0)) {
  const size = Buffer.alloc(4); size.writeUInt32BE(data.length);
  return Buffer.concat([size, Buffer.from(type), data, Buffer.alloc(4)]);
}
const pngSignature = Buffer.from([137,80,78,71,13,10,26,10]);
function apng(padding = 0) {
  return new File([pngSignature, chunk('IHDR', Buffer.alloc(13)), ...(padding ? [chunk('tEXt', Buffer.alloc(padding))] : []), chunk('acTL', Buffer.alloc(8)), chunk('IDAT'), chunk('IEND')], 'animated.png', { type: 'image/png' });
}
function renamedAnimatedWebp() {
  const bytes = Buffer.alloc(30); bytes.write('RIFF'); bytes.writeUInt32LE(22, 4); bytes.write('WEBPVP8X', 8); bytes.writeUInt32LE(10, 16); bytes[20] = 2;
  return new File([bytes], 'renamed.png', { type: 'image/png' });
}
function staticPng() { return new File([pngSignature, chunk('IHDR', Buffer.alloc(13)), chunk('IDAT'), chunk('IEND')], 'still.png', { type: 'image/png' }); }

test('animated inputs are rejected without losing the valid batch member', async () => {
  const c = harness();
  await c.importFiles([apng(), renamedAnimatedWebp(), staticPng()]);
  assert.equal(c.state.frames.length, 1, 'APNG and renamed Animated WebP must not flatten into still frames');
  assert.equal(c.state.frames[0].file.name, 'still.png');
  assert.deepEqual(Array.from(c.state.failures, f => f.reason), ['reasonAnimatedPng', 'reasonAnimated']);
});
test('PNG animation detection walks metadata beyond a small header prefix', async () => {
  const c = harness(); await c.importFiles([apng(70000)]);
  assert.equal(c.state.frames.length, 0);
  assert.equal(c.state.failures[0].reason, 'reasonAnimatedPng');
});
test('an invalid-only addition preserves the existing sequence and timing', async () => {
  const c = harness(); const frame = { id: 'old', duration: 370, file: staticPng() }; c.state.frames.push(frame);
  await c.importFiles([apng()]); assert.equal(c.state.frames.length, 1); assert.equal(c.state.frames[0], frame); assert.equal(frame.duration, 370);
});
test('speed buttons scale mixed timing with normalization and one undoable action', () => {
  const c = harness();
  c.state.frames = [20, 30, 100, 250, 9990, 10000].map((duration, i) => ({ id: String(i), duration }));
  for (const frame of c.state.frames) c.state.framePool.set(frame.id, frame);
  assert.equal(typeof c.scaleFrameDurations, 'function', 'Mixed-duration speed action is missing');
  c.scaleFrameDurations(2);
  assert.deepEqual(Array.from(c.state.frames, f => f.duration), [20, 20, 50, 130, 5000, 5000]);
  assert.equal(c.state.undoStack.length, 1); assert.equal(c.effects.invalidations, 1);
  c.undoHistory(); assert.deepEqual(Array.from(c.state.frames, f => f.duration), [20, 30, 100, 250, 9990, 10000]);
  c.redoHistory(); assert.deepEqual(Array.from(c.state.frames, f => f.duration), [20, 20, 50, 130, 5000, 5000]);
  c.scaleFrameDurations(0.5); assert.deepEqual(Array.from(c.state.frames, f => f.duration), [40, 40, 100, 260, 10000, 10000]);
});
test('speed actions do not mutate when busy, empty, invalid or already at the limit', () => {
  const c = harness(); assert.equal(typeof c.scaleFrameDurations, 'function');
  c.scaleFrameDurations(2); assert.equal(c.state.undoStack.length, 0);
  c.state.frames = [{ id: 'a', duration: 20 }]; c.state.importBusy = true; c.scaleFrameDurations(0.5); assert.equal(c.state.frames[0].duration, 20);
  c.state.importBusy = false; for (const speed of [0, NaN, -1, Infinity, 3, 2]) c.scaleFrameDurations(speed);
  assert.equal(c.state.frames[0].duration, 20); assert.equal(c.state.undoStack.length, 0);
});
test('language switch has a destination tooltip in the active language', () => {
  assert.match(code('applyLanguage'), /setAttribute\('title'/);
});


test('truncated PNG metadata fails safely and a valid still PNG remains accepted', async () => {
  const c = harness(); const oversized = Buffer.alloc(8); oversized.writeUInt32BE(1000); oversized.write('tEXt', 4);
  await c.importFiles([new File([pngSignature, oversized, Buffer.alloc(4)], 'truncated.png', { type: 'image/png' }), staticPng()]);
  assert.equal(c.state.frames.length, 1); assert.equal(c.state.failures[0].reason, 'reasonDecode');
});
test('still WebP with an animation-looking filename remains a supported static input', async () => {
  const c = harness(); const bytes = Buffer.alloc(30); bytes.write('RIFF'); bytes.writeUInt32LE(22, 4); bytes.write('WEBPVP8X', 8); bytes.writeUInt32LE(10, 16);
  await c.importFiles([new File([bytes], 'animation.webp', { type: 'image/webp' })]);
  assert.equal(c.state.frames.length, 1); assert.equal(c.state.failures.length, 0);
});


test('completed import renders ready controls', async () => {
  const c = harness(); await c.importFiles([staticPng(), apng()]);
  assert.deepEqual(Array.from(c.effects.renderBusy), [false], 'Completed render must run after leaving import-busy state');
});
test('partial failure records the actual accepted count', async () => {
  const c = harness(); await c.importFiles([staticPng(), apng()]);
  assert.equal(c.state.importAddedCount, 1, 'Partial failure report must retain the accepted count');
  await c.importFiles([apng()]); assert.equal(c.state.importAddedCount, 0);
});
