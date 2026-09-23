// CarLog web demosu — Özet sekmesi, yolculuk kartı ve Yolculuk Özeti sayfası.
// Her fonksiyon SwiftUI'deki aynı adlı görünümün karşılığıdır (TripHistoryView,
// DashboardCards, ComparisonCard, TripDetailView).
(() => {
  'use strict';
  const { F, D, VEHICLES, vehicleById, PUMP } = CL;
  const I = CLIcon;
  const V = (CL.V = {});

  // ── Ortak parçalar ──────────────────────────────────────────────────────
  V.splitBar = (fuel, toll, h = 8) => {
    const total = Math.max(fuel + toll, 0.0001);
    return `<div class="split" style="--h:${h}px"><i class="f" style="width:${(fuel / total) * 100}%"></i><i class="t" style="flex:1"></i></div>`;
  };
  V.legend = (items) => `<div class="legend">${items.map(([cls, t]) => `<span class="${cls}">${t}</span>`).join('')}</div>`;
  V.metric = (label, value, unit, tint = 'var(--text)', icon = '') => `
    <div class="tile"><div class="metric">
      <div class="h">${icon ? I(icon, 11, '', `color:${tint}`) : ''}<span class="lbl">${F.esc(F.upperTR(label))}</span></div>
      <div class="v"><b style="color:${tint}">${value}</b>${unit ? `<small>${unit}</small>` : ''}</div>
    </div></div>`;
  V.sectionHeader = (t) => `<div class="section-h">${t}</div>`;

  // Swift Charts'ın "desiredCount: 3" eksen mantığı: 3'e en yakın sayıda kademe.
  V.niceTicks = (max, desired = 3) => {
    if (!(max > 0)) return { step: 1, top: 1, ticks: [0, 1] };
    let best = null;
    [1, 2, 2.5, 5].forEach((m) => {
      for (let e = -1; e <= 7; e++) {
        const step = m * 10 ** e;
        const top = Math.ceil(max / step) * step;
        const count = Math.round(top / step) + 1;
        const score = Math.abs(count - desired) + (count < 2 ? 5 : 0);
        if (!best || score < best.score || (score === best.score && step > best.step)) best = { step, top, count, score };
      }
    });
    return { step: best.step, top: best.top, ticks: Array.from({ length: best.count }, (_, i) => i * best.step) };
  };
  V.compact = (v) => (v >= 1000 ? `${Math.floor(v / 1000)}b` : `${Math.floor(v)}`);

  // ── Dönem gezgini (PeriodNavigator) ─────────────────────────────────────
  const PERIOD_TITLES = { day: 'Gün', week: 'Hafta', month: 'Ay' };
  function navLabel(S) {
    const { period, anchor } = S;
    if (period === 'day') {
      if (D.isToday(anchor)) return 'Bugün';
      if (D.isYesterday(anchor)) return 'Dün';
      return anchor.getFullYear() === new Date().getFullYear()
        ? `${anchor.getDate()} ${F.MONTHS_LONG[anchor.getMonth()]} ${F.DAYS_LONG[anchor.getDay()]}`
        : `${anchor.getDate()} ${F.MONTHS_LONG[anchor.getMonth()]} ${anchor.getFullYear()}`;
    }
    if (period === 'week') {
      if (D.sameGranularity(anchor, new Date(), 'week')) return 'Bu hafta';
      const [s, e] = D.interval('week', anchor);
      return `${F.dayShort(s)} – ${F.dayShort(D.addDays(e, -1))}`;
    }
    return `${F.MONTHS_LONG[anchor.getMonth()]} ${anchor.getFullYear()}`;
  }
  V.navigator = (S) => {
    const isCurrent = D.sameGranularity(S.anchor, new Date(), S.period);
    const canFwd = D.step(S.period, S.anchor, 1) <= new Date();
    return `<div class="mx stack" style="gap:12px">
      <div class="pills">
        ${Object.entries(PERIOD_TITLES).map(([k, t]) => `<button class="pill ${S.period === k ? 'on' : ''}" data-act="period" data-v="${k}">${t}</button>`).join('')}
        <span style="flex:1"></span>
        ${isCurrent ? '' : `<button class="sg primary" style="font-size:12px" data-act="today">Bugün</button>`}
      </div>
      <div class="date-row">
        <button class="arrow-btn" data-act="step" data-v="-1" aria-label="Önceki">${I('chevL', 13)}</button>
        <button class="mid" data-act="datepick"><span class="tp">${navLabel(S)}</span>${I('calendar', 12, 'm')}</button>
        <button class="arrow-btn" data-act="step" data-v="1" ${canFwd ? '' : 'disabled'} aria-label="Sonraki">${I('chevR', 13)}</button>
      </div></div>`;
  };

  // ── Özet kartı (summaryCard) ────────────────────────────────────────────
  function periodLabel(S) {
    const { period, anchor } = S;
    if (period === 'day') {
      if (D.isToday(anchor)) return 'BUGÜN';
      if (D.isYesterday(anchor)) return 'DÜN';
      return F.upperTR(`${anchor.getDate()} ${F.MONTHS_LONG[anchor.getMonth()]}`);
    }
    if (period === 'week') return D.sameGranularity(anchor, new Date(), 'week') ? 'BU HAFTA' : 'SEÇİLİ HAFTA';
    return F.upperTR(`${F.MONTHS_LONG[anchor.getMonth()]} ${anchor.getFullYear()}`);
  }
  V.summaryCard = (S, cur, allFiltered) => {
    const spent = CL.sum(cur, CL.billable); const km = CL.sum(cur, (t) => t.distanceKm);
    const toll = CL.sum(cur, (t) => t.tollCost); const fuel = Math.max(spent - toll, 0);
    const allTime = CL.sum(allFiltered, CL.billable);
    return `<div class="card mx stack" style="--p:20px;gap:16px">
      <div class="stack" style="gap:4px">
        <div class="lbl k8">TOPLAM GİDER · ${periodLabel(S)}</div>
        <div style="display:flex;align-items:baseline;gap:4px"><span class="sgb tp" style="font-size:38px;line-height:44px">${F.dec(spent)}</span><span class="sgb cur" style="font-size:20px">₺</span></div>
      </div>
      ${spent > 0 ? `<div class="stack" style="gap:8px">${V.splitBar(fuel, toll)}${toll > 0 ? V.legend([['', `Yakıt ${F.dec(fuel)} ₺`], ['t', `Gişe ${F.dec(toll)} ₺`]]) : ''}</div>` : ''}
      <div class="row2">
        ${V.metric('Mesafe', F.dec(km), 'km', 'var(--text)', 'location')}
        ${V.metric('Gişe', F.dec(toll), '₺', 'var(--toll)', 'roadLanes')}
        ${V.metric('Sefer', String(cur.length), '', 'var(--text)', 'car')}
      </div>
      ${allFiltered.length > cur.length ? `<hr class="div"><div style="display:flex;align-items:center;gap:6px" class="m">${I('infinity', 11)}<span class="c2">Tüm zamanlar: ${F.dec(allTime)} ₺ · ${allFiltered.length} yolculuk</span></div>` : ''}
    </div>`;
  };

  // ── Harcama seyri (SpendingTrendCard) ───────────────────────────────────
  const PREV = { day: 'Düne', week: 'Geçen Haftaya', month: 'Geçen Aya' };
  V.trendCard = (S, allFiltered) => {
    const n = { day: 14, week: 8, month: 6 }[S.period];
    const buckets = [];
    for (let off = n - 1; off >= 0; off--) {
      const date = D.step(S.period, S.anchor, -off);
      const [s, e] = D.interval(S.period, date);
      const inB = allFiltered.filter((t) => t.date >= s && t.date < e && !t.wasPassenger);
      const toll = CL.sum(inB, (t) => t.tollCost); const total = CL.sum(inB, (t) => t.totalCost);
      const label = S.period === 'day' ? String(date.getDate())
        : S.period === 'week' ? F.dayShort(D.interval('week', date)[0]) : F.MONTHS[date.getMonth()];
      buckets.push({ label, fuel: Math.max(total - toll, 0), toll, total, cur: off === 0 });
    }
    const active = buckets.filter((b) => b.total > 0);
    if (!active.length) {
      return `<div class="card mx" style="--p:18px"><p class="c1 t2" style="padding:24px 0">Bu dönemde kayıtlı yolculuk yok. Araca binip yola çıktığında burada birikmeye başlar.</p></div>`;
    }
    const avg = active.reduce((a, b) => a + b.total, 0) / active.length;
    let change = '';
    if (buckets.length >= 2) {
      const cur = buckets[buckets.length - 1].total; const prev = buckets[buckets.length - 2].total;
      if (prev > 0) {
        const diff = cur - prev; const pct = Math.abs(diff) / prev * 100;
        let text; let good;
        if (pct < 1) { text = `${PREV[S.period]} göre aynı`; good = true; } else { text = `${PREV[S.period]} göre %${Math.round(pct)} ${diff > 0 ? 'fazla' : 'az'}`; good = diff <= 0; }
        change = `<div style="display:flex;align-items:center;gap:4px;color:var(${good ? '--savings' : '--toll'})">${I(good ? 'arrowDR' : 'arrowUR', 9)}<span class="c2 w6">${text}</span></div>`;
      }
    }
    const W = S.W - 32 - 36; const H = 140; const L = 16; const T = 6; const B = 16;
    const max = Math.max(...buckets.map((b) => b.total));
    const { top, ticks } = V.niceTicks(max);
    const y = (v) => T + (H - T - B - 10) * (1 - v / top);
    const cw = (W - L) / buckets.length;
    let svg = `<svg class="chart" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Harcama seyri">`;
    ticks.forEach((t) => { svg += `<line x1="${L}" x2="${W}" y1="${y(t)}" y2="${y(t)}" stroke="var(--border60)"/><text x="0" y="${y(t) + 3}">${V.compact(t)}</text>`; });
    buckets.forEach((b, i) => {
      const x = L + i * cw + cw * 0.15; const w = cw * 0.7; const op = b.cur ? 1 : 0.5;
      if (b.fuel > 0) svg += `<rect x="${x}" y="${y(b.fuel)}" width="${w}" height="${Math.max(0, y(0) - y(b.fuel))}" rx="4" fill="var(--primary)" opacity="${op}"/>`;
      if (b.toll > 0) svg += `<rect x="${x}" y="${y(b.total)}" width="${w}" height="${Math.max(0, y(b.fuel) - y(b.total)) + 4}" rx="4" fill="var(--toll)" opacity="${op}"/>`;
    });
    if (avg > 0) svg += `<line x1="${L}" x2="${W}" y1="${y(avg)}" y2="${y(avg)}" stroke="var(--muted)" stroke-opacity=".5" stroke-dasharray="4 3"/><text x="${L}" y="${y(avg) - 5}">ort. ${F.dec(avg)} ₺</text>`;
    // Eksen etiketleri: 8'den fazlaysa atlayarak, ilk/son her zaman.
    let picked = buckets.map((b, i) => i);
    if (picked.length > 8) { const step = Math.ceil(picked.length / 8); picked = picked.filter((i) => i % step === 0); if (picked[picked.length - 1] !== buckets.length - 1) picked.push(buckets.length - 1); }
    picked.forEach((i) => { svg += `<text x="${L + i * cw + cw / 2}" y="${H - 3}" text-anchor="middle">${buckets[i].label}</text>`; });
    svg += '</svg>';
    return `<div class="card mx stack" style="--p:18px;gap:14px">
      <div style="display:flex;align-items:baseline;gap:8px"><span class="lbl k0">${F.upperTR(`Son ${n} ${{ day: 'gün', week: 'hafta', month: 'ay' }[S.period]}`)}</span><span style="flex:1"></span>${change}</div>
      ${svg}${V.legend([['', 'Yakıt'], ['t', 'Gişe']])}</div>`;
  };

  // ── Araç şeritleri, yolculuk listesi ────────────────────────────────────
  V.vehicleChips = (S) => {
    const counts = {}; S.trips.forEach((t) => { counts[t.vehicleName] = (counts[t.vehicleName] || 0) + 1; });
    const names = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    if (names.length < 2) return '';
    const chip = (name, label) => `<button class="pill ${S.filterVehicle === name ? 'on' : ''}" data-act="filterVehicle" data-v="${F.esc(name || '')}">${F.esc(label)}</button>`;
    return `<div class="chips">${chip(null, 'Tüm Araçlar')}${names.map((n) => chip(n, n)).join('')}</div>`;
  };

  V.tripCard = (t) => {
    const fuel = Math.max(t.totalCost - t.tollCost, 0);
    let acc;
    if (t.actualCost != null) {
      const pct = Math.abs(t.actualCost - t.totalCost) / Math.max(t.totalCost, 1) * 100;
      const close = pct < 10;
      acc = `<div class="acc-row" style="color:var(${close ? '--savings' : '--toll'})">${I(close ? 'check' : 'warn', 11)}<span class="w6">Gerçek: ${F.dec(t.actualCost)} ₺ · %${Math.max(0, 100 - pct).toFixed(0)} isabetli</span><span style="flex:1"></span>${I('pencil', 10)}</div>`;
    } else acc = `<div class="acc-row">${I('plusCircleFill', 11)}<span>Gerçek maliyeti gir</span></div>`;
    return `<div class="card trip-card" data-act="trip" data-v="${F.esc(t.id)}" role="button" tabindex="0">
      <div class="hd"><div class="name tp">${F.esc(t.label || t.vehicleName)}</div><div class="amt"><b>${F.dec(t.totalCost)}</b><i>₺</i></div></div>
      <div class="c1 m ell">${F.mediumDateTime(t.date)} • ${F.fix(t.distanceKm, 0)} km • ${F.esc(t.vehicleName)}</div>
      ${t.tollCost > 0 ? `<div class="cost-strip"><div class="half"><span class="dot7" style="background:var(--primary)"></span>Yakıt <b style="color:var(--primary)">${F.dec(fuel)} ₺</b></div><div class="sep"></div><div class="half"><span class="dot7" style="background:var(--toll)"></span>Gişe <b style="color:var(--toll)">${F.dec(t.tollCost)} ₺</b></div></div>` : ''}
      <button class="stack" style="align-items:stretch" data-act="actual" data-v="${F.esc(t.id)}">${acc}</button>
    </div>`;
  };

  V.tripsList = (S, cur) => {
    const groups = CL.groupByDayAndPeriod(cur, S.period !== 'day');
    const emptyText = { day: 'Bu gün kayıtlı yolculuk yok.', week: 'Bu hafta kayıtlı yolculuk yok.', month: 'Bu ay kayıtlı yolculuk yok.' }[S.period];
    return `<div class="stack" style="gap:16px">
      <div class="section-h" style="padding-left:20px">Yolculuklar</div>
      ${groups.length ? '' : `<p class="sub m" style="text-align:center;padding:24px 0">${emptyText}</p>`}
      ${groups.map((g) => `<div class="stack" style="gap:10px">
        <div style="display:flex;align-items:center;gap:6px;padding-inline:16px" class="m">${I(g.icon, 11)}<span class="lbl k6">${F.esc(g.title)}</span><span style="flex:1"></span><span class="sgb t2" style="font-size:12px">${F.dec(g.totalCost)} ₺</span></div>
        ${g.trips.map((t) => `<div class="mx">${V.tripCard(t)}</div>`).join('')}
      </div>`).join('')}
    </div>`;
  };

  // ── "Bu parayla / bu mesafeyle" (SpendingComparisonCard) ────────────────
  const fmt = (v) => (v >= 10 ? v.toFixed(0) : v.toFixed(1).replace('.', ','));
  V.comparisonCard = (cur) => {
    const veh = VEHICLES[0]; const price = PUMP.gasoline;
    const paid = cur.filter((t) => !t.wasPassenger);
    const spent = CL.sum(paid, (t) => t.totalCost); const km = CL.sum(cur, (t) => t.distanceKm); const toll = CL.sum(paid, (t) => t.tollCost);
    const money = []; const dist = [];
    const tanks = spent / (veh.tank * price);
    if (spent > 0 && tanks >= 0.5) money.push(['fuel', 'var(--primary)', tanks >= 1 ? `${fmt(tanks)} depo ${veh.fuel.toLowerCase()}` : 'Yarım depodan biraz fazla']);
    const times = spent / ((450 * veh.avg / 100) * price);
    if (spent > 0 && times >= 0.5) money.push(['roadLanes', 'var(--primary)', `${fmt(times)} kez İstanbul–Ankara gidebilirdin`]);
    if (toll > 0 && spent / price >= 5) money.push(['fuel', 'var(--primary)', `Bugünkü fiyatla ${fmt(spent / price)} litre yakıt`]);
    if (toll > 0 && spent > 0) money.push(['roadLanes', 'var(--toll)', `Her 100 ₺'nin ${Math.round(toll / spent * 100)} ₺'si gişeye gitti`]);
    if (km >= 50 && km / 1600 >= 0.25) { const laps = km / 1600; dist.push(['mapFill', 'var(--text-2)', laps >= 1 ? `${fmt(laps)} kez Edirne'den Kars'a` : `Edirne–Kars yolunun %${Math.round(laps * 100)} kadarı`]); }
    if (!money.length && !dist.length) return '';
    const sec = (title, items) => `<div class="stack" style="gap:12px"><div class="lbl k8">${title}</div>${items.map(([ic, col, txt]) => `<div class="cmp-row"><span class="ico" style="color:${col}">${I(ic, 13)}</span><span class="tp">${F.esc(txt)}</span></div>`).join('')}</div>`;
    return `<div class="card mx stack" style="--p:18px;gap:14px">${money.length ? sec('BU PARAYLA', money) : ''}${money.length && dist.length ? '<hr class="div">' : ''}${dist.length ? sec('BU MESAFEYLE', dist) : ''}</div>`;
  };

  // ── Araçlara göre (VehicleBreakdownCard) ────────────────────────────────
  V.breakdownCard = (cur) => {
    const groups = {};
    cur.filter((t) => !t.wasPassenger).forEach((t) => { (groups[t.vehicleName] = groups[t.vehicleName] || []).push(t); });
    const shares = Object.entries(groups).map(([name, list]) => ({ name, total: CL.sum(list, (t) => t.totalCost), km: CL.sum(list, (t) => t.distanceKm), n: list.length }))
      .filter((s) => s.total > 0).sort((a, b) => b.total - a.total);
    if (shares.length < 2) return '';
    const grand = CL.sum(shares, (s) => s.total);
    return `<div class="card mx stack" style="--p:18px;gap:14px"><div class="lbl k8">ARAÇLARA GÖRE</div>
      ${shares.map((s) => `<div class="stack" style="gap:5px">
        <div style="display:flex;gap:8px"><span class="sg tp ell" style="font-size:14px;line-height:19px">${F.esc(s.name)}</span><span style="flex:1"></span><span class="sgb tp" style="font-size:14px">${F.dec(s.total)} ₺</span></div>
        <div style="height:7px;border-radius:99px;background:var(--border35);overflow:hidden"><div style="height:100%;width:${Math.max(1.1, s.total / grand * 100)}%;background:var(--primary);border-radius:99px"></div></div>
        <div class="c2 m" style="display:flex;gap:10px"><span>${s.n} yolculuk</span><span>·</span><span>${F.dec(s.km)} km</span>${s.km > 0 ? `<span>·</span><span class="w6">${(s.total / s.km).toFixed(2)} ₺/km</span>` : ''}</div>
      </div>`).join('')}</div>`;
  };

  // ── Özet sekmesi ────────────────────────────────────────────────────────
  V.ozet = (S) => {
    const fold = (x) => x.replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase().replace(/ı/g, 'i').normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
    const needle = fold(S.searchText || '');
    const vf = S.trips.filter((t) => (!needle || fold(t.label).includes(needle) || fold(t.vehicleName).includes(needle)) && (!S.filterVehicle || t.vehicleName === S.filterVehicle));
    const [s, e] = D.interval(S.period, S.anchor);
    const cur = vf.filter((t) => t.date >= s && t.date < e);
    return `<div class="stack gap24" style="padding-bottom:8px">
      ${S.searching ? `<div class="mx" style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:var(--sunken);border-radius:999px">${I('search', 13, 'm')}<input data-role="search" value="${F.esc(S.searchText || '')}" placeholder="Rota veya araç ara..." style="flex:1;border:0;background:none;outline:none;font-size:15px"></div>` : ''}
      ${V.navigator(S)}${V.summaryCard(S, cur, vf)}${V.trendCard(S, vf)}${V.vehicleChips(S)}${V.tripsList(S, cur)}${V.comparisonCard(cur)}${V.breakdownCard(cur)}
    </div>`;
  };

  // ── Yolculuk Özeti (TripDetailView) ─────────────────────────────────────
  const BANDS = [[0, 20], [20, 40], [40, 60], [60, 80], [80, 100], [100, 120], [120, 999]];
  const speedColor = (k) => (k < 20 ? 'var(--speed-0)' : k < 50 ? 'var(--speed-1)' : k < 90 ? 'var(--speed-2)' : k < 120 ? 'var(--speed-3)' : 'var(--speed-4)');
  V.speedColor = speedColor;
  const durText = (sec) => {
    const m = Math.round(sec / 60);
    if (m < 1) return `${Math.round(sec)} sn`;
    if (m < 60) return `${m} dakika`;
    return m % 60 === 0 ? `${m / 60} saat` : `${Math.floor(m / 60)} sa ${m % 60} dk`;
  };

  // Rota haritası: uygulamada Apple Haritalar; burada örnek sokak dokusu üstünde
  // hıza göre renkli güzergâh (aynı bilgi, çizim örnek).
  V.routeMap = (t, height = 200) => {
    const pts = CL.routePoints(t); const rand = CL.rng(t.seed + 7);
    let bg = '';
    for (let i = 0; i < 11; i++) bg += `<path d="M${-20 + rand() * 60} ${rand() * 200} C ${100 + rand() * 60} ${rand() * 200}, ${200 + rand() * 60} ${rand() * 200}, ${360} ${rand() * 200}" stroke="#fff" stroke-width="${1.2 + rand() * 2.2}" fill="none" opacity=".95"/>`;
    for (let i = 0; i < 7; i++) bg += `<path d="M${rand() * 340} -10 C ${rand() * 340} 60, ${rand() * 340} 120, ${rand() * 340} 210" stroke="#fff" stroke-width="${1 + rand() * 2}" fill="none" opacity=".9"/>`;
    const seg = []; const n = pts.length;
    for (let i = 0; i < n - 1; i++) {
      const sp = t.speeds[Math.floor(i / (n - 1) * (t.speeds.length - 1))] || 0;
      seg.push(`<path d="M${pts[i][0]} ${pts[i][1]} L${pts[i + 1][0]} ${pts[i + 1][1]}" stroke="${speedColor(sp)}" stroke-width="5" stroke-linecap="round" fill="none"/>`);
    }
    const end = pts[n - 1];
    return `<div class="map" style="height:${height}px"><svg viewBox="0 0 340 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="340" height="200" fill="#EEF0F2"/>
      <path d="M0 150 C 60 130, 110 175, 200 160 S 300 150, 340 168 L340 200 L0 200 Z" fill="#B9DDF3"/>
      <path d="M20 118 C 50 108, 70 118, 96 112 L112 128 C 80 138, 46 134, 20 130 Z" fill="#CFE8C8"/>
      ${bg}<g>${seg.join('')}</g>
      <circle cx="${end[0]}" cy="${end[1]}" r="6.500" fill="var(--toll)" stroke="#fff" stroke-width="2.500"/>
      <text x="${end[0] + 10}" y="${end[1] + 4}" font-size="10" font-weight="600" fill="#1c1c1e" font-family="-apple-system, Inter, sans-serif">Varış</text></svg>
      <div class="map-chip">${I('arrowUR', 10)} İncele</div></div>`;
  };

  V.tripDetail = (t, S) => {
    const st = t.speeds; const n = st.length; const secs = n * t.interval; const mins = secs / 60;
    const bands = BANDS.map(([lo, hi]) => { const c = st.filter((v) => Math.floor(v) >= lo && (hi >= 999 || Math.floor(v) < hi)).length; return c ? { lo, hi, label: hi >= 999 ? `${lo}+` : `${lo}–${hi}`, sec: c * t.interval } : null; }).filter(Boolean);
    const dominant = bands.filter((b) => b.lo >= 20).sort((a, b) => b.sec - a.sec)[0];
    const durVal = mins < 60 ? String(Math.round(mins)) : (mins / 60).toFixed(1); const durUnit = mins < 60 ? 'dk' : 'sa';
    const fuel = Math.max(t.totalCost - t.tollCost, 0);
    const veh = vehicleById(t.vehicleId);
    const col = (icon, label, value, unit, tint) => `<div class="mcol"><div class="h">${I(icon, 9)}<span class="lbl">${label}</span></div><div class="v"><b style="color:${tint}">${value}</b><span class="c2 m">${unit}</span></div></div>`;
    const sep = '<div style="width:1px;height:34px;background:var(--border)"></div>';

    // Hız grafiği: alan + monoton çizgi, en yüksek hız kesikli çizgisi.
    const W = S.W - 32 - 32; const H = 170; const L = 0; const R = 34; const T0 = 26; const B = 32;
    const maxX = (n - 1) * t.interval / 60 || 1; const yMax = V.niceTicks(Math.max(t.maxSpeed, 10), 4).top;
    const xs = (i) => L + (W - L - R) * ((i * t.interval / 60) / maxX);
    const ys = (v) => T0 + (H - T0 - B) * (1 - v / yMax);
    const pts = st.map((v, i) => [xs(i), ys(v)]);
    const path = (() => { // monoton kübik
      if (pts.length < 3) return pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join('');
      const dx = []; const m = []; const tng = [];
      for (let i = 0; i < pts.length - 1; i++) { dx.push(pts[i + 1][0] - pts[i][0]); m.push((pts[i + 1][1] - pts[i][1]) / (dx[i] || 1)); }
      tng.push(m[0]);
      for (let i = 1; i < pts.length - 1; i++) tng.push(m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2);
      tng.push(m[m.length - 1]);
      let d = `M${pts[0][0]} ${pts[0][1]}`;
      for (let i = 0; i < pts.length - 1; i++) { const h = dx[i]; d += ` C${pts[i][0] + h / 3} ${pts[i][1] + tng[i] * h / 3} ${pts[i + 1][0] - h / 3} ${pts[i + 1][1] - tng[i + 1] * h / 3} ${pts[i + 1][0]} ${pts[i + 1][1]}`; }
      return d;
    })();
    const xt = Math.max(1, Math.round(maxX / 3 / 5) * 5) || 1;
    let g = '';
    for (let x = 0; x <= maxX; x += xt) g += `<line x1="${xs(x * 60 / t.interval)}" x2="${xs(x * 60 / t.interval)}" y1="${T0}" y2="${H - B}" stroke="var(--border)" stroke-dasharray="3 3"/><text x="${xs(x * 60 / t.interval) + 2}" y="${H - B + 14}" class="a">${x}</text>`;
    const yTicks = V.niceTicks(yMax, 4).ticks;
    yTicks.forEach((v) => { g += `<line x1="${L}" x2="${W - R}" y1="${ys(v)}" y2="${ys(v)}" stroke="var(--border)"/><text x="${W - R + 6}" y="${ys(v) + 4}" text-anchor="start">${v}</text>`; });
    const chart = `<svg class="chart big" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
      <text x="${W}" y="12" text-anchor="end">km/s</text>${g}
      <path d="${path} L${pts[pts.length - 1][0]} ${ys(0)} L${pts[0][0]} ${ys(0)} Z" fill="var(--primary)" opacity=".18"/>
      <path d="${path}" stroke="var(--primary)" stroke-width="2" fill="none" stroke-linejoin="round"/>
      <line x1="${L}" x2="${W - R}" y1="${ys(t.maxSpeed)}" y2="${ys(t.maxSpeed)}" stroke="var(--toll)" stroke-opacity=".6" stroke-dasharray="4 3"/>
      <text x="${W - R}" y="${ys(t.maxSpeed) - 5}" text-anchor="end" style="fill:var(--toll)">en yüksek ${Math.round(t.maxSpeed)}</text>
      <text x="${W - R}" y="${H - 4}" text-anchor="end">dakika</text></svg>`;

    return `<div class="stack" style="gap:18px;padding-inline:16px">
      <div class="card stack" style="--p:18px;gap:14px">
        <div><div class="sg tp" style="font-size:19px;line-height:24px">${F.fullDate(t.date)}</div><div class="sub m">${t.label ? `${F.esc(t.label)} · ` : ''}ort. ${Math.round(t.avgSpeed)} km/s${t.wasAuto ? '' : ''}</div></div>
        <div style="display:flex">${col('arrowLR', 'MESAFE', F.fix(t.distanceKm, 1), 'km', 'var(--text)')}${sep}${col('clock', 'SÜRE', durVal, durUnit, 'var(--text)')}${sep}${col('gauge', 'EN YÜKSEK', String(Math.round(t.maxSpeed)), 'km/s', speedColor(t.maxSpeed))}</div>
      </div>
      <div data-act="fullmap" style="cursor:pointer" class="frame">${V.routeMap(t)}</div>
      <div class="stack" style="gap:10px"><div style="display:flex;gap:10px">
        <div class="attr-tile">${I('car', 13, 'm')}<div style="min-width:0;flex:1"><div class="lbl" style="font-size:9px;line-height:11px;letter-spacing:.5px">ARAÇ</div><div class="sg tp ell" style="font-size:14px;line-height:18px">${F.esc(t.vehicleName)}</div></div>${I('chevD', 10, 'm')}</div>
        <div class="attr-tile">${I('steering', 13, 'm')}<div style="min-width:0;flex:1"><div class="lbl" style="font-size:9px;line-height:11px;letter-spacing:.5px">ROL</div><div class="sg tp ell" style="font-size:14px;line-height:18px">${t.wasPassenger ? 'Yolcu' : 'Sürücü'}</div></div>${I('chevD', 10, 'm')}</div>
      </div></div>
      <div class="card stack" style="--p:18px;gap:14px">
        <div class="lbl k8">MALİYET</div>
        <div style="display:flex;align-items:baseline;gap:4px"><span class="sgb tp" style="font-size:32px;line-height:38px">${F.dec(t.totalCost)}</span><span class="sgb cur" style="font-size:18px">₺</span></div>
        ${t.totalCost > 0 ? `${V.splitBar(fuel, t.tollCost)}${V.legend([['', `Yakıt ${F.dec(fuel)} ₺`], ...(t.tollCost > 0 ? [['t', `Gişe ${F.dec(t.tollCost)} ₺`]] : [])])}` : ''}
        ${t.liters > 0 ? `<hr class="div"><div style="display:flex;align-items:center"><span class="c1 t2" style="display:inline-flex;gap:8px;align-items:center">${I('fuel', 12)} Tüketim</span><span style="flex:1"></span><span class="sgb tp" style="font-size:13px">${F.fix(t.liters, 1)} L · ${F.fix(t.rate, 1)} L/100km</span></div>` : ''}
      </div>
      ${dominant ? `<div class="callout" style="background:color-mix(in srgb,var(--primary) 8%,transparent)"><span class="primary">${I('sparkles', 14)}</span><div class="stack" style="gap:3px"><div class="sub w6 tp">En çok ${dominant.label} km/s aralığında gittin — toplam ${durText(dominant.sec)}.</div><div class="c1 t2">En yüksek hız ${Math.round(t.maxSpeed)} km/s.</div></div></div>` : ''}
      <div class="card stack" style="--p:16px;gap:10px"><div style="display:flex"><span class="lbl k6">HIZ — YOLCULUK BOYUNCA</span><span style="flex:1"></span><span class="c2 m">${Math.round(mins)} dk</span></div>${chart}</div>
      <div class="card stack" style="--p:16px;gap:12px"><div style="display:flex"><span class="lbl k6">HANGİ HIZDA NE KADAR</span><span style="flex:1"></span><span class="c2 m">${Math.round(mins)} dk</span></div>
        <div style="display:flex;gap:2px;height:10px">${bands.map((b) => `<div style="flex:${Math.max(b.sec / secs, 0.03)};background:${speedColor(b.lo)};border-radius:99px"></div>`).join('')}</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px 12px">${bands.map((b) => `<span style="display:inline-flex;align-items:center;gap:5px"><span class="dot7" style="background:${speedColor(b.lo)}"></span><span class="c2 m">${b.label}</span><span class="sgb tp" style="font-size:12px">%${Math.round(b.sec / secs * 100)}</span></span>`).join('')}</div>
        <div class="c2 m">km/s</div></div>
      ${(t.stops > 0 || t.avgSpeed > 0) ? `<div class="card stack" style="--p:16px;gap:10px"><div class="lbl k6">SÜRÜŞ</div>
        ${t.stops > 0 ? `<div style="display:flex;align-items:center;gap:10px"><span class="m" style="width:18px;display:grid;place-items:center">${I('hand', 12)}</span><span class="c1 t2">Dur-kalk sayısı</span><span style="flex:1"></span><span class="sgb tp" style="font-size:13px">${t.stops} kez</span></div>` : ''}
        ${t.highShare > 0 ? `<div style="display:flex;align-items:center;gap:10px"><span class="m" style="width:18px;display:grid;place-items:center">${I('gauge', 12)}</span><span class="c1 t2">100 km/s üzeri</span><span style="flex:1"></span><span class="sgb tp" style="font-size:13px">%${Math.round(t.highShare * 100)}</span></div>` : ''}
        ${t.highwayShare > 0 ? `<div style="display:flex;align-items:center;gap:10px"><span class="m" style="width:18px;display:grid;place-items:center">${I('roadLanes', 12)}</span><span class="c1 t2">Otoyol payı</span><span style="flex:1"></span><span class="sgb tp" style="font-size:13px">%${Math.round(t.highwayShare * 100)}</span></div>` : ''}
        ${t.actualCost != null ? `<div style="display:flex;align-items:center;gap:10px"><span class="m" style="width:18px;display:grid;place-items:center">${I('check', 12)}</span><span class="c1 t2">Gerçek maliyet</span><span style="flex:1"></span><span class="sgb tp" style="font-size:13px">${F.dec(t.actualCost)} ₺ (${t.actualCost - t.totalCost >= 0 ? '+' : ''}${F.dec(t.actualCost - t.totalCost)})</span></div>` : ''}
      </div>` : ''}
    </div>`;
  };
})();
