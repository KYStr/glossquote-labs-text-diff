# 驗收案例

這是規格，尚未實作。以下預期是規格，全部仍待執行。記號E/D/I分別代表equal/delete/insert；括號為text，行號從1起。字串escape按JS解讀。

| ID／類型 | 需求 | 輸入／步驟 | 精確預期 |
|---|---|---|---|
| DF-01 自動 | FR-01,03 | left:"",right:"" | operations:[]，三種count皆0 |
| DF-02 自動 | FR-04, FR-05 | "A\nB"對"A\nB" | E("A",old1,new1),E("B",old2,new2)；equal:2,deleted:0,inserted:0 |
| DF-03 自動 | FR-04, FR-05 | ""對"A" | I("A",old:null,new1) |
| DF-04 自動 | FR-04, FR-05 | "A"對"" | D("A",old1,new:null) |
| DF-05 自動 | FR-04 | "A"對"B" | D("A"),I("B")，deleted:1,inserted:1,equal:0 |
| DF-06 自動 | FR-03 | "A\r\nB\rC"對"A\nB\nC" | 三筆equal，沒有insert/delete |
| DF-07 自動 | FR-03 | "A"對"A\n" | E("A",1,1),I("",null,2) |
| DF-08 自動 | FR-03 | ""對"\n" | I("",null,1),I("",null,2)，不是0行 |
| DF-09 自動 | FR-04 | "A\nB"對"B\nA" | D("A",1,null),E("B",2,1),I("A",null,2)，驗tie-break |
| DF-10 自動 | FR-04 | "A "對"A"；"A"對"a" | 兩組都是一delete後一insert |
| DF-11 自動 | FR-02 | 以999個LF連接1000個"A"；再用1001個"A" | 前者成功；後者LINE_LIMIT |
| DF-12 自動 | FR-02 | "A".repeat(8192)，再用8193 | 前者成功，後者LINE_TOO_LONG |
| DF-13 自動 | FR-02 | 16行各8191個"a"，LF連接，再加1個"a"至第一行；之後再加1個至第二行 | bytes分別131071、131072成功；131073為INPUT_TOO_LARGE |
| DF-14 自動 | FR-02 | left:"\uD800",right:"A" | INVALID_UNICODE，side:left |
| DF-15 自動 | FR-06 | 201筆operation，page0/1/2 | 長度100/100/1；page3回INVALID_PAGE；不漏不重複 |
| DF-16 自動 | FR-08 | E("A"),D("B"),I("C") | bytes解碼為"  A\n- B\n+ C"，無最後LF |
| DF-17 自動 | FR-04 | 枚舉["A","B"]長度0..4的陣列兩兩比較 | old/new重建與來源完全相等；equal count為LCS長度；operations<=n+m |
| DF-18 自動 | FR-07 | running job2，接job1；clear後接job2 | 不採用任一舊結果 |
| DF-19 瀏覽器 | FR-10 | 一側"<script>alert(1)</script>"另一側空 | 只顯示一筆移除文字，沒有script節點、執行或網路請求 |
| DF-20 瀏覽器 | FR-07, FR-09 | 延遲worker harness下依序run→cancel、run→swap、run→clear | 無晚到結果；swap只交換原文；clear後全部空，page重設0，焦點回原版本 |
| DF-21 瀏覽器 | FR-08, FR-09 | 下載DF-16、再clear；查Blob URL及Storage | 名diff-report.txt、內容精確、URL最終撤銷；無storage/cookie/IDB寫入 |
| DF-22 瀏覽器 | FR-07, FR-09 | 頁載完成後切離線並比較；查看Network | 工作成功、沒有工作資料網路請求 |
| DF-23 瀏覽器 | FR-07 | 禁用Worker；另令worker不回覆 | UNSUPPORTED；5秒watchdog到期TIMEOUT；不走雲端 |
| DF-24 瀏覽器 | FR-06,10 | 僅鍵盤完成輸入、交換、比較、翻頁、下載 | 焦點可見、無陷阱；每頁最多100列資料DOM且總頁數正確 |
| DF-25 瀏覽器 | FR-10 | 320px與200%縮放，加入8192字長行 | 全部控制可達，結果區局部橫捲，整頁不雙向捲動；狀態不只顏色 |

Node測試只涵蓋pure functions。手動記錄瀏覽器版本與結果，不能把來源文件視為支援證據。T00後的最終命令：npm test、npm run check、npm run build；Git環境另git diff --check；瀏覽器用npm run dev，測完停止服務。
