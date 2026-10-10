import test from 'node:test';
import assert from 'node:assert/strict';
import { compareText, diffLines, pageOperations } from '../public/js/core/diff.mjs';
const op = (kind, text, oldLine, newLine) => ({ kind, text, oldLine, newLine });

test('DF-01..10 exact operations, counts, stable deletion tie-break', () => {
  const fixtures = [
    ['', '', []], ['A\nB', 'A\nB', [op('equal', 'A', 1, 1), op('equal', 'B', 2, 2)]],
    ['', 'A', [op('insert', 'A', null, 1)]], ['A', '', [op('delete', 'A', 1, null)]],
    ['A', 'B', [op('delete', 'A', 1, null), op('insert', 'B', null, 1)]],
    ['A\r\nB\rC', 'A\nB\nC', [op('equal', 'A', 1, 1), op('equal', 'B', 2, 2), op('equal', 'C', 3, 3)]],
    ['A', 'A\n', [op('equal', 'A', 1, 1), op('insert', '', null, 2)]],
    ['', '\n', [op('insert', '', null, 1), op('insert', '', null, 2)]],
    ['A\nB', 'B\nA', [op('delete', 'A', 1, null), op('equal', 'B', 2, 1), op('insert', 'A', null, 2)]],
    ['A ', 'A', [op('delete', 'A ', 1, null), op('insert', 'A', null, 1)]],
    ['A', 'a', [op('delete', 'A', 1, null), op('insert', 'a', null, 1)]]
  ];
  for (const [left, right, expected] of fixtures) {
    const result = compareText(left, right); assert.equal(result.ok, true);
    assert.deepEqual(result.value.operations, expected);
    assert.deepEqual(result.value.counts, { equal: expected.filter(x => x.kind === 'equal').length, deleted: expected.filter(x => x.kind === 'delete').length, inserted: expected.filter(x => x.kind === 'insert').length });
  }
});
test('side-specific rejection and bounded allocation before diff', () => {
  assert.deepEqual(compareText('\ud800', 'A'), { ok: false, error: { code: 'INVALID_UNICODE', side: 'left' } });
  assert.equal(compareText('A', '\udc00').error.side, 'right');
  assert.equal(diffLines(Array(1001).fill('A'), []).error.code, 'LINE_LIMIT');
  assert.equal(diffLines(['A'.repeat(8193)], []).error.code, 'LINE_TOO_LONG');
  assert.equal(diffLines([null], []).error.code, 'INVALID_INPUT');
  const result = compareText(Array(1000).fill('A').join('\n'), Array(1000).fill('B').join('\n'));
  assert.equal(result.value.operations.length, 2000);
  assert.deepEqual(result.value.counts, { equal: 0, deleted: 1000, inserted: 1000 });
});
test('DF-17 exhaustive reconstruction and independent recursive LCS for 961 pairs', () => {
  const all = [[]];
  for (let length = 1; length <= 4; length++) for (let bits = 0; bits < 2 ** length; bits++) all.push(Array.from({ length }, (_, i) => bits & (1 << i) ? 'B' : 'A'));
  const lcs = (a, b) => !a.length || !b.length ? 0 : a[0] === b[0] ? 1 + lcs(a.slice(1), b.slice(1)) : Math.max(lcs(a.slice(1), b), lcs(a, b.slice(1)));
  for (const left of all) for (const right of all) {
    const before = [left.slice(), right.slice()]; const result = diffLines(left, right).value;
    assert.deepEqual(result.operations.filter(x => x.kind !== 'insert').map(x => x.text), left);
    assert.deepEqual(result.operations.filter(x => x.kind !== 'delete').map(x => x.text), right);
    assert.equal(result.counts.equal, lcs(left, right)); assert.ok(result.operations.length <= left.length + right.length);
    assert.deepEqual([left, right], before);
  }
});
test('prototype-looking lines stay data in the Map interner', () => {
  const result = compareText('__proto__\nconstructor', 'constructor\n__proto__');
  assert.equal(result.ok, true); assert.equal(result.value.counts.equal, 1);
});

test('DF-15 fixed 100-row pagination never drops or duplicates operations', () => {
  const operations = Array.from({ length: 201 }, (_, i) => op('insert', `${i}`, null, i + 1));
  const pages = [0, 1, 2].map(i => pageOperations(operations, i).value);
  assert.deepEqual(pages.map(page => page.length), [100, 100, 1]);
  assert.deepEqual(pages.flat(), operations);
  for (const page of [-1, 0.5, 3, NaN]) assert.equal(pageOperations(operations, page).error.code, 'INVALID_PAGE');
  assert.deepEqual(pageOperations([], 0), { ok: true, value: [] });
  assert.equal(pageOperations([], 1).error.code, 'INVALID_PAGE');
});
