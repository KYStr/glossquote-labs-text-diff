# 逐行文字差異：實際驗收紀錄

日期：2026-10-10（Asia/Taipei）。Node v24.14.0、npm 11.9.0；Windows x64，Chrome 154.0.8037.98，獨立測試 context／合成文字。沒有讀取真實使用者文字、憑證或既有瀏覽器 profile。

必要本機驗收 PASS，完整雙語 MVP 已實作。下方人工 NOT_RUN 是使用者允許的明確例外，不是 PASS。來源公开、網站上線與本機完成各自記於 release candidate／HANDOFF。

## 命令

| 實際命令 | 結果 | 證據 |
|---|---|---|
| npm.cmd test | exit 0，23/23，0 skipped | T06-test.log |
| npm.cmd run check | exit 0，14 static files／語法／資源／危險 API scan | T08-final-check.log |
| npm.cmd run build | exit 0，16 static files，noindex | T08-final-preview-build.log |
| npm.cmd run verify:dist | exit 0，檔案清單、逐檔 bytes/hash 一致 | T08-final-preview-verify.log |
| npm.cmd run build:release | exit 0，18 static files | T08-final-release-build.log |
| npm.cmd run verify:release | exit 0，逐檔 hash、完整來源生成清單一致 | T08-final-release-verify.log |
| git diff --check -- . | exit 0；根 repo 中本工具 untracked，公開副本另做 staged gate | T06-diff-check.log |
| npm.cmd run dev | 127.0.0.1:4183；最後停止本次 session | T03/04/05/07 服務紀錄 |

T08 staged whitespace gate 發現 app.mjs／app.css 末行帶 CR；僅將這兩個檔案換行統一 LF，未改邏輯／樣式。受影響的 check/build/逐檔 hash gate 重新執行並通過；23個測試與真正瀏覽器的行為結果沿用未改變的程式行為。發布副本也驗證相同來源 bytes 並另跑其 23個測試／check/staged gate；結果於本機 HANDOFF 最終發布紀錄中記載。最終可部署 dist 是 release candidate，仍未部署。

## 需求證據

| 案例 | 結果／實際驗證 |
|---|---|
| DF-01..10 | PASS：空／同文、單側空、替換、CRLF/CR/LF、尾 LF、空行、固定刪除優先、空白／大小寫精確結果 |
| DF-11..14 | PASS：1000/1001 行、8192/8193 units、131071/131072/131073 bytes、raw CRLF、UTF-8 多 bytes、非法 surrogate；兩側錯誤定位 |
| DF-15 | PASS：pure pagination + 真 DOM 100/100/1；201 筆全部重建，無漏重，越界拒絕 |
| DF-16 | PASS：UTF-8 報告精確 `  A\n- B\n+ C`，無最後額外 LF；512 KiB exact/+1 gate |
| DF-17 | PASS：961 組左右陣列，獨立 recursive LCS 長度＋來源重建不變量；輸入不變 |
| DF-18 | PASS：純 session 不含文字；jobId 過期回覆／clear 後回覆永不成功 |
| DF-19 | PASS：真 Worker 比較 script-looking 文字，DOM 只呈現文字，沒有 script 節點、執行、內容網路請求 |
| DF-20 | PASS：延遲 harness 下 cancel/swap/clear/edit；晚到回覆拒絕，Worker terminate、busy 解除；swap 不運算；clear 完全空、頁0、焦點 left |
| DF-21 | PASS：真下載檔名／字串；1 秒撤銷及連續下載／clear／pagehide 立即撤銷；cookie、Local/Session Storage、IDB、Cache API 無寫入／內容 |
| DF-22 | PASS：繁中與英文首次比較在完整頁載入後斷網成功；請求只有同源 cached mjs GET、無 body／內容／第三方；無 console／pageerror |
| DF-23 | PASS：缺 Worker、另缺 TextEncoder 時停用；不回覆 Worker 的真實 5 秒 watchdog 進 TIMEOUT 並終止；無雲端 fallback |
| DF-24 | PASS：不中斷的鍵盤輸入→交換→比較→翻頁→下載；全部報告精確，焦點 outline 2px／外環可見，無陷阱 |
| DF-25 | PASS：320px、8192 長行、兩語 200% CSS 文字放大、控制可達／頁面不橫向溢位／結果區局部橫捲。實際 browser chrome 200% zoom：NOT_RUN |

額外：英文 empty/same/blank/error、100/100/1 分頁／下載／交換、缺能力、語言切換清除及同語首頁皆 PASS。兩語關 JS 時 title/H1/教學/4 FAQ/限制可讀；reduced-motion PASS。從 render 檢視桌面與手機，沒有阻塞工作或須追加的視覺修正。取自真 CSS 的文字／語意 pairs ≥4.5:1，控制邊界 ≥3:1。

真正 Worker 的 1000×1000 上限輸入成功，2000 operations、20 頁；此次觀察 57ms，僅為這個環境一次觀察，不宣稱其他裝置效能。fixture 5183 與 OS 分配埠只綁 loopback；所有 task-owned disposable server 已停止。

## 未執行與限制

- NOT_RUN：Firefox、實體手機瀏覽器、screen reader、瀏覽器 chrome 的實際 200% zoom。已完成 Chrome 的 320px viewport 及 200% CSS 文字放大；不把模擬操作冒充上述人工結果。
- NOT_RUN：Wrangler CLI dry-run／遠端部署／正式 Cloudflare response headers、HTTPS、DNS、搜尋收錄。這是交給原主對話的正式整合階段；本任務沒有新增 Wrangler 依賴、讀憑證、改 Cloudflare 或 homepage catalog。
- 不保證關頁後離線重開；沒有 Service Worker。HTTP cache 只含固定網站程式／樣式，不含文字；這些資源 max-age 1 小時，後續 release 應考慮既有瀏覽器 cache。
- 清除／pagehide 只釋放本頁引用、timer、Worker 與 Blob URL，不刪既存下載或承諾安全抹除底層記憶體。

## 環境與證據位置

完整本機 logs／harness／合成下載／screenshots 在孵化器專用 `.runs/text-diff/2026-10-10-run-01/`；這些運行產物不進公開 repo。公開來源提供可離線重跑的 pure/server/release tests；本文件記錄真瀏覽器結果。

持續環境 guard 在長自動化前／本機後均 PASS，值完全不變：User PATH ExpandString 長834、Machine PATH String 長1227、ephemeral entries 各0；PATH SHA256 及整個 HKCU/HKLM Environment-key fingerprint、TEMP/TMP hashes 全部一致。未改持久環境或停止其他任務程序。來源發布後還會再核對。

首輪 harness 有兩個已修正、已留存的工具問題：Windows import path 改成 file URL；初始 favicon 404 與工作階段 console 分開量測。最終已加入本地 favicon，初始／工作 console 皆空。沒有產品 FAIL 被當作 NOT_RUN 或 PASS。
