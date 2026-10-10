import { failure, limits, wellFormed } from './lines.mjs';
const prefixes = Object.freeze({ equal: '  ', delete: '- ', insert: '+ ' });

export function makeReport(operations) {
  if (!Array.isArray(operations) || operations.length > limits.operations) return failure('INVALID_INPUT');
  const encoder = new TextEncoder(); const lines = []; let size = Math.max(0, operations.length - 1);
  for (const operation of operations) {
    if (!operation || !Object.hasOwn(prefixes, operation.kind) || typeof operation.text !== 'string' || operation.text.length > limits.lineUnits || /[\r\n]/u.test(operation.text) || !wellFormed(operation.text)) return failure('INVALID_INPUT');
    size += 2 + encoder.encode(operation.text).length;
    if (size > limits.reportBytes) return failure('OUTPUT_TOO_LARGE');
    lines.push(prefixes[operation.kind] + operation.text);
  }
  return { ok: true, value: encoder.encode(lines.join('\n')) };
}
