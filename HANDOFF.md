# Text diff — public source handoff

Local MVP and necessary acceptance gates: PASS (23 automated tests). The full Traditional Chinese and English interface, bounded LCS, Worker cancellation, pagination, report download, privacy and release build are implemented.

The source revision is this repository's Git HEAD. The original workspace's HANDOFF preserves milestone history, exact verified remote commit and environment-guard evidence; account-specific task instructions and run artifacts are excluded from this reviewed public copy.

See docs/ACCEPTANCE-RESULTS.md for actual Chrome 154.0.8037.98 / Windows results and manual NOT_RUN items, and docs/RELEASE-CANDIDATE.md for independent integration steps. Firefox, physical mobile, screen readers and actual browser chrome 200% zoom remain NOT_RUN. CSS text resizing to 200% and 320px reflow passed.

Hosting: NOT DEPLOYED BY THIS TASK. Candidate URLs are https://diff.glossquote.com/index.html and https://diff.glossquote.com/en/index.html. Source publication does not establish live hosting. The original coordinating chat handles independent acceptance, free Cloudflare deployment and the bilingual family catalog.

Requested chat configuration: gpt-6.1-sol / max. Backend routing was not verifiable from this chat. No model switch, child agent, new chat or cross-chat message was made.

No runtime or development packages are required. Use Node 24+ and the commands in README.md. Public HTML remains noindex; the approved release build generates indexable metadata in dist only. No credentials, unrelated tool source or private run artifact is included.

## 2026-10-13 U03 change navigation source candidate

Task U03-CHANGE-NAVIGATION-20261013: local acceptance PASS, source revision is this repository's Git HEAD. The new version awaits primary independent acceptance, deployment and external review; the existing MVP's live/external status is historical evidence for that earlier version.

Added index-only contiguous change groups, previous/next change controls, cross-page first-row focus and text markers. Completion remains at page 1 with change 0/N. Manual page changes retain selection and say when it is off-page; navigation never wraps. Original LCS, limits, row order and complete TXT reporting are preserved. Input/swap/clear/cancel/rerun and stale replies invalidate all change indices.

Focused tests 11/11 and full package tests 30/30 PASS; check, preview build/verify and release build/verify exit 0 (17/19 output files). Both languages passed real Chrome 154.0.8037.98 / Windows 400-line navigation, keyboard focus/context, cross-page grouping, exact full 402-row TXT, 320px/200% CSS text sizing, offline/privacy and buffered real-Worker reply races. See docs/U03-CHANGE-NAVIGATION-20261013.md for reproducible cases and explicit manual NOT_RUN.

No dependencies, credentials, deployment, homepage/shared state edits, child agents or new chats. Firefox, physical mobile, screen readers, actual browser chrome 200% zoom and new-version live/primary/external acceptance remain NOT_RUN. The original workspace records verified remote SHA, fixed ZIP/manifest, final environment hashes and write-ownership release after publication.
