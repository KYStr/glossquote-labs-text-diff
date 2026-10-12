import test from 'node:test';
import assert from 'node:assert/strict';
import { indexChanges, locateChange } from '../public/js/core/changes.mjs';
import { compareText, pageOperations } from '../public/js/core/diff.mjs';
import { makeReport } from '../public/js/core/report.mjs';
import { messages, interpolate } from '../public/js/locales.mjs';

const operation = (kind, index) => ({ kind, oldLine: kind === 'insert' ? null : index + 1, newLine: kind === 'delete' ? null : index + 1, text: `line-${index + 1}` });
test('U03 zero groups for identical/empty input; replacement is one group', () => {
  for (const [left, right] of [['', ''], ['A\nB', 'A\nB']]) assert.deepEqual(indexChanges(compareText(left, right).value.operations), { ok: true, value: [] });
  const result = compareText('A\nB\nC', 'A\nX\nC').value;
  const groups = indexChanges(result.operations);
  assert.deepEqual(groups, { ok: true, value: [{ startIndex: 1, endIndex: 2 }] });
  assert.deepEqual(locateChange(groups.value, 0), { ok: true, value: { operationIndex: 1, pageIndex: 0 } });
  assert.deepEqual(result.counts, { equal: 2, deleted: 1, inserted: 1 });
  assert.equal(new TextDecoder().decode(makeReport(result.operations).value), '  A\n- B\n+ X\n  C');
});
test('U03 400 unique lines modified at 110 and 310 locate pages 2 and 4', () => {
  const left = Array.from({ length: 400 }, (_, i) => `line-${i + 1}`); const right = left.slice();
  right[109] = 'changed-110'; right[309] = 'changed-310';
  const result = compareText(left.join('\n'), right.join('\n')).value;
  const before = structuredClone(result.operations);
  const groups = indexChanges(result.operations).value;
  assert.deepEqual(groups, [{ startIndex: 109, endIndex: 110 }, { startIndex: 310, endIndex: 311 }]);
  for (const [groupIndex, expectedPage, oldLine] of [[0, 1, 110], [1, 3, 310]]) {
    const target = locateChange(groups, groupIndex).value;
    assert.equal(target.pageIndex, expectedPage);
    assert.equal(result.operations[target.operationIndex].oldLine, oldLine);
    assert.equal(pageOperations(result.operations, target.pageIndex).value[target.operationIndex % 100].kind, 'delete');
  }
  assert.deepEqual(result.operations, before); assert.equal(result.operations.length, 402);
  assert.deepEqual(result.counts, { equal: 398, deleted: 2, inserted: 2 });
  const report = new TextDecoder().decode(makeReport(result.operations).value).split('\n');
  assert.equal(report.length, 402); assert.equal(report[0], '  line-1'); assert.equal(report[401], '  line-400');
  assert.ok(report.includes('- line-110')); assert.ok(report.includes('+ changed-310'));
});
test('U03 index 99..102 stays one group; locate its first page', () => {
  let oldLine = 0; let newLine = 0;
  const operations = Array.from({ length: 205 }, (_, i) => {
    const kind = i === 99 || i === 100 ? 'delete' : i === 101 || i === 102 ? 'insert' : 'equal';
    return { kind, oldLine: kind === 'insert' ? null : ++oldLine, newLine: kind === 'delete' ? null : ++newLine, text: `synthetic-${i}` };
  });
  assert.deepEqual(indexChanges(operations), { ok: true, value: [{ startIndex: 99, endIndex: 102 }] });
  assert.deepEqual(locateChange(indexChanges(operations).value, 0).value, { operationIndex: 99, pageIndex: 0 });
  assert.equal(pageOperations(operations, 0).value[99].kind, 'delete');
  assert.deepEqual(pageOperations(operations, 1).value.slice(0, 3).map(x => x.kind), ['delete', 'insert', 'insert']);
  // A real-core integration fixture also crosses the 100-operation boundary.
  const left = Array.from({ length: 205 }, (_, i) => `unique-${i}`); const right = left.slice(); right[99] = 'replacement';
  const real = compareText(left.join('\n'), right.join('\n')).value.operations;
  assert.deepEqual(indexChanges(real).value, [{ startIndex: 99, endIndex: 100 }]);
  assert.equal(real[99].oldLine, 100); assert.equal(real[100].newLine, 100);
});
test('U03 beginning/end/all-changing runs, content-free indices and invalid calls', () => {
  const operations = ['delete', 'insert', 'equal', 'insert', 'equal', 'delete'].map(operation);
  assert.deepEqual(indexChanges(operations).value, [{ startIndex: 0, endIndex: 1 }, { startIndex: 3, endIndex: 3 }, { startIndex: 5, endIndex: 5 }]);
  assert.deepEqual(indexChanges(Array.from({ length: 2000 }, (_, i) => operation(i < 1000 ? 'delete' : 'insert', i))).value, [{ startIndex: 0, endIndex: 1999 }]);
  for (const value of [null, [{}], [{ kind: 'replace' }], Array(2001).fill(operation('equal', 0))]) assert.equal(indexChanges(value).ok, false);
  const groups = indexChanges(operations).value;
  for (const index of [-1, 3, 0.5, NaN]) assert.equal(locateChange(groups, index).ok, false);
  assert.equal(locateChange([], 0).ok, false);
  for (const group of groups) assert.deepEqual(Object.keys(group), ['startIndex', 'endIndex']);
});
test('U03 whitespace, final empty line and original 1000/1001 gate stay exact', () => {
  const changed = compareText('A \n\nB', 'A\n\nB\n').value;
  assert.deepEqual(indexChanges(changed.operations).value, [{ startIndex: 0, endIndex: 1 }, { startIndex: 4, endIndex: 4 }]);
  assert.equal(changed.operations[4].text, '');
  assert.equal(compareText(Array(1000).fill('A').join('\n'), '').ok, true);
  assert.equal(compareText(Array(1001).fill('A').join('\n'), '').error.code, 'LINE_LIMIT');
});

test('U03 both locales cover every change-navigation state and placeholder', () => {
  assert.deepEqual(Object.keys(messages['zh-Hant'].changes), Object.keys(messages.en.changes));
  for (const key of Object.keys(messages.en.changes)) {
    const variables = template => [...template.matchAll(/\{(\w+)\}/gu)].map(match => match[1]).sort();
    assert.deepEqual(variables(messages['zh-Hant'].changes[key]), variables(messages.en.changes[key]));
    for (const locale of ['zh-Hant', 'en']) assert.ok(interpolate(messages[locale].changes[key], { current: 1, total: 2, page: 2 }).length > 0);
  }
});
