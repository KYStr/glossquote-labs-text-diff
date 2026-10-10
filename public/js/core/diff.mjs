import { splitLines, validateLines, limits, failure } from './lines.mjs';

export function diffLines(left, right) {
  const a = validateLines(left, 'left'); if (!a.ok) return a;
  const b = validateLines(right, 'right'); if (!b.ok) return b;
  const n = left.length; const m = right.length; const width = m + 1;
  const intern = new Map();
  const ids = lines => lines.map(line => {
    if (!intern.has(line)) intern.set(line, intern.size);
    return intern.get(line);
  });
  const leftIds = ids(left); const rightIds = ids(right);
  const table = new Uint16Array((n + 1) * width);
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) {
    const cell = i * width + j;
    table[cell] = leftIds[i] === rightIds[j] ? 1 + table[cell + width + 1] : Math.max(table[cell + width], table[cell + 1]);
  }
  const operations = []; const counts = { equal: 0, deleted: 0, inserted: 0 };
  let i = 0; let j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && leftIds[i] === rightIds[j]) {
      operations.push({ kind: 'equal', oldLine: i + 1, newLine: j + 1, text: left[i] }); counts.equal++; i++; j++;
    } else if (i < n && (j === m || table[(i + 1) * width + j] >= table[i * width + j + 1])) {
      operations.push({ kind: 'delete', oldLine: i + 1, newLine: null, text: left[i] }); counts.deleted++; i++;
    } else {
      operations.push({ kind: 'insert', oldLine: null, newLine: j + 1, text: right[j] }); counts.inserted++; j++;
    }
  }
  return { ok: true, value: { operations, counts } };
}

export function compareText(left, right) {
  const a = splitLines(left); if (!a.ok) return { ok: false, error: { ...a.error, side: 'left' } };
  const b = splitLines(right); if (!b.ok) return { ok: false, error: { ...b.error, side: 'right' } };
  return diffLines(a.value, b.value);
}

export function pageOperations(operations, pageIndex) {
  if (!Array.isArray(operations) || operations.length > limits.operations || !Number.isInteger(pageIndex) || pageIndex < 0 || (operations.length === 0 ? pageIndex !== 0 : pageIndex >= Math.ceil(operations.length / limits.pageSize))) return failure('INVALID_PAGE');
  return { ok: true, value: operations.slice(pageIndex * limits.pageSize, (pageIndex + 1) * limits.pageSize) };
}
