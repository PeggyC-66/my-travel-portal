// 設定您的 Google Client ID 與 GAS API URL
const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"; 
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbxWDzIwyFQXqbO5iOZzQ5pkM5QtcNHWhm12JBtvuN1wEbUWI35CZVp8qw1Rr1ycb7Ekpw/exec";

// 前端全局狀態管理
let idToken = localStorage.getItem('google_id_token') || null;
let userRole = 'user'; // 'admin' 或 'user'
let tripsList = [];    // 該使用者可存取的行程列表
let currentTripUuid = localStorage.getItem('current_trip_uuid') || '';
let tripData = null;   // 當前行程的詳細資料
let editMode = false;
let currentTab = 'checklist';
let selectedDay = 0;

// 初始化 Google 登入元件
window.onload = function () {
  initGoogleAuth();
};

function initGoogleAuth() {
  if (idToken) {
    // 已有快取的 Token，直接嘗試載入專案資料
    showApp();
    fetchTrips();
  } else {
    // 未登入，初始化 Google 登入按鈕
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse
    });
    google.accounts.id.renderButton(
      document.getElementById("gSignInBtn"),
      { theme: "outline", size: "large", width: 240 }
    );
    showLogin();
  }
}

// 登入成功回呼
function handleCredentialResponse(response) {
  idToken = response.credential;
  localStorage.setItem('google_id_token', idToken);
  showToast("登入成功，驗證權限中...");
  showApp();
  fetchTrips();
}

function logout() {
  idToken = null;
  userRole = 'user';
  tripsList = [];
  currentTripUuid = '';
  tripData = null;
  localStorage.removeItem('google_id_token');
  localStorage.removeItem('current_trip_uuid');
  location.reload();
}

function showLogin() {
  document.getElementById('loginOverlay').style.display = 'flex';
  document.getElementById('appContent').style.display = 'none';
}

function showApp() {
  document.getElementById('loginOverlay').style.display = 'none';
  document.getElementById('appContent').style.display = 'block';
}

// 取得該使用者被授權的所有行程清單
async function fetchTrips() {
  try {
    const res = await fetch(`${GAS_API_URL}?action=getTrips`, {
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    });
    const result = await res.json();
    if (result.status === 'success') {
      userRole = result.role;
      tripsList = result.trips;
      
      // 控制編輯按鈕與後台管理分頁是否顯示
      const isAdmin = (userRole === 'admin');
      document.getElementById('editBtn').style.display = isAdmin ? 'inline-flex' : 'none';
      document.getElementById('btn-tab-admin').style.display = isAdmin ? 'block' : 'none';
      
      renderTripSelector();
      
      if (tripsList.length > 0) {
        if (!currentTripUuid || !tripsList.find(t => t.uuid === currentTripUuid)) {
          currentTripUuid = tripsList[0].uuid;
          localStorage.setItem('current_trip_uuid', currentTripUuid);
        }
        document.getElementById('tripSelector').value = currentTripUuid;
        fetchTripData();
      } else {
        showToast("您目前尚未被加入任何行程");
      }
    } else {
      showToast("身分驗證失敗，請重新登入");
      logout();
    }
  } catch (e) {
    showToast("連線後端 API 失敗，請檢查網路");
  }
}

// 取得特定行程的詳細旅遊資料
async function fetchTripData() {
  if (!currentTripUuid) return;
  showToast("更新行程資料中...");
  try {
    const res = await fetch(`${GAS_API_URL}?action=getTripData&tripUuid=${currentTripUuid}`, {
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    });
    const result = await res.json();
    if (result.status === 'success') {
      tripData = result.data;
      initCountdown();
      render();
      showToast("同步成功 ✓");
    } else {
      showToast(result.message || "載入行程資料失敗");
    }
  } catch (e) {
    showToast("同步失敗，請檢查網路");
  }
}

// 渲染行程切換下拉選單
function renderTripSelector() {
  const selector = document.getElementById('tripSelector');
  selector.innerHTML = tripsList.map(t => 
    `<option value="${t.uuid}">${t.name}</option>`
  ).join('');
}

function onTripChanged(uuid) {
  currentTripUuid = uuid;
  localStorage.setItem('current_trip_uuid', uuid);
  fetchTripData();
}

