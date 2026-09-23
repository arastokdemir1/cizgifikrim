// CarLog web demosu — uygulama kabuğu: durum, sayfa (sheet) yığını, olaylar,
// canlı sürüş simülasyonu. Hiçbir sunucuya veri gönderilmez; demo sürüşleri ve
// girdiğin "gerçek maliyet" değerleri yalnızca bu tarayıcıda (localStorage) kalır.
(() => {
  'use strict';
  const { F, D, vehicleById, V } = CL;
  const I = CLIcon;
  const STORE = 'carlog-web-demo-v2';
  const $ = (s, r = document) => r.querySelector(s);
  const app = $('#app');

  // ── Durum ───────────────────────────────────────────────────────────────
  const seeds = CL.seedTrips();
  const saved = (() => { try { return JSON.parse(localStorage.getItem(STORE) || '{}'); } catch (_) { return {}; } })();
  const userTrips = (saved.trips || []).map((t) => ({ ...t, date: new Date(t.date) }));
  const S = {
    W: 440, tab: 'ozet', period: 'day', anchor: new Date(), filterVehicle: null, searching: false, searchText: '',
    trips: [], actual: saved.actual || {}, tripsRange: '90', analysisRange: '90', collapsedVehicles: new Set(),
    vehicleOrder: ['egea', 'golf'], reordering: false, bannerOn: true,
    calc: { vehicleId: 'egea', place: null, pick: 0, roundTrip: false, tripType: 1, terrain: 0, style: 1, climate: false, fuelLevel: 1, manual: false, fuelText: '', tollText: '', quickOpen: false, settingsOpen: false, detailsOpen: false, saved: false, mapPlace: null, mapPick: null },
    live: null, sheets: [], menuOpen: false, pickMonth: new Date(),
  };
  const rebuildTrips = () => {
    S.trips = [...seeds, ...userTrips].sort((a, b) => b.date - a.date);
    S.trips.forEach((t) => { if (S.actual[t.id] != null) t.actualCost = S.actual[t.id]; });
  };
  const persist = () => { try { localStorage.setItem(STORE, JSON.stringify({ trips: userTrips, actual: S.actual })); } catch (_) { /* gizli sekme */ } };
  rebuildTrips();

  // ── Sayfa (sheet) tanımları ─────────────────────────────────────────────
  const findTrip = (id) => S.trips.find((t) => t.id === id);
  const SHEETS = {
    trip: { title: 'Yolculuk Özeti', left: ['Kapat', 'blue'], body: (d) => { const t = findTrip(d.id); return t ? V.tripDetail(t, S) : ''; } },
    analysis: { title: 'Analiz', left: ['Kapat'], body: () => V.analysis(S) },
    trips: { title: 'Yolculuklar', left: ['Kapat'], body: () => V.tripsSheet(S) },
    calc: { title: 'Hesapla', left: null, inline: true, body: () => V.calc(S) },
    routetypes: { title: 'Rota Karşılaştırma', left: ['Kapat'], body: () => V.routeTypes(S) },
    actual: { title: 'Gerçek Maliyet', left: ['İptal'], body: (d) => { const t = findTrip(d.id); return t ? V.actualCost(t, S) : ''; } },
    vehiclepick: { title: 'Araç Seç', left: ['Kapat'], body: () => V.vehiclePick(S) },
    datepick: { title: 'Tarih Seç', left: ['Kapat'], right: ['Bugün', 'today'], body: () => V.datePicker(S) },
    info: { title: '', left: ['Kapat'], body: (d) => V.info(d.title, d.text), dyn: (d) => d.title },
    routemap: { custom: true, body: () => V.routeMapSheet(S) },
  };
  const sheetEls = [];
  const pushSheet = (type, data = {}) => {
    S.sheets.push({ type, data, key: `${type}-${Math.random().toString(36).slice(2, 7)}` });
    mountSheets();
  };
  const popSheet = () => {
    const s = S.sheets.pop(); if (!s) return;
    if (s.type === 'calc' || s.type === 'routemap') S.calc.saved = false;
    mountSheets(); render();
  };
  const topSheet = () => S.sheets[S.sheets.length - 1];

  function sheetHTML(s) {
    const def = SHEETS[s.type];
    const title = def.dyn ? def.dyn(s.data) : def.title;
    if (def.custom) return `<div style="position:absolute;inset:0;overflow:hidden" data-body>${def.body(s.data)}</div>`;
    const left = def.left ? `<button class="glass-btn txt ${def.left[1] || ''}" data-act="closesheet">${def.left[0]}</button>` : '';
    const right = def.right ? `<button class="glass-btn txt blue" data-act="${def.right[1]}">${def.right[0]}</button>` : '';
    return `<div class="grab" data-drag></div><div class="navbar" data-drag><div class="nav-l">${left}</div><h1>${F.esc(title)}</h1><div class="nav-r">${right}</div></div><div class="scroll" data-body>${def.body(s.data)}</div>`;
  }
  function mountSheets() {
    const layer = $('#sheets');
    // kaldırılanlar
    for (let i = sheetEls.length - 1; i >= 0; i--) {
      if (!S.sheets.find((s) => s.key === sheetEls[i].key)) {
        const el = sheetEls[i].el; el.classList.remove('on'); setTimeout(() => el.remove(), 450); sheetEls.splice(i, 1);
      }
    }
    // eklenenler
    S.sheets.forEach((s, idx) => {
      if (sheetEls.find((x) => x.key === s.key)) return;
      const el = document.createElement('section');
      el.className = 'sheet'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
      el.style.zIndex = String(41 + idx * 2);
      if (SHEETS[s.type].custom) el.style.background = '#EAF3DA';
      el.innerHTML = sheetHTML(s);
      layer.appendChild(el);
      sheetEls.push({ key: s.key, el });
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('on')));
    });
    $('#dim').classList.toggle('on', S.sheets.length > 0 || S.menuOpen);
    $('#dim').style.zIndex = String(S.sheets.length ? 40 + S.sheets.length * 2 - 1 : 44);
    if (S.menuOpen && !S.sheets.length) $('#dim').style.zIndex = '44';
  }
  function refreshSheets() {
    S.sheets.forEach((s) => {
      const rec = sheetEls.find((x) => x.key === s.key); if (!rec) return;
      const body = $('[data-body]', rec.el); if (!body) return;
      const st = body.scrollTop; const def = SHEETS[s.type];
      const focus = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.role : null;
      body.innerHTML = def.body(s.data);
      body.scrollTop = st;
      const h = $('h1', rec.el); if (h && def.dyn) h.textContent = def.dyn(s.data);
      if (focus) { const el = $(`[data-role="${focus}"]`, body); if (el) { el.focus(); const v = el.value; el.value = ''; el.value = v; } }
    });
  }

  // ── Ana ekran ───────────────────────────────────────────────────────────
  function renderNav() {
    const menu = `<button class="nav-menu" data-act="menuopen" aria-label="Menü">${I('menu', 21, '', 'height:12px')}</button>`;
    let html;
    if (S.tab === 'ozet') html = `<div class="nav-l">${menu}</div><h1>Özet</h1><div class="nav-r"><button class="glass-btn" data-act="search" aria-label="${S.searching ? 'Aramayı kapat' : 'Ara'}">${I(S.searching ? 'xmark' : 'search', 15)}</button></div>`;
    else if (S.tab === 'live') html = `<div class="nav-l">${menu}</div><h1>Canlı Sürüş</h1><div class="nav-r"></div>`;
    else html = `<div class="nav-l">${menu}</div><h1></h1><div class="nav-r"><button class="fab" data-act="addvehicle" aria-label="Araç ekle">${I('plus', 18)}</button></div>`;
    $('#navbar').innerHTML = html;
  }
  function render() {
    S.W = app.clientWidth || 440;
    const scr = $('#screen'); const st = scr.scrollTop; const focus = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.role : null;
    renderNav();
    scr.innerHTML = S.tab === 'ozet' ? V.ozet(S) : S.tab === 'live' ? V.live(S) : V.garage(S);
    scr.scrollTop = st;
    $('#liveActions').innerHTML = S.tab === 'live' && S.live ? V.liveActions() : '';
    document.querySelectorAll('.tabbar button').forEach((b) => b.classList.toggle('on', b.dataset.v === S.tab));
    if (focus === 'search') { const el = $('[data-role="search"]'); if (el) { el.focus(); const v = el.value; el.value = ''; el.value = v; } }
    refreshSheets();
  }

  const toastEl = $('#toast'); let toastTimer;
  const toast = (msg) => { toastEl.textContent = msg; toastEl.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('on'), 2600); };

  // ── Canlı sürüş simülasyonu ─────────────────────────────────────────────
  let liveTimer = null;
  function startLive() {
    S.live = { vehicleId: S.vehicleOrder[0], dist: 0, speed: 0, target: 35, t: 0, samples: [] };
    liveTimer = setInterval(tickLive, 250); render();
  }
  function stopLive() { clearInterval(liveTimer); liveTimer = null; S.live = null; }
  function tickLive() {
    const L = S.live; if (!L) return; L.t += 1;
    if (L.t % 18 === 0) L.target = (L.t % 90 === 0) ? 0 : 25 + ((L.t * 37) % 50);
    L.speed += (L.target - L.speed) * 0.18 + (((L.t * 13) % 7) - 3) * 0.15;
    L.speed = Math.max(0, Math.min(90, L.speed));
    L.dist += L.speed * 4 / 3600; L.samples.push(Math.round(L.speed * 10) / 10);
    const q = (k) => $(`[data-live="${k}"]`); const sp = q('speed'); if (!sp) return;
    sp.textContent = Math.round(L.speed);
    const active = vehicleById(L.vehicleId);
    q('total').textContent = F.dec(L.dist * active.avg / 100 * CL.FUEL_PRICE[active.fuel]);
    CL.VEHICLES.forEach((v) => { const el = q(`cost-${v.id}`); if (el) el.textContent = `${F.dec(L.dist * v.avg / 100 * CL.FUEL_PRICE[v.fuel])} ₺`; });
  }
  function finishLive() {
    const L = S.live;
    if (!L || L.dist < 0.3) { stopLive(); render(); toast('Çok kısa bir sürüş — kaydedilmedi.'); return; }
    const veh = vehicleById(L.vehicleId);
    const trip = CL.makeTrip({ label: 'Web demo sürüşü', km: L.dist, toll: 0, vehicle: veh, date: new Date(), auto: false, speeds: L.samples.length > 4 ? L.samples : undefined });
    const st = CL.driveStats(trip.speeds, 4); trip.interval = 4; trip.avgSpeed = st.avg; trip.maxSpeed = st.max; trip.highShare = st.highShare; trip.stops = st.stops; trip.highwayShare = 0;
    userTrips.push(trip); persist(); rebuildTrips(); stopLive();
    S.tab = 'ozet'; S.period = 'day'; S.anchor = new Date(); S.filterVehicle = null; render(); pushSheet('trip', { id: trip.id });
  }

  // ── Hesapla yardımcıları ────────────────────────────────────────────────
  const calcView = () => { const c = S.calc; const place = CL.PLACES.find((p) => p.id === c.place); return place ? CL.routeView(S, place, c.pick) : null; };
  function saveCalcTrip() {
    const c = S.calc; const v = CL.routeView(S, CL.PLACES.find((p) => p.id === c.place), c.pick); if (!v) return;
    const place = CL.PLACES.find((p) => p.id === c.place); const veh = vehicleById(c.vehicleId); const km = v.route.km * v.mult;
    const trip = CL.makeTrip({ label: `Mevcut Konum – ${place.name}`, km, toll: v.e.toll * v.mult, vehicle: veh, date: new Date(), auto: false, speeds: [] });
    trip.fuelCost = v.e.fuel * v.mult; trip.totalCost = trip.fuelCost + trip.tollCost; trip.liters = v.e.liters * v.mult; trip.rate = v.e.rate; trip.speeds = []; trip.avgSpeed = 0; trip.maxSpeed = 0; trip.highShare = 0; trip.stops = 0; trip.highwayShare = v.route.hwy;
    userTrips.push(trip); persist(); rebuildTrips(); c.saved = true; toast('Yolculuk kaydedildi — Özet sekmesinde görünür.'); render();
  }

  // ── Olaylar ─────────────────────────────────────────────────────────────
  const ACT = {
    tab: (v) => { if (S.tab !== v) { S.tab = v; $('#screen').scrollTop = 0; } },
    period: (v) => { S.period = v; S.anchor = new Date(); },
    today: () => { S.anchor = new Date(); if (topSheet() && topSheet().type === 'datepick') popSheet(); },
    step: (v) => { const next = D.step(S.period, S.anchor, Number(v)); if (Number(v) < 0 || next <= new Date()) S.anchor = next; },
    datepick: () => { S.pickMonth = new Date(S.anchor); pushSheet('datepick'); },
    pickmonth: (v) => { S.pickMonth = new Date(S.pickMonth.getFullYear(), S.pickMonth.getMonth() + Number(v), 1); },
    pickday: (v) => { S.anchor = new Date(S.pickMonth.getFullYear(), S.pickMonth.getMonth(), Number(v), S.anchor.getHours(), S.anchor.getMinutes()); popSheet(); },
    filterVehicle: (v) => { S.filterVehicle = v || null; },
    search: () => { S.searching = !S.searching; if (!S.searching) S.searchText = ''; },
    trip: (v) => pushSheet('trip', { id: v }),
    actual: (v) => pushSheet('actual', { id: v }),
    saveactual: (v) => {
      const el = $('[data-role="actual"]'); const val = parseFloat(String(el.value).replace(',', '.'));
      if (!isFinite(val) || val < 0) { toast('Geçerli bir tutar gir (örn. 1250).'); return; }
      S.actual[v] = val; persist(); rebuildTrips(); popSheet();
    },
    range: (v) => { const top = topSheet(); if (top && top.type === 'trips') S.tripsRange = v; else S.analysisRange = v; },
    collapse: (v) => { if (S.collapsedVehicles.has(v)) S.collapsedVehicles.delete(v); else S.collapsedVehicles.add(v); },
    menuopen: () => { S.menuOpen = true; $('#menu').classList.add('on'); mountSheets(); },
    menuclose: () => { S.menuOpen = false; $('#menu').classList.remove('on'); mountSheets(); },
    menu: (v) => {
      if (S.menuOpen) ACT.menuclose();
      const go = () => {
        if (v === 'calc') pushSheet('calc'); else if (v === 'analysis') pushSheet('analysis'); else if (v === 'trips') pushSheet('trips');
        else if (v === 'compare') pushSheet('info', { title: 'Araç Karşılaştır', text: 'Gerçek uygulamada aynı yolu hangi aracın daha ucuza gittiğini yan yana görürsün. Web demosunda bu ekran yok.' });
        else if (v === 'carplay') pushSheet('info', { title: 'CarPlay', text: 'Gerçek uygulamada araba ekranında içerik gösterir. Bu özellik yalnızca iPhone ve CarPlay ile çalışır.' });
        else pushSheet('info', { title: 'Ayarlar', text: 'Otomatik algılama, bildirim ve izin ayarları gerçek uygulamada. Web demosunda ayar yok.' });
      };
      S.menuOpen ? setTimeout(go, 0) : go();
    },
    vehicle: (v) => toast(`${vehicleById(v).name} ayrıntısı web demosunda yok; gerçek uygulamada dolum ve bakım kayıtları burada.`),
    move: (v) => { const [id, dir] = v.split(':'); const i = S.vehicleOrder.indexOf(id); const j = dir === 'up' ? i - 1 : i + 1; if (j >= 0 && j < S.vehicleOrder.length) { const o = S.vehicleOrder; [o[i], o[j]] = [o[j], o[i]]; } },
    reorder: () => { S.reordering = !S.reordering; },
    banner: () => { S.bannerOn = false; },
    trend: () => toast('Akaryakıt fiyat trendi web demosunda yok.'),
    addvehicle: () => toast('Web demosunda araç ekleme kapalı — gerçek uygulamada araç kataloğundan seçilir.'),
    startlive: () => startLive(),
    finishlive: () => finishLive(),
    cancellive: () => { stopLive(); render(); toast('Sürüş iptal edildi, kaydedilmedi.'); },
    livevehicle: (v) => { if (S.live) S.live.vehicleId = v; },
    coll: (v) => { const c = S.calc; if (v === 'quick') c.quickOpen = !c.quickOpen; else if (v === 'settings') c.settingsOpen = !c.settingsOpen; else c.detailsOpen = !c.detailsOpen; },
    cset: (v) => { const [k, val] = v.split(':'); const c = S.calc; c[k] = k === 'roundTrip' ? val === 'true' : Number(val); c.saved = false; },
    ctoggle: (v) => { S.calc[v] = !S.calc[v]; S.calc.saved = false; },
    pickplace: (v) => { S.calc.place = v; S.calc.pick = 0; S.calc.saved = false; S.calc.quickOpen = false; },
    pickroute: (v) => { S.calc.pick = Number(v); S.calc.saved = false; },
    resetroute: () => { S.calc.place = null; S.calc.pick = 0; S.calc.saved = false; },
    openroutemap: () => { S.calc.mapPlace = S.calc.place; S.calc.mapPick = S.calc.place ? S.calc.pick : null; pushSheet('routemap'); },
    mappick: (v) => { S.calc.mapPlace = v; S.calc.mapPick = null; },
    mappickroute: (v) => { S.calc.mapPick = Number(v); },
    mapreset: () => { S.calc.mapPlace = null; S.calc.mapPick = null; },
    chooseroute: () => {
      const c = S.calc; const place = CL.PLACES.find((p) => p.id === c.mapPlace); if (!place) return;
      c.place = place.id; c.pick = c.mapPick != null ? c.mapPick : 0; c.saved = false; popSheet();
    },
    closesheet: () => popSheet(),
    savetrip: () => saveCalcTrip(),
    routetypes: () => pushSheet('routetypes'),
    vehiclepick: () => pushSheet('vehiclepick'),
    vehiclechosen: (v) => { S.calc.vehicleId = v; S.calc.saved = false; popSheet(); },
    fullmap: () => toast('Gerçek uygulamada rota tam ekran haritada açılır.'),
    toast: (v) => toast(v),
  };
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]'); if (!el || el.disabled) return;
    const fn = ACT[el.dataset.act]; if (!fn) return;
    e.preventDefault();
    const out = fn(el.dataset.v);
    if (out === undefined && !['closesheet', 'saveactual', 'pickday', 'today', 'chooseroute', 'vehiclechosen', 'menu', 'menuopen', 'menuclose'].includes(el.dataset.act)) { render(); } else { render(); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (S.menuOpen) ACT.menuclose(); else if (S.sheets.length) popSheet(); }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-act][role="button"]')) { e.preventDefault(); e.target.click(); }
  });
  $('#dim').addEventListener('click', () => { if (S.sheets.length) popSheet(); else if (S.menuOpen) { ACT.menuclose(); render(); } });
  document.addEventListener('input', (e) => {
    const r = e.target.dataset && e.target.dataset.role; if (!r) return;
    if (r === 'search') { S.searchText = e.target.value; render(); }
    else if (r === 'fuelText') { S.calc.fuelText = e.target.value; S.calc.saved = false; render(); }
    else if (r === 'tollText') { S.calc.tollText = e.target.value; S.calc.saved = false; render(); }
    else if (r === 'actual') {
      const top = topSheet(); const t = top && findTrip(top.data.id); const box = $('[data-role="actualDiff"]'); if (!t || !box) return;
      const val = parseFloat(String(e.target.value).replace(',', '.'));
      if (!isFinite(val)) { box.innerHTML = ''; return; }
      const diff = val - t.totalCost; const pct = Math.abs(diff) / Math.max(t.totalCost, 1) * 100;
      box.innerHTML = `<hr class="div"><div style="display:flex;padding:14px 16px"><span>Fark</span><span style="flex:1"></span><b style="color:${pct < 10 ? '#34C759' : pct < 20 ? '#FF9500' : '#FF3B30'}">${diff >= 0 ? '+' : ''}₺${Math.round(diff)} (%${pct.toFixed(1)})</b></div>`;
    }
  });

  // Menünün dışına dokununca kapanması, sayfaların aşağı çekilerek kapanması.
  let drag = null;
  document.addEventListener('pointerdown', (e) => {
    const h = e.target.closest('[data-drag]'); if (!h || e.target.closest('button')) return;
    const rec = sheetEls[sheetEls.length - 1]; if (!rec || !rec.el.contains(h)) return;
    drag = { y: e.clientY, el: rec.el, dy: 0 }; rec.el.style.transition = 'none';
  });
  document.addEventListener('pointermove', (e) => { if (!drag) return; drag.dy = Math.max(0, e.clientY - drag.y); drag.el.style.transform = `translateY(${drag.dy}px)`; });
  const endDrag = () => { if (!drag) return; const { el, dy } = drag; drag = null; el.style.transition = ''; el.style.transform = ''; if (dy > 110) popSheet(); };
  document.addEventListener('pointerup', endDrag); document.addEventListener('pointercancel', endDrag);

  // ── Kabuk ───────────────────────────────────────────────────────────────
  if (window.self !== window.top) document.body.classList.add('framed');
  else if (matchMedia('(max-width: 520px)').matches && matchMedia('(pointer: coarse)').matches) document.documentElement.classList.add('real-status');
  const tickClock = () => { const n = new Date(); $('[data-clock]').textContent = `${n.getHours()}:${F.pad(n.getMinutes())}`; };
  tickClock(); setInterval(tickClock, 30000);
  let rz; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(render, 120); });
  document.querySelectorAll('.tabbar button').forEach((b) => b.addEventListener('click', () => { ACT.tab(b.dataset.v); render(); }));
  $('#menu').innerHTML = V.menu(); render();
  window.CLApp = { S, ACT, render, pushSheet };
})();
