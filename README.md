# ✈️ 零基礎上手！多行程雲端旅遊手冊發布指南 (v2.0)

這是一份專門為**非資訊背景人員**設計的教學說明。我們會用最白話的方式，教您如何將寫好的「多行程旅遊手冊網頁」放上網路，讓同行的團員直接用手機開啟網頁檢視。

---

## 📖 這是一個什麼樣的專案？

簡單來說，這是一個**「通用型雲端多行程旅遊手冊」**。

- **📱 團員看到的手冊網頁**：精美的日式雜誌風排版，可以隨時在手機上看航班時間、飯店地圖、每天的行程時間軸，還能把必吃美食打勾。
- **🔄 多行程動態載入**：支援管理多趟不同的旅遊行程（例如：日本賞櫻、泰國度假、國內家庭旅遊等），使用者登入後可透過下拉選單自由切換不同的手冊內容。
- **🔒 安全保護機制**：網站加了門禁鎖，大家要用 Google 帳戶登入。只有在該行程「授權名單內」的團員能看到該次行程。
- **⚙️ 管理員後台**：身為管理員的您，可以直接在網頁上建立新行程、修改行程、上傳景點照片，這些修改會自動同步儲存到您個人的 Google 雲端試算表中。

---

## 📂 專案檔案結構簡介

| 檔案名稱 | 角色說明 | 是否需要修改 |
| :--- | :--- | :--- |
| `index.html` | 手冊網頁的主體架構與視覺樣式 (CSS) | 否（預設已調校完成） |
| `app.js` | 前端邏輯（負責 Google 登入驗證、畫面渲染、與後端通訊） | 是（需填入您的 Client ID 與 GAS 網址） |
| `gas-code.js` | 部署於 Google Apps Script 的雲端後端程式碼 | 是（需貼至 Google 雲端並填入主試算表 ID） |
| `.gitignore` | 設定 Git 忽略上傳的暫存檔 | 否 |
| `README.md` | 本操作說明手冊 | 否 |

---

## 🛠️ 第一步：準備工作 (只需做一次)

在開始前，我們需要準備好開發工具。這就像是我們要出國，得先辦好護照（帳號）跟買好行李箱（軟體）：

