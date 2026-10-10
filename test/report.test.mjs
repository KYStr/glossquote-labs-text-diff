import test from 'node:test';
import assert from 'node:assert/strict';
import { makeReport } from '../public/js/core/report.mjs';
const operation = (kind, text) => ({ kind, text, oldLine: null, newLine: null });

test('DF-16 exact readable report, prefixes and no automatic final LF', () => {
  const operations = [operation('equal', 'A'), operation('delete', 'B'), operation('insert', 'C')];
  assert.equal(new TextDecoder().decode(makeReport(operations).value), '  A\n- B\n+ C');
  assert.equal(new TextDecoder().decode(makeReport([operation('insert', '')]).value), '+ ');
  assert.deepEqual(makeReport([]).value, new Uint8Array());
  assert.equal(new TextDecoder().decode(makeReport([operation('equal', '繁😀\t  ')]).value), '  繁😀\t  ');
});
test('exact 524288-byte report gate and one-byte overflow', () => {
  const operations = Array.from({ length: 64 }, () => operation('equal', 'a'.repeat(8192)));
  operations.push(operation('insert', ''));
  operations[0].text = 'a'.repeat(8192 - 194);
  assert.equal(makeReport(operations).value.length, 524288);
  operations[0].text += 'a';
  assert.deepEqual(makeReport(operations), { ok: false, error: { code: 'OUTPUT_TOO_LARGE', side: null } });
});
test('report rejects non-schema text/kinds without returning input', () => {
  for (const operations of [null, [operation('__proto__', 'FAKE')], [operation('equal', '\ud800')], [operation('delete', 'A\nB')], [operation('equal', 'a'.repeat(8193))], Array(2001).fill(operation('insert', ''))]) assert.deepEqual(makeReport(operations), { ok: false, error: { code: 'INVALID_INPUT', side: null } });
});
