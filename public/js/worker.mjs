import { compareText } from './core/diff.mjs';
import { failure } from './core/lines.mjs';

export function processRequest(data) {
  if (!data || !Number.isSafeInteger(data.jobId) || data.jobId < 1) return null;
  const keys = Object.keys(data).sort().join(',');
  const valid = keys === 'jobId,left,right,type' && data.type === 'compare' && typeof data.left === 'string' && typeof data.right === 'string';
  let result;
  try { result = valid ? compareText(data.left, data.right) : failure('INVALID_INPUT'); }
  catch { result = failure('WORKER_FAILED'); }
  return { type: 'result', jobId: data.jobId, result };
}

if (typeof self !== 'undefined') self.addEventListener('message', event => {
  const response = processRequest(event.data);
  if (response) self.postMessage(response);
});
