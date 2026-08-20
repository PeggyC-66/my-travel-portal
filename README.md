# ✈️ 零基礎上手！多行程雲端旅遊手冊發布指南 (v2.0)

這是一份專門為**非資訊背景人員**設計的教學說明。我們會用最白話的方式，教您如何將寫好的「多行程旅遊手冊網頁」放上網路，讓同行的團員直接用手機開啟網頁檢視。

---

## 📖 這是一個什麼樣的專案？

簡單來說，這是一個**「通用型雲端多行程旅遊手冊」**。
* **團員看到的手冊網頁**：精美的日式雜誌風排版，可以隨時在手機上看航班時間、飯店地圖、每天的行程時間軸，還能把必吃美食打勾。
* **多行程動態載入**：支援管理多趟不同的旅遊行程（例如：日本賞櫻、泰國度假、國內家庭旅遊等），使用者登入後可透過下拉選單自由切換不同的手冊內容。
* **安全保護機制**：網站加了門禁鎖，大家要用 Google 帳戶登入。只有在該行程「授權名單內」的團員能看到該次行程。
* **管理員後台**：身為管理員的您，可以直接在網頁上建立新行程、修改行程、上傳景點照片，這些修改會自動同步儲存到您個人的 Google 雲端試算表中。

---

## 🛠️ 第一步：準備工作 (只需做一次)

在開始前，我們需要準備好開發工具。這就像是我們要出國，得先辦好護照（帳號）跟買好行李箱（軟體）：

