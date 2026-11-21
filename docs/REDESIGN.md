# 網站改版紀錄與任務清單

依 `14-菸蒂快篩APP/更動.md`（全面優化規格）執行。這份清單會隨每個階段更新。

## 1. 現有架構（2026-11-21 盤點）

| 項目 | 現況 |
|---|---|
| 技術 | 純靜態 HTML + CSS + 原生 JS，沒有框架、沒有建置步驟 |
| 頁面 | `index.html` 首頁、`project.html` 不落蒂聯盟（約 1,250 行，活動全部寫在 HTML）、`squads.html` 分隊、`about.html` 關於我（含北極考察）、`interests.html` 興趣（技能樹）、`edit.html` 文字編輯區 |
| 多語言 | 中文寫在 HTML，英文、日文在 `assets/i18n.js`（`data-i18n` 代號）；預設語言為英文，偏好存在 localStorage |
| 後台 | `edit.html`：只能改文字（三語），存草稿到瀏覽器，用 GitHub 權杖把 `content.json` 寫進 `gh-pages`。密碼檢查在前端（SHA-256），真正的寫入權限靠 GitHub 權杖 |
| 部署 | 本 repo（本地 `master`）推到 `No_Butts_APP` 的 `gh-pages`；正式站 nobutts.stu.techedu.cc 由 Coolify 在 APP repo `main` 推送時建置，會抓 gh-pages 的網站壓縮檔 |
| APP | `screening/` 是 `cigarette-screening-app`（Vite + PocketBase）的建置副本；首頁、導覽列用 `assets/app-popup.js` 以視窗開啟 |
| 資料庫 | 個人網站沒有資料庫；活動、獎項、數字都寫死在 HTML / i18n.js。APP 使用 PocketBase |

## 2. 已確認的問題

| # | 問題 | 狀態 |
|---|---|---|
| 1 | 「一根菸蒂汙染 500 公升水」 | 依你的指示保留（2026-11-21）；尚未附出處，有來源時加進 site-data.js 的 references |
| 2 | 「台灣每年亂丟 900 萬根、汙染 45 億公升水」與環境部資料不符（環境部推估 ≥ 91 億根） | 已完成：改用環境部推估並註明是推估值 |
| 3 | 遊戲完成後宣稱「你保護了 6,000 公升的水」，把虛擬成果說成真實成果 | 已完成：改為說明這只是遊戲，並引導到真實行動 |
| 4 | 未成年人私人 WhatsApp 電話公開在 5 個頁面 | 已完成：從所有公開頁面移除 |
| 5 | 成果數字（17,707 / 94 / 117,608 / 300）分散寫死在多個頁面與三種語言 | 已完成：改由 `assets/site-data.js` 統一提供 |
| 6 | 數字沒有資料來源、統計截止日、計算方式 | 部分完成：已顯示來源；截止日與計算方式待提供 |
| 7 | 沒有參考文獻區 | 已完成：`project.html#sources` |
| 8 | 導覽列沒有 APP 入口 | 已完成 |
| 9 | 首頁只在介紹「網站有哪些分頁」，沒有定位與代表作品 | 已完成：新 Hero 定位、成果數據、精選專案、結尾 CTA |
| 10 | 320px 寬時不落蒂聯盟頁會橫向捲動（統計數字帶） | 已完成 |
| 11 | 遊戲的菸蒂按鈕無障礙名稱是「🚬 1」 | 已完成：改為三語文字 |
| 12 | `project.html` 過長，活動全部寫在 HTML，無法搜尋、篩選、分享單筆 | 待處理（第二階段：活動資料庫） |
| 13 | 編輯區只能改文字，照片、活動、獎項都要改程式 | 待處理 |
| 14 | 沒有深色模式、沒有 sitemap / robots / Open Graph / JSON-LD / 404 頁 | 待處理 |
| 15 | 仍公開私人 Gmail（目前唯一聯絡方式） | 需要你決定：建議改用專門的公開信箱或聯絡表單 |

## 3. 尚未驗證

- 17,707 根、94 場、117,608 觸及的統計口徑：是否重複計算、是否混入三重分隊數字、觸及人次是否含社群瀏覽
- 照片是否含 EXIF GPS（尚未掃描）
- 各頁效能（Lighthouse 尚未跑）
- Safari 實機（目前只用 Chromium 測試）
- APP 的資安（PocketBase 規則、上傳限制）尚未檢查

## 4. 本階段修改的檔案

- 新增 `assets/site-data.js`：成果數字、資料來源、參考文獻的唯一來源，並負責三語顯示
- 新增 `docs/REDESIGN.md`（本檔）
- `index.html`：Hero 定位與按鈕、成果數據帶、精選專案、遊戲文字與完成後引導、結尾 CTA
- `project.html`：Hero 科學數據改寫（附 [1][2]）、數字改用 `data-stat`、`#tech`、`#sources` 資料來源區
- `about.html`：成長故事中的 500 公升說法、北極區塊加 `#arctic`
- `squads.html`：數字改用 `data-stat`
- 全部公開頁面：移除 WhatsApp、導覽列加 APP 入口
- `assets/i18n.js`：上述內容的英文、日文
- `assets/game.js`：完成後顯示引導連結、按鈕無障礙名稱
- `assets/style.css`：新區塊樣式、窄螢幕統計數字

沒有新增任何套件。

## 5. 怎麼改數字

打開 `assets/site-data.js`，改 `stats` 裡的 `value`。知道統計截止日或計算方式時，填進 `asOf`（例如 `'2026-11-01'`）和 `method`（`{ zh: '…', en: '…', ja: '…' }`），網站會自動顯示；留 `null` 就不顯示。

## 6. 測試紀錄（2026-11-21，本機 Chromium）

- 5 個公開頁面 × 寬度 320 / 390 / 768 / 1280 × 中英日：無 Console Error、無 404、無橫向捲動
- 數字在三語都正確顯示，參考文獻區顯示 2 筆
- 遊戲：觸控撿完 12 根後顯示完成文字與 4 個引導連結；按「再玩一次」後引導隱藏
- 未測：Safari、實機、Lighthouse、正式站

## 7. 部署與回復

- 開發分支：`redesign`（已推到 GitHub，不影響正式站）
- 改版前備份：tag `backup-before-redesign-2026-11-21`
- 上線：確認後執行 `git push origin redesign:gh-pages`，再觸發 APP repo 重新部署
- 回復：`git push -f origin backup-before-redesign-2026-11-21:gh-pages`，再重新部署

## 8. 需要你提供

1. 成果數字的統計截止日與計算方式（尤其 117,608 觸及人次包含哪些來源）
2. 是否要建立專門的公開合作信箱，取代私人 Gmail
3. 300+ 論壇人數的資料來源（目前不顯示來源）
4. 智慧攔截網、菸蒂拐杖的測試數據（沒有就維持不顯示）

## 9. 下一步（第一階段剩餘 → 第二階段）

- 把 `project.html` 的活動改成 JSON 活動資料庫，支援搜尋、篩選、單筆網址
- 導覽列重整為 7 大區，拆分不落蒂聯盟頁
- 北極研究、科學與科技獨立頁面
- 編輯區擴充到活動、獎項、最新消息
- SEO（sitemap、robots、Open Graph、JSON-LD、404）、深色模式
