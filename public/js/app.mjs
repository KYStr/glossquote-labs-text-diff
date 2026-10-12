import { pageOperations } from './core/diff.mjs';
import { limits, wellFormed } from './core/lines.mjs';
import { initialSession, transition } from './core/session.mjs';
import { makeReport } from './core/report.mjs';
import { messages, interpolate } from './locales.mjs';
import { indexChanges, locateChange } from './core/changes.mjs';

const elements = Object.fromEntries(['workspace', 'left', 'right', 'swap', 'compare', 'cancel', 'clear', 'download', 'status', 'error', 'counts', 'rows', 'page', 'previous', 'next', 'empty-result', 'previous-change', 'next-change', 'change-position', 'change-context'].map(id => [id, document.getElementById(id)]));
let session = initialSession(); let current = null; let worker = null; let watchdog = null; let changes = [];
let reportUrl = null; let revokeTimer = null;
const supported = typeof Worker === 'function' && typeof TextEncoder === 'function' && typeof Blob === 'function' && typeof URL.createObjectURL === 'function' && typeof URL.revokeObjectURL === 'function';
const t = messages[document.documentElement.lang] ?? messages.en;
const format = new Intl.NumberFormat(t.locale);
const summaries = counts => interpolate(t.summary, Object.fromEntries(Object.entries(counts).map(([key, count]) => [key, format.format(count)])));
const errorCodes = ['INPUT_TOO_LARGE', 'LINE_LIMIT', 'LINE_TOO_LONG', 'INVALID_UNICODE', 'UNSUPPORTED', 'TIMEOUT', 'WORKER_FAILED', 'OUTPUT_TOO_LARGE', 'INVALID_INPUT'];
const keysAre = (value, keys) => value !== null && typeof value === 'object' && Object.keys(value).sort().join(',') === keys;

function validResult(result) {
  if (!result || typeof result.ok !== 'boolean') return false;
  if (!result.ok) return keysAre(result, 'error,ok') && keysAre(result.error, 'code,side') && errorCodes.includes(result.error.code) && [null, 'left', 'right'].includes(result.error.side);
  if (!keysAre(result, 'ok,value') || !keysAre(result.value, 'counts,operations')) return false;
  const { operations, counts } = result.value;
  if (!Array.isArray(operations) || operations.length > limits.operations || !keysAre(counts, 'deleted,equal,inserted')) return false;
  const expected = { equal: 0, deleted: 0, inserted: 0 }; let oldLine = 0; let newLine = 0;
  for (const operation of operations) {
    if (!keysAre(operation, 'kind,newLine,oldLine,text') || !['equal', 'delete', 'insert'].includes(operation.kind) || typeof operation.text !== 'string' || operation.text.length > limits.lineUnits || !wellFormed(operation.text) || /[\r\n]/u.test(operation.text)) return false;
    if (operation.kind !== 'insert') oldLine++;
    if (operation.kind !== 'delete') newLine++;
    if (operation.oldLine !== (operation.kind === 'insert' ? null : oldLine) || operation.newLine !== (operation.kind === 'delete' ? null : newLine)) return false;
    expected[operation.kind === 'delete' ? 'deleted' : operation.kind === 'insert' ? 'inserted' : 'equal']++;
  }
  return oldLine <= limits.lines && newLine <= limits.lines && Object.keys(expected).every(key => counts[key] === expected[key]);
}

