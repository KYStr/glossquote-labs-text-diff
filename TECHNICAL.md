# 技術規格

這是規格，尚未實作。原生 HTML/CSS/瀏覽器ESM、Node24+ node:test，runtime零套件。

## 檔案

    package.json
    scripts/serve.mjs
    scripts/check.mjs
    scripts/build.mjs
    public/index.html
    public/styles/tokens.css
    public/styles/app.css
    public/js/app.mjs
    public/js/worker.mjs
    public/js/core/lines.mjs
    public/js/core/diff.mjs
    public/js/core/report.mjs
    public/js/core/session.mjs
    test/scaffold.test.mjs
    test/lines.test.mjs
    test/diff.test.mjs
    test/report.test.mjs
    test/session.test.mjs

package private:true/type:module。dev=node scripts/serve.mjs，test=node --test，check=node scripts/check.mjs，build=node scripts/build.mjs。serve只讀public/、loopback4173；build只把允許的靜態來源複製到dist，不包含輸入、docs或test。

## 純函式契約

    splitLines(source) -> Result<string[]>
    diffLines(leftLines,rightLines) -> Result<{
      operations:Operation[],
      counts:{equal:number,deleted:number,inserted:number}
    }>
    compareText(left,right) -> Result<DiffResult>
    pageOperations(operations,pageIndex) -> Result<Operation[]>
    makeReport(operations) -> Result<Uint8Array>
    transition(session,event) -> session
    Operation = {
      kind:"equal"|"delete"|"insert",
      oldLine:number|null,newLine:number|null,text:string
    }

成功{ok:true,value}；失敗{ok:false,error:{code,side}}。pageIndex是0-based整數，每頁100，越界回INVALID_PAGE；空operations只接受pageIndex0回[]。函式不修改傳入陣列，不把使用者文字當key加入一般物件。

splitLines先检查primitive string、raw長度、surrogate配對、raw UTF8bytes，再normalize CRLF/CR為LF。空字串回[]；非空split後驗1,000行及每行8,192單位。不得預先截斷paste、丟最後空行、trim或NFC normalize。

## 有界LCS演算法

1. n,m各<=1,000，先檢查再分配；n*m<=1,000,000。把左右所有行依序 intern 到 Map<string,integer>，比較用整數ID；Map只為本次記憶體，不記錄原文。
2. 建立Uint16Array((n+1)*(m+1))，最大2,004,002 bytes。所有格預設0。用 index(i,j)=i*(m+1)+j。
3. i從n-1降至0，j從m-1降至0：ID相等時D[i,j]=1+D[i+1,j+1]，否则max(D[i+1,j],D[i,j+1])。
4. traceback由i=j=0開始。相同→equal且i/j各+1；不同且D[i+1,j]>=D[i,j+1]→delete/i+1；否則insert/j+1。任何一邊耗盡，另一邊逐行delete或insert。行號用處理前i+1/j+1，缺邊null。
5. counts由operations算，不由DOM算。最多n+m筆。equal+delete的text序列必與leftLines相等，equal+insert必與rightLines相等；這兩項是必要回歸不變量。
6. 不產生replace operation，不猜行移動；固定tie-break是產品規則，不能為畫面好看更換。

小型窮舉測試可列舉字母表["A","B"]、長度0到4的所有陣列兩兩比對：檢查重建不變量、equal count等於獨立簡單LCS長度、operation數<=n+m。這是有意義的規則驗證，不是對實作寫快照。

## 執行與報告

worker接{type:"compare",jobId,left,right}，回{type:"result",jobId,result}。每次run先清結果、同步標busy、啟watchdog；完成/取消/error/clear都terminate並清timer。新的jobId只能遞增，input/swap/clear取消後的回覆全部忽略。UI只保留目前page的<=100列DOM，不讓2,000長行同時建立節點。

報告以operation.kind映射固定prefix，再接原text，以LF join；無metadata header、無尾端自動LF。結果是自訂可讀報告，不是unified diff。makeReport再次驗證最大524,288 bytes，使用TextEncoder；application下載型別text/plain;charset=utf-8，固定diff-report.txt。

Blob URL點擊後1秒撤銷；新下載、clear/pagehide撤銷未完成URLs。沒有剪貼簿API（使用者可自行選取文字），沒有file reader、storage、service worker、網路API。伺服器只負責靜態資源；不送工作資料。

## 參考與待驗證

2026-09-23查閱官方平台文件：[WHATWG Worker終止](https://html.spec.whatwg.org/multipage/workers.html#dom-worker-terminate)、[Encoding](https://encoding.spec.whatwg.org/)、[File API的Blob URL撤銷](https://w3c.github.io/FileAPI/#dfn-revokeObjectURL)。演算法與上限是本工具的明確設計選擇，不宣稱已達任何裝置效能。

未來須feature detection檢Worker/TextEncoder/Blob/URL.createObjectURL；缺少任一則顯示不支援，不做大型主執行緒fallback。Node只能驗纯函式，取消與DOM分頁必須實際瀏覽器驗收。
