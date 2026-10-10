# 產品規格

這是規格，尚未實作。

| ID | MVP 可觀察行為 |
|---|---|
| FR-01 | 兩個有明確 label 的 textarea：「原版本」、「新版本」。預設皆空，不預填範例，不自動讀剪貼簿／檔案。按「比較文字」才運算。 |
| FR-02 | 每側原始 UTF-8 最多131,072 bytes，UTF-16 length也不得超過131,072；換行正規化後最多1,000行，單行最多8,192 code units。空來源合法；任何一側超限都不算部分結果。拒絕未配對 surrogate。 |
| FR-03 | CRLF/孤立CR固定轉LF後分行；不更改其他字元。空字串是0行；非空 split("\n")，尾LF產生末尾空行，因此 "A" 和 "A\n" 不同。CRLF 與 LF 的差異本身不顯示，介面永久揭露。 |
| FR-04 | 行以完整字串精確相等判斷，包含空白與大小寫。以LCS產生 equal/delete/insert；多條最佳路徑相同長度時優先刪除原版本行，結果固定可重現。替換顯示先移除、後新增，沒有自創 replace kind。 |
| FR-05 | 結果提供每行的原行號／新行號、狀態文字與內容；空行標「空行」作輔助但不修改實際text。equal有兩側行號，delete新行號為null，insert原行號為null。顯示新增／移除／保留行數。 |
| FR-06 | 結果最多2,000 operations，每頁100筆，預設第一頁；「上一頁／下一頁」與總頁數一直可見，無隱藏截斷、無無限捲動。空結果0頁；不折疊未變更行。 |
| FR-07 | 專用worker，5秒watchdog、可取消。編輯任一輸入或按交換即取消並清舊結果；交換只互換來源，不自動重算。jobId阻止舊回覆。能力不足時停止，不走雲端。 |
| FR-08 | 成功後可下載純文字 diff-report.txt；每行前綴 equal為兩空格、delete為"- "、insert為"+ "，LF連接，無最後額外LF。這是閱讀報告，不能直接當Git patch。空操作結果不提供下載。輸出最多524,288 bytes。 |
| FR-09 | 全部清除終止worker、清來源／結果／分頁／錯誤／統計、撤銷Blob URL；焦點回原版本。資料只在記憶體，不保存歷史、URL、storage或logs。 |
| FR-10 | 全部來源文字以value/textContent展示，永不解讀HTML。鍵盤、320px、200%縮放都可完成整段工作；錯誤不含原文片段。 |

狀態 idle、dirty、running、success、empty、error。兩側都空比較為 empty；兩側同樣非空則 success並顯示「內容相同（換行統一為 LF 後）」，不是「沒有資料」。結果只保留當前一次，clear不會撤銷已存的下載檔，不宣稱安全抹除記憶體。

錯誤碼：INPUT_TOO_LARGE、LINE_LIMIT、LINE_TOO_LONG、INVALID_UNICODE、UNSUPPORTED、TIMEOUT、WORKER_FAILED、OUTPUT_TOO_LARGE。錯誤帶side:"left"|"right"|null供對應輸入，不帶原字串。

延後任何忽略大小寫／空白的比較選項、字元highlight、合併及patch功能，避免首次MVP產生不明確語義。
