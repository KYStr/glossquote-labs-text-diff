import test from 'node:test';
import assert from 'node:assert/strict';
import { initialSession, transition } from '../public/js/core/session.mjs';
import { processRequest } from '../public/js/worker.mjs';

test('DF-18 old job and replies after clear cannot enter success', () => {
  let state = transition(initialSession(), { type: 'START' });
  state = transition(state, { type: 'START' }); assert.equal(state.jobId, 2);
  assert.equal(transition(state, { type: 'RESULT', jobId: 1 }), state);
  state = transition(state, { type: 'CLEAR' });
  assert.equal(transition(state, { type: 'RESULT', jobId: 2 }), state);
  assert.equal(state.status, 'idle'); assert.equal(state.pageIndex, 0);
});
test('all invalidations increment ID, clear page/errors and carry no source text', () => {
  for (const type of ['INPUT', 'SWAP', 'CANCEL', 'CLEAR']) {
    const before = { status: 'running', jobId: 7, pageIndex: 3, error: { code: 'TIMEOUT', side: null } };
    const next = transition(before, { type, left: 'SYNTHETIC' });
    assert.equal(next.jobId, 8); assert.equal(next.pageIndex, 0); assert.equal(next.error, null);
    assert.equal(transition(next, { type: 'RESULT', jobId: 7 }), next);
    assert.deepEqual(Object.keys(next).sort(), ['error', 'jobId', 'pageIndex', 'status']);
    assert.equal(before.jobId, 7);
  }
});
test('current completion/empty/error, timeout, invalid events and page bounds', () => {
  const running = transition(initialSession(), { type: 'START' });
  assert.equal(transition(running, { type: 'RESULT', jobId: 1, empty: true }).status, 'empty');
  assert.equal(transition(running, { type: 'RESULT', jobId: 1, error: { code: 'LINE_LIMIT', side: 'left' } }).status, 'error');
  assert.equal(transition(running, { type: 'FAIL', jobId: 1, code: 'TIMEOUT' }).error.code, 'TIMEOUT');
  assert.equal(transition(running, { type: 'FAIL', jobId: 0, code: 'TIMEOUT' }), running);
  const done = transition(running, { type: 'RESULT', jobId: 1 });
  assert.equal(transition(done, { type: 'PAGE', pageIndex: 2, totalPages: 3 }).pageIndex, 2);
  assert.equal(transition(done, { type: 'PAGE', pageIndex: 3, totalPages: 3 }), done);
  assert.equal(transition(done, { type: 'PAGE', pageIndex: 0.5, totalPages: 3 }), done);
  assert.equal(transition(done, { type: 'UNKNOWN' }), done);
});
test('worker exact request protocol and content-free failures', () => {
  assert.deepEqual(processRequest({ type: 'compare', jobId: 1, left: 'A', right: 'B' }).result.value.counts, { equal: 0, deleted: 1, inserted: 1 });
  for (const payload of [{ type: 'compare', jobId: 1, left: 'A', right: 'B', extra: 'SYNTHETIC' }, { type: 'unknown', jobId: 1 }, { type: 'compare', jobId: 1, left: {}, right: '' }]) {
    assert.deepEqual(processRequest(payload), { type: 'result', jobId: 1, result: { ok: false, error: { code: 'INVALID_INPUT', side: null } } });
  }
  for (const payload of [null, {}, { jobId: -1 }, { jobId: Infinity }]) assert.equal(processRequest(payload), null);
});
