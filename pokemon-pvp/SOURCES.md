# GO 智能研究所 — 公開資料來源

本專案為獨立 Pokémon GO 粉絲工具，**不會存取使用者 Pokémon GO 帳戶**。所有計算與分析不代表遊戲官方結果。

## 採用資料

| 來源 | 用途 | 網址 |
|---|---|---|
| WatWowMap / pogo-data-api | Pokémon GO 物種資料、基礎能力值、招式、屬性及繁體中文翻譯 | https://github.com/WatWowMap/pogo-data-api |
| PvPoke | PVP 超級／高級／大師聯盟排名、推薦招式及模擬對局 | https://github.com/pvpoke/pvpoke |
| PoGO API | CP 倍率、強化費用及進化資料 | https://pogoapi.net/documentation/ |
| Leek Duck / Leak Duck feed | 團體戰、活動日曆、田野調查、火箭隊陣容及蛋池 | https://leekduck.com/ |
| Pokémon GO 官方網站 | 官方公告連結 | https://pokemongo.com/news |
| Pokémon GO Hub RSS | 第三方攻略與新聞（與官方公告分開顯示） | https://pokemongohub.net/feed/ |
| PokeAPI Sprites | 圖鑑小圖示 | https://github.com/PokeAPI/sprites |

資料屬於各自原始權利人，請遵守原始專案授權及使用條款。PvPoke 程式碼為 MIT 授權，但遊戲資料、美術與角色的權利不等於 MIT 授權。本網站與 Niantic、The Pokémon Company 或 Nintendo 無關。

## 資料更新

GitHub Actions `.github/workflows/pages.yml` 每小時執行，使用 `sync_data.py` 下載並驗證公開資料、產生 `data/*.json`，隨後發布 GitHub Pages。同步項目包括圖鑑、招式、PVP 排名、團體戰、活動、田野調查、火箭隊陣容、蛋池及新聞。更新不成功時，保留既有快照；如首次部署未取得必要資料，工作流程會停止而不是發布虛假結果。前端如未找到快照，會嘗試直接載入公開來源，並顯示狀態。

來源的「目前團體戰 Boss」可能與實際地區和當日活動不同，請以遊戲或官方活動公告為準。

## 計算限制

- CP 公式：`max(10, floor((baseAtk + atkIV) × sqrt(baseDef + defIV) × sqrt(baseSta + staIV) × CPM² / 10))`。
- CPM 1–45 來自 PoGO API；如來源缺少 45.5–50，使用已知等級 45 倍率按每半級 +0.0025 的規則推算，並在快照 meta 標示。較新遊戲等級上限或機制變更可能需要重新校正。
- PVP IV 排名比較同一物種 4,096 種 IV 組合的乘積，**不是** PvPoke 的實際對戰排名。
- PVP 隊伍分析只按屬性、招式池、公開排名提供啟發式建議；不取代 PvPoke Battle Simulator。
- 團體戰攻擊手依屬性有效性及基礎攻擊能力做簡易排序，並未模擬完整 DPS、坦度、天氣、Mega、Shadow、友情及各種特殊效果。
- AI 智能分析目前是**本地規則式分析引擎**，不是串接雲端 LLM，也沒有付費 API Key；所有結論應以顯示來源交叉核實。

## 私隱與成本

本網站不要求遊戲帳號、密碼或 API Key，也不會透過網站讀取遊戲資產。GitHub Pages 靜態託管和 GitHub Actions 運行仍須符合 GitHub 帳戶的服務及用量限制。
