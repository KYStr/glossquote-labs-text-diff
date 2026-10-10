export const initialSession = () => ({ status: 'idle', jobId: 0, pageIndex: 0, error: null });

export function transition(session, event) {
  const invalidate = status => ({ status, jobId: session.jobId + 1, pageIndex: 0, error: null });
  switch (event.type) {
    case 'START': return invalidate('running');
    case 'INPUT': case 'SWAP': case 'CANCEL': return invalidate('dirty');
    case 'CLEAR': return invalidate('idle');
    case 'RESULT':
      if (session.status !== 'running' || event.jobId !== session.jobId) return session;
      return { ...session, status: event.error ? 'error' : event.empty ? 'empty' : 'success', pageIndex: 0, error: event.error ? { code: event.error.code, side: event.error.side } : null };
    case 'FAIL':
      if (session.status !== 'running' || event.jobId !== session.jobId) return session;
      return { ...session, status: 'error', pageIndex: 0, error: { code: event.code, side: null } };
    case 'PAGE':
      if (session.status !== 'success' || !Number.isInteger(event.pageIndex) || !Number.isInteger(event.totalPages) || event.pageIndex < 0 || event.pageIndex >= event.totalPages) return session;
      return { ...session, pageIndex: event.pageIndex };
    default: return session;
  }
}