// 計算出發倒數
function initCountdown() {
  if (!tripData || !tripData.startDate) {
    document.getElementById('tripCountdown').innerText = '尚未設定日期';
    return;
  }
  const targetDate = new Date(tripData.startDate + 'T00:00:00');
  const now = new Date();
  const diffTime = targetDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const cdEl = document.getElementById('tripCountdown');
  
  if (diffDays > 0) {
    cdEl.innerText = `距離出發還有 ${diffDays} 天`;
  } else if (diffDays === 0) {
    cdEl.innerText = `✨ 旅程就是今天！`;
  } else {
    cdEl.innerText = `旅程進行中 / 已出發`;
  }
  
  // 更新 Hero 區域文字
  document.getElementById('portalTitle').innerText = `🍑 ${tripData.name || '旅遊手冊'}`;
  document.getElementById('portalSubtitle').innerText = `${tripData.startDate || ''} — ${tripData.endDate || ''}・${tripData.duration || ''}`;
}

function showToast(text) {
  const t = document.getElementById('toast');
  t.innerText = text;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}

// 儲存（若為管理員則同步回 GAS，否則僅存於本機）
async function save() {
  if (userRole === 'admin') {
    showToast("同步更新至雲端中...");
    try {
      const res = await fetch(`${GAS_API_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain', // GAS 只支援 POST 以 text/plain 接收資料
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          action: 'updateTripData',
          tripUuid: currentTripUuid,
          data: tripData
        })
      });
      const result = await res.json();
      if (result.status === 'success') {
        showToast("雲端同步成功 ✓");
      } else {
        showToast(result.message || "雲端儲存失敗");
      }
    } catch(e) {
      showToast("網路錯誤，同步失敗");
    }
  } else {
    // 一般團員不能修改雲端，只存在 localStorage
    localStorage.setItem(`trip_${currentTripUuid}`, JSON.stringify(tripData));
    showToast("已儲存至本機緩存（一般人員唯讀）");
  }
}

function uid() { return Math.random().toString(36).slice(2,8); }

function switchTab(id, btn) {
  currentTab = id;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  btn.classList.add('active');
  render();
}

function toggleEdit() {
  if (userRole !== 'admin') return;
  editMode = !editMode;
  const btn = document.getElementById('editBtn');
  btn.textContent = editMode ? '✓ 完成' : '✏️ 編輯';
  btn.classList.toggle('active', editMode);
  render();
}

function setFont(size, btn) {
  document.querySelectorAll('.font-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.body.classList.toggle('large', size === 'large');
}

// 原生 HTML 欄位產生輔助函數
function ef(label, val, onchange, multi, type = 'text') {
  const v = (val || '').toString().replace(/"/g, '&quot;');
  return `<div class="ef-wrap"><div class="ef-label">${label}</div>` +
    (multi ? `<textarea class="ef-textarea" oninput="${onchange}">${val || ''}</textarea>`
           : `<input type="${type}" class="ef-input" value="${v}" oninput="${onchange}">`) +
    `</div>`;
}

// === 1. 必備清單頁面渲染 ===
function renderChecklist() {
  if (!tripData) return;
  const list = tripData.checklist || [];
  const rows = list.map((item, i) => editMode
    ? `<div style="background:#FAF8F5;border-radius:14px;padding:12px;margin-bottom:10px;border:1px solid var(--mist);">
        <div style="display:flex;justify-content:flex-end;"><button class="btn-del" onclick="tripData.checklist.splice(${i},1);save();render()">刪除</button></div>
        ${ef('類別', item.cat, `tripData.checklist[${i}].cat=this.value;save()`)}
        ${ef('項目', item.title, `tripData.checklist[${i}].title=this.value;save()`)}
        ${ef('備註說明', item.note, `tripData.checklist[${i}].note=this.value;save()`)}
        ${ef('外部連結', item.link, `tripData.checklist[${i}].link=this.value;save()`)}
      </div>`
    : `<div style="display:flex;align-items:flex-start;gap:12px;padding:14px 0;border-bottom:1px solid var(--mist);">
        <input type="checkbox" style="width:19px;height:19px;accent-color:var(--moss);margin-top:2px;cursor:pointer;" ${item.done ? 'checked' : ''} onclick="tripData.checklist[${i}].done=!tripData.checklist[${i}].done;save();render()">
        <div style="flex:1;${item.done ? 'text-decoration:line-through;opacity:0.4;' : ''}">
          <span style="font-size:10px;font-weight:800;color:var(--gold);background:var(--gold-soft);padding:2px 8px;border-radius:6px;letter-spacing:0.5px;">${item.cat || '備忘'}</span>
          <div style="font-size:15px;font-weight:700;margin-top:3px;">${item.title || ''}</div>
          ${item.note ? `<div style="font-size:12px;color:#666;margin-top:2px;">${item.note}</div>` : ''}
          ${item.link ? `<a href="${item.link}" target="_blank" style="display:inline-block;margin-top:5px;font-size:11px;color:var(--moss);font-weight:bold;text-decoration:none;">🔗 點擊預約/查看</a>` : ''}
        </div>
      </div>`
  ).join('');
  const addBtn = editMode ? `<button class="glass-btn" style="background:var(--moss);color:#fff;width:100%;margin-top:12px;justify-content:center;" onclick="tripData.checklist.push({id:uid(),cat:'新類別',title:'新備忘項目',note:'',link:'',done:false});save();render()">＋ 新增必備項目</button>` : '';
  document.getElementById('page-checklist').innerHTML = `<div class="card"><div class="card-header"><span class="card-title">✓ 行前準備清單</span></div>${rows || '<p style="color:#888;">尚無清單</p>'}${addBtn}</div>`;
}

// === 2. 航班住宿頁面渲染 ===
function renderFlights() {
  if (!tripData) return;
  function fc(title, f, key) {
    if (!f) f = {};
    return editMode
      ? `<div class="card"><div class="card-header"><span class="card-title">${title}</span></div>
          ${ef('航空公司', f.airline, `tripData.flights.${key}.airline=this.value;save()`)}
          ${ef('航班號', f.no, `tripData.flights.${key}.no=this.value;save()`)}
          ${ef('出發地', f.from, `tripData.flights.${key}.from=this.value;save()`)}
          ${ef('目的地', f.to, `tripData.flights.${key}.to=this.value;save()`)}
          ${ef('日期', f.date, `tripData.flights.${key}.date=this.value;save()`)}
          ${ef('出發時間', f.dep, `tripData.flights.${key}.dep=this.value;save()`)}
          ${ef('抵達時間', f.arr, `tripData.flights.${key}.arr=this.value;save()`)}
          ${ef('備註說明', f.note, `tripData.flights.${key}.note=this.value;save()`)}
        </div>`
      : `<div class="flight-box">
          <div style="font-size:11px;font-weight:800;color:var(--gold);letter-spacing:1px;">${title} · ${f.date || ''}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;">
            <div>
              <div style="font-size:20px;font-weight:900;color:var(--moss);">${f.no || ''}</div>
              <div style="font-size:12px;color:#666;font-weight:500;">${f.airline || ''} | ${f.from || ''} ➔ ${f.to || ''}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:16px;font-weight:800;">${f.dep || '--:--'}</div>
              <div style="font-size:11px;color:#888;">➔ ${f.arr || '--:--'}</div>
            </div>
          </div>
          ${f.note ? `<div style="font-size:11px;color:var(--red);background:#FFF0EE;padding:5px 10px;border-radius:8px;margin-top:8px;">⚠️ ${f.note}</div>` : ''}
        </div>`;
  }
  const h = tripData.hotel || {};
  const hotelQuery = encodeURIComponent((h.name || '') + ' ' + (h.addr || ''));
  const hotelMapUrl = (h.name || h.addr) ? 'https://www.google.com/maps/search/?api=1&query=' + hotelQuery : '';

  const hotel = editMode
    ? `<div class="card"><div class="card-header"><span class="card-title">🏨 住宿資訊</span></div>
        ${ef('飯店名稱', h.name, `tripData.hotel.name=this.value;save()`)}
        ${ef('地址', h.addr, `tripData.hotel.addr=this.value;save()`)}
        ${ef('入住日', h.checkin, `tripData.hotel.checkin=this.value;save()`)}
        ${ef('退房日', h.checkout, `tripData.hotel.checkout=this.value;save()`)}
        ${ef('晚數', h.nights, `tripData.hotel.nights=this.value;save()`)}
        ${ef('備註說明', h.note, `tripData.hotel.note=this.value;save()`)}
      </div>`
    : `<div class="hotel-card">
        <div class="hotel-name">🏨 ${h.name || '未設定飯店'}</div>
        <div class="hotel-meta">📍 ${h.addr || ''}</div>
        <div class="hotel-meta">📅 ${h.checkin || ''} ～ ${h.checkout || ''}（${h.nights || ''}）</div>
        ${h.note ? `<div style="font-size:12px;color:#6B5A2A;background:var(--gold-soft);padding:8px 12px;border-radius:8px;margin:10px 0;">💡 ${h.note}</div>` : ''}
        ${hotelMapUrl ? `<a class="map-link" href="${hotelMapUrl}" target="_blank">🗺 Google 地圖導航</a>` : ''}
      </div>`;
  
  document.getElementById('page-flights').innerHTML = `
    <div class="card"><div class="card-header"><span class="card-title">✈️ 航班行程</span></div>
    ${fc('去程航班', tripData.flights ? tripData.flights.out : {}, 'out')}
    ${fc('回程航班', tripData.flights ? tripData.flights.in : {}, 'in')}
    </div>
    <div class="card"><div class="card-header"><span class="card-title">🏨 飯店住宿</span></div>
    ${hotel}
    </div>`;
}

// === 3. 每日行程頁面渲染 ===
function renderItinerary() {
  if (!tripData || !tripData.days) {
    document.getElementById('page-itinerary').innerHTML = '<div class="card">本日尚無行程規劃</div>';
    return;
  }
  if (selectedDay >= tripData.days.length) selectedDay = 0;
  
  const dayBtns = tripData.days.map((d, i) => `
    <button class="day-btn ${i === selectedDay ? 'active' : ''}" onclick="selectedDay=${i};render()">
      <div class="day-btn-date">${(d.date||'').split('（')[0]}</div>
      <div class="day-btn-id">${d.id}</div>
    </button>
  `).join('');
  
  const day = tripData.days[selectedDay] || tripData.days[0];
  if (!day) return;
  const titleEdit = editMode ? `<div style="margin-bottom:14px;">${ef('當日主題', day.title, `tripData.days[${selectedDay}].title=this.value;save();render()`)}</div>` : '';
  
  const items = (day.items || []).map((item, j) => {
    const mapQuery = encodeURIComponent(item.place || '');
    const autoMapUrl = item.place ? 'https://www.google.com/maps/search/?api=1&query=' + mapQuery : '';

    return editMode
      ? `<div style="background:#FAF8F5;border-radius:14px;padding:12px;margin-bottom:12px;border:1px solid var(--mist);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span style="font-size:11px;font-weight:bold;color:var(--moss);">行程 #${j+1}</span>
            <button class="btn-del" onclick="tripData.days[${selectedDay}].items.splice(${j},1);save();render()">刪除</button>
          </div>
          ${ef('時間', item.time, `tripData.days[${selectedDay}].items[${j}].time=this.value;save()`)}
          ${ef('地點', item.place, `tripData.days[${selectedDay}].items[${j}].place=this.value;save()`)}
          ${ef('備註說明', item.desc, `tripData.days[${selectedDay}].items[${j}].desc=this.value;save()`, true)}
          <div class="ef-wrap">
            <div class="ef-label">上傳圖片到雲端硬碟</div>
            <input type="file" accept="image/*" onchange="uploadImageToDrive(this, ${selectedDay}, ${j})">
          </div>
          ${item.imgUrl ? `<div style="margin-top:8px;"><img src="${item.imgUrl}" style="max-width:100%;border-radius:8px;"></div>` : ''}
        </div>`
      : `<div class="tl">
          <div class="tl-time-badge">${item.time || '行程'}</div>
          <div class="tl-content">
            <div class="tl-place">${item.place || ''}</div>
            ${item.desc ? `<div class="tl-desc">${item.desc}</div>` : ''}
            ${item.imgUrl ? `<div style="margin-top:10px;"><img src="${item.imgUrl}" style="max-width:100%;border-radius:12px;box-shadow:var(--shadow-sm);"></div>` : ''}
            ${autoMapUrl ? `<a class="map-link" href="${autoMapUrl}" target="_blank">🗺 地圖導航</a>` : ''}
          </div>
        </div>`;
  }).join('');

  const addBtn = editMode ? `<button class="glass-btn" style="background:var(--moss);color:#fff;width:100%;margin-top:14px;justify-content:center;" onclick="tripData.days[${selectedDay}].items.push({id:uid(),time:'10:00',place:'新景點',desc:'說明描述',imgUrl:''});save();render()">＋ 新增景點</button>` : '';

  document.getElementById('page-itinerary').innerHTML = `
    <div class="day-selector">${dayBtns}</div>
    <div class="card">
      <div class="card-header"><span class="card-title">${day.id} ｜ ${day.title}</span></div>
      ${titleEdit}
      <div class="timeline">${items || '<p style="color:#888;">本日尚無規劃行程</p>'}</div>
      ${addBtn}
    </div>`;
}

// 管理員上傳圖片到 Google 雲端硬碟
async function uploadImageToDrive(input, dayIdx, itemIdx) {
  const file = input.files[0];
  if (!file) return;

  showToast("圖片上傳中，請稍候...");
  const reader = new FileReader();
  reader.onload = async function(e) {
    const base64Data = e.target.result.split(',')[1];
    try {
      const res = await fetch(GAS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          action: 'uploadImage',
          tripUuid: currentTripUuid,
          filename: file.name,
          mimeType: file.type,
          data: base64Data
        })
      });
      const result = await res.json();
      if (result.status === 'success') {
        tripData.days[dayIdx].items[itemIdx].imgUrl = result.url;
        save();
        render();
        showToast("圖片上傳成功 ✓");
      } else {
        showToast(result.message || "上傳失敗");
      }
    } catch(e) {
      showToast("圖片上傳失敗，請檢查網路");
    }
  };
  reader.readAsDataURL(file);
}

// === 4. 美食清單頁面渲染 ===
function renderFood() {
  if (!tripData) return;
  const list = tripData.food || [];
  const items = list.map((item, i) => editMode
    ? `<div style="background:#FAF8F5;border-radius:14px;padding:12px;margin-bottom:12px;border:1px solid var(--mist);">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <input class="ef-input" style="width:56px;text-align:center;" value="${item.emoji || '🍴'}" oninput="tripData.food[${i}].emoji=this.value;save()">
          <button class="btn-del" onclick="tripData.food.splice(${i},1);save();render()">刪除</button>
        </div>
        ${ef('名稱', item.name, `tripData.food[${i}].name=this.value;save()`)}
        ${ef('地區', item.area, `tripData.food[${i}].area=this.value;save()`)}
        ${ef('說明描述', item.desc, `tripData.food[${i}].desc=this.value;save()`)}
        <label style="font-size:12px;color:var(--gold);font-weight:bold;display:flex;align-items:center;gap:4px;margin-top:6px;cursor:pointer;">
          <input type="checkbox" ${item.must ? 'checked' : ''} onchange="tripData.food[${i}].must=this.checked;save()"> 標記為必吃名店
        </label>
      </div>`
    : `<div style="display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid var(--mist);">
        <span style="font-size:28px;flex-shrink:0;opacity:${item.done ? 0.35 : 1};">${item.emoji || '🍴'}</span>
        <div style="flex:1;${item.done ? 'text-decoration:line-through;opacity:0.4;' : ''}">
          <div style="font-size:15px;font-weight:800;color:var(--ink);">${item.name || ''} ${item.must ? '<span style="font-size:10px;background:var(--red);color:#fff;padding:2px 6px;border-radius:4px;vertical-align:middle;font-weight:normal;">必吃</span>' : ''}</div>
          <div style="font-size:11px;color:var(--gold);font-weight:700;margin-top:2px;">📍 ${item.area || '周邊地區'}</div>
          <div style="font-size:12px;color:#666;margin-top:3px;">${item.desc || ''}</div>
        </div>
        <button onclick="tripData.food[${i}].done=!tripData.food[${i}].done;save();render()" style="flex-shrink:0;border:none;border-radius:14px;padding:6px 14px;font-size:11px;font-weight:bold;cursor:pointer;background:${item.done ? 'var(--moss)' : 'var(--mist)'};color:${item.done ? '#fff' : '#666'};">
          ${item.done ? '已品嚐 ✓' : '想吃'}
        </button>
      </div>`
  ).join('');

  const addBtn = editMode ? `<button class="glass-btn" style="background:var(--moss);color:#fff;width:100%;margin-top:12px;justify-content:center;" onclick="tripData.food.push({id:uid(),emoji:'🍴',name:'美食名稱',area:'地點',desc:'特色描述',must:false,done:false});save();render()">＋ 新增美食</button>` : '';

  document.getElementById('page-food').innerHTML = `<div class="card"><div class="card-header"><span class="card-title">🍽 旅遊口袋名單</span></div>${items || '<p style="color:#888;">尚未加入美食</p>'}${addBtn}</div>`;
}

// === 5. 後台管理頁面渲染 (僅管理員可用) ===
function renderAdmin() {
  if (userRole !== 'admin') return;

  const html = `
    <div class="card">
      <div class="card-header"><span class="card-title" style="color:var(--red);">⚙️ 系統管理員後台</span></div>
      
      <div style="background:#FAF8F5;border-radius:14px;padding:16px;margin-bottom:20px;border:1.5px solid var(--gold);">
        <h3 style="font-size:14px;font-weight:bold;margin-bottom:12px;color:var(--moss);">➕ 建立新行程</h3>
        
        <div class="ef-wrap">
          <div class="ef-label">行程識別碼 (UUID，對外唯一標示，例如: trip-tokyo-2028)</div>
          <input type="text" id="newTripUuid" class="ef-input" placeholder="請輸入全英文識別碼">
        </div>
        <div class="ef-wrap">
          <div class="ef-label">行程名稱</div>
          <input type="text" id="newTripName" class="ef-input" placeholder="例如: 2028 東京賞櫻之旅">
        </div>
        <div class="ef-wrap">
          <div class="ef-label">關聯 Google 試算表 ID</div>
          <input type="text" id="newSheetId" class="ef-input" placeholder="請貼上該行程專用試算表的 ID">
        </div>
        <div class="ef-wrap">
          <div class="ef-label">雲端硬碟資料夾 ID (上傳圖片存放處)</div>
          <input type="text" id="newFolderId" class="ef-input" placeholder="請貼上雲端硬碟資料夾的 ID">
        </div>
        <div class="ef-wrap">
          <div class="ef-label">授權人員 Email (以英文逗號分隔)</div>
          <textarea id="newAllowedUsers" class="ef-textarea" placeholder="user1@gmail.com,user2@gmail.com"></textarea>
        </div>
        
        <button class="glass-btn" style="background:var(--moss);color:#fff;width:100%;justify-content:center;margin-top:10px;" onclick="createNewTrip()">建立行程並初始雲端試算表</button>
      </div>

      <h3 style="font-size:14px;font-weight:bold;margin-bottom:12px;">已綁定行程列表</h3>
      <div id="adminTripsList">載入行程列表中...</div>
    </div>
  `;

  document.getElementById('page-admin').innerHTML = html;
  renderAdminTripsList();
}

function renderAdminTripsList() {
  const container = document.getElementById('adminTripsList');
  if (tripsList.length === 0) {
    container.innerHTML = '<p style="color:#888;">目前沒有任何已建立的行程。</p>';
    return;
  }

  const listHtml = tripsList.map(t => `
    <div style="background:#FFF;border-radius:12px;padding:12px;margin-bottom:8px;border:1px solid var(--mist);font-size:12px;">
      <div style="font-weight:bold;font-size:13px;color:var(--moss);">${t.name} (${t.uuid})</div>
      <div style="color:#666;margin-top:4px;">試算表 ID: <span style="font-family:monospace;">${t.sheet_id}</span></div>
      <div style="color:#666;">圖片資料夾 ID: <span style="font-family:monospace;">${t.folder_id}</span></div>
      <div style="color:#666;">授權人員: ${t.allowed_users || '僅管理員'}</div>
    </div>
  `).join('');
  
  container.innerHTML = listHtml;
}

// 呼叫 GAS API 建立行程與自動初始化試算表結構
async function createNewTrip() {
  const uuid = document.getElementById('newTripUuid').value.trim();
  const name = document.getElementById('newTripName').value.trim();
  const sheetId = document.getElementById('newSheetId').value.trim();
  const folderId = document.getElementById('newFolderId').value.trim();
  const allowedUsers = document.getElementById('newAllowedUsers').value.trim();

  if (!uuid || !name || !sheetId || !folderId) {
    alert("請完整填寫行程識別碼、名稱、試算表 ID 與資料夾 ID！");
    return;
  }

  showToast("正在雲端建立行程，並自動初始化試算表結構...");
  try {
    const res = await fetch(GAS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        action: 'createTrip',
        uuid,
        name,
        sheetId,
        folderId,
        allowedUsers
      })
    });
    const result = await res.json();
    if (result.status === 'success') {
      showToast("新行程建立成功且初始化完畢！ ✓");
      fetchTrips(); // 重新整理清單
    } else {
      alert(result.message || "建立失敗");
    }
  } catch(e) {
    showToast("網路異常，建立行程失敗");
  }
}

// 主渲染分流
function render() {
  if (currentTab === 'checklist') renderChecklist();
  else if (currentTab === 'flights') renderFlights();
  else if (currentTab === 'itinerary') renderItinerary();
  else if (currentTab === 'food') renderFood();
  else if (currentTab === 'admin') renderAdmin();
}
