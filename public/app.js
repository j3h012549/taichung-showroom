(function(){
  "use strict";

  var BRANDS = ["Resmo","Pickme","Giorgio Graesan","沙發大師","睡眠王國","浴室整體規劃改造","Sigmas","震旦"];
  var SLOTS = ["10:00–12:00","13:00–15:00","15:00–17:00","17:00–19:00"];
  var STATUSES = [
    {key:"scheduled", label:"已預約", color:"var(--brass)"},
    {key:"visited", label:"初次來訪", color:"var(--accent)"},
    {key:"following", label:"追蹤中", color:"var(--warning)"},
    {key:"closed", label:"已成交", color:"var(--success)"},
    {key:"lost", label:"已流失", color:"var(--ink-faint)"}
  ];
  var STATUS_MAP = {};
  STATUSES.forEach(function(s){ STATUS_MAP[s.key] = s; });

  /* 訂單／工程財務模組：預設值（可依需求調整） */
  var COMMISSION_BASIS = "total"; // "total" = 抽成以訂單總價計算；改成 "profit" = 以毛利（總價－成本）計算
  var ORDER_STATUSES = [
    {key:"in_progress", label:"進行中", color:"var(--accent)"},
    {key:"deposit", label:"已收訂金", color:"var(--brass)"},
    {key:"settled", label:"已結清", color:"var(--success)"},
    {key:"cancelled", label:"已取消", color:"var(--ink-faint)"}
  ];
  var ORDER_STATUS_MAP = {};
  ORDER_STATUSES.forEach(function(s){ ORDER_STATUS_MAP[s.key] = s; });
  var PAYMENT_TYPES = ["訂金","尾款","其他"];

  var ICON_STAFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
  var ICON_PHONE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 2 .6 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.5 2.9.6a2 2 0 0 1 1.7 2Z"/></svg>';
  var ICON_MAIL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/></svg>';
  var ICON_CAL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>';
  var ICON_CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  var ICON_CLOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>';
  var ICON_USERS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
  var ICON_TAG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l8.29-8.29a1 1 0 0 0 0-1.41L12 2Z"/><circle cx="7" cy="7" r="1"/></svg>';
  var ICON_CASE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>';
  var ICON_LOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';

  var isReadonly = true; // 伺服器連線成功前，先停用所有寫入動作
  var customersData = [];
  var staffData = [];
  var ordersData = [];
  var accountsData = [];

  function uid(prefix){
    return prefix + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2,8);
  }

  function esc(s){
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function fmtNow(){
    var d = new Date();
    function p(n){ return String(n).padStart(2,"0"); }
    return d.getFullYear()+"/"+p(d.getMonth()+1)+"/"+p(d.getDate())+" "+p(d.getHours())+":"+p(d.getMinutes());
  }

  function debounce(fn, wait){
    var t;
    return function(){
      var args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function(){ fn.apply(ctx, args); }, wait);
    };
  }

  function showToast(msg){
    var t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(showToast._h);
    showToast._h = setTimeout(function(){ t.classList.remove("show"); }, 2600);
  }

  /* ---------------- 後端 API：資料讀寫（Express + SQLite） ---------------- */
  function setSyncState(state){
    var dot = document.getElementById("syncDot");
    var label = document.getElementById("syncLabel");
    dot.classList.remove("off","pending");
    if(state === "connected"){
      label.textContent = "與同仁同步";
    } else if(state === "connecting"){
      dot.classList.add("pending");
      label.textContent = "連線中…";
    } else {
      dot.classList.add("off");
      label.textContent = "連線失敗";
    }
  }

  /* 統一的 API 呼叫工具：帶上登入用的 cookie，錯誤時丟出方便上層 catch 的物件 */
  function apiFetch(url, opts){
    opts = opts || {};
    var options = {
      method: opts.method || "GET",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" }
    };
    if(opts.body !== undefined){ options.body = JSON.stringify(opts.body); }
    return fetch(url, options).then(function(res){
      return res.text().then(function(text){
        var data = null;
        try{ data = text ? JSON.parse(text) : null; }catch(e){ /* 非 JSON 回應 */ }
        if(!res.ok){
          var err = new Error((data && data.error) || ("請求失敗（" + res.status + "）"));
          err.status = res.status;
          err.data = data;
          throw err;
        }
        return data;
      });
    });
  }

  function initApp(){
    setSyncState("connecting");
    apiFetch("/api/session").then(function(res){
      isReadonly = false;
      document.getElementById("roBanner").classList.remove("show");
      setSyncState("connected");
      if(res && res.account){
        currentAccount = res.account;
        adminElevated = !!res.adminElevated;
        setMode("back");
        setAdminFlag(isAdminUnlocked());
        reflectLoggedInName();
      } else {
        setMode("front");
      }
      setBackView("customers");
      refreshSessionThenData();
      startPolling();
    }, function(){
      setSyncState("error");
      document.getElementById("roBanner").classList.add("show");
      document.getElementById("roBannerText").textContent = "無法連線到伺服器，請確認網路連線或稍後再重新整理頁面。";
    });
  }

  /* 沒有即時推播了，改成定時輪詢，讓多人同時開啟時可以看到彼此的更新（近似即時） */
  var pollTimer = null;
  function startPolling(){
    if(pollTimer){ clearInterval(pollTimer); }
    pollTimer = setInterval(function(){
      if(document.hidden) return; // 分頁在背景時不打擾伺服器
      loadCustomers();
      if(currentAccount){ loadStaff(); }
      if(currentAccount && (currentAccount.role === "admin" || isAdminUnlocked())){
        loadOrders();
        loadAccounts();
      }
    }, 6000);
  }

  function refreshSessionThenData(){
    loadCustomers();
    if(currentAccount){ loadStaff(); }
    if(currentAccount && (currentAccount.role === "admin" || isAdminUnlocked())){
      loadOrders();
      loadAccounts();
    }
  }

  function loadCustomers(){
    return apiFetch("/api/customers").then(function(rows){
      customersData = rows || [];
      renderCustomers();
      recomputeAll();
      recomputeCalendar();
      renderByBrandList();
    }, function(err){
      if(err.status !== 401){ showToast("讀取客戶資料時發生問題"); }
    });
  }

  function loadStaff(){
    return apiFetch("/api/staff").then(function(rows){
      staffData = rows || [];
      renderStaffList();
      recomputeAll();
      renderOrders();
      recomputeOrders();
    }, function(err){
      if(err.status !== 401){ showToast("讀取同仁名單時發生問題"); }
    });
  }

  function loadOrders(){
    return apiFetch("/api/orders").then(function(rows){
      ordersData = rows || [];
      renderOrders();
      recomputeOrders();
    }, function(err){
      if(err.status !== 401 && err.status !== 403){ showToast("讀取訂單資料時發生問題"); }
    });
  }

  var accountsLoadedOnce = false;
  function loadAccounts(){
    return apiFetch("/api/accounts").then(function(rows){
      accountsData = rows || [];
      accountsLoadedOnce = true;
      renderAccountsList();
    }, function(err){
      if(err.status !== 401 && err.status !== 403){ showToast("讀取帳號資料時發生問題"); }
    });
  }

  function createCustomer(fields){
    if(isReadonly){ showToast("尚未連接伺服器，暫時無法儲存"); return Promise.reject(); }
    return apiFetch("/api/customers", { method:"POST", body: fields || {} }).then(function(row){
      loadCustomers();
      return row;
    }, function(err){
      showToast("新增客戶失敗：" + err.message);
      throw err;
    });
  }
  function updateCustomerDoc(id, patch){
    if(isReadonly) return;
    apiFetch("/api/customers/" + id, { method:"PATCH", body: patch }).then(function(){
      loadCustomers();
    }, function(){
      showToast("儲存失敗，請檢查網路連線");
    });
  }
  function deleteCustomerDoc(id){
    if(isReadonly) return;
    apiFetch("/api/customers/" + id, { method:"DELETE" }).then(function(){
      loadCustomers();
    }, function(){
      showToast("刪除失敗，請檢查網路連線");
    });
  }
  function createStaffDoc(name){
    if(isReadonly){ showToast("尚未連接伺服器，暫時無法儲存"); return Promise.reject(); }
    return apiFetch("/api/staff", { method:"POST", body:{ name:name } }).then(function(row){
      loadStaff();
      return row;
    }, function(err){
      showToast("新增同仁失敗：" + err.message);
      throw err;
    });
  }
  function updateStaffDoc(id, name){
    if(isReadonly) return;
    apiFetch("/api/staff/" + id, { method:"PATCH", body:{ name:name } }).then(function(){
      loadStaff();
    }, function(){
      showToast("儲存失敗，請檢查網路連線");
    });
  }
  function updateStaffCommission(id, rate){
    if(isReadonly) return;
    apiFetch("/api/staff/" + id + "/commission", { method:"PATCH", body:{ commissionRate:rate } }).then(function(){
      loadStaff();
    }, function(){
      showToast("儲存失敗，請檢查網路連線或權限");
    });
  }
  function deleteStaffDoc(id){
    if(isReadonly) return;
    apiFetch("/api/staff/" + id, { method:"DELETE" }).then(function(){
      loadStaff();
    }, function(){
      showToast("刪除失敗，請檢查網路連線");
    });
  }

  /* ---------------- 帳號（權限管理）：後端 API 讀寫 ---------------- */
  function createAccountDoc(fields){
    if(isReadonly){ showToast("尚未連接伺服器，暫時無法儲存"); return Promise.reject(); }
    return apiFetch("/api/accounts", { method:"POST", body: fields || {} }).then(function(row){
      loadAccounts();
      return row;
    }, function(err){
      showToast("新增帳號失敗：" + err.message);
      throw err;
    });
  }
  function updateAccountDoc(id, patch){
    if(isReadonly) return;
    apiFetch("/api/accounts/" + id, { method:"PATCH", body: patch }).then(function(){
      loadAccounts();
    }, function(){
      showToast("儲存失敗，請檢查網路連線");
    });
  }
  function deleteAccountDoc(id){
    if(isReadonly) return;
    apiFetch("/api/accounts/" + id, { method:"DELETE" }).then(function(){
      loadAccounts();
    }, function(){
      showToast("刪除失敗，請檢查網路連線");
    });
  }

  /* ---------------- 訂單／工程：後端 API 讀寫 ---------------- */
  function createOrderDoc(fields){
    if(isReadonly){ showToast("尚未連接伺服器，暫時無法儲存"); return Promise.reject(); }
    return apiFetch("/api/orders", { method:"POST", body: fields || {} }).then(function(row){
      loadOrders();
      return row;
    }, function(err){
      showToast("新增訂單失敗：" + err.message);
      throw err;
    });
  }
  function updateOrderDoc(id, patch){
    if(isReadonly) return;
    apiFetch("/api/orders/" + id, { method:"PATCH", body: patch }).then(function(){
      loadOrders();
    }, function(){
      showToast("儲存失敗，請檢查網路連線");
    });
  }
  function deleteOrderDoc(id){
    if(isReadonly) return;
    apiFetch("/api/orders/" + id, { method:"DELETE" }).then(function(){
      loadOrders();
    }, function(){
      showToast("刪除失敗，請檢查網路連線");
    });
  }
  function addOrderSubRecord(orderId, field, entry){
    var order = ordersData.filter(function(o){ return o.id === orderId; })[0];
    if(!order) return;
    var list = (order[field] || []).slice();
    list.push(entry);
    var patch = {}; patch[field] = list;
    updateOrderDoc(orderId, patch);
  }
  function removeOrderSubRecord(orderId, field, index){
    var order = ordersData.filter(function(o){ return o.id === orderId; })[0];
    if(!order) return;
    var list = (order[field] || []).slice();
    list.splice(index, 1);
    var patch = {}; patch[field] = list;
    updateOrderDoc(orderId, patch);
  }

  /* ---------------- popover ---------------- */
  var openPopoverEl = null;
  function closePopover(){
    if(openPopoverEl && openPopoverEl.parentNode){ openPopoverEl.parentNode.removeChild(openPopoverEl); }
    openPopoverEl = null;
    document.removeEventListener("pointerdown", onDocPointerDown, true);
  }
  function onDocPointerDown(e){
    if(openPopoverEl && !openPopoverEl.contains(e.target)){ closePopover(); }
  }
  function openPopover(anchor, items){
    closePopover();
    var pv = document.createElement("div");
    pv.className = "popover";
    items.forEach(function(it){
      var b = document.createElement("button");
      b.type = "button";
      if(it.dot){
        var dot = document.createElement("span");
        dot.className = "pv-dot";
        dot.style.background = it.dot;
        b.appendChild(dot);
      }
      var label = document.createElement("span");
      label.textContent = it.label;
      b.appendChild(label);
      b.addEventListener("click", function(ev){
        ev.stopPropagation();
        closePopover();
        it.onSelect();
      });
      pv.appendChild(b);
    });
    document.body.appendChild(pv);
    var r = anchor.getBoundingClientRect();
    var top = r.bottom + 6;
    var left = r.left;
    var pw = pv.offsetWidth || 170;
    if(left + pw > window.innerWidth - 10){ left = window.innerWidth - pw - 10; }
    if(top + pv.offsetHeight > window.innerHeight - 10){ top = r.top - pv.offsetHeight - 6; }
    pv.style.top = Math.max(8,top) + "px";
    pv.style.left = Math.max(8,left) + "px";
    openPopoverEl = pv;
    setTimeout(function(){ document.addEventListener("pointerdown", onDocPointerDown, true); },0);
  }

  /* ---------------- customer card ---------------- */
  function buildCustomerCard(data){
    data = data || {};
    var id = data.id || uid("local");
    var li = document.createElement("li");
    li.className = "customer";
    li.dataset.key = id;

    var top = document.createElement("div");
    top.className = "customer-top";

    var name = document.createElement("input");
    name.type = "text"; name.className = "f-name"; name.placeholder = "客戶姓名";
    name.value = data.name || "";
    var saveName = debounce(function(){ updateCustomerDoc(id, { name: name.value.trim() }); }, 500);
    name.addEventListener("input", saveName);
    name.addEventListener("blur", function(){ updateCustomerDoc(id, { name: name.value.trim() }); });
    top.appendChild(name);

    var statusBtn = document.createElement("button");
    statusBtn.type = "button"; statusBtn.className = "status-pill";
    var statusKey = data.status || "visited";
    statusBtn.dataset.status = statusKey;
    statusBtn.textContent = (STATUS_MAP[statusKey] || STATUS_MAP.visited).label;
    statusBtn.addEventListener("click", function(){
      if(isReadonly) return;
      openPopover(statusBtn, STATUSES.map(function(s){
        return { label:s.label, dot:s.color, onSelect:function(){
          statusBtn.dataset.status = s.key;
          statusBtn.textContent = s.label;
          updateCustomerDoc(id, { status: s.key });
          recomputeAll();
        }};
      }));
    });
    top.appendChild(statusBtn);

    var staffBtn = document.createElement("button");
    staffBtn.type = "button"; staffBtn.className = "staff-badge";
    staffBtn.dataset.staffName = data.staffName || "";
    staffBtn.innerHTML = ICON_STAFF + "<span>" + esc(data.staffName || "未指派") + "</span>";
    staffBtn.addEventListener("click", function(){
      if(isReadonly) return;
      var items = [{ label:"未指派", onSelect:function(){ setStaffOnCard(staffBtn, id, ""); } }];
      staffData.forEach(function(s){
        items.push({ label:s.name, onSelect:function(){ setStaffOnCard(staffBtn, id, s.name); } });
      });
      openPopover(staffBtn, items);
    });
    top.appendChild(staffBtn);

    var del = document.createElement("button");
    del.type = "button"; del.className = "btn-delete"; del.setAttribute("aria-label","刪除客戶");
    del.dataset.localConfirming = "false";
    del.innerHTML = ICON_CLOSE;
    del.addEventListener("click", function(){
      if(isReadonly) return;
      if(del.dataset.localConfirming === "true"){
        deleteCustomerDoc(id);
        showToast("已刪除客戶資料");
      } else {
        del.dataset.localConfirming = "true";
        clearTimeout(del._t);
        del._t = setTimeout(function(){ del.dataset.localConfirming = "false"; }, 3000);
      }
    });
    top.appendChild(del);

    li.appendChild(top);

    var mid = document.createElement("div");
    mid.className = "customer-mid";

    var phoneLabel = document.createElement("label"); phoneLabel.className = "field-inline";
    phoneLabel.innerHTML = ICON_PHONE;
    var phone = document.createElement("input"); phone.type = "tel"; phone.className = "f-phone"; phone.placeholder = "電話"; phone.value = data.phone || "";
    var savePhone = debounce(function(){ updateCustomerDoc(id, { phone: phone.value.trim() }); }, 500);
    phone.addEventListener("input", savePhone);
    phone.addEventListener("blur", function(){ updateCustomerDoc(id, { phone: phone.value.trim() }); });
    phoneLabel.appendChild(phone);
    mid.appendChild(phoneLabel);

    var emailLabel = document.createElement("label"); emailLabel.className = "field-inline";
    emailLabel.innerHTML = ICON_MAIL;
    var email = document.createElement("input"); email.type = "email"; email.className = "f-email"; email.placeholder = "Email（選填）"; email.value = data.email || "";
    var saveEmail = debounce(function(){ updateCustomerDoc(id, { email: email.value.trim() }); }, 500);
    email.addEventListener("input", saveEmail);
    email.addEventListener("blur", function(){ updateCustomerDoc(id, { email: email.value.trim() }); });
    emailLabel.appendChild(email);
    mid.appendChild(emailLabel);

    var dateLabel = document.createElement("label"); dateLabel.className = "field-inline";
    dateLabel.innerHTML = ICON_CAL;
    var date = document.createElement("input"); date.type = "date"; date.className = "f-date"; date.value = data.date || "";
    date.addEventListener("change", function(){ updateCustomerDoc(id, { date: date.value }); });
    dateLabel.appendChild(date);
    mid.appendChild(dateLabel);

    var slotWrap = document.createElement("div"); slotWrap.className = "field-inline";
    slotWrap.innerHTML = ICON_CLOCK;
    var slotBtn = document.createElement("button");
    slotBtn.type = "button"; slotBtn.className = "slot-badge-inline";
    slotBtn.dataset.slot = data.slot || "";
    slotBtn.textContent = data.slot || "未安排時段";
    slotBtn.addEventListener("click", function(){
      if(isReadonly) return;
      var items = SLOTS.map(function(s){
        return { label:s, onSelect:function(){
          slotBtn.dataset.slot = s; slotBtn.textContent = s;
          updateCustomerDoc(id, { slot: s });
        }};
      });
      items.push({ label:"清除時段", onSelect:function(){
        slotBtn.dataset.slot = ""; slotBtn.textContent = "未安排時段";
        updateCustomerDoc(id, { slot: "" });
      }});
      openPopover(slotBtn, items);
    });
    slotWrap.appendChild(slotBtn);
    mid.appendChild(slotWrap);

    li.appendChild(mid);

    var chips = document.createElement("div");
    chips.className = "brand-chips";
    chips.setAttribute("role","group");
    chips.setAttribute("aria-label","興趣品牌");
    var activeBrands = data.brands || [];
    BRANDS.forEach(function(b){
      var chip = document.createElement("button");
      chip.type = "button"; chip.className = "chip"; chip.dataset.brand = b;
      chip.setAttribute("aria-pressed", activeBrands.indexOf(b) > -1 ? "true" : "false");
      chip.textContent = b;
      chip.addEventListener("click", function(){
        if(isReadonly) return;
        var pressed = chip.getAttribute("aria-pressed") === "true";
        chip.setAttribute("aria-pressed", pressed ? "false" : "true");
        var newBrands = Array.prototype.filter.call(chips.children, function(c){
          return c.getAttribute("aria-pressed") === "true";
        }).map(function(c){ return c.dataset.brand; });
        updateCustomerDoc(id, { brands: newBrands });
        recomputeAll();
      });
      chips.appendChild(chip);
    });
    li.appendChild(chips);

    var notes = document.createElement("input");
    notes.type = "text"; notes.className = "f-notes"; notes.placeholder = "備註（喜好、預算、跟進事項…）";
    notes.value = data.notes || "";
    var saveNotes = debounce(function(){ updateCustomerDoc(id, { notes: notes.value.trim() }); }, 500);
    notes.addEventListener("input", saveNotes);
    notes.addEventListener("blur", function(){ updateCustomerDoc(id, { notes: notes.value.trim() }); });
    li.appendChild(notes);

    var foot = document.createElement("div");
    foot.className = "customer-foot";
    foot.textContent = "建立於 " + (data.createdAtLabel || fmtNow());
    li.appendChild(foot);

    return li;
  }

  function setStaffOnCard(staffBtn, id, name){
    staffBtn.dataset.staffName = name;
    staffBtn.innerHTML = ICON_STAFF + "<span>" + esc(name || "未指派") + "</span>";
    updateCustomerDoc(id, { staffName: name });
    recomputeAll();
  }

  /* patch an existing card's fields from fresh data, without rebuilding
     (keeps listeners + doesn't yank focus/cursor from a field someone is typing in) */
  function patchCustomerCard(li, data){
    function setIfIdle(input, val){
      if(document.activeElement !== input && input.value !== val){ input.value = val; }
    }
    setIfIdle(li.querySelector(".f-name"), data.name || "");
    setIfIdle(li.querySelector(".f-phone"), data.phone || "");
    setIfIdle(li.querySelector(".f-email"), data.email || "");
    setIfIdle(li.querySelector(".f-date"), data.date || "");
    setIfIdle(li.querySelector(".f-notes"), data.notes || "");

    var statusBtn = li.querySelector(".status-pill");
    var stKey = data.status || "visited";
    if(statusBtn.dataset.status !== stKey){
      statusBtn.dataset.status = stKey;
      statusBtn.textContent = (STATUS_MAP[stKey] || STATUS_MAP.visited).label;
    }

    var staffBtn = li.querySelector(".staff-badge");
    var staffName = data.staffName || "";
    if(staffBtn.dataset.staffName !== staffName){
      staffBtn.dataset.staffName = staffName;
      staffBtn.innerHTML = ICON_STAFF + "<span>" + esc(staffName || "未指派") + "</span>";
    }

    var slotBtn = li.querySelector(".slot-badge-inline");
    var slotVal = data.slot || "";
    if(slotBtn.dataset.slot !== slotVal){
      slotBtn.dataset.slot = slotVal;
      slotBtn.textContent = slotVal || "未安排時段";
    }

    var brands = data.brands || [];
    Array.prototype.forEach.call(li.querySelectorAll(".chip"), function(chip){
      var pressed = brands.indexOf(chip.dataset.brand) > -1;
      chip.setAttribute("aria-pressed", pressed ? "true" : "false");
    });

    li.querySelector(".customer-foot").textContent = "建立於 " + (data.createdAtLabel || fmtNow());
  }

  function renderCustomers(){
    var list = document.getElementById("customerList");
    var existing = {};
    Array.prototype.forEach.call(list.children, function(li){ existing[li.dataset.key] = li; });
    var frag = document.createDocumentFragment();
    customersData.forEach(function(c){
      var li = existing[c.id];
      if(li){ patchCustomerCard(li, c); delete existing[c.id]; }
      else{ li = buildCustomerCard(c); }
      frag.appendChild(li);
    });
    list.innerHTML = "";
    list.appendChild(frag);
    applyFilters();
    updateEmptyState();
  }

  function addCustomer(){
    createCustomer({}).then(function(ref){
      setTimeout(function(){
        var li = document.querySelector('#customerList .customer[data-key="'+ref.id+'"]');
        var nameInput = li && li.querySelector(".f-name");
        if(nameInput){ nameInput.focus(); }
      }, 120);
    }, function(){ /* createCustomer already toasted */ });
  }

  /* ============================================================
     展間預約行事曆
     ============================================================ */
  var calState = { year:null, month:null, selectedDate:null };

  function initCalState(){
    var d = new Date();
    calState.year = d.getFullYear();
    calState.month = d.getMonth();
    calState.selectedDate = todayISO();
  }

  function countAppointmentsByDate(){
    var map = {};
    customersData.forEach(function(c){
      if(c.date){ map[c.date] = (map[c.date] || 0) + 1; }
    });
    return map;
  }

  function renderCalendarGrid(){
    var grid = document.getElementById("calGrid");
    if(!grid || calState.year === null) return;
    grid.innerHTML = "";
    ["日","一","二","三","四","五","六"].forEach(function(w){
      var el = document.createElement("div"); el.className = "cal-weekday"; el.textContent = w;
      grid.appendChild(el);
    });
    var year = calState.year, month = calState.month;
    var startOffset = new Date(year, month, 1).getDay();
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var counts = countAppointmentsByDate();
    var today = todayISO();

    for(var i = 0; i < startOffset; i++){
      var empty = document.createElement("div");
      empty.className = "cal-cell"; empty.dataset.empty = "true";
      grid.appendChild(empty);
    }
    for(var day = 1; day <= daysInMonth; day++){
      var dateStr = year + "-" + String(month + 1).padStart(2,"0") + "-" + String(day).padStart(2,"0");
      var cell = document.createElement("div");
      cell.className = "cal-cell"; cell.dataset.date = dateStr;
      if(dateStr === today){ cell.dataset.today = "true"; }
      if(dateStr === calState.selectedDate){ cell.dataset.selected = "true"; }
      var num = document.createElement("div"); num.className = "cal-daynum"; num.textContent = day;
      cell.appendChild(num);
      if(counts[dateStr]){
        var badge = document.createElement("div"); badge.className = "cal-count-badge"; badge.textContent = counts[dateStr];
        cell.appendChild(badge);
      }
      cell.addEventListener("click", function(){
        calState.selectedDate = this.dataset.date;
        renderCalendarGrid();
        renderCalAgenda();
      });
      grid.appendChild(cell);
    }
    document.getElementById("calMonthLabel").textContent = year + "年" + (month + 1) + "月";
  }

  function renderCalAgenda(){
    var list = document.getElementById("calAgendaList");
    if(!list) return;
    var ds = calState.selectedDate;
    document.getElementById("calAgendaTitle").textContent = ds ? (fmtDateHuman(ds) + " 的預約／到訪") : "請選擇日期";
    var matched = customersData.filter(function(c){ return c.date === ds; });
    var existing = {};
    Array.prototype.forEach.call(list.children, function(li){ existing[li.dataset.key] = li; });
    var frag = document.createDocumentFragment();
    matched.forEach(function(c){
      var li = existing[c.id];
      if(li){ patchCustomerCard(li, c); delete existing[c.id]; }
      else{ li = buildCustomerCard(c); }
      frag.appendChild(li);
    });
    Object.keys(existing).forEach(function(id){ existing[id].remove(); });
    list.appendChild(frag);
    document.getElementById("calAgendaEmpty").style.display = matched.length === 0 ? "block" : "none";
  }

  function recomputeCalendar(){
    if(calState.year === null){ initCalState(); }
    renderCalendarGrid();
    renderCalAgenda();
  }

  /* ============================================================
     各品牌客戶
     ============================================================ */
  var byBrandState = { brand:null };

  function populateByBrandSelect(){
    var sel = document.getElementById("byBrandSelect");
    if(!sel || sel.dataset.built) return;
    sel.dataset.built = "1";
    BRANDS.forEach(function(b){
      var opt = document.createElement("option"); opt.value = b; opt.textContent = b;
      sel.appendChild(opt);
    });
    byBrandState.brand = BRANDS[0] || null;
    sel.value = byBrandState.brand || "";
    sel.addEventListener("change", function(){
      byBrandState.brand = sel.value;
      renderByBrandList();
    });
  }

  function renderByBrandList(){
    var list = document.getElementById("byBrandList");
    if(!list || !byBrandState.brand) return;
    var brand = byBrandState.brand;
    var matched = customersData.filter(function(c){ return (c.brands || []).indexOf(brand) > -1; });
    var existing = {};
    Array.prototype.forEach.call(list.children, function(li){ existing[li.dataset.key] = li; });
    var frag = document.createDocumentFragment();
    matched.forEach(function(c){
      var li = existing[c.id];
      if(li){ patchCustomerCard(li, c); delete existing[c.id]; }
      else{ li = buildCustomerCard(c); }
      frag.appendChild(li);
    });
    Object.keys(existing).forEach(function(id){ existing[id].remove(); });
    list.appendChild(frag);
    document.getElementById("byBrandCount").textContent = matched.length ? ("共 " + matched.length + " 位") : "";
    document.getElementById("byBrandEmptyState").style.display = matched.length === 0 ? "block" : "none";
  }

  /* ============================================================
     訂單／工程財務模組（管理者專用）
     ============================================================ */

  function todayISO(){
    var d = new Date();
    function p(n){ return String(n).padStart(2,"0"); }
    return d.getFullYear() + "-" + p(d.getMonth()+1) + "-" + p(d.getDate());
  }
  function currentYYYYMM(){
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0");
  }
  function fmtMoney(n){
    if(n === null || n === undefined || isNaN(n)) return "－";
    return "NT$" + Math.round(n).toLocaleString("zh-Hant");
  }
  function fmtMoneyPlain(n){
    if(n === null || n === undefined || isNaN(n)) return "0";
    return Math.round(n).toLocaleString("zh-Hant");
  }
  function getStaffRate(staffId){
    var s = staffData.filter(function(x){ return x.id === staffId; })[0];
    return s ? (s.commissionRate || 0) : 0;
  }
  function sumAmounts(list){
    return (list || []).reduce(function(sum, r){ return sum + (Number(r.amount) || 0); }, 0);
  }
  function calcOrderFinance(o){
    var total = Number(o.totalPrice) || 0;
    var cost = (o.cost === null || o.cost === undefined || o.cost === "") ? null : (Number(o.cost) || 0);
    var grossProfit = cost === null ? null : (total - cost);
    var basis = COMMISSION_BASIS === "profit" ? (grossProfit === null ? 0 : grossProfit) : total;
    var rate = (o.commissionRate === null || o.commissionRate === undefined || o.commissionRate === "") ? getStaffRate(o.staffId) : (Number(o.commissionRate) || 0);
    var commissionOwed = basis * (rate / 100);
    var paidTotal = sumAmounts(o.payments);
    var balanceDue = total - paidTotal;
    var payoutTotal = sumAmounts(o.payouts);
    var payoutRemaining = commissionOwed - payoutTotal;
    return {
      total:total, cost:cost, grossProfit:grossProfit, rate:rate,
      commissionOwed:commissionOwed, paidTotal:paidTotal, balanceDue:balanceDue,
      payoutTotal:payoutTotal, payoutRemaining:payoutRemaining
    };
  }

  /* ---------------- 報價單：開新視窗列印／另存為 PDF（不依賴任何外部套件） ---------------- */
  function openQuotePrintWindow(orderId, overrideData){
    var o = ordersData.filter(function(x){ return x.id === orderId; })[0];
    if(!o){ showToast("找不到這筆訂單"); return; }
    if(overrideData){ o = Object.assign({}, o, overrideData); }
    function pad(n){ return String(n).padStart(2,"0"); }
    var today = new Date();
    var todayLabel = today.getFullYear() + "/" + pad(today.getMonth()+1) + "/" + pad(today.getDate());
    var dealLabel = o.dealDate ? String(o.dealDate).replace(/-/g,"/") : "－";
    var t = quoteItemsTotals(o);
    var itemsRowsHtml;
    if(t.hasItems){
      itemsRowsHtml = (o.items || []).map(function(it){
        return "<tr><td>" + esc(it.name || "") + "</td><td>" + esc(it.spec || "") + "</td>"
          + "<td class=\"num\">" + esc(it.unit || "") + "</td><td class=\"num\">" + quoteItemQty(it) + "</td>"
          + "<td class=\"num\">" + fmtMoneyPlain(quoteItemUnitPrice(it)) + "</td>"
          + "<td class=\"num\">" + fmtMoneyPlain(quoteItemDiscount(it)) + "</td>"
          + "<td class=\"num\">" + fmtMoney(quoteItemSubtotal(it)) + "</td></tr>";
      }).join("");
    } else {
      itemsRowsHtml = "<tr><td colspan=\"6\">" + esc(o.brand || "") + "</td><td class=\"num\">" + fmtMoney(t.subtotal) + "</td></tr>";
    }
    var totalsHtml = ""
      + (t.hasItems ? "<div>小計　" + fmtMoney(t.subtotal) + "</div>" : "")
      + "<div>稅金（" + t.taxRate + "%）　" + fmtMoney(t.tax) + "</div>"
      + "<div class=\"grand\">總計　" + fmtMoney(t.total) + "</div>";
    var html = ""
      + "<!DOCTYPE html><html lang=\"zh-Hant\"><head><meta charset=\"utf-8\">"
      + "<title>報價單－" + esc(o.brand || "") + "－" + esc(o.customerName || "") + "</title>"
      + "<style>"
      + "@page{ size:A4; margin:18mm; }"
      + "body{ font-family:'Noto Sans TC','PingFang TC','Microsoft JhengHei',sans-serif; color:#1c1c1a; margin:0; padding:32px; }"
      + "h1{ font-size:22px; letter-spacing:.15em; margin:0 0 8px; }"
      + ".brand-banner{ display:inline-block; font-size:16px; font-weight:700; color:#26424b; background:#e4eef0; border-radius:6px; padding:4px 14px; margin:0 0 6px; }"
      + ".sub{ color:#78766e; font-size:12.5px; margin:0 0 24px; }"
      + "table.info{ width:100%; border-collapse:collapse; margin-bottom:24px; }"
      + "table.info th, table.info td{ text-align:left; padding:8px 8px; border-bottom:1px solid #ddd8cc; font-size:13.5px; }"
      + "table.info th{ width:110px; color:#78766e; font-weight:600; white-space:nowrap; }"
      + "table.items{ width:100%; border-collapse:collapse; margin-bottom:10px; }"
      + "table.items th, table.items td{ text-align:left; padding:8px 8px; border-bottom:1px solid #ddd8cc; font-size:13px; }"
      + "table.items th{ color:#78766e; font-weight:600; font-size:11.5px; white-space:nowrap; }"
      + "table.items td.num, table.items th.num{ text-align:right; font-variant-numeric:tabular-nums; }"
      + ".totals{ text-align:right; font-size:13.5px; color:#4a4844; margin-bottom:28px; }"
      + ".totals div{ margin-top:4px; }"
      + ".totals .grand{ font-size:18px; font-weight:700; color:#1c1c1a; margin-top:8px; }"
      + ".notes{ min-height:50px; white-space:pre-wrap; font-size:13px; border:1px solid #ddd8cc; border-radius:6px; padding:10px; margin-bottom:32px; }"
      + ".sign-grid{ display:flex; gap:40px; margin-top:48px; }"
      + ".sign-box{ flex:1; }"
      + ".sign-line{ border-bottom:1px solid #1c1c1a; height:46px; }"
      + ".sign-label{ font-size:12.5px; color:#78766e; margin-top:6px; }"
      + ".print-bar{ text-align:right; margin-bottom:20px; }"
      + ".print-bar button{ font-size:13px; padding:8px 18px; border-radius:8px; border:1px solid #3e6370; background:#e4eef0; color:#26424b; cursor:pointer; }"
      + "@media print{ .print-bar{ display:none; } body{ padding:0; } }"
      + "</style></head><body>"
      + "<div class=\"print-bar\"><button onclick=\"window.print()\">列印／另存為 PDF</button></div>"
      + "<h1>報 價 單</h1>"
      + "<div class=\"brand-banner\">" + esc(o.brand || "（未選擇品牌）") + "</div>"
      + "<p class=\"sub\">製表日期　" + todayLabel + "</p>"
      + "<table class=\"info\">"
      + "<tr><th>客戶姓名</th><td>" + esc(o.customerName || "") + "</td></tr>"
      + (o.customerPhone ? "<tr><th>客戶電話</th><td>" + esc(o.customerPhone) + "</td></tr>" : "")
      + "<tr><th>負責業務</th><td>" + esc(o.staffName || "") + "</td></tr>"
      + "<tr><th>預計成交日期</th><td>" + dealLabel + "</td></tr>"
      + "</table>"
      + "<table class=\"items\"><thead><tr><th>項目</th><th>規格</th><th class=\"num\">單位</th><th class=\"num\">數量</th><th class=\"num\">單價</th><th class=\"num\">折扣</th><th class=\"num\">小計</th></tr></thead>"
      + "<tbody>" + itemsRowsHtml + "</tbody></table>"
      + "<div class=\"totals\">" + totalsHtml + "</div>"
      + (o.notes ? "<div class=\"notes\">" + esc(o.notes) + "</div>" : "")
      + "<div class=\"sign-grid\">"
      + "<div class=\"sign-box\"><div class=\"sign-line\"></div><div class=\"sign-label\">客戶簽名　　　日期：＿＿＿＿＿＿</div></div>"
      + "<div class=\"sign-box\"><div class=\"sign-line\"></div><div class=\"sign-label\">主管簽核　　　日期：＿＿＿＿＿＿</div></div>"
      + "</div>"
      + "</body></html>";
    /* 用 Blob URL 開新視窗，避免部分瀏覽器（尤其 Safari）對 window.open("") 之後
       再用 document.write 寫入內容的時機處理不穩定，導致列印出來是空白頁。 */
    var blob = new Blob([html], { type: "text/html" });
    var blobUrl = URL.createObjectURL(blob);
    var win = window.open(blobUrl, "_blank");
    if(!win){ showToast("瀏覽器擋下了新視窗，請允許本頁的彈出視窗後再試一次"); URL.revokeObjectURL(blobUrl); return; }
    setTimeout(function(){ URL.revokeObjectURL(blobUrl); }, 60000);
  }

  function updateOrderSummary(el, data){
    var f = calcOrderFinance(data);
    var parts = [
      "毛利 <b>" + fmtMoney(f.grossProfit) + "</b>",
      "應付抽成 <b>" + fmtMoney(f.commissionOwed) + "</b>（" + (f.rate||0) + "%）",
      "已收 <b>" + fmtMoney(f.paidTotal) + "</b>／應收餘額 <b>" + fmtMoney(f.balanceDue) + "</b>",
      "已領佣金 <b>" + fmtMoney(f.payoutTotal) + "</b>／待領 <b>" + fmtMoney(f.payoutRemaining) + "</b>"
    ];
    el.innerHTML = parts.map(function(p){ return "<span>" + p + "</span>"; }).join("");
  }

  function readOrderCardFinanceInputs(li){
    var existing = ordersData.filter(function(o){ return o.id === li.dataset.key; })[0] || {};
    var total = parseFloat(li.querySelector(".f-total").value) || 0;
    var costRaw = li.querySelector(".f-cost").value;
    var cost = costRaw === "" ? null : (parseFloat(costRaw) || 0);
    var staffId = li.querySelector(".order-staff-badge").dataset.staffId || "";
    return {
      totalPrice: total, cost: cost, staffId: staffId,
      payments: existing.payments || [], payouts: existing.payouts || []
    };
  }
  function patchOrderFinanceLocal(li){
    var summary = li.querySelector('[data-role="summary"]');
    if(!summary) return;
    updateOrderSummary(summary, readOrderCardFinanceInputs(li));
  }

  function buildSubList(order, field, showType){
    var ul = document.createElement("ul");
    ul.className = "sub-list";
    (order[field] || []).forEach(function(rec, idx){
      var row = document.createElement("li");
      row.className = "sub-row";
      var amt = document.createElement("span"); amt.className = "sub-amt"; amt.textContent = fmtMoney(rec.amount);
      row.appendChild(amt);
      var date = document.createElement("span"); date.className = "sub-date"; date.textContent = rec.date || "";
      row.appendChild(date);
      if(showType){
        var type = document.createElement("span"); type.className = "sub-type"; type.textContent = rec.type || "其他";
        row.appendChild(type);
      }
      var rm = document.createElement("button");
      rm.type = "button"; rm.className = "sub-rm"; rm.innerHTML = ICON_CLOSE; rm.setAttribute("aria-label","刪除這筆紀錄");
      rm.addEventListener("click", function(){
        if(isReadonly) return;
        removeOrderSubRecord(order.id, field, idx);
      });
      row.appendChild(rm);
      ul.appendChild(row);
    });
    return ul;
  }

  function buildSubAddForm(order, field, showType){
    var form = document.createElement("div");
    form.className = "sub-add-form";
    var amtInput = document.createElement("input");
    amtInput.type = "number"; amtInput.className = "sub-amt-input"; amtInput.placeholder = "金額"; amtInput.min = "0";
    form.appendChild(amtInput);
    var dateInput = document.createElement("input");
    dateInput.type = "date"; dateInput.value = todayISO();
    form.appendChild(dateInput);
    var typeSelect = null;
    if(showType){
      typeSelect = document.createElement("select");
      PAYMENT_TYPES.forEach(function(t){
        var opt = document.createElement("option"); opt.value = t; opt.textContent = t;
        typeSelect.appendChild(opt);
      });
      form.appendChild(typeSelect);
    }
    var btn = document.createElement("button");
    btn.type = "button"; btn.textContent = showType ? "新增收款" : "新增領款";
    btn.addEventListener("click", function(){
      if(isReadonly) return;
      var amount = parseFloat(amtInput.value);
      if(!amount || amount <= 0){ showToast("請輸入金額"); return; }
      var entry = { amount: amount, date: dateInput.value || todayISO() };
      if(showType){ entry.type = typeSelect.value; }
      addOrderSubRecord(order.id, field, entry);
      amtInput.value = ""; dateInput.value = todayISO();
    });
    form.appendChild(btn);
    return form;
  }

  /* ---------------- 報價項目明細（給客戶看的品項與價格，用來產生報價單） ---------------- */
  function quoteItemQty(it){ var v = Number(it.qty); return isNaN(v) ? 0 : v; }
  function quoteItemUnitPrice(it){ var v = Number(it.unitPrice); return isNaN(v) ? 0 : v; }
  function quoteItemDiscount(it){ var v = Number(it.discount); return isNaN(v) ? 0 : v; }
  function quoteItemSubtotal(it){ return quoteItemQty(it) * quoteItemUnitPrice(it) - quoteItemDiscount(it); }
  function quoteItemsSubtotal(order){
    return (order.items || []).reduce(function(sum, it){ return sum + quoteItemSubtotal(it); }, 0);
  }
  function quoteTaxRate(order){
    var r = Number(order.taxRate);
    return (isNaN(r) || r < 0) ? 0 : r;
  }
  function quoteItemsTotals(order){
    var hasItems = (order.items || []).length > 0;
    var subtotal = hasItems ? quoteItemsSubtotal(order) : (Number(order.totalPrice) || 0);
    var taxRate = quoteTaxRate(order);
    var tax = Math.round(subtotal * taxRate / 100);
    return { hasItems:hasItems, subtotal:subtotal, taxRate:taxRate, tax:tax, total:subtotal + tax };
  }

  /* ---------------- 報價單編輯彈出視窗（可直接打字新增／編輯項目） ---------------- */
  /* 視窗開啟期間，項目明細一律以 quoteModalItems（本機暫存陣列）為準：
     所有欄位的修改都先同步寫進這個陣列，再用「單一、合併後」的儲存函式整包送出，
     避免多欄位快速連續編輯時，因為伺服器回寫有延遲、各自用舊資料組陣列而互相覆蓋。 */
  var quoteModalOrderId = null;
  var quoteModalItems = [];
  var quoteModalTaxRateLocal = 0;

  function cloneQuoteItems(items){
    return (items || []).map(function(it){ return Object.assign({}, it); });
  }

  function openQuoteEditModal(orderId){
    var order = ordersData.filter(function(x){ return x.id === orderId; })[0];
    if(!order){ showToast("找不到這筆訂單"); return; }
    quoteModalOrderId = orderId;
    quoteModalItems = cloneQuoteItems(order.items);
    quoteModalTaxRateLocal = quoteTaxRate(order);
    document.getElementById("quoteModalBrand").textContent = order.brand || "（未選擇品牌）";
    document.getElementById("quoteModalCustomer").textContent = order.customerName || "（未填客戶姓名）";
    renderQuoteModalItems();
    document.getElementById("quoteModalOverlay").classList.add("open");
  }
  function closeQuoteEditModal(){
    quoteModalOrderId = null;
    quoteModalItems = [];
    document.getElementById("quoteModalOverlay").classList.remove("open");
  }
  function currentQuoteModalOrder(){
    if(!quoteModalOrderId) return null;
    return ordersData.filter(function(x){ return x.id === quoteModalOrderId; })[0] || null;
  }

  function saveQuoteModalItemsNow(){
    if(!quoteModalOrderId) return;
    updateOrderDoc(quoteModalOrderId, { items: cloneQuoteItems(quoteModalItems) });
  }
  var saveQuoteModalItemsDebounced = debounce(saveQuoteModalItemsNow, 500);

  function updateQuoteItemField(index, key, value, immediate){
    if(!quoteModalItems[index]) return;
    quoteModalItems[index][key] = value;
    if(immediate){ saveQuoteModalItemsNow(); }
    else { saveQuoteModalItemsDebounced(); }
  }

  function buildQuoteModalRow(it, idx){
    var tr = document.createElement("tr");
    tr.dataset.idx = idx;

    function textCell(key, placeholder, extraClass){
      var td = document.createElement("td"); if(extraClass){ td.className = extraClass; }
      var input = document.createElement("input");
      input.type = "text"; input.className = "qm-input-" + key; input.placeholder = placeholder || "";
      input.value = it[key] || "";
      var save = debounce(function(){ updateQuoteItemField(idx, key, input.value); }, 500);
      input.addEventListener("input", save);
      input.addEventListener("blur", function(){ updateQuoteItemField(idx, key, input.value, true); });
      td.appendChild(input);
      return td;
    }
    function numCell(key, placeholder){
      var td = document.createElement("td"); td.className = "qm-num";
      var input = document.createElement("input");
      input.type = "number"; input.className = "qm-input-" + key; input.placeholder = placeholder || "";
      input.value = (it[key] === undefined || it[key] === null || it[key] === "") ? "" : it[key];
      function commit(immediate){
        var v = parseFloat(input.value); if(isNaN(v)) v = 0;
        updateQuoteItemField(idx, key, v, immediate);
        updateQuoteModalTotalsDisplay();
      }
      var save = debounce(function(){ commit(false); }, 400);
      input.addEventListener("input", save);
      input.addEventListener("blur", function(){ commit(true); });
      td.appendChild(input);
      return td;
    }

    tr.appendChild(textCell("name", "項目名稱", "qm-name"));
    tr.appendChild(textCell("spec", "規格", "qm-spec"));
    tr.appendChild(textCell("unit", "單位", "qm-unit"));
    tr.appendChild(numCell("qty", "數量"));
    tr.appendChild(numCell("unitPrice", "單價"));
    tr.appendChild(numCell("discount", "折扣"));
    var tdSub = document.createElement("td"); tdSub.className = "qm-num qm-subtotal"; tdSub.textContent = fmtMoney(quoteItemSubtotal(it));
    tr.appendChild(tdSub);
    var tdRm = document.createElement("td");
    var rm = document.createElement("button");
    rm.type = "button"; rm.className = "sub-rm"; rm.innerHTML = ICON_CLOSE; rm.setAttribute("aria-label","刪除這個項目");
    rm.addEventListener("click", function(){
      if(isReadonly) return;
      quoteModalItems.splice(idx, 1);
      renderQuoteModalItems();
      saveQuoteModalItemsNow();
    });
    tdRm.appendChild(rm);
    tr.appendChild(tdRm);
    return tr;
  }

  function renderQuoteModalItems(){
    var tbody = document.getElementById("quoteModalTbody");
    tbody.innerHTML = "";
    var frag = document.createDocumentFragment();
    quoteModalItems.forEach(function(it, idx){ frag.appendChild(buildQuoteModalRow(it, idx)); });
    tbody.appendChild(frag);
    updateQuoteModalTotalsDisplay();
  }

  function quoteModalLocalTotals(){
    var subtotal = quoteModalItems.reduce(function(sum, it){ return sum + quoteItemSubtotal(it); }, 0);
    var taxRate = quoteModalTaxRateLocal;
    var tax = Math.round(subtotal * taxRate / 100);
    return { hasItems: quoteModalItems.length > 0, subtotal: subtotal, taxRate: taxRate, tax: tax, total: subtotal + tax };
  }

  function updateQuoteModalTotalsDisplay(){
    if(!quoteModalOrderId) return;
    var t = quoteModalLocalTotals();
    document.getElementById("quoteModalSubtotal").textContent = fmtMoney(t.subtotal);
    document.getElementById("quoteModalTax").textContent = fmtMoney(t.tax);
    document.getElementById("quoteModalTotal").textContent = fmtMoney(t.total);
    var taxInput = document.getElementById("quoteModalTaxRate");
    if(document.activeElement !== taxInput){ taxInput.value = t.taxRate; }
  }

  function addQuoteModalRow(){
    if(isReadonly) return;
    if(!quoteModalOrderId) return;
    quoteModalItems.push({ name:"", spec:"", unit:"", qty:1, unitPrice:0, discount:0 });
    renderQuoteModalItems();
    saveQuoteModalItemsNow();
  }

  /* ---------------- order table row (spreadsheet-style editable order list) ---------------- */
  function buildSelect(className, options, currentValue, placeholder, onChange){
    var sel = document.createElement("select");
    sel.className = className;
    var ph = document.createElement("option");
    ph.value = ""; ph.textContent = placeholder;
    sel.appendChild(ph);
    options.forEach(function(opt){
      var o = document.createElement("option");
      o.value = opt.value; o.textContent = opt.label;
      if(opt.value === currentValue){ o.selected = true; }
      sel.appendChild(o);
    });
    if(!currentValue){ ph.selected = true; }
    sel.addEventListener("change", onChange);
    return sel;
  }

  function buildOrderRow(data){
    data = data || {};
    var id = data.id || uid("local");
    var tbody = document.createElement("tbody");
    tbody.dataset.key = id;

    var row = document.createElement("tr");
    row.className = "order-row";

    /* 客戶 */
    var tdName = document.createElement("td");
    tdName.className = "oc-name";
    var nameWrap = document.createElement("div"); nameWrap.className = "row-flex";
    var name = document.createElement("input");
    name.type = "text"; name.className = "order-cust-name"; name.placeholder = "客戶姓名";
    name.value = data.customerName || "";
    var saveCustName = debounce(function(){ updateOrderDoc(id, { customerName: name.value.trim() }); }, 500);
    name.addEventListener("input", saveCustName);
    name.addEventListener("blur", function(){ updateOrderDoc(id, { customerName: name.value.trim() }); });
    nameWrap.appendChild(name);
    var linkBtn = document.createElement("button");
    linkBtn.type = "button"; linkBtn.className = "link-icon-btn"; linkBtn.title = "連結既有客戶";
    linkBtn.dataset.customerId = data.customerId || "";
    linkBtn.dataset.linked = data.customerId ? "true" : "false";
    linkBtn.innerHTML = ICON_STAFF;
    linkBtn.addEventListener("click", function(){
      if(isReadonly) return;
      var items = customersData.map(function(c){
        return { label: c.name + (c.phone ? "（"+c.phone+"）" : ""), onSelect:function(){
          name.value = c.name;
          linkBtn.dataset.customerId = c.id;
          linkBtn.dataset.linked = "true";
          updateOrderDoc(id, { customerId: c.id, customerName: c.name, customerPhone: c.phone || "" });
          if((c.status || "") !== "closed"){
            updateCustomerDoc(c.id, { status: "closed" });
            showToast("已將客戶「" + c.name + "」的追蹤狀態同步更新為「已成交」");
          }
        }};
      });
      if(customersData.length === 0){
        items.push({ label:"（尚無客戶名單，可直接手動輸入姓名）", onSelect:function(){} });
      }
      items.push({ label:"取消連結（保留姓名文字）", onSelect:function(){
        linkBtn.dataset.customerId = "";
        linkBtn.dataset.linked = "false";
        updateOrderDoc(id, { customerId: "" });
      }});
      openPopover(linkBtn, items);
    });
    nameWrap.appendChild(linkBtn);
    tdName.appendChild(nameWrap);
    row.appendChild(tdName);

    /* 品牌 */
    var tdBrand = document.createElement("td");
    var brandSelect = buildSelect("oc-brand", BRANDS.map(function(b){ return {value:b, label:b}; }), data.brand || "", "（選擇品牌）", function(){
      updateOrderDoc(id, { brand: brandSelect.value });
    });
    tdBrand.appendChild(brandSelect);
    row.appendChild(tdBrand);

    /* 負責業務 */
    var tdStaff = document.createElement("td");
    var rateInput; // 抽成％輸入框（於下方「應付抽成」欄建立），此處先宣告供 staff 切換時更新顯示用
    var staffSelect = buildSelect("oc-staff", staffData.map(function(s){ return {value:s.id, label:s.name}; }), data.staffId || "", "（選擇業務）", function(){
      var s = staffData.filter(function(x){ return x.id === staffSelect.value; })[0];
      updateOrderDoc(id, { staffId: staffSelect.value, staffName: s ? s.name : "" });
      // 若這筆訂單尚未手動設定過抽成％（沿用業務預設值），切換業務時一併更新顯示的預設值
      if((data.commissionRate === null || data.commissionRate === undefined) && rateInput && document.activeElement !== rateInput){
        rateInput.value = getStaffRate(staffSelect.value);
      }
      patchOrderFinanceLocal(row);
    });
    tdStaff.appendChild(staffSelect);
    row.appendChild(tdStaff);

    /* 成交日期 */
    var tdDate = document.createElement("td"); tdDate.className = "oc-date";
    var dealDate = document.createElement("input"); dealDate.type = "date"; dealDate.className = "f-dealdate";
    dealDate.value = data.dealDate || "";
    dealDate.addEventListener("change", function(){ updateOrderDoc(id, { dealDate: dealDate.value }); recomputeOrders(); });
    tdDate.appendChild(dealDate);
    row.appendChild(tdDate);

    /* 總價 */
    var tdTotal = document.createElement("td"); tdTotal.className = "oc-num";
    var totalInput = document.createElement("input"); totalInput.type = "number"; totalInput.className = "f-total"; totalInput.min = "0";
    totalInput.value = data.totalPrice || 0;
    var saveTotal = debounce(function(){ updateOrderDoc(id, { totalPrice: parseFloat(totalInput.value) || 0 }); }, 500);
    totalInput.addEventListener("input", function(){ saveTotal(); patchOrderFinanceLocal(row); });
    totalInput.addEventListener("blur", function(){ updateOrderDoc(id, { totalPrice: parseFloat(totalInput.value)||0 }); patchOrderFinanceLocal(row); });
    tdTotal.appendChild(totalInput);
    row.appendChild(tdTotal);

    /* 成本 */
    var tdCost = document.createElement("td"); tdCost.className = "oc-num";
    var costInput = document.createElement("input"); costInput.type = "number"; costInput.className = "f-cost"; costInput.min = "0"; costInput.placeholder = "未填";
    costInput.value = (data.cost === null || data.cost === undefined) ? "" : data.cost;
    var saveCost = debounce(function(){
      var raw = costInput.value;
      updateOrderDoc(id, { cost: raw === "" ? null : (parseFloat(raw) || 0) });
    }, 500);
    costInput.addEventListener("input", function(){ saveCost(); patchOrderFinanceLocal(row); });
    costInput.addEventListener("blur", function(){ var raw = costInput.value; updateOrderDoc(id, { cost: raw === "" ? null : (parseFloat(raw)||0) }); patchOrderFinanceLocal(row); });
    tdCost.appendChild(costInput);
    row.appendChild(tdCost);

    /* 毛利（唯讀） */
    var tdProfit = document.createElement("td"); tdProfit.className = "oc-computed"; tdProfit.dataset.role = "profit";
    row.appendChild(tdProfit);

    /* 應付抽成（金額唯讀，抽成％可個別覆寫） */
    var tdCommission = document.createElement("td"); tdCommission.className = "oc-computed"; tdCommission.dataset.role = "commission";
    var commMoney = document.createElement("b"); commMoney.className = "commission-money";
    tdCommission.appendChild(commMoney);
    tdCommission.appendChild(document.createTextNode("（"));
    rateInput = document.createElement("input");
    rateInput.type = "number"; rateInput.className = "f-rate"; rateInput.min = "0"; rateInput.max = "100"; rateInput.step = "0.1";
    rateInput.title = "這筆訂單的抽成比例（可個別調整，預設帶入該業務的抽成設定）";
    rateInput.value = (data.commissionRate === null || data.commissionRate === undefined) ? getStaffRate(data.staffId) : data.commissionRate;
    var saveRate = debounce(function(){
      var v = parseFloat(rateInput.value); if(isNaN(v) || v < 0) v = 0;
      updateOrderDoc(id, { commissionRate: v });
    }, 500);
    rateInput.addEventListener("input", function(){ saveRate(); patchOrderFinanceLocal(row); });
    rateInput.addEventListener("blur", function(){
      var v = parseFloat(rateInput.value); if(isNaN(v) || v < 0) v = 0;
      updateOrderDoc(id, { commissionRate: v });
      patchOrderFinanceLocal(row);
    });
    tdCommission.appendChild(rateInput);
    tdCommission.appendChild(document.createTextNode("%）"));
    row.appendChild(tdCommission);

    /* 收款狀況（唯讀摘要） */
    var tdPayment = document.createElement("td"); tdPayment.className = "oc-computed"; tdPayment.dataset.role = "paymentSummary";
    row.appendChild(tdPayment);

    /* 領款狀況（唯讀摘要） */
    var tdPayout = document.createElement("td"); tdPayout.className = "oc-computed"; tdPayout.dataset.role = "payoutSummary";
    row.appendChild(tdPayout);

    /* 訂單狀態 */
    var tdStatus = document.createElement("td");
    var statusSelect = buildSelect("oc-status", ORDER_STATUSES.map(function(s){ return {value:s.key, label:s.label}; }), data.orderStatus || "in_progress", "（狀態）", function(){
      updateOrderDoc(id, { orderStatus: statusSelect.value || "in_progress" });
      recomputeOrders();
    });
    if(!data.orderStatus){ statusSelect.value = "in_progress"; }
    tdStatus.appendChild(statusSelect);
    row.appendChild(tdStatus);

    /* 備註 */
    var tdNotes = document.createElement("td"); tdNotes.className = "oc-notes";
    var notes = document.createElement("input");
    notes.type = "text"; notes.className = "order-notes"; notes.placeholder = "備註";
    notes.value = data.notes || "";
    var saveNotes = debounce(function(){ updateOrderDoc(id, { notes: notes.value.trim() }); }, 500);
    notes.addEventListener("input", saveNotes);
    notes.addEventListener("blur", function(){ updateOrderDoc(id, { notes: notes.value.trim() }); });
    tdNotes.appendChild(notes);
    row.appendChild(tdNotes);

    /* 操作：收付明細展開、刪除 */
    var tdActions = document.createElement("td");
    var actionsWrap = document.createElement("div"); actionsWrap.className = "oc-actions";
    var toggleBtn = document.createElement("button");
    toggleBtn.type = "button"; toggleBtn.className = "oc-toggle-btn"; toggleBtn.textContent = "收付明細";
    toggleBtn.setAttribute("aria-expanded", "false");
    toggleBtn.addEventListener("click", function(){
      var detailRow = tbody.querySelector(".order-detail-row");
      var collapsed = detailRow.dataset.localCollapsed === "true";
      detailRow.dataset.localCollapsed = collapsed ? "false" : "true";
      toggleBtn.setAttribute("aria-expanded", collapsed ? "true" : "false");
    });
    actionsWrap.appendChild(toggleBtn);
    var quoteBtn = document.createElement("button");
    quoteBtn.type = "button"; quoteBtn.className = "oc-toggle-btn"; quoteBtn.textContent = "報價單";
    quoteBtn.addEventListener("click", function(){ openQuoteEditModal(id); });
    actionsWrap.appendChild(quoteBtn);
    var del = document.createElement("button");
    del.type = "button"; del.className = "btn-delete"; del.setAttribute("aria-label","刪除訂單");
    del.dataset.localConfirming = "false";
    del.innerHTML = ICON_CLOSE;
    del.addEventListener("click", function(){
      if(isReadonly) return;
      if(del.dataset.localConfirming === "true"){
        deleteOrderDoc(id);
        showToast("已刪除訂單");
      } else {
        del.dataset.localConfirming = "true";
        clearTimeout(del._t);
        del._t = setTimeout(function(){ del.dataset.localConfirming = "false"; }, 3000);
      }
    });
    actionsWrap.appendChild(del);
    tdActions.appendChild(actionsWrap);
    row.appendChild(tdActions);

    tbody.appendChild(row);

    /* 展開列：付款紀錄／業務領款紀錄（報價項目明細改到「報價單」彈出視窗編輯） */
    var detailRow = document.createElement("tr");
    detailRow.className = "order-detail-row";
    detailRow.dataset.localCollapsed = "true";
    var detailTd = document.createElement("td");
    detailTd.colSpan = 13;

    var grid = document.createElement("div"); grid.className = "order-detail-grid";

    var paymentBlock = document.createElement("div");
    paymentBlock.className = "sub-block"; paymentBlock.dataset.role = "payments";
    var h1 = document.createElement("h4"); h1.textContent = "付款紀錄（客戶收款，可分次記錄）";
    paymentBlock.appendChild(h1);
    paymentBlock.appendChild(buildSubList(data, "payments", true));
    paymentBlock.appendChild(buildSubAddForm(data, "payments", true));
    grid.appendChild(paymentBlock);

    var payoutBlock = document.createElement("div");
    payoutBlock.className = "sub-block"; payoutBlock.dataset.role = "payouts";
    var h2 = document.createElement("h4"); h2.textContent = "業務領款紀錄";
    payoutBlock.appendChild(h2);
    payoutBlock.appendChild(buildSubList(data, "payouts", false));
    payoutBlock.appendChild(buildSubAddForm(data, "payouts", false));
    grid.appendChild(payoutBlock);

    detailTd.appendChild(grid);
    detailRow.appendChild(detailTd);
    tbody.appendChild(detailRow);

    updateOrderRowComputed(row, data);

    return tbody;
  }

  function updateOrderRowComputed(row, data){
    var f = calcOrderFinance(data);
    row.querySelector('[data-role="profit"]').innerHTML = "<b>" + fmtMoney(f.grossProfit) + "</b>";
    var commEl = row.querySelector('[data-role="commission"]');
    var commMoneyEl = commEl.querySelector(".commission-money");
    if(commMoneyEl){ commMoneyEl.textContent = fmtMoney(f.commissionOwed); }
    row.querySelector('[data-role="paymentSummary"]').innerHTML = "已收 <b>" + fmtMoney(f.paidTotal) + "</b><br>餘 " + fmtMoney(f.balanceDue);
    row.querySelector('[data-role="payoutSummary"]').innerHTML = "已領 <b>" + fmtMoney(f.payoutTotal) + "</b><br>待 " + fmtMoney(f.payoutRemaining);
  }

  function readOrderRowFinanceInputs(row){
    var tbody = row.parentNode;
    var existing = ordersData.filter(function(o){ return o.id === tbody.dataset.key; })[0] || {};
    var total = parseFloat(row.querySelector(".f-total").value) || 0;
    var costRaw = row.querySelector(".f-cost").value;
    var cost = costRaw === "" ? null : (parseFloat(costRaw) || 0);
    var staffId = row.querySelector(".oc-staff").value || "";
    var rateRaw = row.querySelector(".f-rate").value;
    var commissionRate = rateRaw === "" ? null : (parseFloat(rateRaw) || 0);
    return {
      totalPrice: total, cost: cost, staffId: staffId, commissionRate: commissionRate,
      payments: existing.payments || [], payouts: existing.payouts || []
    };
  }
  function patchOrderFinanceLocal(row){
    updateOrderRowComputed(row, readOrderRowFinanceInputs(row));
  }

  function patchOrderRow(tbody, data){
    var row = tbody.querySelector(".order-row");
    function setIfIdle(input, val){
      if(input && document.activeElement !== input && input.value !== val){ input.value = val; }
    }
    setIfIdle(row.querySelector(".order-cust-name"), data.customerName || "");

    var linkBtn = row.querySelector(".link-icon-btn");
    var custId = data.customerId || "";
    if(linkBtn.dataset.customerId !== custId){
      linkBtn.dataset.customerId = custId;
      linkBtn.dataset.linked = custId ? "true" : "false";
    }

    var brandSelect = row.querySelector(".oc-brand");
    if(document.activeElement !== brandSelect && brandSelect.value !== (data.brand || "")){ brandSelect.value = data.brand || ""; }

    var staffSelect = row.querySelector(".oc-staff");
    if(document.activeElement !== staffSelect){
      var wantIds = staffData.map(function(s){ return s.id; });
      // rebuild options if staff roster changed
      var curIds = Array.prototype.slice.call(staffSelect.options).slice(1).map(function(o){ return o.value; });
      if(curIds.join(",") !== wantIds.join(",")){
        var keep = staffSelect.value;
        staffSelect.innerHTML = "";
        var ph = document.createElement("option"); ph.value = ""; ph.textContent = "（選擇業務）";
        staffSelect.appendChild(ph);
        staffData.forEach(function(s){
          var o = document.createElement("option"); o.value = s.id; o.textContent = s.name;
          staffSelect.appendChild(o);
        });
        staffSelect.value = keep;
      }
      if(staffSelect.value !== (data.staffId || "")){ staffSelect.value = data.staffId || ""; }
    }

    var statusSelect = row.querySelector(".oc-status");
    if(document.activeElement !== statusSelect && statusSelect.value !== (data.orderStatus || "in_progress")){
      statusSelect.value = data.orderStatus || "in_progress";
    }

    setIfIdle(row.querySelector(".f-dealdate"), data.dealDate || "");
    setIfIdle(row.querySelector(".f-total"), data.totalPrice || 0);
    setIfIdle(row.querySelector(".f-cost"), (data.cost === null || data.cost === undefined) ? "" : data.cost);
    setIfIdle(row.querySelector(".f-rate"), (data.commissionRate === null || data.commissionRate === undefined) ? getStaffRate(data.staffId) : data.commissionRate);
    setIfIdle(row.querySelector(".order-notes"), data.notes || "");

    var paymentBlock = tbody.querySelector('[data-role="payments"]');
    paymentBlock.replaceChild(buildSubList(data, "payments", true), paymentBlock.querySelector(".sub-list"));
    var payoutBlock = tbody.querySelector('[data-role="payouts"]');
    payoutBlock.replaceChild(buildSubList(data, "payouts", false), payoutBlock.querySelector(".sub-list"));

    updateOrderRowComputed(row, data);
  }

  function renderOrders(){
    var table = document.getElementById("orderList");
    var existing = {};
    Array.prototype.forEach.call(table.children, function(el){
      if(el.tagName === "TBODY" && el.dataset.key){ existing[el.dataset.key] = el; }
    });
    var frag = document.createDocumentFragment();
    ordersData.forEach(function(o){
      var grp = existing[o.id];
      if(grp){ patchOrderRow(grp, o); delete existing[o.id]; }
      else{ grp = buildOrderRow(o); }
      frag.appendChild(grp);
    });
    Object.keys(existing).forEach(function(id){ existing[id].remove(); });
    table.appendChild(frag);
    applyOrderFilters();
    document.getElementById("orderEmptyState").style.display = ordersData.length === 0 ? "block" : "none";
    refreshQuoteModalIfOpen();
  }

  function refreshQuoteModalIfOpen(){
    var overlay = document.getElementById("quoteModalOverlay");
    if(!overlay || !overlay.classList.contains("open")) return;
    var order = currentQuoteModalOrder();
    if(!order){ closeQuoteEditModal(); return; }
    document.getElementById("quoteModalBrand").textContent = order.brand || "（未選擇品牌）";
    document.getElementById("quoteModalCustomer").textContent = order.customerName || "（未填客戶姓名）";
    /* 項目明細（quoteModalItems）不從遠端資料重新覆蓋：視窗開啟期間一律以本機暫存為準，
       避免伺服器回寫延遲把使用者正在輸入、還沒送達伺服器的內容蓋掉。 */
  }

  function addOrder(){
    createOrderDoc({ dealDate: todayISO() }).then(function(ref){
      setTimeout(function(){
        var input = document.querySelector('#orderList tbody[data-key="'+ref.id+'"] .order-cust-name');
        if(input){ input.focus(); }
      }, 120);
    }, function(){ /* createOrderDoc already toasted */ });
  }

  /* ---------------- 訂單篩選／統計／報表 ---------------- */
  var orderFilter = { month: null, brand: null, showAll: false };

  function populateOrderBrandSelect(){
    var sel = document.getElementById("orderBrandFilterSelect");
    if(!sel || sel.dataset.built) return;
    sel.dataset.built = "1";
    BRANDS.forEach(function(b){
      var opt = document.createElement("option"); opt.value = b; opt.textContent = b;
      sel.appendChild(opt);
    });
    sel.addEventListener("change", function(){
      orderFilter.brand = sel.value || null;
      applyOrderFilters();
      updateFinStats();
    });
  }

  function orderMatchesFilter(o){
    var matchMonth = orderFilter.showAll || !orderFilter.month || !o.dealDate || (o.dealDate || "").indexOf(orderFilter.month) === 0;
    var matchBrand = !orderFilter.brand || o.brand === orderFilter.brand;
    return matchMonth && matchBrand;
  }

  function applyOrderFilters(){
    Array.prototype.forEach.call(document.querySelectorAll("#orderList > tbody[data-key]"), function(tbody){
      var o = ordersData.filter(function(x){ return x.id === tbody.dataset.key; })[0];
      tbody.dataset.localHidden = (o && orderMatchesFilter(o)) ? "false" : "true";
    });
    var count = ordersData.filter(orderMatchesFilter).length;
    document.getElementById("orderListCount").textContent = count ? ("共 " + count + " 筆") : "";
  }

  function updateFinStats(){
    var scoped = ordersData.filter(function(o){ return orderMatchesFilter(o) && o.orderStatus !== "cancelled"; });
    var revenue = 0, cost = 0, hasCost = false, commission = 0;
    scoped.forEach(function(o){
      var f = calcOrderFinance(o);
      revenue += f.total;
      if(f.cost !== null){ cost += f.cost; hasCost = true; }
      commission += f.commissionOwed;
    });
    var profit = hasCost ? (revenue - cost) : null;
    var pendingAll = ordersData.filter(function(o){ return o.orderStatus !== "cancelled"; }).reduce(function(sum,o){
      return sum + calcOrderFinance(o).payoutRemaining;
    }, 0);

    var row = document.getElementById("finStatsRow");
    row.querySelector('[data-k="revenue"] .stat-num').textContent = fmtMoneyPlain(revenue);
    row.querySelector('[data-k="profit"] .stat-num').textContent = profit === null ? "－" : fmtMoneyPlain(profit);
    row.querySelector('[data-k="commission"] .stat-num').textContent = fmtMoneyPlain(commission);
    row.querySelector('[data-k="pending"] .stat-num').textContent = fmtMoneyPlain(pendingAll);
  }

  function renderMonthReport(){
    var wrap = document.getElementById("monthReportWrap");
    var groups = {};
    ordersData.forEach(function(o){
      if(o.orderStatus === "cancelled") return;
      var month = (o.dealDate || "").slice(0,7) || "未填成交日期";
      var brand = o.brand || "未分類";
      groups[month] = groups[month] || {};
      groups[month][brand] = groups[month][brand] || { revenue:0, cost:0, hasCost:false, commission:0, paidCommission:0 };
      var f = calcOrderFinance(o);
      var g = groups[month][brand];
      g.revenue += f.total;
      if(f.cost !== null){ g.cost += f.cost; g.hasCost = true; }
      g.commission += f.commissionOwed;
      g.paidCommission += f.payoutTotal;
    });
    var months = Object.keys(groups).sort().reverse();
    if(months.length === 0){
      wrap.innerHTML = '<div class="report-empty">尚無訂單資料</div>';
      return;
    }
    var html = '<table class="report-table"><thead><tr><th>月份／品牌</th><th>營收</th><th>成本</th><th>毛利</th><th>應付抽成</th><th>已領佣金</th><th>待領佣金</th></tr></thead><tbody>';
    months.forEach(function(month){
      var brands = Object.keys(groups[month]).sort();
      var mRevenue=0, mCost=0, mHasCost=false, mCommission=0, mPaid=0;
      brands.forEach(function(brand){
        var g = groups[month][brand];
        var profit = g.hasCost ? (g.revenue - g.cost) : null;
        var pending = g.commission - g.paidCommission;
        html += '<tr><td>'+esc(month)+' － '+esc(brand)+'</td><td>'+fmtMoneyPlain(g.revenue)+'</td><td>'+(g.hasCost?fmtMoneyPlain(g.cost):'－')+'</td><td>'+(profit===null?'－':fmtMoneyPlain(profit))+'</td><td>'+fmtMoneyPlain(g.commission)+'</td><td>'+fmtMoneyPlain(g.paidCommission)+'</td><td>'+fmtMoneyPlain(pending)+'</td></tr>';
        mRevenue += g.revenue; if(g.hasCost){ mCost += g.cost; mHasCost = true; } mCommission += g.commission; mPaid += g.paidCommission;
      });
      var mProfit = mHasCost ? (mRevenue - mCost) : null;
      var mPending = mCommission - mPaid;
      html += '<tr class="report-subtotal"><td>'+esc(month)+' 小計</td><td>'+fmtMoneyPlain(mRevenue)+'</td><td>'+(mHasCost?fmtMoneyPlain(mCost):'－')+'</td><td>'+(mProfit===null?'－':fmtMoneyPlain(mProfit))+'</td><td>'+fmtMoneyPlain(mCommission)+'</td><td>'+fmtMoneyPlain(mPaid)+'</td><td>'+fmtMoneyPlain(mPending)+'</td></tr>';
    });
    html += '</tbody></table>';
    wrap.innerHTML = html;
  }

  function renderStaffReport(){
    var wrap = document.getElementById("staffReportWrap");
    var byStaff = {};
    ordersData.forEach(function(o){
      if(o.orderStatus === "cancelled") return;
      var name = o.staffName || "未指派";
      byStaff[name] = byStaff[name] || { count:0, revenue:0, commission:0, paid:0 };
      var f = calcOrderFinance(o);
      byStaff[name].count += 1;
      byStaff[name].revenue += f.total;
      byStaff[name].commission += f.commissionOwed;
      byStaff[name].paid += f.payoutTotal;
    });
    var names = Object.keys(byStaff).sort();
    if(names.length === 0){
      wrap.innerHTML = '<div class="report-empty">尚無訂單資料</div>';
      return;
    }
    var html = '<table class="report-table"><thead><tr><th>業務</th><th>成交筆數</th><th>成交總額</th><th>應得抽成</th><th>已領</th><th>待領</th></tr></thead><tbody>';
    names.forEach(function(name){
      var s = byStaff[name];
      var pending = s.commission - s.paid;
      html += '<tr><td>'+esc(name)+'</td><td>'+s.count+'</td><td>'+fmtMoneyPlain(s.revenue)+'</td><td>'+fmtMoneyPlain(s.commission)+'</td><td>'+fmtMoneyPlain(s.paid)+'</td><td>'+fmtMoneyPlain(pending)+'</td></tr>';
    });
    html += '</tbody></table>';
    wrap.innerHTML = html;
  }

  function recomputeOrders(){
    applyOrderFilters();
    updateFinStats();
    renderMonthReport();
    renderStaffReport();
  }

  /* ---------------- mode: front desk (customer) vs back office (staff) ---------------- */
  var currentAccount = null; // 目前登入的帳號 {id, name, role, username}，由伺服器 session 決定，不再存在 localStorage
  var adminElevated = false; // 「就地升級」旗標，也是由伺服器 session 決定
  function isAdminUnlocked(){
    return !!(currentAccount && currentAccount.role === "admin") || adminElevated;
  }

  function setMode(mode){
    if(mode === "back"){
      document.body.dataset.localMode = "back";
    } else {
      document.body.dataset.localMode = "front";
      closeStaffGate();
    }
  }

  function reflectLoggedInName(){
    var el = document.getElementById("loggedInAs");
    if(!el) return;
    if(currentAccount && currentAccount.name){
      el.textContent = "目前登入：" + currentAccount.name + "（" + (currentAccount.role === "admin" ? "管理員" : "操作人員") + "）　";
    } else {
      el.textContent = "";
    }
  }

  function completeLogin(account){
    currentAccount = { id: account.id, username: account.username, role: account.role, name: account.name };
    setMode("back");
    setAdminFlag(account.role === "admin");
    setBackView("customers");
    reflectLoggedInName();
    closeStaffGate();
    refreshSessionThenData();
  }

  function logoutStaff(){
    apiFetch("/api/logout", { method:"POST" });
    currentAccount = null;
    adminElevated = false;
    setAdminFlag(false);
    reflectLoggedInName();
    setMode("front");
  }

  function openStaffGate(){
    var gate = document.getElementById("staffGate");
    gate.classList.add("open");
    document.getElementById("staffUserInput").focus();
  }
  function closeStaffGate(){
    var gate = document.getElementById("staffGate");
    gate.classList.remove("open");
    document.getElementById("staffUserInput").value = "";
    document.getElementById("staffPassInput").value = "";
    document.getElementById("staffGateError").classList.remove("show");
  }
  function tryLogin(){
    var userInput = document.getElementById("staffUserInput");
    var passInput = document.getElementById("staffPassInput");
    var username = userInput.value.trim();
    var password = passInput.value;
    function fail(){
      var gate = document.getElementById("staffGate");
      document.getElementById("staffGateError").classList.add("show");
      gate.classList.remove("shake");
      void gate.offsetWidth;
      gate.classList.add("shake");
      passInput.value = "";
      passInput.focus();
    }
    if(!username || !password){ fail(); return; }
    apiFetch("/api/login", { method:"POST", body:{ username:username, password:password } }).then(function(res){
      completeLogin(res.account);
    }, fail);
  }

  /* ---------------- 管理員權限（就地升級：案件管理／權限管理） ---------------- */
  var BACK_VIEWS = ["calendar","customers","byBrand","orders","staff","permissions"];
  var ADMIN_VIEWS = ["orders","permissions"];
  var VIEW_TITLES = {
    calendar: { title:"展間預約行事曆", subtitle:"依日期檢視客人的預約與到訪安排" },
    customers: { title:"展間客戶總覽", subtitle:"Resmo・Pickme・Giorgio Graesan・沙發大師・睡眠王國・浴室整體規劃改造・Sigmas・震旦" },
    byBrand: { title:"各品牌客戶", subtitle:"選擇品牌，只看該品牌感興趣的客戶" },
    orders: { title:"案件管理", subtitle:"訂單／工程財務資料，含成本、毛利與業務抽成，僅管理員可見" },
    staff: { title:"業務管理", subtitle:"管理可指派的負責人員名單；抽成比例僅管理員看得到" },
    permissions: { title:"權限管理", subtitle:"管理登入帳號、身份與密碼" }
  };
  var pendingAdminView = null;
  var currentView = "customers";

  function capitalize(s){ return s.charAt(0).toUpperCase() + s.slice(1); }

  function setBackView(view){
    if(BACK_VIEWS.indexOf(view) === -1){ view = "customers"; }
    currentView = view;
    BACK_VIEWS.forEach(function(v){
      var el = document.getElementById("view" + capitalize(v));
      if(el){ el.style.display = (v === view) ? "" : "none"; }
    });
    Array.prototype.forEach.call(document.querySelectorAll("#sideNav .side-nav-btn"), function(btn){
      btn.setAttribute("aria-current", btn.dataset.view === view ? "true" : "false");
    });
    var t = VIEW_TITLES[view];
    if(t){
      document.getElementById("viewTitle").textContent = t.title;
      document.getElementById("viewSubtitle").textContent = t.subtitle;
    }
    if(view === "orders"){ recomputeOrders(); }
    if(view === "calendar"){ recomputeCalendar(); }
    if(view === "byBrand"){ renderByBrandList(); }
  }

  function setAdminFlag(on){
    if(on){
      document.body.dataset.localAdmin = "true";
      document.getElementById("ordersLockIco").style.display = "none";
      document.getElementById("permissionsLockIco").style.display = "none";
      document.getElementById("btnAdminLogout").style.display = "";
    } else {
      document.body.dataset.localAdmin = "false";
      document.getElementById("ordersLockIco").style.display = "";
      document.getElementById("permissionsLockIco").style.display = "";
      document.getElementById("btnAdminLogout").style.display = "none";
    }
  }
  function unlockAdmin(){
    adminElevated = true;
    setAdminFlag(true);
    closeAdminGate();
    setBackView(pendingAdminView || "orders");
    pendingAdminView = null;
    loadOrders();
    loadAccounts();
  }
  function logoutAdmin(){
    adminElevated = false;
    apiFetch("/api/admin-delevate", { method:"POST" });
    setAdminFlag(currentAccount && currentAccount.role === "admin");
    setBackView("customers");
  }
  function openAdminGate(){
    var gate = document.getElementById("adminGate");
    gate.classList.add("open");
    setTimeout(function(){ document.getElementById("adminUserInput").focus(); }, 0);
  }
  function closeAdminGate(){
    var gate = document.getElementById("adminGate");
    gate.classList.remove("open");
    document.getElementById("adminUserInput").value = "";
    document.getElementById("adminPassInput").value = "";
    document.getElementById("adminGateError").classList.remove("show");
  }
  function tryAdminLogin(){
    var userInput = document.getElementById("adminUserInput");
    var passInput = document.getElementById("adminPassInput");
    var username = userInput.value.trim();
    var password = passInput.value;
    function fail(){
      var box = document.getElementById("adminGateBox");
      document.getElementById("adminGateError").classList.add("show");
      box.classList.remove("shake");
      void box.offsetWidth;
      box.classList.add("shake");
      passInput.value = "";
      passInput.focus();
    }
    if(!username || !password){ fail(); return; }
    apiFetch("/api/admin-elevate", { method:"POST", body:{ username:username, password:password } }).then(function(){
      unlockAdmin();
    }, fail);
  }

  /* ---------------- 權限管理：帳號清單畫面 ---------------- */
  function buildAccountRow(a){
    var tr = document.createElement("tr");
    tr.dataset.key = a.id;

    var tdName = document.createElement("td");
    var nameInput = document.createElement("input");
    nameInput.type = "text"; nameInput.className = "acc-name"; nameInput.value = a.name || "";
    var saveName = debounce(function(){ updateAccountDoc(a.id, { name: nameInput.value.trim() }); }, 500);
    nameInput.addEventListener("input", saveName);
    nameInput.addEventListener("blur", function(){ updateAccountDoc(a.id, { name: nameInput.value.trim() }); });
    tdName.appendChild(nameInput); tr.appendChild(tdName);

    var tdRole = document.createElement("td");
    var roleSelect = document.createElement("select"); roleSelect.className = "acc-role";
    [["staff","操作人員"],["admin","管理員"]].forEach(function(opt){
      var o = document.createElement("option"); o.value = opt[0]; o.textContent = opt[1];
      roleSelect.appendChild(o);
    });
    roleSelect.value = a.role === "admin" ? "admin" : "staff";
    roleSelect.addEventListener("change", function(){
      updateAccountDoc(a.id, { role: roleSelect.value });
      showToast("已更新身份，重新登入後套用");
    });
    tdRole.appendChild(roleSelect); tr.appendChild(tdRole);

    var tdUser = document.createElement("td");
    var userInput = document.createElement("input");
    userInput.type = "text"; userInput.className = "acc-user"; userInput.value = a.username || "";
    var saveUser = debounce(function(){ updateAccountDoc(a.id, { username: userInput.value.trim() }); }, 500);
    userInput.addEventListener("input", saveUser);
    userInput.addEventListener("blur", function(){ updateAccountDoc(a.id, { username: userInput.value.trim() }); });
    tdUser.appendChild(userInput); tr.appendChild(tdUser);

    var tdPass = document.createElement("td");
    var passInput = document.createElement("input");
    passInput.type = "text"; passInput.className = "acc-pass"; passInput.value = "";
    passInput.placeholder = "留空＝密碼不變更";
    var commitPass = function(){
      if(!passInput.value) return; // 沒輸入新密碼就不送出，避免把密碼清空
      updateAccountDoc(a.id, { password: passInput.value });
      showToast("密碼已更新");
      passInput.value = "";
    };
    passInput.addEventListener("blur", commitPass);
    passInput.addEventListener("keydown", function(e){ if(e.key === "Enter"){ e.preventDefault(); commitPass(); passInput.blur(); } });
    tdPass.appendChild(passInput); tr.appendChild(tdPass);

    var tdDel = document.createElement("td"); tdDel.className = "acc-actions";
    var del = document.createElement("button");
    del.type = "button"; del.className = "btn-delete"; del.setAttribute("aria-label","刪除帳號");
    del.dataset.localConfirming = "false";
    del.innerHTML = ICON_CLOSE;
    del.addEventListener("click", function(){
      if(isReadonly) return;
      if(del.dataset.localConfirming === "true"){
        deleteAccountDoc(a.id);
        showToast("已刪除帳號");
      } else {
        del.dataset.localConfirming = "true";
        clearTimeout(del._t);
        del._t = setTimeout(function(){ del.dataset.localConfirming = "false"; }, 3000);
      }
    });
    tdDel.appendChild(del); tr.appendChild(tdDel);

    return tr;
  }

  function patchAccountRow(tr, a){
    function setIfIdle(input, val){ if(input && document.activeElement !== input && input.value !== val){ input.value = val; } }
    setIfIdle(tr.querySelector(".acc-name"), a.name || "");
    var roleSelect = tr.querySelector(".acc-role");
    if(document.activeElement !== roleSelect){ roleSelect.value = a.role === "admin" ? "admin" : "staff"; }
    setIfIdle(tr.querySelector(".acc-user"), a.username || "");
    setIfIdle(tr.querySelector(".acc-pass"), a.password || "");
  }

  function renderAccountsList(){
    var tbody = document.getElementById("accountTableBody");
    if(!tbody) return;
    var existing = {};
    Array.prototype.forEach.call(tbody.children, function(tr){ existing[tr.dataset.key] = tr; });
    var frag = document.createDocumentFragment();
    accountsData.forEach(function(a){
      var tr = existing[a.id];
      if(tr){ patchAccountRow(tr, a); delete existing[a.id]; }
      else{ tr = buildAccountRow(a); }
      frag.appendChild(tr);
    });
    Object.keys(existing).forEach(function(id){ existing[id].remove(); });
    tbody.appendChild(frag);
    var empty = document.getElementById("accountEmpty");
    if(empty){ empty.style.display = accountsData.length === 0 ? "block" : "none"; }
  }

  function addAccount(){
    var nameInput = document.getElementById("newAccName");
    var roleSelect = document.getElementById("newAccRole");
    var userInput = document.getElementById("newAccUser");
    var passInput = document.getElementById("newAccPass");
    var name = nameInput.value.trim();
    var username = userInput.value.trim();
    var password = passInput.value;
    if(!name || !username || !password){ showToast("請填寫姓名、帳號、密碼"); return; }
    if(accountsData.some(function(a){ return a.username === username; })){ showToast("這個帳號已經有人使用，請換一個"); return; }
    createAccountDoc({ name:name, role:roleSelect.value, username:username, password:password }).then(function(){
      nameInput.value = ""; userInput.value = ""; passInput.value = ""; roleSelect.value = "staff";
      showToast("已新增帳號");
    });
  }

  /* ---------------- front desk: customer self check-in form ---------------- */
  var fdSelectedBrands = [];
  var frontLastFlow = "checkin";

  function buildFrontBrandGrid(){
    var grid = document.getElementById("fdBrandGrid");
    grid.innerHTML = "";
    BRANDS.forEach(function(b){
      var chip = document.createElement("button");
      chip.type = "button"; chip.className = "chip-lg"; chip.dataset.brand = b;
      chip.setAttribute("aria-pressed", fdSelectedBrands.indexOf(b) > -1 ? "true" : "false");
      chip.textContent = b;
      chip.addEventListener("click", function(){
        var i = fdSelectedBrands.indexOf(b);
        if(i > -1){ fdSelectedBrands.splice(i,1); chip.setAttribute("aria-pressed","false"); }
        else{ fdSelectedBrands.push(b); chip.setAttribute("aria-pressed","true"); }
      });
      grid.appendChild(chip);
    });
  }

  function resetFrontForm(){
    document.getElementById("fdName").value = "";
    document.getElementById("fdPhone").value = "";
    document.getElementById("fdEmail").value = "";
    document.getElementById("fdNotes").value = "";
    document.getElementById("fdError").classList.remove("show");
    fdSelectedBrands = [];
    buildFrontBrandGrid();
    document.getElementById("frontCard").dataset.localState = "form";
  }

  function submitFrontForm(){
    if(isReadonly){
      document.getElementById("fdError").textContent = "系統目前無法儲存資料，請直接洽詢現場同仁";
      document.getElementById("fdError").classList.add("show");
      return;
    }
    var name = document.getElementById("fdName").value.trim();
    var phone = document.getElementById("fdPhone").value.trim();
    if(!name || !phone){
      document.getElementById("fdError").textContent = "請填寫姓名與聯絡電話";
      document.getElementById("fdError").classList.add("show");
      return;
    }
    document.getElementById("fdError").classList.remove("show");

    createCustomer({
      name: name,
      phone: phone,
      email: document.getElementById("fdEmail").value.trim(),
      notes: document.getElementById("fdNotes").value.trim(),
      brands: fdSelectedBrands.slice(),
      status: "visited",
      staffName: ""
    }).then(function(){
      document.getElementById("thanksTitle").textContent = "感謝您的填寫";
      document.getElementById("thanksBody").textContent = "我們的顧問將盡快與您聯繫";
      document.getElementById("frontCard").dataset.localState = "thanks";
      frontLastFlow = "checkin";
      clearTimeout(submitFrontForm._t);
      submitFrontForm._t = setTimeout(resetFrontForm, 6000);
    }).catch(function(){
      document.getElementById("fdError").textContent = "送出失敗，請檢查網路後再試一次";
      document.getElementById("fdError").classList.add("show");
    });
  }

  /* ---------------- front desk: appointment booking form ---------------- */
  var apSelectedBrands = [];
  var apSelectedSlot = "";

  function buildApBrandGrid(){
    var grid = document.getElementById("apBrandGrid");
    grid.innerHTML = "";
    BRANDS.forEach(function(b){
      var chip = document.createElement("button");
      chip.type = "button"; chip.className = "chip-lg"; chip.dataset.brand = b;
      chip.setAttribute("aria-pressed", apSelectedBrands.indexOf(b) > -1 ? "true" : "false");
      chip.textContent = b;
      chip.addEventListener("click", function(){
        var i = apSelectedBrands.indexOf(b);
        if(i > -1){ apSelectedBrands.splice(i,1); chip.setAttribute("aria-pressed","false"); }
        else{ apSelectedBrands.push(b); chip.setAttribute("aria-pressed","true"); }
      });
      grid.appendChild(chip);
    });
  }

  function buildApSlotGrid(){
    var grid = document.getElementById("apSlotGrid");
    grid.innerHTML = "";
    SLOTS.forEach(function(s){
      var chip = document.createElement("button");
      chip.type = "button"; chip.className = "chip-lg"; chip.dataset.slot = s;
      chip.setAttribute("aria-pressed", apSelectedSlot === s ? "true" : "false");
      chip.textContent = s;
      chip.addEventListener("click", function(){
        apSelectedSlot = (apSelectedSlot === s) ? "" : s;
        Array.prototype.forEach.call(grid.children, function(c){
          c.setAttribute("aria-pressed", c.dataset.slot === apSelectedSlot ? "true" : "false");
        });
      });
      grid.appendChild(chip);
    });
  }

  function fmtDateHuman(dateStr){
    if(!dateStr) return "";
    var d = new Date(dateStr + "T00:00:00");
    if(isNaN(d.getTime())) return dateStr;
    var wd = ["日","一","二","三","四","五","六"][d.getDay()];
    return (d.getMonth()+1) + "/" + d.getDate() + "（週" + wd + "）";
  }

  function resetAppointmentForm(){
    document.getElementById("apName").value = "";
    document.getElementById("apPhone").value = "";
    document.getElementById("apEmail").value = "";
    document.getElementById("apDate").value = "";
    document.getElementById("apNotes").value = "";
    document.getElementById("apError").classList.remove("show");
    apSelectedBrands = [];
    apSelectedSlot = "";
    buildApBrandGrid();
    buildApSlotGrid();
    document.getElementById("frontCard").dataset.localState = "form";
  }

  function submitAppointmentForm(){
    var err = document.getElementById("apError");
    if(isReadonly){
      err.textContent = "系統目前無法儲存資料，請直接洽詢現場同仁";
      err.classList.add("show");
      return;
    }
    var name = document.getElementById("apName").value.trim();
    var phone = document.getElementById("apPhone").value.trim();
    var date = document.getElementById("apDate").value;
    if(!name || !phone || !date || !apSelectedSlot){
      err.textContent = "請填寫姓名、電話、預約日期與時段";
      err.classList.add("show");
      return;
    }
    err.classList.remove("show");

    createCustomer({
      name: name,
      phone: phone,
      email: document.getElementById("apEmail").value.trim(),
      notes: document.getElementById("apNotes").value.trim(),
      brands: apSelectedBrands.slice(),
      status: "scheduled",
      staffName: "",
      date: date,
      slot: apSelectedSlot
    }).then(function(){
      document.getElementById("thanksTitle").textContent = "已為您預約";
      document.getElementById("thanksBody").textContent = fmtDateHuman(date) + " " + apSelectedSlot + "，我們會與您確認到訪時間";
      document.getElementById("frontCard").dataset.localState = "thanks";
      frontLastFlow = "appointment";
      clearTimeout(submitAppointmentForm._t);
      submitAppointmentForm._t = setTimeout(resetAppointmentForm, 6000);
    }).catch(function(){
      err.textContent = "送出失敗，請檢查網路後再試一次";
      err.classList.add("show");
    });
  }

  function setFrontTab(tab){
    document.getElementById("frontCard").dataset.localTab = tab;
    document.getElementById("tabCheckin").setAttribute("aria-selected", tab === "checkin" ? "true" : "false");
    document.getElementById("tabAppointment").setAttribute("aria-selected", tab === "appointment" ? "true" : "false");
  }

  /* ---------------- staff roster ---------------- */
  function getStaffNames(){
    return staffData.map(function(s){ return s.name; }).filter(Boolean);
  }

  function buildStaffChip(id, name, commissionRate){
    var li = document.createElement("li");
    li.className = "staff-chip";
    li.dataset.key = id;
    var input = document.createElement("input");
    input.type = "text"; input.className = "staff-name"; input.value = name;
    input.size = Math.max(2, name.length);
    var saveStaffName = debounce(function(){
      input.size = Math.max(2, input.value.length);
      updateStaffDoc(id, input.value.trim());
      recomputeAll();
    }, 500);
    input.addEventListener("input", saveStaffName);
    input.addEventListener("blur", function(){ updateStaffDoc(id, input.value.trim()); });
    li.appendChild(input);

    var pct = document.createElement("span");
    pct.className = "commission-pct";
    pct.textContent = "抽成";
    li.appendChild(pct);
    var rate = document.createElement("input");
    rate.type = "number"; rate.className = "commission-input"; rate.min = "0"; rate.max = "100"; rate.step = "0.1";
    rate.value = commissionRate || 0;
    rate.title = "抽成比例（%）";
    var saveRate = debounce(function(){
      var v = parseFloat(rate.value); if(isNaN(v) || v < 0) v = 0;
      updateStaffCommission(id, v);
      recomputeOrders();
    }, 500);
    rate.addEventListener("input", saveRate);
    rate.addEventListener("blur", function(){ var v = parseFloat(rate.value); if(isNaN(v) || v < 0) v = 0; updateStaffCommission(id, v); recomputeOrders(); });
    li.appendChild(rate);
    var pctSign = document.createElement("span");
    pctSign.className = "commission-pct";
    pctSign.textContent = "%";
    li.appendChild(pctSign);

    var rm = document.createElement("button");
    rm.type = "button"; rm.className = "remove-staff"; rm.setAttribute("aria-label","移除同仁");
    rm.innerHTML = ICON_CLOSE;
    rm.addEventListener("click", function(){
      if(isReadonly) return;
      deleteStaffDoc(id);
    });
    li.appendChild(rm);
    return li;
  }

  function renderStaffList(){
    var list = document.getElementById("staffList");
    var existing = {};
    Array.prototype.forEach.call(list.children, function(li){ existing[li.dataset.key] = li; });
    var frag = document.createDocumentFragment();
    staffData.forEach(function(s){
      var li = existing[s.id];
      if(li){
        var input = li.querySelector(".staff-name");
        if(document.activeElement !== input && input.value !== s.name){
          input.value = s.name;
          input.size = Math.max(2, s.name.length);
        }
        var rateInput = li.querySelector(".commission-input");
        if(document.activeElement !== rateInput && parseFloat(rateInput.value) !== (s.commissionRate || 0)){
          rateInput.value = s.commissionRate || 0;
        }
        delete existing[s.id];
      } else {
        li = buildStaffChip(s.id, s.name, s.commissionRate || 0);
      }
      frag.appendChild(li);
    });
    list.innerHTML = "";
    list.appendChild(frag);
    updateStaffEmptyState();
  }

  function addStaff(){
    if(isReadonly) return;
    var input = document.getElementById("newStaffInput");
    var name = input.value.trim();
    if(!name) return;
    input.disabled = true;
    createStaffDoc(name).then(function(){
      input.value = "";
      showToast("已新增同仁「" + name + "」");
    }, function(){
      /* 失敗時 createStaffDoc 已經顯示錯誤訊息，這裡保留使用者剛剛打的名字，不清空輸入框 */
    }).then(function(){
      input.disabled = false;
      input.focus();
    });
  }

  /* ---------------- local: stats / filters / bars ---------------- */
  var localFilter = { text:"", brand:null, status:null, staff:null };

  function recomputeAll(){
    updateStaffEmptyState();
    updateStats();
    updateBrandFilterChips();
    updateStatusFilterChips();
    updateStaffFilterMenu();
    applyFilters();
    updateEmptyState();
  }

  function updateStaffEmptyState(){
    document.getElementById("staffEmpty").style.display = staffData.length > 0 ? "none" : "block";
  }

  function updateStats(){
    var counts = { total:customersData.length, scheduled:0, visited:0, following:0, closed:0, lost:0 };
    var brandCounts = {};
    BRANDS.forEach(function(b){ brandCounts[b] = 0; });
    customersData.forEach(function(c){
      var st = c.status || "visited";
      if(counts[st] != null) counts[st]++;
      (c.brands || []).forEach(function(b){
        if(brandCounts[b] != null) brandCounts[b]++;
      });
    });
    var row = document.getElementById("statsRow");
    row.querySelector('[data-k="total"] .stat-num').textContent = counts.total;
    row.querySelector('[data-k="scheduled"] .stat-num').textContent = counts.scheduled;
    row.querySelector('[data-k="following"] .stat-num').textContent = counts.following;
    row.querySelector('[data-k="closed"] .stat-num').textContent = counts.closed;
    row.querySelector('[data-k="lost"] .stat-num').textContent = counts.lost;

    var max = Math.max(1, Math.max.apply(null, BRANDS.map(function(b){ return brandCounts[b]; })));
    var bb = document.getElementById("brandBars");
    bb.innerHTML = "";
    BRANDS.forEach(function(b){
      var row2 = document.createElement("div");
      row2.className = "bb-row";
      var pct = Math.round((brandCounts[b] / max) * 100);
      row2.innerHTML = '<div class="bb-name">'+esc(b)+'</div><div class="bb-track"><div class="bb-fill" style="width:'+pct+'%"></div></div><div class="bb-count">'+brandCounts[b]+'</div>';
      bb.appendChild(row2);
    });

    document.getElementById("listCount").textContent = counts.total ? ("共 " + counts.total + " 位") : "";
  }

  function updateBrandFilterChips(){
    var wrap = document.getElementById("brandFilterChips");
    if(wrap.dataset.built) {
      Array.prototype.forEach.call(wrap.children, function(chip){
        chip.setAttribute("aria-pressed", chip.dataset.brand === localFilter.brand ? "true" : "false");
      });
      return;
    }
    wrap.dataset.built = "1";
    BRANDS.forEach(function(b){
      var chip = document.createElement("button");
      chip.type = "button"; chip.className = "filter-chip"; chip.dataset.brand = b;
      chip.setAttribute("aria-pressed","false");
      chip.textContent = b;
      chip.addEventListener("click", function(){
        localFilter.brand = (localFilter.brand === b) ? null : b;
        updateBrandFilterChips();
        applyFilters();
      });
      wrap.appendChild(chip);
    });
  }

  function updateStatusFilterChips(){
    var wrap = document.getElementById("statusFilterChips");
    if(wrap.dataset.built){
      Array.prototype.forEach.call(wrap.children, function(chip){
        chip.setAttribute("aria-pressed", chip.dataset.status === localFilter.status ? "true" : "false");
      });
      return;
    }
    wrap.dataset.built = "1";
    STATUSES.forEach(function(s){
      var chip = document.createElement("button");
      chip.type = "button"; chip.className = "filter-chip"; chip.dataset.status = s.key;
      chip.setAttribute("aria-pressed","false");
      chip.textContent = s.label;
      chip.addEventListener("click", function(){
        localFilter.status = (localFilter.status === s.key) ? null : s.key;
        updateStatusFilterChips();
        applyFilters();
      });
      wrap.appendChild(chip);
    });
  }

  function updateStaffFilterMenu(){
    var btn = document.getElementById("staffFilterBtn");
    var menu = document.getElementById("staffFilterMenu");
    menu.innerHTML = "";
    var allBtn = document.createElement("button");
    allBtn.type = "button"; allBtn.textContent = "全部";
    allBtn.setAttribute("aria-pressed", localFilter.staff === null ? "true":"false");
    allBtn.addEventListener("click", function(){ localFilter.staff = null; finishStaffFilter(); });
    menu.appendChild(allBtn);
    getStaffNames().forEach(function(n){
      var b = document.createElement("button");
      b.type = "button"; b.textContent = n;
      b.setAttribute("aria-pressed", localFilter.staff === n ? "true":"false");
      b.addEventListener("click", function(){ localFilter.staff = n; finishStaffFilter(); });
      menu.appendChild(b);
    });
    var unassigned = document.createElement("button");
    unassigned.type = "button"; unassigned.textContent = "未指派";
    unassigned.setAttribute("aria-pressed", localFilter.staff === "" ? "true":"false");
    unassigned.addEventListener("click", function(){ localFilter.staff = ""; finishStaffFilter(); });
    menu.appendChild(unassigned);

    btn.textContent = "負責人：" + (localFilter.staff === null ? "全部" : (localFilter.staff === "" ? "未指派" : localFilter.staff));
    btn.setAttribute("aria-pressed", localFilter.staff !== null ? "true":"false");
  }
  function finishStaffFilter(){
    updateStaffFilterMenu();
    document.getElementById("staffFilterMenu").classList.remove("open");
    applyFilters();
  }

  function applyFilters(){
    var q = localFilter.text.trim().toLowerCase();
    document.querySelectorAll("#customerList .customer").forEach(function(c){
      var name = (c.querySelector(".f-name").value || "").toLowerCase();
      var phone = (c.querySelector(".f-phone").value || "").toLowerCase();
      var matchText = !q || name.indexOf(q) > -1 || phone.indexOf(q) > -1;
      var matchBrand = !localFilter.brand || c.querySelector('.chip[data-brand="'+CSS.escape(localFilter.brand)+'"]').getAttribute("aria-pressed") === "true";
      var matchStatus = !localFilter.status || c.querySelector(".status-pill").dataset.status === localFilter.status;
      var staffName = c.querySelector(".staff-badge").dataset.staffName || "";
      var matchStaff = localFilter.staff === null || staffName === localFilter.staff;
      var show = matchText && matchBrand && matchStatus && matchStaff;
      c.dataset.localHidden = show ? "false" : "true";
    });
  }

  function updateEmptyState(){
    document.getElementById("emptyState").style.display = customersData.length === 0 ? "block" : "none";
  }

  /* ---------------- wiring ---------------- */
  function init(){
    document.getElementById("btnAddCustomer").addEventListener("click", addCustomer);
    document.getElementById("addStaffBtn").addEventListener("click", addStaff);
    document.getElementById("newStaffInput").addEventListener("keydown", function(e){
      if(e.key === "Enter"){ e.preventDefault(); addStaff(); }
    });
    document.getElementById("searchInput").addEventListener("input", function(e){
      localFilter.text = e.target.value;
      applyFilters();
    });
    document.getElementById("staffFilterBtn").addEventListener("click", function(e){
      e.stopPropagation();
      document.getElementById("staffFilterMenu").classList.toggle("open");
    });
    document.addEventListener("click", function(e){
      var menu = document.getElementById("staffFilterMenu");
      if(menu.classList.contains("open") && !document.getElementById("staffFilterWrap").contains(e.target)){
        menu.classList.remove("open");
      }
    });
    document.getElementById("staffPanelToggle").addEventListener("click", function(){
      var panel = document.getElementById("staffPanel");
      var collapsed = panel.dataset.localCollapsed === "true";
      panel.dataset.localCollapsed = collapsed ? "false" : "true";
    });

    document.addEventListener("keydown", function(e){
      if(e.key === "Escape"){
        closePopover();
        if(document.getElementById("quoteModalOverlay").classList.contains("open")){ closeQuoteEditModal(); }
      }
    });

    /* front desk wiring */
    buildFrontBrandGrid();
    document.getElementById("fdSubmit").addEventListener("click", submitFrontForm);
    ["fdName","fdPhone"].forEach(function(id){
      document.getElementById(id).addEventListener("keydown", function(e){
        if(e.key === "Enter"){ e.preventDefault(); submitFrontForm(); }
      });
    });

    buildApBrandGrid();
    buildApSlotGrid();
    var apDateInput = document.getElementById("apDate");
    apDateInput.min = new Date().toISOString().slice(0,10);
    document.getElementById("apSubmit").addEventListener("click", submitAppointmentForm);
    ["apName","apPhone"].forEach(function(id){
      document.getElementById(id).addEventListener("keydown", function(e){
        if(e.key === "Enter"){ e.preventDefault(); submitAppointmentForm(); }
      });
    });

    document.getElementById("fdAgain").addEventListener("click", function(){
      if(frontLastFlow === "appointment"){ resetAppointmentForm(); } else { resetFrontForm(); }
    });
    document.getElementById("tabCheckin").addEventListener("click", function(){ setFrontTab("checkin"); });
    document.getElementById("tabAppointment").addEventListener("click", function(){ setFrontTab("appointment"); });

    document.getElementById("staffLinkBtn").addEventListener("click", openStaffGate);
    document.getElementById("staffCodeConfirm").addEventListener("click", tryLogin);
    ["staffUserInput","staffPassInput"].forEach(function(id){
      document.getElementById(id).addEventListener("keydown", function(e){
        if(e.key === "Enter"){ e.preventDefault(); tryLogin(); }
      });
    });
    document.getElementById("btnToFront").addEventListener("click", function(){ setMode("front"); });
    document.getElementById("btnLogout").addEventListener("click", logoutStaff);

    /* 左側導覽列 wiring */
    Array.prototype.forEach.call(document.querySelectorAll("#sideNav .side-nav-btn"), function(btn){
      btn.addEventListener("click", function(){
        var view = btn.dataset.view;
        if(ADMIN_VIEWS.indexOf(view) > -1 && document.body.dataset.localAdmin !== "true"){
          pendingAdminView = view;
          openAdminGate();
          return;
        }
        setBackView(view);
      });
    });
    document.getElementById("adminCodeConfirm").addEventListener("click", tryAdminLogin);
    ["adminUserInput","adminPassInput"].forEach(function(id){
      document.getElementById(id).addEventListener("keydown", function(e){
        if(e.key === "Enter"){ e.preventDefault(); tryAdminLogin(); }
      });
    });
    document.getElementById("adminGateCancel").addEventListener("click", closeAdminGate);
    document.getElementById("btnAdminLogout").addEventListener("click", logoutAdmin);
    document.getElementById("btnAddOrder").addEventListener("click", addOrder);

    /* 報價單編輯彈出視窗 wiring */
    document.getElementById("quoteModalCloseBtn").addEventListener("click", closeQuoteEditModal);
    document.getElementById("quoteModalDoneBtn").addEventListener("click", closeQuoteEditModal);
    document.getElementById("quoteModalAddRowBtn").addEventListener("click", addQuoteModalRow);
    document.getElementById("quoteModalPrintBtn").addEventListener("click", function(){
      if(quoteModalOrderId){
        openQuotePrintWindow(quoteModalOrderId, { items: cloneQuoteItems(quoteModalItems), taxRate: quoteModalTaxRateLocal });
      }
    });
    document.getElementById("quoteModalOverlay").addEventListener("click", function(e){
      if(e.target === document.getElementById("quoteModalOverlay")){ closeQuoteEditModal(); }
    });
    (function(){
      var taxInput = document.getElementById("quoteModalTaxRate");
      function commit(immediate){
        if(!quoteModalOrderId) return;
        var v = parseFloat(taxInput.value); if(isNaN(v) || v < 0) v = 0;
        quoteModalTaxRateLocal = v;
        if(immediate){ updateOrderDoc(quoteModalOrderId, { taxRate: v }); }
        else { saveTaxRateDebounced(); }
        updateQuoteModalTotalsDisplay();
      }
      var saveTaxRateDebounced = debounce(function(){ updateOrderDoc(quoteModalOrderId, { taxRate: quoteModalTaxRateLocal }); }, 400);
      taxInput.addEventListener("input", function(){ commit(false); });
      taxInput.addEventListener("blur", function(){ commit(true); });
    })();

    /* 展間預約行事曆 wiring */
    document.getElementById("calPrevBtn").addEventListener("click", function(){
      calState.month -= 1;
      if(calState.month < 0){ calState.month = 11; calState.year -= 1; }
      renderCalendarGrid();
    });
    document.getElementById("calNextBtn").addEventListener("click", function(){
      calState.month += 1;
      if(calState.month > 11){ calState.month = 0; calState.year += 1; }
      renderCalendarGrid();
    });
    document.getElementById("calTodayBtn").addEventListener("click", function(){
      initCalState();
      renderCalendarGrid();
      renderCalAgenda();
    });

    /* 各品牌客戶 wiring */
    populateByBrandSelect();

    /* 案件管理 wiring */
    populateOrderBrandSelect();
    var orderMonthInput = document.getElementById("orderMonthFilter");
    orderFilter.month = currentYYYYMM();
    orderMonthInput.value = orderFilter.month;
    orderMonthInput.addEventListener("change", function(){
      orderFilter.month = orderMonthInput.value || currentYYYYMM();
      applyOrderFilters();
      updateFinStats();
    });
    document.getElementById("orderShowAllBtn").addEventListener("click", function(){
      orderFilter.showAll = !orderFilter.showAll;
      document.getElementById("orderShowAllBtn").setAttribute("aria-pressed", orderFilter.showAll ? "true" : "false");
      orderMonthInput.disabled = orderFilter.showAll;
      applyOrderFilters();
      updateFinStats();
    });
    document.getElementById("monthReportToggle").addEventListener("click", function(){
      var panel = document.getElementById("monthReportPanel");
      var collapsed = panel.dataset.localCollapsed === "true";
      panel.dataset.localCollapsed = collapsed ? "false" : "true";
    });
    document.getElementById("staffReportToggle").addEventListener("click", function(){
      var panel = document.getElementById("staffReportPanel");
      var collapsed = panel.dataset.localCollapsed === "true";
      panel.dataset.localCollapsed = collapsed ? "false" : "true";
    });

    /* 權限管理 wiring */
    document.getElementById("addAccountBtn").addEventListener("click", addAccount);
    ["newAccName","newAccUser","newAccPass"].forEach(function(id){
      document.getElementById(id).addEventListener("keydown", function(e){
        if(e.key === "Enter"){ e.preventDefault(); addAccount(); }
      });
    });

    /* 登入狀態現在完全由伺服器 session（cookie）決定，不再依賴 localStorage；
       initApp() 會先問伺服器「現在是誰登入的」，再據此決定要顯示前台還是後台畫面。 */
    recomputeAll();
    recomputeOrders();
    recomputeCalendar();
    initApp();
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
