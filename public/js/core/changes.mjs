import { limits, failure } from './lines.mjs';

// Indices only: never duplicate text or recompute the diff.
export function indexChanges(operations) {
  if (!Array.isArray(operations) || operations.length > limits.operations) return failure('INVALID_INPUT');
  const groups = []; let startIndex = null;
  for (let index = 0; index < operations.length; index++) {
    const kind = operations[index]?.kind;
    if (!['equal', 'delete', 'insert'].includes(kind)) return failure('INVALID_INPUT');
    if (kind !== 'equal' && startIndex === null) startIndex = index;
    if (kind === 'equal' && startIndex !== null) { groups.push({ startIndex, endIndex: index - 1 }); startIndex = null; }
  }
  if (startIndex !== null) groups.push({ startIndex, endIndex: operations.length - 1 });
  return { ok: true, value: groups };
}

export function locateChange(groups, changeIndex) {
  if (!Array.isArray(groups) || !Number.isInteger(changeIndex) || changeIndex < 0 || changeIndex >= groups.length) return failure('INVALID_INPUT');
  const group = groups[changeIndex];
  if (!group || !Number.isInteger(group.startIndex) || !Number.isInteger(group.endIndex) || group.startIndex < 0 || group.endIndex < group.startIndex || group.endIndex >= limits.operations) return failure('INVALID_INPUT');
  return { ok: true, value: { operationIndex: group.startIndex, pageIndex: Math.floor(group.startIndex / limits.pageSize) } };
}