function stopJob() {
  if (worker) worker.terminate(); worker = null;
  if (watchdog !== null) clearTimeout(watchdog); watchdog = null;
}
function revokeReport() {
  if (revokeTimer !== null) clearTimeout(revokeTimer); revokeTimer = null;
  if (reportUrl !== null) URL.revokeObjectURL(reportUrl); reportUrl = null;
}
function clearResult() { revokeReport(); current = null; changes = []; elements.rows.replaceChildren(); }
function errorText(error) {
  if (error.code === 'WORKER_FAILED' && session.status === 'success' && current) return t.reportRetry;
  const side = error.side === 'left' ? t.left : error.side === 'right' ? t.right : t.text;
  return interpolate(t.errors[error.code] ?? t.errors.WORKER_FAILED, { side });
}
function render(message) {
  const running = session.status === 'running';
  elements.workspace.setAttribute('aria-busy', String(running)); elements.compare.disabled = !supported || running;
  elements.compare.textContent = running ? t.busy : t.compare; elements.cancel.hidden = !running;
  elements.download.disabled = session.status !== 'success' || !current?.operations.length;
  elements.error.hidden = !session.error; elements.error.textContent = session.error ? errorText(session.error) : '';
  for (const side of ['left', 'right']) elements[side].setAttribute('aria-invalid', String(session.error?.side === side));
  elements.status.textContent = message ?? (current ? (current.counts.inserted === 0 && current.counts.deleted === 0 ? t.statuses.same : interpolate(t.statuses.complete, { summary: summaries(current.counts) })) : t.statuses[session.status]);
  elements.counts.textContent = summaries(current?.counts ?? { equal: 0, deleted: 0, inserted: 0 });
  const total = current ? Math.ceil(current.operations.length / limits.pageSize) : 0;
  elements.page.textContent = interpolate(t.page, { current: format.format(total ? session.pageIndex + 1 : 0), total: format.format(total) });
  elements.previous.disabled = !total || session.pageIndex === 0; elements.next.disabled = !total || session.pageIndex + 1 >= total;
  elements['empty-result'].hidden = Boolean(current?.operations.length);
  const selected = changes[session.changeIndex];
  const values = { current: format.format(session.changeIndex + 1), total: format.format(changes.length), page: format.format(selected ? Math.floor(selected.startIndex / limits.pageSize) + 1 : 0) };
  elements['change-position'].textContent = interpolate(selected ? t.changes.selected : t.changes.unselected, values);
  const visible = selected && selected.startIndex < (session.pageIndex + 1) * limits.pageSize && selected.endIndex >= session.pageIndex * limits.pageSize;
  elements['change-context'].textContent = selected ? interpolate(visible ? t.changes.visible : t.changes.offPage, values) : (session.status === 'success' || session.status === 'empty') && changes.length === 0 ? t.changes.none : t.changes.prompt;
  elements['previous-change'].disabled = session.status !== 'success' || session.changeIndex <= 0;
  elements['next-change'].disabled = session.status !== 'success' || changes.length === 0 || session.changeIndex + 1 >= changes.length;
}
function renderPage() {
  elements.rows.replaceChildren(); if (!current) return;
  const page = pageOperations(current.operations, session.pageIndex); if (!page.ok) return;
  const fragment = document.createDocumentFragment(); const labels = t.kinds;
  const selected = changes[session.changeIndex];
  for (const [offset, operation] of page.value.entries()) {
    const operationIndex = session.pageIndex * limits.pageSize + offset;
    const row = document.createElement('tr'); row.className = operation.kind;
    row.id = `operation-${operationIndex}`; row.dataset.operationIndex = String(operationIndex);
    const inSelection = selected && operationIndex >= selected.startIndex && operationIndex <= selected.endIndex;
    const target = inSelection && operationIndex === selected.startIndex;
    if (inSelection) { row.classList.add('selected-change'); row.setAttribute('aria-describedby', 'change-position change-context'); }
    if (target) { row.tabIndex = -1; row.setAttribute('aria-current', 'true'); }
    for (const [className, text] of [['number', operation.oldLine === null ? '—' : format.format(operation.oldLine)], ['number', operation.newLine === null ? '—' : format.format(operation.newLine)], ['kind', labels[operation.kind]], ['content', operation.text]]) {
      const cell = document.createElement('td'); cell.className = className;
      if (className === 'content' && text === '') { const blank = document.createElement('span'); blank.className = 'blank-line'; blank.textContent = t.blank; cell.append(blank); }
      else cell.textContent = text;
      if (className === 'kind' && inSelection) { const marker = document.createElement('span'); marker.className = 'change-marker'; marker.textContent = target ? t.changes.start : t.changes.member; cell.append(marker); }
      row.append(cell);
    }
    fragment.append(row);
  }
  elements.rows.append(fragment);
}
function invalidate(type, message) { stopJob(); clearResult(); session = transition(session, { type }); render(message); }
function fail(code, jobId) {
  if (session.status !== 'running' || session.jobId !== jobId) return;
  stopJob(); clearResult(); session = transition(session, { type: 'FAIL', jobId, code }); render();
}
function run() {
  if (!supported || session.status === 'running') return;
  stopJob(); clearResult(); session = transition(session, { type: 'START' }); render();
  const jobId = session.jobId;
  try {
    worker = new Worker(new URL('./worker.mjs', import.meta.url), { type: 'module' });
    watchdog = setTimeout(() => fail('TIMEOUT', jobId), 5000);
    worker.addEventListener('error', event => { event.preventDefault(); fail('WORKER_FAILED', jobId); });
    worker.addEventListener('messageerror', () => fail('WORKER_FAILED', jobId));
    worker.addEventListener('message', event => {
      const data = event.data;
      if (session.status !== 'running' || session.jobId !== jobId || data?.jobId !== jobId) return;
      if (!keysAre(data, 'jobId,result,type') || data.type !== 'result' || !validResult(data.result)) return fail('WORKER_FAILED', jobId);
      stopJob(); const result = data.result;
      if (result.ok) {
        const indexed = indexChanges(result.value.operations);
        if (!indexed.ok) return fail('WORKER_FAILED', jobId);
        current = result.value; changes = indexed.value;
      }
      session = transition(session, { type: 'RESULT', jobId, empty: result.ok && current.operations.length === 0, error: result.ok ? null : result.error });
      if (session.status === 'empty') current = null;
      renderPage(); render(); if (session.error?.side) elements[session.error.side].focus();
    });
    worker.postMessage({ type: 'compare', jobId, left: elements.left.value, right: elements.right.value });
  } catch { fail('WORKER_FAILED', jobId); }
}
for (const side of ['left', 'right']) elements[side].addEventListener('input', () => invalidate('INPUT'));
elements.compare.addEventListener('click', run);
elements.download.addEventListener('click', () => {
  if (session.status !== 'success' || !current?.operations.length) return;
  revokeReport();
  const report = makeReport(current.operations);
  if (!report.ok) { session = { ...session, error: report.error }; render(t.reportFailed); return; }
  try {
    reportUrl = URL.createObjectURL(new Blob([report.value], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = reportUrl; link.download = 'diff-report.txt';
    document.body.append(link); link.click(); link.remove(); revokeTimer = setTimeout(revokeReport, 1000);
  } catch { revokeReport(); session = { ...session, error: { code: 'WORKER_FAILED', side: null } }; render(t.reportRetry); }
});
elements.cancel.addEventListener('click', () => { invalidate('CANCEL', t.cancelled); elements.compare.focus(); });
elements.swap.addEventListener('click', () => { invalidate('SWAP'); [elements.left.value, elements.right.value] = [elements.right.value, elements.left.value]; });
elements.clear.addEventListener('click', () => { invalidate('CLEAR'); elements.left.value = ''; elements.right.value = ''; elements.left.focus(); });
for (const [id, delta] of [['previous', -1], ['next', 1]]) elements[id].addEventListener('click', () => {
  session = transition(session, { type: 'PAGE', pageIndex: session.pageIndex + delta, totalPages: Math.ceil(current.operations.length / limits.pageSize) });
  renderPage(); render(interpolate(t.pageSummary, { current: format.format(session.pageIndex + 1), total: format.format(Math.ceil(current.operations.length / limits.pageSize)) }));
});
for (const [id, delta] of [['previous-change', -1], ['next-change', 1]]) elements[id].addEventListener('click', () => {
  if (session.status !== 'success' || !current) return;
  const changeIndex = session.changeIndex + delta;
  const target = locateChange(changes, changeIndex); if (!target.ok) return;
  session = transition(session, { type: 'CHANGE', changeIndex, totalChanges: changes.length, pageIndex: target.value.pageIndex, totalPages: Math.ceil(current.operations.length / limits.pageSize) });
  renderPage(); render(interpolate(t.changes.located, { current: format.format(changeIndex + 1), total: format.format(changes.length), page: format.format(session.pageIndex + 1) }));
  const row = document.getElementById(`operation-${target.value.operationIndex}`);
  elements.rows.closest('.table-region').scrollLeft = 0;
  row.focus({ preventScroll: true }); row.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' });
});
window.addEventListener('pagehide', () => { stopJob(); clearResult(); elements.left.value = ''; elements.right.value = ''; session = transition(session, { type: 'CLEAR' }); render(); });
if (!supported) session = { ...initialSession(), status: 'error', error: { code: 'UNSUPPORTED', side: null } };
render();
