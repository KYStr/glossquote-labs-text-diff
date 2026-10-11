# 逐行文字差異

## Current live release — 2026-10-11

[繁體中文](https://diff.glossquote.com/index.html) · [English](https://diff.glossquote.com/en/index.html)

Deployed source: [a518ac5fbe9e](https://github.com/KYStr/glossquote-labs-text-diff/commit/a518ac5fbe9efcab30b9a2f3a8c3b4bdfc32e244); Cloudflare version `b432de10-ead8-4944-a0fd-b7c65c7ef2a3`. This dated status supersedes older candidate-only or NOT_DEPLOYED notes below. Later documentation-only commits do not change the deployed assets.

Release verification passed: 16 public assets matched the reviewed build byte for byte across 39 HTTP response checks, including HTTPS, security headers, MIME, bilingual SEO, robots/sitemap, missing paths and configured redirects. Both language pages received scoped browser checks. Deletion-first ties and a trailing empty line were exercised.

The runtime retains its previously accepted offline test evidence; this release changes hosting configuration and documentation, not tool algorithms. Full Network/Storage inspection, physical devices, assistive technology and all remaining documented manual checks are still NOT_RUN. Live publication is not a claim of exhaustive certification or search-engine indexing.

原生雙語的本機逐行比較工具。MVP 已實作且必要本機 gate 通過；明確人工 NOT_RUN 見驗收紀錄。正式網站尚未由本對話部署。進度及實際結果見 HANDOFF.md 與 docs/RELEASE-CANDIDATE.md。

給想核對兩個版本短文、清單或設定片段的人：左右貼入文字，查看新增、移除、保留的行與兩側行號。比較結果不會修改來源，也不執行內容。

- MVP：在明確大小上限內，以固定規則比較兩份文字的逐行差異。
- 價值：看清楚哪些行不同，保留空白／大小寫差異；尾端換行也有明確定義。
- 難度：中。使用有界 LCS、worker 取消與分頁，零 runtime 套件。
- 平台：原生 HTML/CSS/ESM、Worker；Node 24+ 僅本機開發與離線測試。
- 非目標：Git、patch 套用、檔案上傳、資料夾比較、字元級比對、語意／AI比較、忽略空白模式、三方合併、版本歷史。

## 本機啟動

需要 Node.js 24+；沒有 runtime 或 development 套件，不需 npm install。

```powershell
npm.cmd test
npm.cmd run check
npm.cmd run build
npm.cmd run verify:dist
npm.cmd run dev
```

預覽只綁 `127.0.0.1:4183`，繁中 `/index.html`、英文 `/en/index.html`。埠被占用時不會停止占用者；可用 `npm.cmd run dev -- --port 0` 取得空閒 loopback 埠。測完按 Ctrl+C 停止自己啟動的服務。

## 發布候選

```powershell
npm.cmd run build:release
npm.cmd run verify:release
npm.cmd run preview:release
```

一般 build 保持 noindex、robots Disallow，且不生成 sitemap/canonical。release build 只接受已核准的 `https://diff.glossquote.com`，在產物中產生 canonical、雙向 hreflang、x-default、sitemap、robots、404 與 Cloudflare 靜態 response headers；public 來源永遠保持 noindex。這些命令只在本機建置與預覽，不會部署。

wrangler.jsonc 是供整合方審查的靜態資產設定，關閉 workers.dev、preview URLs 及 Worker observability。沒有安裝或鎖定 Wrangler；本任務不新增依賴、不讀部署憑證、不操作遠端帳戶。正式部署與 homepage catalog 由原主對話統一驗收及處理。

## English

A bilingual, dependency-free text diff tool built with native HTML, CSS, ES modules and a dedicated Worker. Compare two versions exactly, keep spaces and case, browse 100 rows per page, cancel processing and download `diff-report.txt`. CRLF and lone CR normalize to LF; a final LF creates an empty line. The report is for reading and cannot be applied as a Git patch.

Each version is limited to 128 KiB, 131,072 UTF-16 units and 1,000 lines, with 8,192 UTF-16 units per line. Text remains in page memory. No history, storage, analytics, account, upload API or remote processing is used. Cached same-origin program resources allow comparison after the page has fully loaded and the network is disconnected; reopening the site offline is not guaranteed.

Use Node 24+ and the commands above. The local preview binds only to `127.0.0.1:4183`. Source publication, local validation and live hosting are separate milestones. See the acceptance report for tested browsers and explicit manual NOT_RUN items.

產品／工程原始文件保留規格寫作時的歷史措辭；實際狀態以 [HANDOFF](HANDOFF.md)、[驗收紀錄](docs/ACCEPTANCE-RESULTS.md) 與 [release candidate](docs/RELEASE-CANDIDATE.md) 為準。

本資料夾可獨立複製開發；没有其他工具 API 或檔案依賴。測試均採合成資料且不需外部網路。
