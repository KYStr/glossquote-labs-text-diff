export const limits = Object.freeze({ bytes: 131072, units: 131072, lines: 1000, lineUnits: 8192, operations: 2000, reportBytes: 524288, pageSize: 100 });
export const failure = (code, side = null) => ({ ok: false, error: { code, side } });
export const wellFormed = source => !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(source);

export function splitLines(source) {
  if (typeof source !== 'string') return failure('INVALID_INPUT');
  if (source.length > limits.units) return failure('INPUT_TOO_LARGE');
  if (!wellFormed(source)) return failure('INVALID_UNICODE');
  if (new TextEncoder().encode(source).length > limits.bytes) return failure('INPUT_TOO_LARGE');
  const lines = source === '' ? [] : source.replace(/\r\n?/gu, '\n').split('\n');
  if (lines.length > limits.lines) return failure('LINE_LIMIT');
  if (lines.some(line => line.length > limits.lineUnits)) return failure('LINE_TOO_LONG');
  return { ok: true, value: lines };
}

export function validateLines(lines, side) {
  if (!Array.isArray(lines)) return failure('INVALID_INPUT', side);
  if (lines.length > limits.lines) return failure('LINE_LIMIT', side);
  let units = Math.max(0, lines.length - 1); let bytes = units;
  const encoder = new TextEncoder();
  for (const line of lines) {
    if (typeof line !== 'string' || /[\r\n]/u.test(line)) return failure('INVALID_INPUT', side);
    if (line.length > limits.lineUnits) return failure('LINE_TOO_LONG', side);
    if (!wellFormed(line)) return failure('INVALID_UNICODE', side);
    units += line.length; bytes += encoder.encode(line).length;
    if (units > limits.units || bytes > limits.bytes) return failure('INPUT_TOO_LARGE', side);
  }
  return { ok: true, value: lines };
}
