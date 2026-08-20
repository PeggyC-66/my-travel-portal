// =========================================================================
// Google Apps Script 後端程式碼
// 部署時請選擇：網頁應用程式 (Web App)
// 執行身分：我 (Me - 管理員的帳號)
// 誰有權限存取：任何人 (Anyone)
// =========================================================================

// 請貼上您在第一步建立的「主控試算表 (Master Sheet)」的 ID
const MASTER_SHEET_ID = "YOUR_MASTER_SHEET_ID_HERE";

// 驗證前端傳過來的 Google ID Token (JWT)
// 透過 Google Tokeninfo API 安全解析出使用者的 Email
function verifyIdToken(token) {
  if (!token) return null;
  try {
    const url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + token;
    const response = UrlFetchApp.fetch(url);
    const json = JSON.parse(response.getContentText());
    if (json.email) {
      return json.email.toLowerCase();
    }
  } catch (e) {
    Logger.log("Token 驗證失敗: " + e.message);
  }
  return null;
}

// 取得使用者角色與可存取行程列表
function getUserAccess(email) {
  const masterSpreadsheet = SpreadsheetApp.openById(MASTER_SHEET_ID);
  
  // 1. 檢查是否為管理員
  const adminSheet = masterSpreadsheet.getSheetByName("Admins");
  const adminRows = adminSheet.getDataRange().getValues();
  let isAdmin = false;
  // 從第 2 行開始 (跳過標頭)
  for (let i = 1; i < adminRows.length; i++) {
    if (adminRows[i][0] && adminRows[i][0].toString().toLowerCase() === email) {
      isAdmin = true;
      break;
    }
  }
  
  // 2. 檢索可存取行程
  const tripSheet = masterSpreadsheet.getSheetByName("Trips");
  const tripRows = tripSheet.getDataRange().getValues();
  const allowedTrips = [];
  
  for (let i = 1; i < tripRows.length; i++) {
    const uuid = tripRows[i][0];
    const name = tripRows[i][1];
    const sheetId = tripRows[i][2];
    const folderId = tripRows[i][3];
    const allowedUsersStr = tripRows[i][4] || "";
    
    if (!uuid) continue;
    
    // 如果是管理員，可以看到所有行程
    // 如果是一般人，檢查其 Email 是否在 allowedUsersStr 清單內
    if (isAdmin) {
      allowedTrips.push({ uuid: uuid, name: name, sheet_id: sheetId, folder_id: folderId, allowed_users: allowedUsersStr });
    } else {
      const allowedEmails = allowedUsersStr.toLowerCase().split(",").map(e => e.trim());
      if (allowedEmails.indexOf(email) !== -1) {
        allowedTrips.push({ uuid: uuid, name: name }); // 一般團員隱蔽實體 Sheet & Folder ID
      }
    }
  }
  
  return {
    role: isAdmin ? "admin" : "user",
    trips: allowedTrips
  };
}

// 處理 GET 請求
function doGet(e) {
  const action = e.parameter.action;
  const authHeader = e.parameter.token || ""; // 支援 query 傳 token 或 headers 傳遞
  let token = authHeader;
  
  // 處理 CORS options
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  
  // 嘗試從 Authorization 標頭取得 Bearer token
  // 由於 GAS doGet 在某些環境可能無法完整讀取自訂 headers，故前端可雙向傳遞
  
  // 身份驗證
  const email = verifyIdToken(token);
  if (!email) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Invalid ID Token" }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
  
  const access = getUserAccess(email);
  
  if (action === "getTrips") {
    const responseData = {
      status: "success",
      role: access.role,
      trips: access.trips
    };
    return ContentService.createTextOutput(JSON.stringify(responseData))
                         .setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === "getTripData") {
    const tripUuid = e.parameter.tripUuid;
    // 檢查是否有權限讀取此行程
    const hasAccess = access.trips.some(t => t.uuid === tripUuid);
    if (!hasAccess) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Permission Denied" }))
                           .setMimeType(ContentService.MimeType.JSON);
    }
    
    // 獲取該行程對應的 Sheet ID
    const masterSpreadsheet = SpreadsheetApp.openById(MASTER_SHEET_ID);
    const tripSheet = masterSpreadsheet.getSheetByName("Trips");
    const tripRows = tripSheet.getDataRange().getValues();
    let targetSheetId = "";
    
    for (let i = 1; i < tripRows.length; i++) {
      if (tripRows[i][0] === tripUuid) {
        targetSheetId = tripRows[i][2];
        break;
      }
    }
    
    if (!targetSheetId) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Linked Sheet Not Found" }))
                           .setMimeType(ContentService.MimeType.JSON);
    }
    
    // 讀取該旅遊專屬試算表的資料
    try {
      const data = loadTripDetails(targetSheetId);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", data: data }))
                           .setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Failed to read database: " + err.message }))
                           .setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Invalid Action" }))
                       .setMimeType(ContentService.MimeType.JSON);
}

