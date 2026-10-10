# 逐行差異介面決定

模式：Product App。使用者核對短文、清單或設定的兩個版本，成功時看清行號和新增／移除／保留，並能取得閱讀報告。工作內容不持久化；不替使用者修改原文。

主要物件是兩份原文與一張逐行結果表。固定可見：輸入、交換、比較、清除、換行規則／上限；相鄰：取消、下載、統計、上一頁／下一頁。說明及 FAQ 在下方。沒有額外設定。

色彩依家族 tokens：paper #f3f0e8、ink #111410、white #ffffff、acid #c8f56a；新增 success surface/text，刪除 danger surface/text，保留用中性白。唯一視覺辨識為結果的兩欄行號及 = / − / + 文字狀態；酸綠只給比較主動作。

系統 UI 字型，資料文字用系統 monospace；無字型下載。標題上限 32px，44px 原生按鈕，雙層焦點。產品沒有 sidebar，主畫布全寬是本工作所需的模式，沿用 48rem/75rem 斷點及 1/1.5/2rem gutter。

```text
桌面：品牌／同語首頁                              語言／清除
      標題、規則
      原版本 textarea          新版本 textarea
      交換                         比較／取消
      狀態、行數                         下載
      原行│新行│狀態│內容（局部橫捲）
      上一頁        頁碼        下一頁
      說明、限制、FAQ

手機：品牌／語言／清除（可換行）
      標題、規則
      原版本 textarea
      新版本 textarea
      交換／比較／取消（可換行）
      狀態、統計、下載
      有名稱的局部捲動結果表
      上一頁／頁碼／下一頁
      說明、FAQ
```

狀態：idle、dirty、running、success、empty、error（UNSUPPORTED 屬 error）；沒有部分結果、帳號或認證流程，不捏造這些狀態。視覺 QA 以實際 desktop/mobile screenshots 和鍵盤／重排流程記錄，一輪檢視、必要的一批修正後一次確認。
