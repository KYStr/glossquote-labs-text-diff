# U03：跨頁差異段導覽

日期：2026-10-13（Asia/Taipei）。任務 `U03-CHANGE-NAVIGATION-20261013`。

本機必要 gate **PASS**；新版 **awaiting external review**，目前階段是待主代理獨立驗收／正式部署整合。既有 MVP 已有正式站及歷史外驗紀錄，這些不當作本次改版的通過證據。本版由功能對話完成本機實作與 PUBLIC 來源；不部署、不更動首頁或共享狀態。

## 可觀察行為

- 完整 operations 中連續的非 equal 為一段；相鄰 delete + insert 同段，跨100筆頁界不拆段。只建立 startIndex/endIndex，沒有複製文字或重新執行 LCS。
- 完成比較仍在第一頁，未選段為0/N；下一段從第一段開始，上一段停用。選段定位第一筆 operation 的頁與可聚焦目標行，行號、狀態及「差異段起點」文字清楚，段內其餘行標「選取段差異」。到首／末段停用對應按鈕，不循環。
- 一般翻頁保留選段；目前頁包含該段任何部分時標為在本頁，完全不相交時明示不在本頁與起點頁。equal 不會被當成差異。
- INPUT／SWAP／CLEAR／CANCEL／START／FAIL／pagehide 清空段落資料與標示；遲到回覆不能建立或覆蓋段落。Worker、watchdog、原 jobId 規則及 Blob 清理維持。
- 原 LCS／刪除優先、1000行／128KiB／8192單行上限、尾端空行、最多2000 ops及每頁100列不變；下載始終由完整 current.operations 產生所有頁 TXT。

介面沿用 Product App worksheet／家族 tokens：兩語原生按鈕放在結果旁，與一般頁面導航清楚分開。320px以換行保留所有控制，表格局部橫捲；字面 marker與墨色邊線共同標示選段，不只顏色。目標行保留原／新行號和相鄰上下文。

## 實際改檔

新增 `public/js/core/changes.mjs`、`test/changes.test.mjs`；修改 `core/session.mjs`、`app.mjs`、`locales.mjs`、兩語 index.html、styles/app.css、test/session.test.mjs；本工具規格派發註記、HANDOFF、release candidate及本文件。沒有 runtime/dev 套件、package/config、LCS、Worker或report模組變更。

## 命令與結果

Node v24.14.0、npm 11.9.0；Windows，Chrome 154.0.8037.98。所有測試用合成文字及獨立瀏覽器 context。

| 命令 | 實測 |
|---|---|
| node --test test/changes.test.mjs test/session.test.mjs | exit0，11/11 PASS |
| npm.cmd test | exit0，30/30 PASS、0 skipped |
| npm.cmd run check | exit0，15 static files、語法／本地資源／安全 scan |
| npm.cmd run build + verify:dist | 各exit0，17檔 preview noindex，逐檔bytes/hash一致 |
| npm.cmd run build:release + verify:release | 各exit0，19檔，原canonical/hreflang/robots/sitemap/headers仍通過 |
| browser-main-attempt2.mjs | exit0，兩語各7組真瀏覽器案例 PASS |
| browser-race.mjs | exit0，兩語各5組緩衝真Worker回覆／取消失效 PASS |
| browser-release.mjs | exit0，19檔清單／17個served assets MIME/nosniff及兩語release runtime PASS |

腳本／JSON／PNG／合成下載與gate logs留在孵化器專用 `.runs/diff-outcome-2026-10-13/run-01/`，不進公開來源。完整manifest和固定source ZIP於remote commit驗證後產生並交主代理。公開文件版本用repository Git HEAD定位；精確remote hash與ZIP hashes在本機HANDOFF及外部manifest記錄，避免自指hash。

最初兩個驗收 wrapper 問題已留存：guard本身回PASS，但PowerShell的未設定LASTEXITCODE被誤判，改讀已保存JSON Status；browser初稿錯誤要求disabled比較按鈕保留焦點，原實作會回body。本規格要求的是第一頁／0/N／不聚焦差異行，實測以這些精確条件判斷。兩者沒有系統漂移或放寬產品gate；真正導航焦點仍驗證了 :focus-visible 與2px outline。

## 主代理／外驗重現

1. 兩語任一頁，用下列假資料貼入原版本／新版本，按比較。

   ```js
   const left = Array.from({ length: 400 }, (_, i) => `line-${i + 1}`);
   const right = left.slice();
   right[109] = 'changed-110';
   right[309] = 'changed-310';
   const original = left.join('\n');
   const revised = right.join('\n');
   ```

2. 初始第1/5頁、0/2段、沒有選段marker；計數398保留、2移除、2新增，共402 operations。報告包含line-1到line-400及兩處delete/insert，沒有額外尾LF。
3. 按下一段：第2/5頁、1/2段，焦點operation109、原行110的刪除；旁邊原109與新增changed-110可讀。再下一段：第4/5頁、2/2段，焦點operation310、原行310；下一段停用。上一段回第2頁／110。
4. 第一段選取後一般下一頁到第3頁：仍1/2段，但提示不在本頁，沒有selected/equal誤標；下一段仍直接到第二段第4頁。下載前後完整402筆一致。
5. A/B/C對A/X/C：1段，包括刪B＋增X，定位原行2，TXT為 `  A\n- B\n+ X\n  C`。相同文字與全空各0段、段落導覽停用；同文仍能下载原可讀報告，全空不能。
6. 真核心跨頁：205個唯一行 `unique-0..unique-204`，只將第100行改replacement。group indices99..100，只1段；跳索引99在第1頁，一般下一頁顯示索引100新增，仍1/1段且提示在本頁。另單測的合法indices99..102四操作fixture也只有1段。
7. 鍵盤Tab到輸入／比較／下一段，Enter或Space選段後焦點到起點行；Shift+Tab可回段落控制。兩次下一段→上一段→普通下一頁→下一段→下載，完整流程已實測兩語。
8. 編輯、交換、清除、取消、重跑立即0/0與無marker；晚到有效回覆不恢復舊段。320px與200% CSS文字放大控制可達；8192長行局部橫捲，script-looking文字只作文字，1000成功／1001拒絕。

## 範圍、未驗與風險

- NOT_RUN：Firefox、實體手機、screen reader、實際browser chrome 200% zoom；兩語320px及200% CSS文字放大、可見焦點、reduced-motion已PASS。
- 新版Cloudflare live／主代理独立驗收／外部複驗尚未執行。正式站網址仍是繁中 `https://diff.glossquote.com/index.html`、英文 `https://diff.glossquote.com/en/index.html`；本版source-only不能視為已部署。
- HTTP cached網站程式最多1h，後續部署需驗證新helper載入與舊browser cache；關頁後離線重開不保證，沒有Service Worker。這次已完整載入後的離線比較／段落導覽／完整下载、無內容GET/POST外送與storage/cookie/IDB/Cache API寫入均PASS。
- pagehide新增索引清理驗的是lifecycle-hook dispatch；跨装置實際navigation/back-forward矩陣沒有冒充通過。資料保持記憶體，不宣稱安全抹除底層記憶體。
- 沒有新增產品選擇、權限、依賴或成本決策；正式部署／首頁／共享batch狀態由主代理序列整合。功能對話交接後釋放03工具及專用發布副本寫入權，等待主代理指派的必要修正。
