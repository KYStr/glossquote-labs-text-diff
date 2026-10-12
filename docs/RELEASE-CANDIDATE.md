> **2026-10-13 U03新版候選：本機必要gate PASS，待主代理独立驗收／部署及新版外驗。** 改版證據及重現步驟見 [U03驗收文件](U03-CHANGE-NAVIGATION-20261013.md)；既有正式站／舊版外驗不套用到新版。

# 逐行文字差異：Release candidate

2026-10-10，THREAD-03-text-diff。必要本機 MVP gate PASS，保留明確人工 NOT_RUN。此文件是審查後來源版的 release candidate；版本以本 repo Git HEAD 定位，最終 PUBLIC／remote HEAD 驗證另記於原工作區 HANDOFF。網站尚未由本任務部署。

## 交付

繁體中文 `public/index.html` 與英文 `public/en/index.html` 完整工具；雙輸入、精確 LCS、行號／新增移除保留、100筆分頁、5秒 watchdog、取消／交換／編輯失效／清除，以及可讀 `diff-report.txt`。原生 ESM／Node 24+ builtins，runtime 與 development 零套件。

輸入每側 128 KiB／131072 UTF-16 units／1000 行，單行8192 units，最大2000 operations。保留尾端空行；CRLF/CR 固定正規化 LF；LCS tie 固定刪除優先。資料只在記憶體，不保存、上傳、讀剪貼簿或解讀 HTML。報告不能當 Git patch。

必要 gate 23/23 PASS；真正 Chrome 154.0.8037.98／Windows 的兩語、Worker 上限、競態、離線、下載清理、鍵盤串行與 320px 重排 PASS。詳見 [ACCEPTANCE-RESULTS.md](ACCEPTANCE-RESULTS.md)。人工 NOT_RUN：Firefox、實體手機、screen reader、實際 browser chrome 200% zoom；200% CSS 文字放大另已通過。

建立請求明確設定 gpt-6.1-sol / max；沒有本對話可驗證後端模型路由的介面，因此路由未確認。沒有切换模型、建立子代理、新對話或傳訊其他任務。

## 獨立來源與版本

目標公開 repo：[KYStr/glossquote-labs-text-diff](https://github.com/KYStr/glossquote-labs-text-diff)。本文件隨來源提交；其來源版本是 repository 的 Git HEAD。本機 HANDOFF 與發布證據另記最終 remote commit／PUBLIC 驗證，避免在提交內自指自己的 hash。

審查發布副本只攜本工具 public/scripts/test、package/project/wrangler 設定、README 及必要產品／技術／驗收說明。排除 .runs、dist、.git 歷史之外的 workspace、憑證、task-entry、帳戶層級規則或其他工具。無需 npm install。

## 主對話獨立驗收與正式整合

候選正式網址（本任務未部署）：

- `https://diff.glossquote.com/index.html`（zh-Hant）
- `https://diff.glossquote.com/en/index.html`（en）

```powershell
npm.cmd test
npm.cmd run check
npm.cmd run build
npm.cmd run verify:dist
npm.cmd run dev
# 自己的預覽結束後 Ctrl+C
npm.cmd run build:release
npm.cmd run verify:release
npm.cmd run preview:release
```

預覽 127.0.0.1:4183；指定埠占用時用 `--port 0` 或明確空閒 loopback 埠，保留占用者。release build 僅接受核准的 diff.glossquote.com origin；public 來源仍 noindex，release dist 共18個檔案。preview dist 共16個檔案，沒有 sitemap/canonical。

release main pages 各自 canonical、互相 zh-Hant/en hreflang、x-default 指繁中；sitemap 只含2語頁。robots Allow + Sitemap、局部404 noindex、_headers、_redirects 已生成及逐檔驗證。CSP default none／self scripts+styles+Worker／connect none／frame-ancestors none，nosniff、no-referrer、Permissions-Policy、DENY；.mjs 為 text/javascript，CSS text/css，XML application/xml。HTTP預览實際MIME/header/404檢查 PASS；這不替代真正 Cloudflare host 驗證。

wrangler.jsonc 的名稱 `glossquote-labs-text-diff`，assets directory ./dist、html_handling none、not_found_handling 404-page；workers_dev、preview_urls、observability 關閉；唯一 custom domain diff.glossquote.com。沒有 Worker server code、bindings 或遠端資料。Wrangler 尚未安裝／鎖定、dry-run NOT_RUN；依零套件契約沒有私自安裝。整合方需用其已審查部署流程驗證配置，再執行已授權的免費 hosting workflow。

正式上線次序：原主對話獨立驗收此候選→使用其已授權的部署途徑→確認2語HTTP/HTTPS/headers/MIME/404/Worker實際可操作→將 00-home catalog 對應兩語項目從 draft 轉 published→重建／公開首頁來源／部署首頁→驗證2語 live catalog 和相互連結。此任務未修改 00-home、其他工具、GlossGate、040141.xyz、DNS 或 Cloudflare 帳戶；沒有讀任何憑證。既有來源與免費 hosting 授權無需重問使用者。

## 風險與決策

沒有阻塞本機／來源發布的產品或權限決策。正式上線仍需整合方的真實 host 驗證；未部署即不標 live／catalog published。保留人工 NOT_RUN，HTTP cached 程式資源 max-age 1h，以及關頁後 offline reopening 不保證。公開來源與本機完成不等於網站上線或獨立安全認證。

Cloudflare配置參照於2026-10-10核實：[HTML handling](https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/)、[static headers](https://developers.cloudflare.com/workers/static-assets/headers/)、[custom 404](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/)、[Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)。Worker／Blob生命週期參照 [WHATWG Workers](https://html.spec.whatwg.org/multipage/workers.html#dom-worker-terminate)、[File API](https://w3c.github.io/FileAPI/#dfn-revokeObjectURL)；自動測試採 [Node test runner](https://nodejs.org/docs/latest-v24.x/api/test.html)。
