# Text diff — public source handoff

Local MVP and necessary acceptance gates: PASS (23 automated tests). The full Traditional Chinese and English interface, bounded LCS, Worker cancellation, pagination, report download, privacy and release build are implemented.

The source revision is this repository's Git HEAD. The original workspace's HANDOFF preserves milestone history, exact verified remote commit and environment-guard evidence; account-specific task instructions and run artifacts are excluded from this reviewed public copy.

See docs/ACCEPTANCE-RESULTS.md for actual Chrome 154.0.8037.98 / Windows results and manual NOT_RUN items, and docs/RELEASE-CANDIDATE.md for independent integration steps. Firefox, physical mobile, screen readers and actual browser chrome 200% zoom remain NOT_RUN. CSS text resizing to 200% and 320px reflow passed.

Hosting: NOT DEPLOYED BY THIS TASK. Candidate URLs are https://diff.glossquote.com/index.html and https://diff.glossquote.com/en/index.html. Source publication does not establish live hosting. The original coordinating chat handles independent acceptance, free Cloudflare deployment and the bilingual family catalog.

Requested chat configuration: gpt-6.1-sol / max. Backend routing was not verifiable from this chat. No model switch, child agent, new chat or cross-chat message was made.

No runtime or development packages are required. Use Node 24+ and the commands in README.md. Public HTML remains noindex; the approved release build generates indexable metadata in dist only. No credentials, unrelated tool source or private run artifact is included.
