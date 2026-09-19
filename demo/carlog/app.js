// CarLog web demosu — iOS uygulamasının örnek verilerle çalışan web kopyası.
// Veri: CarLog/Utils/DemoSeed.swift ile aynı araçlar, rotalar ve üretim kuralı.
// Hiçbir sunucuya veri gönderilmez; demo sürüşleri yalnızca bu tarayıcıda tutulur.
(() => {
  'use strict';

  // ── Veri ──────────────────────────────────────────────────────────────────
  const FUEL_PRICE = { Dizel: 52.0, Benzin: 49.5 }; // DemoSeed.swift fiyatları
  const VEHICLES = [
    { id: 'egea', name: 'Egea', brand: 'Fiat', model: 'Egea 1.6 Multijet 130 HP', year: 2022, fuel: 'Dizel', avg: 4.5, city: 5.0, hwy: 4.1, tank: 50 },
    { id: 'golf', name: 'Golf', brand: 'Volkswagen', model: 'Golf 1.5 TSI', year: 2020, fuel: 'Benzin', avg: 6.0, city: 7.3, hwy: 5.1, tank: 50 },
  ];
  const ROUTES = [
    ['Ev – Ofis', 18.4, 0], ['Ofis – Ev', 19.1, 0], ['Kadıköy – Beşiktaş', 12.2, 0],
    ['Osmangazi Köprüsü', 148.0, 995], ['Ev – Market', 4.6, 0], ['İstanbul – Bursa', 152.0, 995],
    ['Ev – Havalimanı', 41.3, 78],
  ];
  const STORE_KEY = 'carlog-web-demo-trips-v1';

  const vehicleById = (id) => VEHICLES.find((v) => v.id === id) || VEHICLES[0];

  function makeTrip({ label, km, toll, vehicle, date, speeds, auto = true }) {
    const litres = km * vehicle.avg / 100;
    const fuel = litres * FUEL_PRICE[vehicle.fuel];
    const hwy = km > 100;
    return {
      id: `${date.getTime()}-${label}`,
      label, km, toll, fuel, total: fuel + toll, litres, date,
      vehicleId: vehicle.id, rate: vehicle.avg,
      avgSpeed: hwy ? 96 : 38, maxSpeed: hwy ? 124 : 67, highShare: hwy ? .62 : .04, stops: hwy ? 3 : 11,
      speeds: speeds || timeline(km), auto,
    };
  }
  function timeline(km) {
    const points = Math.max(8, Math.floor(km / 1.5));
    const peak = km > 100 ? 118 : 62;
    return Array.from({ length: points }, (_, i) => Math.max(0, Math.sin((i / points) * Math.PI) * peak + ((i * 7) % 9) - 4));
  }
  function seedTrips() {
    const trips = [];
    let index = 0;
    const now = new Date();
    for (let day = 0; day < 45; day += 1) {
      const count = day % 3 === 0 ? 2 : (day % 5 === 0 ? 0 : 1);
      for (let slot = 0; slot < count; slot += 1) {
        const [label, km, toll] = ROUTES[index % ROUTES.length];
        index += 1;
        const vehicle = index % 4 === 0 ? VEHICLES[1] : VEHICLES[0];
        const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day, slot === 0 ? 8 : 18, 25);
        if (date > now) continue; // bugünün henüz gelmemiş saati
        trips.push(makeTrip({ label, km, toll, vehicle, date }));
      }
    }
    return trips;
  }
  function loadUserTrips() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
      return raw.map((t) => ({ ...t, date: new Date(t.date) }));
    } catch (_) { return []; }
  }
  function saveUserTrips() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state.trips.filter((t) => !t.auto))); } catch (_) { /* gizli sekme vb. */ }
  }

  const state = {
    tab: 'summary', period: 'day', offset: 0, vehicle: 'all', primary: 'egea',
    analysisRange: '90', trips: [...seedTrips(), ...loadUserTrips()].sort((a, b) => b.date - a.date),
    live: null, route: { dest: 'bursa', pick: 0 },
  };

  // ── Biçim ─────────────────────────────────────────────────────────────────
  const nf0 = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 });
  const nf1 = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const nf2 = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  const MONTHS_LONG = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tl = (v) => nf0.format(Math.round(v));
  const pad = (n) => String(n).padStart(2, '0');
  const dateLine = (d) => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const kmFmt = (km) => (km < 10 ? nf1.format(km) : nf0.format(Math.round(km)));

  // ── Dönem ─────────────────────────────────────────────────────────────────
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const startOfWeek = (d) => addDays(startOfDay(d), -((d.getDay() + 6) % 7));
  function periodRange(kind, offset, base = new Date()) {
    if (kind === 'day') { const s = addDays(startOfDay(base), -offset); return [s, addDays(s, 1)]; }
    if (kind === 'week') { const s = addDays(startOfWeek(base), -7 * offset); return [s, addDays(s, 7)]; }
    const s = new Date(base.getFullYear(), base.getMonth() - offset, 1);
    return [s, new Date(s.getFullYear(), s.getMonth() + 1, 1)];
  }
  function periodTitle(kind, offset) {
    const [s, e] = periodRange(kind, offset);
    if (kind === 'day') return offset === 0 ? 'Bugün' : offset === 1 ? 'Dün' : `${s.getDate()} ${MONTHS[s.getMonth()]}`;
    if (kind === 'week') {
      if (offset === 0) return 'Bu hafta';
      if (offset === 1) return 'Geçen hafta';
      const last = addDays(e, -1);
      return `${s.getDate()} ${MONTHS[s.getMonth()]} – ${last.getDate()} ${MONTHS[last.getMonth()]}`;
    }
    return offset === 0 ? 'Bu ay' : `${MONTHS_LONG[s.getMonth()]} ${s.getFullYear()}`;
  }
  const filterVehicle = (trips) => (state.vehicle === 'all' ? trips : trips.filter((t) => t.vehicleId === state.vehicle));
  const inRange = (trips, [s, e]) => trips.filter((t) => t.date >= s && t.date < e);
  const sum = (trips, key) => trips.reduce((a, t) => a + t[key], 0);

  // ── Ortak parçalar ────────────────────────────────────────────────────────
  const splitBar = (fuel, toll) => {
    const total = Math.max(fuel + toll, .0001);
    return `<div class="split" role="img" aria-label="Yakıt ${tl(fuel)} ₺, gişe ${tl(toll)} ₺"><i class="f" style="width:${(fuel / total) * 100}%"></i><i class="t" style="width:${(toll / total) * 100}%"></i></div>`;
  };
  const ICON = {
    menu: '<svg width="24" height="18" viewBox="0 0 24 18" fill="currentColor"><rect width="24" height="2.6" rx="1.3"/><rect y="7.7" width="24" height="2.6" rx="1.3"/><rect y="15.4" width="24" height="2.6" rx="1.3"/></svg>',
    search: '<svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><circle cx="9.5" cy="9.5" r="7"/><path d="M15 15l5 5"/></svg>',
    plus: '<svg width="22" height="22" viewBox="0 0 22 22" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M11 3v16M3 11h16"/></svg>',
    left: '<svg width="10" height="16" viewBox="0 0 10 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2L2 8l6 6"/></svg>',
    right: '<svg width="10" height="16" viewBox="0 0 10 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2 2l6 6-6 6"/></svg>',
    nav: '<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M11.5.5L.5 5.2l4.6 1.3 1.3 4.6z"/></svg>',
    tollI: '<svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M1 11L5 1M15 11L11 1M8 1v2M8 5v2M8 9v2"/></svg>',
    car: '<svg width="16" height="12" viewBox="0 0 30 22" fill="currentColor"><path d="M6 8l2.4-5A3 3 0 0 1 11.1 1h7.8a3 3 0 0 1 2.7 2L24 8a3 3 0 0 1 3 3v6a2 2 0 0 1-2 2h-1a3 3 0 0 1-6 0h-6a3 3 0 0 1-6 0H5a2 2 0 0 1-2-2v-6a3 3 0 0 1 3-3z"/></svg>',
    carBig: '<svg width="26" height="20" viewBox="0 0 30 22" fill="currentColor"><path d="M6 8l2.4-5A3 3 0 0 1 11.1 1h7.8a3 3 0 0 1 2.7 2L24 8a3 3 0 0 1 3 3v6a2 2 0 0 1-2 2h-1a3 3 0 0 1-6 0h-6a3 3 0 0 1-6 0H5a2 2 0 0 1-2-2v-6a3 3 0 0 1 3-3z"/></svg>',
    infinity: '<svg width="18" height="10" viewBox="0 0 18 10" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 5c-2-3-4-4-5.5-4S1 2.5 1 5s1 4 2.5 4S7 8 9 5s3.5-4 5.5-4S17 2.5 17 5s-1 4-2.5 4S11 8 9 5z"/></svg>',
    flag: '<svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor"><path d="M3 1h1.6v16H3zM6 2h10l-2 3.5L16 9H6z"/></svg>',
    fuel: '<svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor"><path d="M3 2a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v14H3zm2 1v4h4V3zM12 6l2.5 2v6a1 1 0 0 0 2 0V7L14 4.5l-1 1z"/></svg>',
  };
  const sunIcon = (h) => (h < 12 ? '☀︎' : h < 17 ? '◐' : '☾');
  const partOfDay = (h) => (h < 12 ? 'Sabah' : h < 17 ? 'Öğleden sonra' : 'Akşam');

  function niceStep(max) {
    const steps = [50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000, 50000];
    return steps.find((s) => max / s <= 3) || 100000;
  }
  const axisLabel = (v) => (v >= 1000 ? `${nf0.format(v / 1000)}b` : nf0.format(v));

  // Yığılmış yakıt/gişe sütun grafiği (Özet ekranı).
  function stackedChart(buckets, highlightIndex) {
    const W = 320; const H = 168; const L = 30; const B = 20; const T = 8;
    const max = Math.max(1, ...buckets.map((b) => b.fuel + b.toll));
    const step = niceStep(max);
    const top = Math.ceil(max / step) * step;
    const y = (v) => T + (H - T - B) * (1 - v / top);
    const bw = (W - L) / buckets.length;
    const avg = buckets.reduce((a, b) => a + b.fuel + b.toll, 0) / buckets.length;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Dönemlere göre harcama">`;
    for (let v = 0; v <= top; v += step) {
      svg += `<line x1="${L}" x2="${W}" y1="${y(v)}" y2="${y(v)}" stroke="var(--border)"/><text x="0" y="${y(v) + 3}">${axisLabel(v)}</text>`;
    }
    buckets.forEach((b, i) => {
      const x = L + i * bw + bw * .18; const w = bw * .64;
      const op = i === highlightIndex ? 1 : .5;
      if (b.fuel > 0) svg += `<rect x="${x}" y="${y(b.fuel)}" width="${w}" height="${y(0) - y(b.fuel)}" rx="2" fill="var(--primary)" opacity="${op}"/>`;
      if (b.toll > 0) svg += `<rect x="${x}" y="${y(b.fuel + b.toll)}" width="${w}" height="${y(b.fuel) - y(b.fuel + b.toll)}" rx="2" fill="var(--toll)" opacity="${op}"/>`;
      if (b.label) svg += `<text x="${x + w / 2}" y="${H - 4}" text-anchor="middle">${b.label}</text>`;
    });
    if (avg > 0) svg += `<line x1="${L}" x2="${W}" y1="${y(avg)}" y2="${y(avg)}" stroke="var(--muted)" stroke-dasharray="4 4"/><text x="${L + 4}" y="${y(avg) - 4}">ort. ${tl(avg)} ₺</text>`;
    return `${svg}</svg>`;
  }
  function barChart(values, labels, color, height = 120) {
    const W = 320; const L = 26; const B = 18; const T = 6;
    const max = Math.max(1, ...values);
    const step = niceStep(max) > max ? Math.max(1, Math.ceil(max / 4)) : niceStep(max);
    const top = Math.ceil(max / step) * step;
    const y = (v) => T + (height - T - B) * (1 - v / top);
    const bw = (W - L) / values.length;
    let svg = `<svg viewBox="0 0 ${W} ${height}" width="100%">`;
    for (let v = 0; v <= top; v += step) svg += `<line x1="${L}" x2="${W}" y1="${y(v)}" y2="${y(v)}" stroke="var(--border)"/><text x="0" y="${y(v) + 3}">${axisLabel(v)}</text>`;
    values.forEach((v, i) => {
      const x = L + i * bw + bw * .2;
      if (v > 0) svg += `<rect x="${x}" y="${y(v)}" width="${bw * .6}" height="${y(0) - y(v)}" rx="1.5" fill="${color}"/>`;
      if (labels[i]) svg += `<text x="${x + bw * .3}" y="${height - 3}" text-anchor="middle">${labels[i]}</text>`;
    });
    return `${svg}</svg>`;
  }
  const speedColor = (k) => (k < 20 ? 'var(--speed-0)' : k < 50 ? 'var(--speed-1)' : k < 90 ? 'var(--speed-2)' : k < 120 ? 'var(--speed-3)' : 'var(--speed-4)');
  function speedChart(speeds) {
    const W = 320; const H = 110;
    const max = Math.max(130, ...speeds);
    const bw = W / speeds.length;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Hız çizelgesi">`;
    speeds.forEach((s, i) => {
      const h = Math.max(1.5, (s / max) * (H - 4));
      svg += `<rect x="${i * bw + .5}" y="${H - h}" width="${Math.max(1, bw - 1)}" height="${h}" rx="1" fill="${speedColor(s)}"/>`;
    });
    return `${svg}</svg>
      <div class="speed-legend">${[['0–20', 10], ['20–50', 35], ['50–90', 70], ['90–120', 105], ['120+', 130]].map(([l, k]) => `<span><i style="background:${speedColor(k)}"></i>${l}</span>`).join('')}</div>`;
  }

  // ── Ekranlar ──────────────────────────────────────────────────────────────
  const screen = document.getElementById('screen');
  const navbar = document.querySelector('[data-navbar]');

  function renderNav() {
    if (state.tab === 'summary') navbar.innerHTML = `<button class="icon-btn" data-action="menu" aria-label="Menü">${ICON.menu}</button><h1>Özet</h1><button class="icon-btn round" data-action="route" aria-label="Rota hesapla">${ICON.search}</button>`;
    else if (state.tab === 'live') navbar.innerHTML = `<button class="icon-btn" data-action="menu" aria-label="Menü">${ICON.menu}</button><h1>Canlı Sürüş</h1><span></span>`;
    else navbar.innerHTML = `<button class="icon-btn" data-action="menu" aria-label="Menü">${ICON.menu}</button><span></span><button class="icon-btn plus" data-action="add-vehicle" aria-label="Araç ekle">${ICON.plus}</button>`;
  }

  function renderSummary() {
    const trips = filterVehicle(state.trips);
    const range = periodRange(state.period, state.offset);
    const cur = inRange(trips, range);
    const prev = inRange(trips, periodRange(state.period, state.offset + 1));
    const fuel = sum(cur, 'fuel'); const toll = sum(cur, 'toll'); const total = fuel + toll;
    const prevTotal = sum(prev, 'total');
    const title = periodTitle(state.period, state.offset);

    // Grafik: gün → son 14 gün, hafta → son 8 hafta, ay → son 6 ay.
    const n = state.period === 'day' ? 14 : state.period === 'week' ? 8 : 6;
    const buckets = [];
    for (let i = n - 1; i >= 0; i -= 1) {
      const r = periodRange(state.period, state.offset + i);
      const tr = inRange(trips, r);
      let label = '';
      if (state.period === 'day') label = (i % 2 === 0) ? String(r[0].getDate()) : '';
      else if (state.period === 'week') label = `${r[0].getDate()} ${MONTHS[r[0].getMonth()]}`.slice(0, 6);
      else label = MONTHS[r[0].getMonth()];
      buckets.push({ fuel: sum(tr, 'fuel'), toll: sum(tr, 'toll'), label });
    }
    const chartTitle = state.period === 'day' ? 'SON 14 GÜN' : state.period === 'week' ? 'SON 8 HAFTA' : 'SON 6 AY';
    const prevWord = state.period === 'day' ? 'Düne' : state.period === 'week' ? 'Geçen haftaya' : 'Geçen aya';
    let delta = '';
    if (prevTotal > 0 && total > 0) {
      const pct = Math.round(((total - prevTotal) / prevTotal) * 100);
      delta = pct >= 0 ? `<span class="delta toll">↗ ${prevWord} göre %${pct} fazla</span>` : `<span class="delta savings">↘ ${prevWord} göre %${-pct} az</span>`;
    }

    // Yolculuk listesi: günün bölümüne göre gruplu.
    const groups = [];
    cur.forEach((t) => {
      const key = `${startOfDay(t.date).getTime()}-${partOfDay(t.date.getHours())}`;
      let g = groups.find((x) => x.key === key);
      if (!g) { g = { key, title: partOfDay(t.date.getHours()), day: t.date, trips: [] }; groups.push(g); }
      g.trips.push(t);
    });
    const multiDay = state.period !== 'day';
    const list = groups.length
      ? groups.map((g) => `<div class="group-head"><span>${sunIcon(g.day.getHours())} ${multiDay ? `${g.day.getDate()} ${MONTHS[g.day.getMonth()]} · ` : ''}${g.title}</span><span class="num">${tl(sum(g.trips, 'total'))} ₺</span></div>${g.trips.map(tripRow).join('')}`).join('')
      : `<p class="empty">Bu dönemde kayıtlı yolculuk yok.</p>`;

    screen.innerHTML = `
      <div class="segmented" role="tablist">${[['day', 'Gün'], ['week', 'Hafta'], ['month', 'Ay']].map(([k, l]) => `<button role="tab" aria-selected="${state.period === k}" class="${state.period === k ? 'on' : ''}" data-period="${k}">${l}</button>`).join('')}</div>
      <div class="period"><button class="arrow" data-shift="1" aria-label="Önceki dönem">${ICON.left}</button><strong>${esc(title)}</strong><button class="arrow" data-shift="-1" aria-label="Sonraki dönem" ${state.offset === 0 ? 'disabled' : ''}>${ICON.right}</button></div>
      <section class="card">
        <p class="label">Toplam gider · ${esc(title)}</p>
        <div class="total"><span class="num">${tl(total)}</span><span class="num cur">₺</span></div>
        ${splitBar(fuel, toll)}
        <div class="tiles">
          <div class="tile"><p class="label">${ICON.nav} Mesafe</p><span class="num">${kmFmt(sum(cur, 'km'))}<span class="unit">km</span></span></div>
          <div class="tile"><p class="label toll">${ICON.tollI} Gişe</p><span class="num toll">${tl(toll)}<span class="unit">₺</span></span></div>
          <div class="tile"><p class="label">${ICON.car} Sefer</p><span class="num">${cur.length}</span></div>
        </div>
        <p class="allTime">${ICON.infinity} Tüm zamanlar: ${tl(sum(trips, 'total'))} ₺ · ${trips.length} yolculuk</p>
      </section>
      <section class="card chart">
        <div class="chart-head"><p class="label">${chartTitle}</p>${delta}</div>
        ${stackedChart(buckets, n - 1)}
        <div class="legend"><span>Yakıt</span><span class="t">Gişe</span></div>
      </section>
      <div class="chips">${[['all', 'Tüm Araçlar'], ...VEHICLES.map((v) => [v.id, v.name])].map(([k, l]) => `<button class="${state.vehicle === k ? 'on' : ''}" data-vehicle="${k}">${esc(l)}</button>`).join('')}</div>
      <p class="label section-label">Yolculuklar</p>
      ${list}`;
  }
  function tripRow(t) {
    const v = vehicleById(t.vehicleId);
    return `<button class="trip" data-trip="${esc(t.id)}"><span><b>${esc(t.label)}</b><small>${dateLine(t.date)} · ${kmFmt(t.km)} km · ${esc(v.name)}</small></span><span class="price">${tl(t.total)}<em>₺</em></span></button>`;
  }

  function liveCosts(dist) {
    return VEHICLES.map((v) => ({ v, cost: dist * v.avg / 100 * FUEL_PRICE[v.fuel] }));
  }
  function renderLive() {
    const L = state.live;
    const running = !!L;
    const dist = L ? L.dist : 0;
    const sel = L ? L.vehicleId : state.primary;
    const v = vehicleById(sel);
    const costs = liveCosts(dist);
    screen.innerHTML = `
      <div class="rec"><span class="dot ${running ? '' : 'idle'}">${running ? 'KAYIT SÜRÜYOR' : 'SÜRÜŞ YOK'}</span><span class="muted">${esc(v.name)}</span></div>
      <section class="card">
        <div class="chart-head"><p class="label">Hangi araçtasın</p><span class="muted" style="font-size:12px">dokunarak değiştir</span></div>
        ${costs.map(({ v: cv, cost }) => `<button class="radio-row ${cv.id === sel ? 'on' : ''}" data-live-vehicle="${cv.id}"><span class="r"></span>${esc(cv.name)}<span class="num">${tl(cost)} ₺</span></button>`).join('')}
      </section>
      <section class="card">
        <div class="speed"><span class="num" data-live-speed>${L ? Math.round(L.speed) : 0}</span><span class="unit">km/s</span></div>
        <div class="row"><span>Ortalama tüketim</span><strong class="num">${nf1.format(v.avg)} L/100km</strong></div>
        <div class="row" style="margin-top:12px"><span>Mesafe</span><strong class="num" data-live-dist>${nf1.format(dist)} km</strong></div>
      </section>
      <section class="card">
        <p class="label">Bu yolculukta</p>
        <div class="total" style="margin:10px 0 8px"><span class="num" data-live-cost>${tl(costs.find((c) => c.v.id === sel).cost)}</span><span class="num cur">₺</span></div>
        <p class="muted" style="font-size:13px">Yalnızca yakıt. Gişeden geçilirse otomatik eklenecek.</p>
      </section>
      ${running
        ? `<button class="btn primary" data-action="finish">${ICON.flag} Yolculuğu Bitir</button><p class="hint">Durduğunda kendiliğinden de kaydedilir.</p><button class="btn danger" data-action="cancel">✕ Bu bir yolculuk değil, iptal et</button>`
        : `<button class="btn primary" data-action="start">${ICON.flag} Demo sürüşü başlat</button><p class="hint">Gerçek uygulamada sürüş hareketle otomatik algılanır. Burada şehir içi bir sürüş canlandırılır.</p>`}`;
  }
  function tickLive() {
    const L = state.live; if (!L) return;
    // Şehir içi hız profili: hedef hıza yumuşak yaklaşım, arada duraklar.
    L.t += 1;
    if (L.t % 18 === 0) L.target = (L.t % 90 === 0) ? 0 : 25 + ((L.t * 37) % 50);
    L.speed += (L.target - L.speed) * .18 + (((L.t * 13) % 7) - 3) * .15;
    L.speed = Math.max(0, Math.min(90, L.speed));
    const simSeconds = 4; // her tik 4 simülasyon saniyesi
    L.dist += L.speed * simSeconds / 3600;
    if (L.t % 2 === 0) L.samples.push(L.speed);
    const sp = screen.querySelector('[data-live-speed]');
    if (!sp) return;
    sp.textContent = Math.round(L.speed);
    screen.querySelector('[data-live-dist]').textContent = `${nf1.format(L.dist)} km`;
    const costs = liveCosts(L.dist);
    screen.querySelector('[data-live-cost]').textContent = tl(costs.find((c) => c.v.id === L.vehicleId).cost);
    screen.querySelectorAll('[data-live-vehicle]').forEach((row) => {
      row.querySelector('.num').textContent = `${tl(costs.find((c) => c.v.id === row.dataset.liveVehicle).cost)} ₺`;
    });
  }

  function renderGarage() {
    const [s, e] = periodRange('month', 0);
    const month = inRange(state.trips, [s, e]);
    const fuel = sum(month, 'fuel'); const toll = sum(month, 'toll');
    const ordered = [vehicleById(state.primary), ...VEHICLES.filter((v) => v.id !== state.primary)];
    screen.innerHTML = `
      <h2 class="large-title">Garajım</h2>
      <section class="card">
        <div class="chart-head" style="align-items:flex-start"><p class="label">${MONTHS_LONG[s.getMonth()]} ${s.getFullYear()} masrafı</p><span style="text-align:right;font-size:14px;font-weight:600">${month.length} yolculuk<br><span class="muted" style="font-weight:400;font-size:13px">${nf0.format(Math.round(sum(month, 'km')))} km</span></span></div>
        <div class="total" style="margin-top:0"><span class="num">${tl(fuel + toll)}</span><span class="num cur">₺</span></div>
        ${splitBar(fuel, toll)}
        <div class="legend"><span>Yakıt ${tl(fuel)} ₺</span><span class="t">Gişe ${tl(toll)} ₺</span></div>
        <p class="allTime" style="color:var(--text-2)">${ICON.car} ${VEHICLES.length} araç</p>
      </section>
      <section class="card">
        <div class="chart-head"><strong style="display:flex;gap:8px;align-items:center;font-size:18px"><span class="toll">${ICON.fuel}</span>Akaryakıt Radarı</strong></div>
        <div class="fuel-tiles" style="grid-template-columns:repeat(2,minmax(0,1fr))">
          <div class="tile"><p class="label">Benzin</p><p class="num">${nf2.format(FUEL_PRICE.Benzin)}</p><small>₺ / Litre</small></div>
          <div class="tile"><p class="label">Motorin</p><p class="num">${nf2.format(FUEL_PRICE.Dizel)}</p><small>₺ / Litre</small></div>
        </div>
        <p class="muted" style="font-size:13px;margin-top:12px">Örnek fiyatlar · gerçek uygulama güncel pompa fiyatını çeker.</p>
      </section>
      <p class="label section-label">Araçlarınız</p>
      ${ordered.map((v) => `
        <section class="card vehicle ${v.id === state.primary ? 'primary-v' : ''}" data-primary="${v.id}" role="button" tabindex="0" aria-label="${esc(v.name)} aracını birincil yap">
          <div class="vehicle-head"><span class="vehicle-icon">${ICON.carBig}</span><div><b>${esc(v.name)}</b>${v.id === state.primary ? '<span class="badge">BİRİNCİL</span>' : ''}<small>${v.year} • ${esc(v.brand)} ${esc(v.model)} • ${esc(v.fuel)}</small></div></div>
          <div class="tiles two" style="margin-top:0">
            <div class="tile"><p class="label">Karma tüketim</p><span class="num">${nf1.format(v.avg)}<span class="unit">L/100km</span></span></div>
            <div class="tile"><p class="label">Tam depo</p><span class="num">${nf0.format(Math.round(v.tank * 100 / v.avg))}<span class="unit">km</span></span></div>
          </div>
        </section>`).join('')}`;
  }

  function render() {
    renderNav();
    if (state.tab === 'summary') renderSummary();
    else if (state.tab === 'live') renderLive();
    else renderGarage();
    document.querySelectorAll('.tabbar [data-tab]').forEach((b) => b.classList.toggle('on', b.dataset.tab === state.tab));
  }

  // ── Sayfalar ──────────────────────────────────────────────────────────────
  const wrap = document.querySelector('[data-sheet-wrap]');
  const sheetBody = document.querySelector('[data-sheet-body]');
  const sheetTitle = document.querySelector('[data-sheet-title]');
  let sheetRender = null;
  function openSheet(title, renderFn) {
    sheetTitle.textContent = title;
    sheetRender = renderFn;
    sheetBody.innerHTML = renderFn();
    sheetBody.scrollTop = 0;
    wrap.classList.add('open');
  }
  const refreshSheet = () => { if (sheetRender) sheetBody.innerHTML = sheetRender(); };
  function closeSheet() { wrap.classList.remove('open'); sheetRender = null; }

  function tripDetail(t) {
    const v = vehicleById(t.vehicleId);
    return `
      <p class="muted" style="margin:0 4px 12px;font-size:14px">${dateLine(t.date)} · ${esc(v.name)}${t.auto ? '' : ' · web demo sürüşü'}</p>
      <section class="card">
        <p class="label">Toplam</p>
        <div class="total"><span class="num">${tl(t.total)}</span><span class="num cur">₺</span></div>
        ${splitBar(t.fuel, t.toll)}
        <div class="legend"><span>Yakıt ${tl(t.fuel)} ₺</span><span class="t">Gişe ${tl(t.toll)} ₺</span></div>
        <div class="tiles">
          <div class="tile"><p class="label">Mesafe</p><span class="num">${kmFmt(t.km)}<span class="unit">km</span></span></div>
          <div class="tile"><p class="label">Yakıt</p><span class="num">${nf1.format(t.litres)}<span class="unit">L</span></span></div>
          <div class="tile"><p class="label">Tüketim</p><span class="num">${nf1.format(t.rate)}<span class="unit">L/100</span></span></div>
        </div>
      </section>
      <section class="card">
        <p class="label">Sürüş</p>
        <div class="kv" style="border-top:0;margin-top:8px;padding-top:0">
          <div><span class="num">${Math.round(t.avgSpeed)}</span><small>Ort. km/s</small></div>
          <div><span class="num">${Math.round(t.maxSpeed)}</span><small>Maks. km/s</small></div>
          <div><span class="num">${t.stops}</span><small>Duraklama</small></div>
        </div>
      </section>
      <section class="card chart"><p class="label" style="margin-bottom:10px">Hız çizelgesi</p>${speedChart(t.speeds)}</section>
      <p class="muted" style="font-size:12px;text-align:center;margin-top:4px">${t.toll > 0 ? 'Gişe: kesin eşleşme (gişe matrisi)' : 'Bu yolculukta gişe yok'}</p>`;
  }

  function analysis() {
    const r = state.analysisRange;
    const now = new Date();
    const from = r === '30' ? addDays(startOfDay(now), -29) : r === '90' ? addDays(startOfDay(now), -89) : r === 'year' ? new Date(now.getFullYear(), 0, 1) : new Date(0);
    const trips = state.trips.filter((t) => t.date >= from);
    const fuel = sum(trips, 'fuel'); const toll = sum(trips, 'toll'); const km = sum(trips, 'km');
    const litres = sum(trips, 'litres');
    const hours = Array(24).fill(0); trips.forEach((t) => { hours[t.date.getHours()] += 1; });
    const wd = Array(7).fill(0); trips.forEach((t) => { wd[(t.date.getDay() + 6) % 7] += t.total; });
    return `
      <div class="segmented full">${[['30', '30 gün'], ['90', '90 gün'], ['year', 'Bu yıl'], ['all', 'Tümü']].map(([k, l]) => `<button class="${r === k ? 'on' : ''}" data-range="${k}">${l}</button>`).join('')}</div>
      <section class="card">
        <p class="label">Toplam harcama</p>
        <div class="total"><span class="num">${tl(fuel + toll)}</span><span class="num cur">₺</span></div>
        <div class="kv"><div><span class="num">${trips.length}</span><small>Yolculuk</small></div><div><span class="num">${nf0.format(Math.round(km))} km</span><small>Mesafe</small></div><div><span class="num">${km ? tl((fuel + toll) / km) : 0} ₺</span><small>Km başı</small></div></div>
      </section>
      <section class="card">
        <p class="label" style="margin-bottom:12px">Para nereye gitti</p>
        ${splitBar(fuel, toll)}
        <div class="legend"><span>Yakıt ${tl(fuel)} ₺</span><span class="t">Gişe ${tl(toll)} ₺</span></div>
        <div class="kv"><div><span class="num">${nf0.format(Math.round(litres))} L</span><small>Yakıt</small></div><div><span class="num">${km ? nf1.format(litres / km * 100) : '0'} L/100</span><small>Tüketim</small></div><div><span class="num">${trips.length ? nf0.format(Math.round(km / trips.length)) : 0} km</span><small>Ort. yolculuk</small></div></div>
      </section>
      <section class="card">
        <p class="label">Araçlara göre</p>
        ${VEHICLES.map((v) => { const vt = trips.filter((t) => t.vehicleId === v.id); const vk = sum(vt, 'km'); const vs = sum(vt, 'total'); return `<div class="vrow"><div><b>${esc(v.name)}</b><small>${vt.length} yolculuk · ${nf0.format(Math.round(vk))} km · ${vk ? tl(vs / vk) : 0} ₺/km</small></div><b>${tl(vs)} ₺</b></div>`; }).join('')}
      </section>
      <section class="card chart"><p class="label" style="margin-bottom:10px">Ne zaman sürüyorsun</p>${barChart(hours, hours.map((_, i) => (i % 3 === 0 ? pad(i) : '')), 'var(--primary)')}</section>
      <section class="card chart"><p class="label" style="margin-bottom:10px">Haftanın günleri (₺)</p>${barChart(wd.map(Math.round), ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'], 'var(--savings)')}</section>`;
  }

  // Örnek rota verisi (gerçek uygulama güncel gişe matrisi ve trafiği kullanır).
  const DESTS = {
    bursa: { name: 'Bursa', from: 'İstanbul (Kartal)', routes: [
      { road: 'Anadolu Otoyolu + Osmangazi', km: 143.5, min: 146, toll: 1754, traffic: 37 },
      { road: 'D-100 Karayolu', km: 142.8, min: 169, toll: 1754, traffic: 45 },
    ] },
    airport: { name: 'Sabiha Gökçen', from: 'Ev', routes: [
      { road: 'O-4 Anadolu Otoyolu', km: 41.3, min: 47, toll: 78, traffic: 28 },
      { road: 'D-100 Karayolu', km: 39.8, min: 58, toll: 0, traffic: 55 },
    ] },
    besiktas: { name: 'Beşiktaş', from: 'Kadıköy', routes: [
      { road: '15 Temmuz Şehitler Köprüsü', km: 12.2, min: 31, toll: 0, traffic: 52 },
      { road: 'FSM Köprüsü', km: 17.9, min: 34, toll: 0, traffic: 30 },
    ] },
  };
  function routeSheet() {
    const d = DESTS[state.route.dest];
    const v = vehicleById(state.primary);
    const price = FUEL_PRICE[v.fuel];
    const calc = d.routes.map((r) => {
      const fuel = r.km * v.avg / 100 * price * (1 + r.traffic / 100 * .25); // trafik tüketimi artırır
      return { ...r, fuel, total: fuel + r.toll };
    });
    const cheapest = calc.reduce((a, b, i) => (b.total < calc[a].total ? i : a), 0);
    const pick = calc[state.route.pick] || calc[0];
    const pathA = 'M40 150 C 90 120, 140 60, 210 70 S 290 40, 300 30';
    const pathB = 'M40 150 C 80 150, 150 130, 200 110 S 280 60, 300 30';
    return `
      <div class="dest">${Object.entries(DESTS).map(([k, x]) => `<button class="${state.route.dest === k ? 'on' : ''}" data-dest="${k}">${esc(x.from)} → ${esc(x.name)}</button>`).join('')}</div>
      <div class="map" aria-hidden="true">
        <svg viewBox="0 0 340 180" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
          <rect width="340" height="180" fill="color-mix(in srgb, var(--primary) 7%, var(--surface))"/>
          <path d="M0 95 C 80 80, 150 120, 340 90 L340 125 C 170 150, 80 110, 0 128 Z" fill="color-mix(in srgb, var(--speed-1) 22%, var(--surface))"/>
          <g stroke="var(--border)" stroke-width="1">${Array.from({ length: 9 }, (_, i) => `<line x1="${i * 42}" y1="0" x2="${i * 42 - 30}" y2="180"/>`).join('')}</g>
          <path d="${state.route.pick === 0 ? pathB : pathA}" stroke="var(--muted)" stroke-width="5" fill="none" stroke-linecap="round" opacity=".45"/>
          <path d="${state.route.pick === 0 ? pathA : pathB}" stroke="var(--primary)" stroke-width="6" fill="none" stroke-linecap="round"/>
          <circle cx="40" cy="150" r="9" fill="var(--primary)" stroke="#fff" stroke-width="3"/><circle cx="300" cy="30" r="8" fill="var(--danger)" stroke="#fff" stroke-width="3"/>
        </svg>
      </div>
      <div class="tiles two" style="margin:0 0 12px">
        <div class="tile"><p class="label" style="color:var(--primary)">Yakıt</p><span class="num" style="font-size:19px">${tl(pick.fuel)} ₺</span></div>
        <div class="tile"><p class="label toll">Gişe</p><span class="num toll" style="font-size:19px">${tl(pick.toll)} ₺</span></div>
      </div>
      <div class="routes">${calc.map((r, i) => `
        <button class="route ${state.route.pick === i ? 'on' : ''}" data-pick="${i}">
          <div class="tags">${i === cheapest ? '<span class="tag">★ Önerilen</span><span class="tag cheap">En Ucuz</span>' : '<span class="tag bal">Dengeli</span>'}</div>
          <p class="traffic">Trafik %${r.traffic}</p>
          <p class="num km">${nf1.format(r.km)}<span class="unit">km</span></p>
          <p class="sub">${Math.floor(r.min / 60) ? `${Math.floor(r.min / 60)} sa ` : ''}${r.min % 60} dk</p>
          <p class="road">${esc(r.road)}</p>
          <p class="sum">Toplam ${tl(r.total)} ₺</p>
          <p class="sub ${r.toll ? 'toll' : 'savings'}">${r.toll ? `Gişe ${tl(r.toll)} ₺` : 'Gişesiz'}</p>
        </button>`).join('')}</div>
      <button class="btn primary" style="margin-top:14px" data-action="choose-route">Rotayı Seç</button>
      <p class="hint">${esc(v.name)} (${esc(v.fuel)}, ${nf1.format(v.avg)} L/100km) için hesaplandı. Örnek rota verisi — gerçek uygulama güncel gişe ücretlerini ve trafiği kullanır.</p>`;
  }
  function menuSheet() {
    return `<div class="menu-list">
      <button class="menu-item" data-action="analysis"><span>▦</span><span>Analiz<small>Harcama, tüketim ve sürüş alışkanlıkları</small></span></button>
      <button class="menu-item" data-action="route"><span>⌕</span><span>Rota hesapla<small>Yakıt + gişe ile rota karşılaştırma</small></span></button>
      <button class="menu-item" data-action="reset"><span>↺</span><span>Demoyu sıfırla<small>Eklediğin demo sürüşlerini sil</small></span></button>
    </div>
    <section class="card" style="margin-top:8px"><p class="label">Bu bir web demosu</p><p style="margin-top:8px;font-size:14px;line-height:1.55;color:var(--text-2)">CarLog'un iOS uygulamasının örnek verilerle çalışan web kopyası. Otomatik sürüş algılama, CarPlay, canlı gişe matrisi ve güncel yakıt fiyatları gerçek uygulamada.</p></section>`;
  }

  // ── Etkileşim ─────────────────────────────────────────────────────────────
  const toastEl = document.querySelector('[data-toast]');
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2400);
  }

  function startLive() {
    state.live = { vehicleId: state.primary, dist: 0, speed: 0, target: 35, t: 0, samples: [], started: new Date() };
    state.live.timer = setInterval(tickLive, 250);
    render();
  }
  function stopLive() { if (state.live) clearInterval(state.live.timer); state.live = null; }
  function finishLive() {
    const L = state.live;
    if (L.dist < 0.3) { stopLive(); render(); toast('Çok kısa bir sürüş — kaydedilmedi.'); return; }
    const v = vehicleById(L.vehicleId);
    const trip = makeTrip({ label: 'Web demo sürüşü', km: L.dist, toll: 0, vehicle: v, date: new Date(), speeds: L.samples.length > 4 ? L.samples : undefined, auto: false });
    trip.avgSpeed = L.samples.length ? L.samples.reduce((a, b) => a + b, 0) / L.samples.length : 0;
    trip.maxSpeed = L.samples.length ? Math.max(...L.samples) : 0;
    trip.stops = L.samples.filter((s, i) => s < 3 && (L.samples[i - 1] || 10) >= 3).length;
    state.trips.unshift(trip); saveUserTrips();
    stopLive();
    state.tab = 'summary'; state.period = 'day'; state.offset = 0; state.vehicle = 'all';
    render();
    openSheet(trip.label, () => tripDetail(trip));
  }

  document.addEventListener('click', (e) => {
    const el = e.target.closest('button, [data-primary]');
    if (!el) return;
    const d = el.dataset;
    if (d.tab) { if (state.tab !== d.tab) { state.tab = d.tab; render(); screen.scrollTop = 0; } return; }
    if (d.period) { state.period = d.period; state.offset = 0; render(); return; }
    if (d.shift) { state.offset = Math.max(0, state.offset + Number(d.shift)); render(); return; }
    if (d.vehicle) { state.vehicle = d.vehicle; render(); return; }
    if (d.trip) { const t = state.trips.find((x) => x.id === d.trip); if (t) openSheet(t.label, () => tripDetail(t)); return; }
    if (d.liveVehicle) { if (state.live) state.live.vehicleId = d.liveVehicle; else state.primary = d.liveVehicle; render(); return; }
    if (d.primary) { state.primary = d.primary; render(); toast(`${vehicleById(d.primary).name} birincil araç yapıldı.`); return; }
    if (d.range) { state.analysisRange = d.range; refreshSheet(); return; }
    if (d.dest) { state.route = { dest: d.dest, pick: 0 }; refreshSheet(); return; }
    if (d.pick) { state.route.pick = Number(d.pick); refreshSheet(); return; }
    if ('close' in d) { closeSheet(); return; }
    switch (d.action) {
      case 'menu': openSheet('Menü', menuSheet); break;
      case 'analysis': openSheet('Analiz', analysis); break;
      case 'route': openSheet('Rota hesapla', routeSheet); break;
      case 'choose-route': toast('Gerçek uygulamada bu rota için navigasyon başlar.'); break;
      case 'add-vehicle': toast('Web demosunda araç ekleme kapalı — gerçek uygulamada araç kataloğundan seçilir.'); break;
      case 'start': startLive(); break;
      case 'finish': finishLive(); break;
      case 'cancel': stopLive(); render(); toast('Sürüş iptal edildi, kaydedilmedi.'); break;
      case 'reset':
        state.trips = state.trips.filter((t) => t.auto); saveUserTrips(); closeSheet(); render(); toast('Demo sıfırlandı.'); break;
      default: break;
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && wrap.classList.contains('open')) closeSheet();
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-primary]')) { e.preventDefault(); e.target.click(); }
  });
  wrap.addEventListener('click', (e) => { if (e.target === wrap) closeSheet(); });

  // Çerçeve içinde (sitedeki telefon maketi) sahte durum çubuğu gösterilir;
  // telefonda tam ekran açıldığında gerçek durum çubuğu zaten var.
  if (window.self !== window.top) document.body.classList.add('framed');
  const clock = document.querySelector('[data-clock]');
  const tickClock = () => { const n = new Date(); clock.textContent = `${pad(n.getHours())}:${pad(n.getMinutes())}`; };
  tickClock(); setInterval(tickClock, 30000);

  render();
})();
