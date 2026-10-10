const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(process.env.APP_SOURCE || path.join(__dirname, '../src/index.template.html'), 'utf8');
const css = source.match(/<style>([\s\S]*?)<\/style>/)[1];
function rulesFor(selector) {
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(match => match[1].split(',').some(value => value.trim() === selector))
    .map(match => match[2]).join(';');
}
test('Help and confirmation modals lock both page scroll containers', () => {
  for (const selector of ['html:has(dialog:modal)', 'body:has(dialog:modal)'])
    assert.match(rulesFor(selector), /overflow:hidden/, selector);
});
test('Existing flex shell and independently scrollable body remain intact', () => {
  assert.match(rulesFor('.dialog-shell'), /display:flex/);
  assert.match(rulesFor('.dialog-shell'), /flex-direction:column/);
  assert.match(rulesFor('.dialog-body'), /overflow:auto/);
  assert.match(rulesFor('.dialog-body'), /overscroll-behavior:contain/);
  assert.match(rulesFor('dialog'), /max-height:[^;]*100dvh/);
});