### 1. 註冊 GitHub 帳號 (您的免費雲端櫥窗)
- 前往 [GitHub 官網](https://github.com/)。
- 點擊右上角 **Sign up** 註冊一個免費帳號，並記下您的 **使用者名稱 (Username)**。

### 2. 安裝 Git 軟體 (雲端傳送門)
- Git 是一個小工具，負責把您電腦裡的網頁檔案，「傳送」到剛才註冊的 GitHub 雲端上。
- 前往 [Git 下載頁面](https://git-scm.com/downloads) 下載並安裝（一路點「下一步 / Next」即可）。
> [!IMPORTANT]
> **請務必先安裝 Git 軟體，再進行下一步安裝 IDE**。否則 IDE 內將無法自動識別 Git 的相關功能！

### 3. 安裝 Antigravity IDE (您的智慧型手冊編輯器)
- Antigravity IDE 是一款內建 AI 助手的智慧型開發工具，讓您可以直接用它打開這個專案，點幾下按鈕就能完成本機測試或上傳。
- 請下載並安裝 Antigravity IDE。
- 安裝完成後，開啟 Antigravity IDE，點選 **「開啟資料夾 (Open Folder)」** 並選擇本專案目錄。

---

## 🚀 第二步：將網頁放上網路 (只需 4 個步驟)

### Step 1：建立雲端倉庫 (Repository)
1. 登入 GitHub，點擊右上角綠色按鈕 **New**。
2. **填寫設定**：
   - **Repository name**：輸入英文名稱（例如：`my-travel-portal`）。
   - **公開度**：請選擇 **Public (公開)**（免費帳號只有公開倉庫才能使用免費的 GitHub Pages 功能；敏感 ID 都受到後端保護，不用擔心隱私外洩）。
   - **初始化設定 (重要)**：底下的 **Add a README file**、**Add .gitignore**、**Choose a license** 等核取方塊**一律不要勾選**！
3. 點擊最下方的 **Create repository** 建立倉庫。

### Step 2：開啟 IDE 終端機
1. 在 Antigravity IDE 中，按下快捷鍵 `` Ctrl + ` ``（反單引號，位於鍵盤 Esc 下方）。
2. 視窗下方會自動開啟內建的終端機黑色視窗。

### Step 3：上傳程式碼到 GitHub
在終端機中，依序輸入以下指令（將 `您的帳號` 替換為實際的 GitHub 帳號）：

```bash
git add .
git commit -m "feat: 第一次上傳網頁"
git branch -M main
git remote add origin https://github.com/您的帳號/my-travel-portal.git
git push -u origin main
```

> [!TIP]
> **指令恐懼？讓 AI 助理代勞！**
> 您可以直接複製以下提示詞發送給右側的 AI 助理：
> 
> > 「我已經在 GitHub 上建立好倉庫了，網址是 `https://github.com/您的帳號/my-travel-portal.git`。請幫我：
> > 1. 初始化此專案的 Git 並執行第一次 Commit（訊息請用繁體中文符合 Conventional Commits 格式）。
> > 2. 將專案關聯到上述遠端倉庫的 main 分支。
> > 3. 將程式碼推送到該遠端倉庫。」

### Step 4：啟動 GitHub Pages 網頁發布
1. 回到 GitHub 剛建立好的倉庫網頁，點選上方選單的 **Settings (設定)**。
2. 在左側導覽列點擊 **Pages**。
3. 在 **Build and deployment** 下方的 **Source** 選擇 `Deploy from a branch`。
4. 在 **Branch** 下拉選單選擇 `main`，然後按 **Save (儲存)**。

> [!NOTE]
> 設定完成後約等候 1~2 分鐘，重整該頁面即可在最上方看見已發布的專屬網址：
> `https://您的帳號.github.io/my-travel-portal/`
> 直接把這條網址分享給親友團員就可以在手機上瀏覽囉！

---

## 🛠️ 第三步：進階技術人員設定指南

若您是開發者，需要進行後台 API 與 Google 雲端權限整合，請參照以下設定步驟：

### 1. 建立 Google 試算表（主控資料庫）
1. 在 Google 雲端硬碟建立一個新的試算表，命名為 `Trip Master Database`。
2. 建立第一個工作表，命名為 `Trips`，欄位如下：
   - `uuid` (行程唯一 ID，用於對外切換行程)
   - `name` (行程名稱)
   - `sheet_id` (該行程的 Google Sheet ID)
   - `folder_id` (該行程用於存放圖片的 Google Drive 資料夾 ID)
   - `allowed_users` (授權的團員 Email，以逗號分隔，例如 `user1@gmail.com,user2@gmail.com`)
3. 建立第二個工作表，命名為 `Admins`，欄位如下：
   - `email` (管理員的 Email)

### 2. 建立 Google Apps Script 後端
1. 開啟 [Google Apps Script 儀表板](https://script.google.com/)，新建一個專案。
2. 複製本專案中的 `gas-code.js` 內容，貼入 GAS 的 `代碼.gs` 檔案中。
3. 修改 `gas-code.js` 最上方的 `MASTER_SHEET_ID` 為您在第一步建立的主控試算表 ID。
4. 點擊右上角 **「部署」 -> 「新增部署」**：
   - **類型**：網頁應用程式 (Web App)
   - **執行身分**：我 (管理員帳號 - Me)
   - **誰有權限存取**：任何人 (Anyone)
5. 完成部署後，複製產生的 **網頁應用程式網址 (GAS API URL)**，並填入 `app.js` 的 `GAS_API_URL` 變數中。

### 3. 申請 Google OAuth 用戶端 ID
1. 前往 [Google Cloud Console](https://console.cloud.google.com/)。
2. 建立新專案，並在 「OAuth 同意畫面」 設定應用程式名稱與支援 Email（使用者類型選擇「外部」）。
3. 前往 「憑證」 頁面，點擊 **「建立憑證」 -> 「OAuth 用戶端 ID」**：
   - **應用程式類型**：網頁應用程式
   - **已授權的 JavaScript 來源**：
     - 開發測試時：`http://localhost` 或 `http://127.0.0.1`
     - 線上部署後：`https://<你的GitHub帳號>.github.io`
4. 複製產生的 **用戶端 ID (Client ID)** 並填入 `app.js` 最上方的 `GOOGLE_CLIENT_ID` 變數中。