### 1. 註冊 GitHub 帳號 (您的免費雲端櫥窗)
* 前往 [GitHub 官網](https://github.com/)。
* 點擊右上角 **Sign up** 註冊一個免費帳號，並記下您的 **使用者名稱 (Username)**。

### 2. 安裝 Git 軟體 (雲端傳送門)
* Git 是一個小軟體，負責把您電腦裡的網頁檔案，「傳送」到剛才註冊的 GitHub 雲端上。
* 前往 [Git 下載頁面](https://git-scm.com/downloads) 下載並安裝（一直點「下一步/Next」即可）。
* > [!IMPORTANT]
  > **請務必先安裝 Git 軟體，再進行下一步安裝 IDE**。否則 IDE 內將無法自動識別 Git 的相關功能！

### 3. 安裝 Antigravity IDE (您的智慧型手冊編輯器)
* Antigravity IDE 是一款內建 AI 助手的智慧型開發工具，讓您可以直接用它打開這個專案，點幾下按鈕就能完成本機測試或上傳。
* 請下載並安裝 Antigravity IDE。
* 安裝完成後，開啟 Antigravity IDE，點選 **「開啟資料夾 (Open Folder)」** 並選擇此專案目錄 `okayama-2027-v2`。

---

## 🚀 第二步：將網頁放上網路 (只需 4 個步驟)

請對照下表，跟著步驟一步步操作：

| 步驟編號 | 操作名稱 | 具體怎麼做與重要細節 |
| :--- | :--- | :--- |
| **Step 1** | **建立雲端倉庫** | 1. 登入 GitHub，點擊右上角綠色按鈕 **New**。<br>2. **設定詳細指南**：<br>&nbsp;&nbsp;&nbsp;&nbsp;* **Repository name (倉庫名稱)**：輸入英文（例如：`my-travel-portal`）。<br>&nbsp;&nbsp;&nbsp;&nbsp;* **公開度 (Public/Private)**：**請選擇 Public (公開)**。免費帳號只有公開倉庫才能使用免費的 GitHub Pages 功能。請放心，我們的敏感 ID 都藏在後端，公開程式碼不會洩漏您的隱私。<br>&nbsp;&nbsp;&nbsp;&nbsp;* **初始化設定 (重要)**：底下的 **Add a README file**、**Add .gitignore**、**Choose a license** 等核取方塊**一律不要勾選**！因為這些檔案我們本機已經做好了，勾選會導致檔案衝突。<br>3. 點擊最下方的 **Create repository** 建立檔案櫃。 |
| **Step 2** | **開啟 IDE 終端機** | 1. 在 Antigravity IDE 中，按下鍵盤快捷鍵 `` Ctrl + ` ``（反單引號，位於 Esc 鍵下方）。<br>2. 這會在視窗下方自動開啟一個內建的黑色終端機對話視窗。 |
| **Step 3** | **輸入上傳指令** | *如果您害怕打指令，請跳到下方閱讀「指令恐懼？讓 AI 助理代勞！」說明。*<br><br>請在終端機視窗中，依序複製並貼上以下指令（每打一行就按一次 Enter 鍵）：<br>*(請把最後一行的「您的帳號」換成您的 GitHub 使用者名稱)*<br>```bash<br>git add .<br>git commit -m "feat: 第一次上傳網頁"<br>git branch -M main<br>git remote add origin https://github.com/您的帳號/my-travel-portal.git<br>git push -u origin main<br>``` |
| **Step 4** | **啟動網頁發布** | 1. 回到 GitHub 剛建立好的倉庫網頁，點選上方橫排的 **Settings (設定)**。<br>2. 在左側選單找到 **Pages**。<br>3. 在 Source 選擇 `Deploy from a branch`。<br>4. 在 Branch 選擇 `main`，然後按 **Save (儲存)**。 |

> [!NOTE]
> 完成 Step 4 後，稍等約 1 分鐘，該 Pages 頁面上方就會出現一行網址（例如 `https://您的帳號.github.io/my-travel-portal/`）。
> 這條網址就是您的專屬手冊網址，可以直接發給親友團員囉！

---

## 🤖 指令恐懼？讓 AI 助理代勞！

如果您不想手動在終端機輸入那些複雜的指令（Step 3），您可以直接在 Antigravity IDE 的右側 AI 對話視窗中，下達提示詞（Prompt）請 AI 助理幫您執行：

### 📋 提示詞範本 (可直接複製使用)

> **對 AI 助理說：**
> 「我已經在 GitHub 上建立好倉庫了，網址是 `https://github.com/您的帳號/my-travel-portal.git`。請幫我：
> 1. 初始化此專案的 Git 並執行第一次 Commit（訊息請用繁體中文符合 Conventional Commits 格式）。
> 2. 將專案關聯到上述遠端倉庫的 main 分支。
> 3. 將程式碼推送到該遠端倉庫。」

AI 助理收到後，會自動在背景幫您執行完所有的終端機指令，您只需要在畫面上點擊確認即可！

---

# 🛠️ 進階：技術人員設定指南

若您是開發者，需要進行後台 API 與 Google 雲端權限整合，請參照以下設定步驟：

### 1. 建立 Google 試算表（主控資料庫）
1.  在您的 Google 雲端硬碟建立一個新的試算表，命名為 `Trip Master Database`。
2.  建立第一個工作表，命名為 `Trips`，欄位如下：
    *   `uuid` (行程唯一 ID，用於對外切換行程)
    *   `name` (行程名稱)
    *   `sheet_id` (該行程的 Google Sheet ID)
    *   `folder_id` (該行程用於存放圖片的 Google Drive 資料夾 ID)
    *   `allowed_users` (授權的團員 Email，以逗號分隔，例如 `user1@gmail.com,user2@gmail.com`)
3.  建立第二個工作表，命名為 `Admins`，欄位如下：
    *   `email` (管理員的 Email)

### 2. 建立 Google Apps Script 後端
1.  開啟 [Google Apps Script 儀表板](https://script.google.com/)，新建一個專案。
2.  複製本專案中的 `gas-code.js` 內容，貼入 GAS 的 `代碼.gs` 檔案中。
3.  修改 `gas-code.js` 最上方的 `MASTER_SHEET_ID` 為您在第一步建立的主控試算表 ID。
4.  點擊右上角 **「部署」 -> 「新增部署」**：
    *   **類型**：網頁應用程式 (Web App)
    *   **執行身分**：我 (管理員帳號 - Me)
    *   **誰有權限存取**：任何人 (Anyone)
5.  完成部署後，複製產生的 **網頁應用程式網址 (GAS API URL)**。

### 3. 申請 Google OAuth 用戶端 ID
1.  前往 [Google Cloud Console](https://console.cloud.google.com/)。
2.  建立新專案，並在 「OAuth 同意畫面」 設定應用程式名稱與支援 Email。
3.  前往 「憑證」 頁面，點擊 **「建立憑證」 -> 「OAuth 用戶端 ID」**：
    *   **應用程式類型**：網頁應用程式
    *   **已授權的 JavaScript 來源**：
        *   開發時：`http://localhost` 或 `http://127.0.0.1`
        *   部署後：`https://<你的GitHub帳號>.github.io`
4.  複製產生的 **用戶端 ID (Client ID)** 並填入 `index.html` 的佔位符。
