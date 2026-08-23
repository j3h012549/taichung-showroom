# 部署到 Render（跟 art-painting-system 一樣的做法）

這個新版本是 Node.js 後端程式（不是單一 `index.html`），所以跟原本「上傳一個 html 檔案」的做法不一樣，Render 那邊也需要改用**「Web Service」**（原本 taichung-showroom 用的是 Static Site，沒辦法跑後端程式，資料庫也沒地方存）。以下步驟跟 `art-painting-system` 的設定方式完全對應。

## 第一步：把新程式碼放進 GitHub 的 taichung-showroom 這個 repo

1. 打開 <https://github.com/j3h012549/taichung-showroom>
2. 先把裡面舊的檔案刪掉（`index.html` 或 `index_12.html`）— 新架構會取代它，兩邊並存反而會讓 Render 不知道要跑哪個。
   - 進到檔案頁面 → 點檔案 → 右上角垃圾桶圖示 → Commit（刪除）
3. 把這個資料夾裡的所有檔案／資料夾拖拉上傳（**不要包含 `node_modules` 這個資料夾**，這個之後 Render 會自動幫你安裝，不用手動上傳）：
   ```
   server.js
   package.json
   package-lock.json
   README.md
   DEPLOYMENT.md
   db/
   middleware/
   routes/
   views/
   public/
   ```
4. 上傳後記得點 "Commit changes" 儲存。

> 提醒：一定要保持資料夾結構（例如 `db/database.js` 要在 `db` 資料夾裡面），不能把裡面的檔案全部攤平丟在最外層，不然程式會找不到檔案。GitHub 網頁版拖拉上傳資料夾時通常會自動保留結構，如果沒有，可以一個資料夾一個資料夾分次上傳。

## 第二步：在 Render 建立一個新的 Web Service

原本的 taichung-showroom 是「Static Site」，沒辦法拿來跑 Node 後端，需要新建一個「Web Service」（跟 art-painting-system 一樣）：

1. 到 Render 後台 <https://dashboard.render.com> → **New** → **Web Service**
2. 選擇 GitHub 上的 `taichung-showroom` 這個 repo
3. 設定：
   - **Name**：可以取 `taichung-showroom`（如果名稱被舊的 Static Site 占用，可以先把舊的那個 Static Site 服務刪掉，或取別的名字，例如 `taichung-showroom-web`）
   - **Runtime**：Node
   - **Build Command**：`npm install`
   - **Start Command**：`npm start`
   - **Instance Type**：Free 即可（跟 art-painting-system 一樣先用免費方案）

## 第三步：加一個 Disk（資料庫要存在這裡，不然重新部署資料就不見了）

跟 art-painting-system 一樣，SQLite 資料庫檔案要存在 Render 的**持久化磁碟（Disk）**上，不能存在程式本身的資料夾裡，不然每次重新部署（更新程式碼）資料都會被清空。

1. 建好 Web Service 後，進到該服務 → 左側選單 **Disks**
2. 新增一個 Disk：
   - **Name**：例如 `data`
   - **Mount Path**：例如 `/var/data`（跟 art-painting-system 用同樣的路徑即可）
   - **Size**：1 GB 就很夠用了

## 第四步：設定環境變數

進到服務的 **Environment** 分頁，新增以下環境變數：

| Key | Value | 說明 |
|---|---|---|
| `DATA_DIR` | `/var/data`（要跟上面 Disk 的 Mount Path 一致） | 告訴程式資料庫檔案要存在 Disk 上，不會因為重新部署而消失 |
| `SESSION_SECRET` | 自訂一串亂數文字，例如 `taichung-a8x92kd0plz` | 用來加密登入 session，正式上線一定要換掉程式裡內建的預設值 |

設定完成後點 **Save Changes**，Render 會自動重新部署一次。

## 第五步：確認網站正常運作

部署完成後，打開 Render 給的網址（類似 `https://taichung-showroom.onrender.com`），應該會看到前台顧客登記頁。

- 用 `admin` / `9999` 登入管理後台，或用 `staff` / `1234` 登入操作人員身分
- **強烈建議**：登入後立刻到「權限管理」把這兩組預設密碼都改掉

## 之後要更新程式碼時

跟 art-painting-system 一樣：把改好的檔案重新上傳到 GitHub 的 `taichung-showroom` repo，Render 偵測到 repo 有更新就會自動重新部署。因為資料庫存在 Disk 上（不是存在程式碼資料夾裡），所以重新部署不會影響既有資料。

## 常見問題

**Q: 免費方案的 Web Service 會不會跟 Static Site 一樣，一段時間沒人用就「睡著」？**
A: 會。Render 免費的 Web Service 在沒有流量時會進入休眠，下次有人打開網站時，第一次讀取會慢個幾十秒（要重新啟動），之後就恢復正常速度。跟 art-painting-system 目前的行為是一樣的。如果不能接受這個延遲，需要升級成付費方案。

**Q: 如果忘記密碼怎麼辦？**
A: 目前系統沒有「忘記密碼」的自助流程。如果所有管理員帳號的密碼都忘記了，需要請我協助用資料庫層級的方式重設，或是刪除 Disk 上的資料庫檔案讓系統重新產生預設帳號（但這樣會清空所有既有資料，僅在必要時使用）。
