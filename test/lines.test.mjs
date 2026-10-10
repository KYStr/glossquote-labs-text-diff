import test from 'node:test';
import assert from 'node:assert/strict';
import { splitLines } from '../public/js/core/lines.mjs';

test('DF-01/06/07/08 normalization preserves final empty lines and other characters', () => {
  for (const [source, expected] of [['', []], ['\n', ['', '']], ['A\n', ['A', '']], ['A\r\nB\rC', ['A', 'B', 'C']], [' A\t \nＡ', [' A\t ', 'Ａ']]]) assert.deepEqual(splitLines(source), { ok: true, value: expected });
});
test('DF-11/12 exact line count and line length boundaries', () => {
  assert.equal(splitLines(Array(1000).fill('A').join('\n')).ok, true);
  assert.equal(splitLines(Array(1001).fill('A').join('\n')).error.code, 'LINE_LIMIT');
  assert.equal(splitLines('A'.repeat(8192)).ok, true);
  assert.equal(splitLines('A'.repeat(8193)).error.code, 'LINE_TOO_LONG');
});
test('DF-13 raw UTF-8/UTF-16 bounds checked before normalization', () => {
  const lines = Array(16).fill('a'.repeat(8191));
  assert.equal(splitLines(lines.join('\n')).ok, true);
  lines[0] += 'a'; assert.equal(splitLines(lines.join('\n')).ok, true);
  lines[1] += 'a'; assert.equal(splitLines(lines.join('\n')).error.code, 'INPUT_TOO_LARGE');
  assert.equal(splitLines('a'.repeat(131073)).error.code, 'INPUT_TOO_LARGE');
  assert.equal(splitLines(Array(6).fill('繁'.repeat(8192)).join('\n')).error.code, 'INPUT_TOO_LARGE');
  assert.equal(splitLines('\r\n'.repeat(65537)).error.code, 'INPUT_TOO_LARGE');
});
test('DF-14 paired Unicode, invalid Unicode and primitive type gate', () => {
  assert.equal(splitLines('😀').ok, true);
  for (const source of ['\ud800', '\udc00', 'A\ud800B']) assert.equal(splitLines(source).error.code, 'INVALID_UNICODE');
  for (const source of [null, 12, {}, new String('A')]) assert.equal(splitLines(source).error.code, 'INVALID_INPUT');
});