// 處理 POST 請求 (建立、修改、上傳)
function doPost(e) {
  const postData = JSON.parse(e.postData.contents);
  const action = postData.action;
  
  // 取得 Authorization Token
  // 處理 headers 驗證
  // 由於 Google Web App 的限制，通常我們在 postData 中將 token 一併帶上，或在 headers 解析
  
  // 實作上以 client 發送的 JSON postData 中的 token 或手動驗證
  // 這裡假設驗證方式同 doGet
  
  // 安全性防禦：檢查呼叫者權限
  // 我們讓前端在 body 中附帶 token 進行驗證
  const token = postData.token;
  const email = verifyIdToken(token);
  if (!email) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Unauthorized" }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
  
  const access = getUserAccess(email);
  
  // 只有管理員可以執行 POST 修改動作
  if (access.role !== "admin") {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Admin privileges required" }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
  
  const masterSpreadsheet = SpreadsheetApp.openById(MASTER_SHEET_ID);
  
  // 1. 建立新行程與初始化
  if (action === "createTrip") {
    const uuid = postData.uuid;
    const name = postData.name;
    const sheetId = postData.sheetId;
    const folderId = postData.folderId;
    const allowedUsers = postData.allowedUsers || "";
    
    const tripSheet = masterSpreadsheet.getSheetByName("Trips");
    tripSheet.appendRow([uuid, name, sheetId, folderId, allowedUsers]);
    
    // 初始化關聯試算表的結構與分頁
    try {
      initializeSubSheet(sheetId, name);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Trip created & initialized" }))
                           .setMimeType(ContentService.MimeType.JSON);
    } catch(err) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Sheet initialized failed: " + err.message }))
                           .setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  // 2. 儲存/更新行程
  if (action === "updateTripData") {
    const tripUuid = postData.tripUuid;
    const data = postData.data;
    
    // 找出對應的 Sheet ID
    const tripSheet = masterSpreadsheet.getSheetByName("Trips");
    const tripRows = tripSheet.getDataRange().getValues();
    let targetSheetId = "";
    for (let i = 1; i < tripRows.length; i++) {
      if (tripRows[i][0] === tripUuid) {
        targetSheetId = tripRows[i][2];
        break;
      }
    }
    
    if (targetSheetId) {
      saveTripDetails(targetSheetId, data);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Cloud sync success" }))
                           .setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  // 3. 上傳圖片到該行程的雲端硬碟
  if (action === "uploadImage") {
    const tripUuid = postData.tripUuid;
    const filename = postData.filename;
    const mimeType = postData.mimeType;
    const base64Data = postData.data;
    
    // 找出該行程的 Folder ID
    const tripSheet = masterSpreadsheet.getSheetByName("Trips");
    const tripRows = tripSheet.getDataRange().getValues();
    let folderId = "";
    for (let i = 1; i < tripRows.length; i++) {
      if (tripRows[i][0] === tripUuid) {
        folderId = tripRows[i][3];
        break;
      }
    }
    
    if (folderId) {
      try {
        const folder = DriveApp.getFolderById(folderId);
        const decoded = Utilities.base64Decode(base64Data);
        const blob = Utilities.newBlob(decoded, mimeType, filename);
        const file = folder.createFile(blob);
        
        // 設定共用權限為「任何知道連結的人皆可檢視」，以供網頁直接渲染
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        const fileId = file.getId();
        // 轉換為直連預覽網址
        const previewUrl = "https://drive.google.com/uc?export=view&id=" + fileId;
        
        return ContentService.createTextOutput(JSON.stringify({ status: "success", url: previewUrl }))
                             .setMimeType(ContentService.MimeType.JSON);
      } catch (err) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Drive upload failed: " + err.message }))
                             .setMimeType(ContentService.MimeType.JSON);
      }
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Action handler not found" }))
                       .setMimeType(ContentService.MimeType.JSON);
}

// 初始化關聯試算表結構
function initializeSubSheet(sheetId, tripName) {
  const ss = SpreadsheetApp.openById(sheetId);
  
  // 1. 基本資訊頁 (Info)
  let infoSheet = ss.getSheetByName("Info");
  if (!infoSheet) infoSheet = ss.insertSheet("Info");
  infoSheet.clear();
  infoSheet.appendRow(["Key", "Value"]);
  infoSheet.appendRow(["Name", tripName]);
  infoSheet.appendRow(["StartDate", "2027-02-12"]);
  infoSheet.appendRow(["EndDate", "2027-02-19"]);
  infoSheet.appendRow(["Duration", "8天7夜"]);
  
  // 2. 準備清單頁 (Checklist)
  let checklistSheet = ss.getSheetByName("Checklist");
  if (!checklistSheet) checklistSheet = ss.insertSheet("Checklist");
  checklistSheet.clear();
  checklistSheet.appendRow(["id", "cat", "title", "note", "link", "done"]);
  checklistSheet.appendRow(["1", "證件", "護照與簽證", "出發前檢查效期需大於6個月", "", "FALSE"]);
  
  // 3. 航班與住宿 (Flights)
  let flightsSheet = ss.getSheetByName("Flights");
  if (!flightsSheet) flightsSheet = ss.insertSheet("Flights");
  flightsSheet.clear();
  flightsSheet.appendRow(["Type", "airline", "no", "from", "to", "date", "dep", "arr", "note"]);
  flightsSheet.appendRow(["out", "虎航", "IT214", "TPE桃園", "OKJ岡山", "2027-02-12", "11:30", "15:05", "準時登機"]);
  flightsSheet.appendRow(["in", "虎航", "IT215", "OKJ岡山", "TPE桃園", "2027-02-19", "15:55", "17:40", ""]);
  
  // 4. 飯店資訊 (Hotel)
  let hotelSheet = ss.getSheetByName("Hotel");
  if (!hotelSheet) hotelSheet = ss.insertSheet("Hotel");
  hotelSheet.clear();
  hotelSheet.appendRow(["name", "addr", "checkin", "checkout", "nights", "note"]);
  hotelSheet.appendRow(["岡山格蘭比亞大酒店", "〒700-0024 岡山県岡山市北区駅元町1-5", "2027-02-12", "2027-02-19", "7晚", "岡山站直結，出站即達"]);
  
  // 5. 行程規劃 (Days)
  let daysSheet = ss.getSheetByName("Days");
  if (!daysSheet) daysSheet = ss.insertSheet("Days");
  daysSheet.clear();
  daysSheet.appendRow(["dayId", "date", "title", "time", "place", "desc", "imgUrl"]);
  daysSheet.appendRow(["Day 1", "2月12日（五）", "岡山空港 ➔ 岡山車站", "15:30", "岡山桃太郎空港", "搭乘接駁巴士前往市區", ""]);
  
  // 6. 美食清單 (Food)
  let foodSheet = ss.getSheetByName("Food");
  if (!foodSheet) foodSheet = ss.insertSheet("Food");
  foodSheet.clear();
  foodSheet.appendRow(["id", "emoji", "name", "area", "desc", "must", "done"]);
  foodSheet.appendRow(["f1", "🦪", "日生 牡蠣燒 (お好み焼き)", "日生町", "岡山限定冬季美味", "TRUE", "FALSE"]);
}

// 從個別試算表加載完整 JSON 資料
function loadTripDetails(sheetId) {
  const ss = SpreadsheetApp.openById(sheetId);
  const result = {};
  
  // 1. Info
  const infoRows = ss.getSheetByName("Info").getDataRange().getValues();
  result.name = infoRows[1][1];
  result.startDate = Utilities.formatDate(new Date(infoRows[2][1]), Session.getScriptTimeZone(), "yyyy-MM-dd");
  result.endDate = Utilities.formatDate(new Date(infoRows[3][1]), Session.getScriptTimeZone(), "yyyy-MM-dd");
  result.duration = infoRows[4][1];
  
  // 2. Checklist
  result.checklist = [];
  const chRows = ss.getSheetByName("Checklist").getDataRange().getValues();
  for (let i = 1; i < chRows.length; i++) {
    result.checklist.push({
      id: chRows[i][0],
      cat: chRows[i][1],
      title: chRows[i][2],
      note: chRows[i][3],
      link: chRows[i][4],
      done: chRows[i][5].toString().toUpperCase() === "TRUE"
    });
  }
  
  // 3. Flights
  result.flights = { out: {}, in: {} };
  const flRows = ss.getSheetByName("Flights").getDataRange().getValues();
  for (let i = 1; i < flRows.length; i++) {
    const type = flRows[i][0];
    const data = {
      airline: flRows[i][1],
      no: flRows[i][2],
      from: flRows[i][3],
      to: flRows[i][4],
      date: Utilities.formatDate(new Date(flRows[i][5]), Session.getScriptTimeZone(), "yyyy-MM-dd"),
      dep: flRows[i][6],
      arr: flRows[i][7],
      note: flRows[i][8]
    };
    if (type === "out") result.flights.out = data;
    if (type === "in") result.flights.in = data;
  }
  
  // 4. Hotel
  const hoRows = ss.getSheetByName("Hotel").getDataRange().getValues();
  result.hotel = {
    name: hoRows[1][0],
    addr: hoRows[1][1],
    checkin: Utilities.formatDate(new Date(hoRows[1][2]), Session.getScriptTimeZone(), "yyyy-MM-dd"),
    checkout: Utilities.formatDate(new Date(hoRows[1][3]), Session.getScriptTimeZone(), "yyyy-MM-dd"),
    nights: hoRows[1][4],
    note: hoRows[1][5]
  };
  
  // 5. Days
  result.days = [];
  const dyRows = ss.getSheetByName("Days").getDataRange().getValues();
  const dayMap = {};
  for (let i = 1; i < dyRows.length; i++) {
    const dayId = dyRows[i][0];
    const date = dyRows[i][1];
    const dayTitle = dyRows[i][2];
    const time = dyRows[i][3];
    const place = dyRows[i][4];
    const desc = dyRows[i][5];
    const imgUrl = dyRows[i][6];
    
    if (!dayMap[dayId]) {
      dayMap[dayId] = {
        id: dayId,
        date: date,
        title: dayTitle,
        items: []
      };
      result.days.push(dayMap[dayId]);
    }
    
    if (place) {
      dayMap[dayId].items.push({
        time: time,
        place: place,
        desc: desc,
        imgUrl: imgUrl
      });
    }
  }
  
  // 6. Food
  result.food = [];
  const fdRows = ss.getSheetByName("Food").getDataRange().getValues();
  for (let i = 1; i < fdRows.length; i++) {
    result.food.push({
      id: fdRows[i][0],
      emoji: fdRows[i][1],
      name: fdRows[i][2],
      area: fdRows[i][3],
      desc: fdRows[i][4],
      must: fdRows[i][5].toString().toUpperCase() === "TRUE",
      done: fdRows[i][6].toString().toUpperCase() === "TRUE"
    });
  }
  
  return result;
}

// 儲存前端修改後的完整資料回 Google 試算表
function saveTripDetails(sheetId, data) {
  const ss = SpreadsheetApp.openById(sheetId);
  
  // 1. Info
  const infoSheet = ss.getSheetByName("Info");
  infoSheet.getRange(2, 2).setValue(data.name);
  infoSheet.getRange(3, 2).setValue(data.startDate);
  infoSheet.getRange(4, 2).setValue(data.endDate);
  infoSheet.getRange(5, 2).setValue(data.duration);
  
  // 2. Checklist
  const checklistSheet = ss.getSheetByName("Checklist");
  checklistSheet.clearContents();
  checklistSheet.appendRow(["id", "cat", "title", "note", "link", "done"]);
  (data.checklist || []).forEach(item => {
    checklistSheet.appendRow([item.id, item.cat, item.title, item.note, item.link, item.done ? "TRUE" : "FALSE"]);
  });
  
  // 3. Flights
  const flightsSheet = ss.getSheetByName("Flights");
  flightsSheet.clearContents();
  flightsSheet.appendRow(["Type", "airline", "no", "from", "to", "date", "dep", "arr", "note"]);
  if (data.flights.out) {
    const f = data.flights.out;
    flightsSheet.appendRow(["out", f.airline, f.no, f.from, f.to, f.date, f.dep, f.arr, f.note]);
  }
  if (data.flights.in) {
    const f = data.flights.in;
    flightsSheet.appendRow(["in", f.airline, f.no, f.from, f.to, f.date, f.dep, f.arr, f.note]);
  }
  
  // 4. Hotel
  const hotelSheet = ss.getSheetByName("Hotel");
  hotelSheet.clearContents();
  hotelSheet.appendRow(["name", "addr", "checkin", "checkout", "nights", "note"]);
  const h = data.hotel || {};
  hotelSheet.appendRow([h.name, h.addr, h.checkin, h.checkout, h.nights, h.note]);
  
  // 5. Days
  const daysSheet = ss.getSheetByName("Days");
  daysSheet.clearContents();
  daysSheet.appendRow(["dayId", "date", "title", "time", "place", "desc", "imgUrl"]);
  (data.days || []).forEach(d => {
    if (d.items && d.items.length > 0) {
      d.items.forEach(item => {
        daysSheet.appendRow([d.id, d.date, d.title, item.time, item.place, item.desc, item.imgUrl || ""]);
      });
    } else {
      daysSheet.appendRow([d.id, d.date, d.title, "", "", "", ""]);
    }
  });
  
  // 6. Food
  const foodSheet = ss.getSheetByName("Food");
  foodSheet.clearContents();
  foodSheet.appendRow(["id", "emoji", "name", "area", "desc", "must", "done"]);
  (data.food || []).forEach(item => {
    foodSheet.appendRow([item.id, item.emoji, item.name, item.area, item.desc, item.must ? "TRUE" : "FALSE", item.done ? "TRUE" : "FALSE"]);
  });
}
