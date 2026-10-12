export const messages = Object.freeze({
  'zh-Hant': {
    locale: 'zh-Hant', compare: '比較文字', busy: '正在比較…',
    summary: '新增 {inserted} 行、移除 {deleted} 行、保留 {equal} 行',
    page: '{current} / {total} 頁', pageSummary: '顯示第 {current} 頁，共 {total} 頁。',
    cancelled: '已取消比較，兩份原文保留。', reportFailed: '報告未能下載，請查看錯誤說明。', reportRetry: '報告未能下載，請重試。',
    blank: '空行', left: '原版本', right: '新版本', text: '文字',
    kinds: { equal: '= 保留', delete: '− 移除', insert: '+ 新增' },
    changes: {
      selected: '第 {current} / {total} 段差異', unselected: '0 / {total} 段差異',
      prompt: '按「下一段差異」定位改動；一般翻頁仍可閱讀所有行。', none: '沒有差異段。',
      visible: '目前選取的差異段在本頁；起點位於第 {page} 頁。',
      offPage: '目前選取的差異段不在本頁；起點位於第 {page} 頁。',
      located: '已定位第 {current} / {total} 段差異，起點位於第 {page} 頁。',
      start: '差異段起點', member: '選取段差異'
    },
    statuses: {
      idle: '貼上原版本和新版本，再比較差異。', dirty: '文字已變更，請重新比較。', running: '正在比較逐行差異…',
      empty: '兩邊都沒有文字，請先輸入要比較的內容。', error: '比較未完成，請查看錯誤說明。',
      same: '內容相同（換行統一為 LF 後）。', complete: '比較完成：{summary}。'
    },
    errors: {
      INPUT_TOO_LARGE: '{side}超過 128 KiB 上限，請分段比較。', LINE_LIMIT: '{side}超過 1,000 行，請分段比較。',
      LINE_TOO_LONG: '{side}的單行超過 8,192 個 UTF-16 單位，請拆分長行。', INVALID_UNICODE: '{side}含不完整的 Unicode 字元，請重新貼上。',
      UNSUPPORTED: '此瀏覽器缺少本機比較能力，無法開始。請改用支援的瀏覽器。', TIMEOUT: '比較超過 5 秒上限，請拆成較小段落再試。',
      WORKER_FAILED: '本機比較未完成，請重新比較；若持續失敗，請縮小內容。', OUTPUT_TOO_LARGE: '報告超過 512 KiB，請分段比較後再下載。', INVALID_INPUT: '文字格式無法比較，請重新貼上。'
    }
  },
  en: {
    locale: 'en', compare: 'Compare text', busy: 'Comparing…',
    summary: 'Added: {inserted}; removed: {deleted}; unchanged: {equal} (lines)',
    page: 'Page {current} of {total}', pageSummary: 'Showing page {current} of {total}.',
    cancelled: 'Comparison cancelled. Both versions are kept.', reportFailed: 'The report could not be downloaded. Check the error below.', reportRetry: 'The report could not be downloaded. Try again.',
    blank: 'Empty line', left: 'Original version', right: 'New version', text: 'Text',
    kinds: { equal: '= Unchanged', delete: '− Removed', insert: '+ Added' },
    changes: {
      selected: 'Change {current} of {total}', unselected: 'Change 0 of {total}',
      prompt: 'Use Next change to find edits. Page controls still show every line.', none: 'No change groups.',
      visible: 'The selected change is on this page. It starts on page {page}.',
      offPage: 'The selected change is not on this page. It starts on page {page}.',
      located: 'Located change {current} of {total}, starting on page {page}.',
      start: 'Change starts here', member: 'Selected change'
    },
    statuses: {
      idle: 'Paste the original and new versions, then compare.', dirty: 'Text changed. Compare again to update the result.', running: 'Comparing lines…',
      empty: 'Both versions are empty. Enter some text to compare.', error: 'Comparison did not finish. Check the error below.',
      same: 'The contents match after line endings are normalized to LF.', complete: 'Comparison complete. {summary}.'
    },
    errors: {
      INPUT_TOO_LARGE: '{side} exceeds 128 KiB. Compare smaller sections.', LINE_LIMIT: '{side} exceeds 1,000 lines. Compare smaller sections.',
      LINE_TOO_LONG: '{side} has a line exceeding 8,192 UTF-16 units. Split the long line.', INVALID_UNICODE: '{side} contains an incomplete Unicode character. Paste the text again.',
      UNSUPPORTED: 'This browser lacks the features needed for local comparison. Use a supported browser.', TIMEOUT: 'Comparison exceeded the 5-second limit. Try smaller sections.',
      WORKER_FAILED: 'Local comparison did not finish. Try again, or compare smaller sections.', OUTPUT_TOO_LARGE: 'The report exceeds 512 KiB. Compare smaller sections before downloading.', INVALID_INPUT: 'The text could not be compared. Paste it again.'
    }
  }
});

export const interpolate = (template, values = {}) => template.replace(/\{(\w+)\}/gu, (_, key) => String(values[key] ?? ''));
