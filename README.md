# 展間客戶總覽 — Node.js 版本

這是「展間客戶總覽」系統的 Node.js 後端版本，取代原本依賴 Firebase 的單一 `index.html` 版本，改成跟 `art-painting-system` 一樣的專案架構：

```
taichung-showroom-node/
├── server.js          # 程式進入點，啟動 Express 伺服器
├── package.json
├── db/
│   ├── database.js    # SQLite 連線（用 Node.js 內建的 node:sqlite，不用另外編譯套件）
│   ├── schema.js       # 資料表結構
│   └── seed.js          # 第一次啟動、資料庫是空的時候，自動建立預設帳號
├── middleware/
│   └── auth.js         # 登入／管理員權限檢查
├── routes/
│   ├── auth.js          # 登入、登出、就地升級管理員
│   ├── customers.js     # 客戶（前台自行登記不用登入，後台管理需要登入）
│   ├── staff.js          # 業務同仁與抽成比例
│   ├── orders.js          # 案件／訂單財務資料（僅管理員）
│   └── accounts.js         # 登入帳號管理（僅管理員）
├── views/
│   └── index.html         # 網頁畫面（前台登記頁＋後台管理頁）
└── public/
    ├── style.css           # 樣式
    └── app.js               # 前端邏輯（跟後端 API 溝通、畫面渲染）
```

## 跟原本 Firebase 版本的差異

- **資料庫**：原本接 Firebase Firestore，現在改成本機 SQLite 檔案（`db/data.sqlite`），不依賴任何外部服務。
- **登入方式**：原本帳號密碼只存在 Firestore、由瀏覽器端自行比對（形同虛設的保護），現在密碼會先加密（bcrypt 雜湊）才存進資料庫，登入驗證與權限檢查都在伺服器端進行，才是真正有效的保護。
- **即時同步**：原本用 Firestore 的即時推播，現在改成每 6 秒自動向伺服器要一次最新資料（輪詢），多人同時使用時，畫面會在幾秒內看到彼此的更新（不是完全即時，但已足夠一般展間使用情境）。
- **畫面與操作方式**：前台顧客登記頁、後台各項功能（客戶總覽、案件管理、報價單、業務管理、權限管理）的操作方式跟原本完全一樣，沒有變動。

## 本機執行

需要 **Node.js 22.5 以上版本**（因為用到內建的 `node:sqlite` 模組）。

```bash
npm install
npm start
```

啟動後打開 <http://localhost:3000> 即可使用。第一次啟動、資料庫還是空的時候，系統會自動建立兩組預設帳號：

- 帳號 `admin` ／ 密碼 `9999`（管理員）
- 帳號 `staff` ／ 密碼 `1234`（操作人員）

建議上線後立刻到「權限管理」把預設密碼換掉。

## 部署到 Render

請參考隨附的 `DEPLOYMENT.md`。
