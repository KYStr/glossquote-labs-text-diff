export const initialSession = () => ({ status: 'idle', jobId: 0, pageIndex: 0, changeIndex: -1, error: null });

export function transition(session, event) {
  const invalidate = status => ({ status, jobId: session.jobId + 1, pageIndex: 0, changeIndex: -1, error: null });
  switch (event.type) {
    case 'START': return invalidate('running');
    case 'INPUT': case 'SWAP': case 'CANCEL': return invalidate('dirty');
    case 'CLEAR': return invalidate('idle');
    case 'RESULT':
      if (session.status !== 'running' || event.jobId !== session.jobId) return session;
      return { ...session, status: event.error ? 'error' : event.empty ? 'empty' : 'success', pageIndex: 0, changeIndex: -1, error: event.error ? { code: event.error.code, side: event.error.side } : null };
    case 'FAIL':
      if (session.status !== 'running' || event.jobId !== session.jobId) return session;
      return { ...session, status: 'error', pageIndex: 0, changeIndex: -1, error: { code: event.code, side: null } };
    case 'CHANGE':
      if (session.status !== 'success' || !Number.isInteger(event.changeIndex) || !Number.isInteger(event.totalChanges) || event.totalChanges < 1 || event.totalChanges > 2000 || event.changeIndex < 0 || event.changeIndex >= event.totalChanges || !Number.isInteger(event.pageIndex) || !Number.isInteger(event.totalPages) || event.totalPages < 1 || event.totalPages > 20 || event.pageIndex < 0 || event.pageIndex >= event.totalPages) return session;
      return { ...session, changeIndex: event.changeIndex, pageIndex: event.pageIndex };
    case 'PAGE':
      if (session.status !== 'success' || !Number.isInteger(event.pageIndex) || !Number.isInteger(event.totalPages) || event.pageIndex < 0 || event.pageIndex >= event.totalPages) return session;
      return { ...session, pageIndex: event.pageIndex };
    default: return session;
  }
}
