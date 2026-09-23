// CarLog web demosu — Analiz, Yolculuklar, Menü ve Garajım
// (AnalysisView, TripsView, SideMenuView, GarageView'ın karşılığı).
(() => {
  'use strict';
  const { F, D, VEHICLES, vehicleById, PUMP, V } = CL;
  const I = CLIcon;

  const RANGES = [['30', '30 gün'], ['90', '90 gün'], ['year', 'Bu yıl'], ['all', 'Tümü']];
  const rangeSeg = (cur) => `<div class="seg">${RANGES.map(([k, t]) => `<button class="${cur === k ? 'on' : ''}" data-act="range" data-v="${k}">${t}</button>`).join('')}</div>`;
  const windowStart = (r) => {
    const now = new Date();
    if (r === '30') return D.addDays(D.startOfDay(now), -30);
    if (r === '90') return D.addDays(D.startOfDay(now), -90);
    if (r === 'year') return new Date(now.getFullYear(), 0, 1);
    return null;
  };
  const scoped = (S, r) => { const s = windowStart(r); return s ? S.trips.filter((t) => t.date >= s) : S.trips; };
  const stat = (v, l) => `<div class="stack" style="flex:1;gap:3px"><span class="sgb tp" style="font-size:17px;line-height:22px">${v}</span><span class="c2 m">${l}</span></div>`;

  // ── Analiz ──────────────────────────────────────────────────────────────
  V.analysis = (S) => {
    const r = S.analysisRange; const trips = scoped(S, r); const tt = CL.totals(trips);
    if (!trips.length) return `<div class="stack" style="align-items:center;gap:14px;padding:80px 40px;text-align:center"><span class="m" style="opacity:.5">${I('chartBars', 40)}</span><div class="sg tp" style="font-size:18px">Bu dönemde yolculuk yok</div><p class="sub t2">Yolculuk kaydedildikçe harcama, tüketim ve sürüş alışkanlıkların burada çıkar.</p><div style="width:100%;padding-inline:0">${rangeSeg(r)}</div></div>`;
    // changeBadge — yalnızca 30/90 günde önceki eşit dönem varsa.
    let badge = '';
    const days = r === '30' ? 30 : r === '90' ? 90 : null;
    if (days) {
      const start = windowStart(r); const prevStart = D.addDays(start, -days);
      const prev = S.trips.filter((t) => t.date >= prevStart && t.date < start); const ps = CL.totals(prev).spend;
      if (ps > 0) {
        const ch = (tt.spend - ps) / ps * 100; const rising = ch > 0; const col = rising ? '--danger' : '--savings';
        badge = `<span style="display:inline-flex;align-items:center;gap:3px;padding:4px 8px;border-radius:99px;color:var(${col});background:color-mix(in srgb,var(${col}) 12%,transparent)">${I(rising ? 'arrowUR' : 'arrowDR', 10)}<span class="sg mono" style="font-size:13px">%${Math.abs(Math.round(ch))}</span></span>`;
      }
    }
    const head = `<div class="card stack" style="--p:18px;gap:10px">
      <div class="lbl k8">TOPLAM HARCAMA</div>
      <div style="display:flex;align-items:baseline;gap:4px"><span class="sgb tp" style="font-size:38px;line-height:44px">${F.dec(tt.spend)}</span><span class="sgb cur" style="font-size:20px">₺</span><span style="flex:1"></span>${badge}</div>
      <hr class="div">
      <div style="display:flex">${stat(String(tt.tripCount), 'Yolculuk')}${stat(`${Math.round(tt.distanceKm)} km`, 'Mesafe')}${stat(`${F.dec(tt.costPerKm)} ₺`, 'Km başı')}</div>
      ${tt.passengerTrips > 0 ? `<p class="c2 m">${tt.passengerTrips} yolculukta yolcuydun — mesafeye sayıldı, harcamaya sayılmadı.</p>` : ''}</div>`;
    const tot = Math.max(tt.fuelSpend + tt.tollSpend, 0.0001);
    const leg = (cls, l, v) => `<span style="display:inline-flex;align-items:center;gap:6px" class="c1 t2"><span style="width:8px;height:8px;border-radius:50%;background:var(${cls})"></span>${l} ${F.dec(v)} ₺</span>`;
    const breakdown = `<div class="card stack" style="--p:18px;gap:12px"><div class="lbl k8">PARA NEREYE GİTTİ</div>
      <div style="display:flex;gap:2px;height:10px;border-radius:99px;overflow:hidden"><div style="width:${tt.fuelSpend / tot * 100}%;background:var(--primary)"></div><div style="flex:1;background:var(--toll)"></div></div>
      <div style="display:flex;gap:16px">${leg('--primary', 'Yakıt', tt.fuelSpend)}${leg('--toll', 'Gişe', tt.tollSpend)}</div><hr class="div">
      <div style="display:flex">${stat(`${tt.liters.toFixed(0)} L`, 'Yakıt')}${stat(`${tt.consumptionPer100.toFixed(1)} L/100`, 'Tüketim')}${stat(`${tt.averageTripKm.toFixed(0)} km`, 'Ort. yolculuk')}</div></div>`;
    const bv = CL.byVehicle(trips);
    const vehicles = bv.length > 1 ? `<div class="card stack" style="--p:18px;gap:12px"><div class="lbl k8">ARAÇLARA GÖRE</div>${bv.map((s, i) => `${i ? '<hr class="div">' : ''}<div class="stack" style="gap:6px"><div style="display:flex;gap:8px"><span class="sg tp ell" style="font-size:15px;line-height:20px">${F.esc(s.name)}</span><span style="flex:1"></span><span class="sgb tp" style="font-size:15px">${F.dec(s.totals.spend)} ₺</span></div><div class="c2 m" style="display:flex;gap:10px"><span>${s.totals.tripCount} yolculuk</span><span>${Math.round(s.totals.distanceKm)} km</span><span>${F.dec(s.totals.costPerKm)} ₺/km</span></div></div>`).join('')}</div>` : '';

    // Ritim: saatlere göre yolculuk sayısı + günlere göre kilometre (Swift Charts varsayılan eksenleri).
    const W = S.W - 32 - 36;
    const hours = CL.byHour(trips); const hMax = Math.max(...hours.map((h) => h.tripCount), 1);
    const hT = V.niceTicks(hMax, 5); const HH = 110; const PL = 18; const hB = 18; const hTop = 7;
    const hy = (v) => hTop + (HH - hTop - hB) * (1 - v / hT.top); const hx = (h) => PL + h / 23 * (W - PL);
    let hs = `<svg class="chart big" viewBox="0 0 ${W} ${HH}" width="${W}" height="${HH}">`;
    hT.ticks.forEach((t) => { hs += `<line x1="${PL}" x2="${W}" y1="${hy(t)}" y2="${hy(t)}" stroke="var(--border)"/><text x="0" y="${hy(t) + 4}">${t}</text>`; });
    hours.forEach((h) => { if (h.tripCount > 0) hs += `<rect x="${hx(h.id) - 4}" y="${hy(h.tripCount)}" width="8" height="${hy(0) - hy(h.tripCount)}" rx="2" fill="var(--primary)"/>`; });
    for (let h = 0; h <= 21; h += 3) hs += `<text x="${hx(h) + 3.5}" y="${HH - 3}">${F.pad(h)}</text>`;
    hs += '</svg>';
    const weekdays = CL.byWeekday(trips); const dMax = Math.max(...weekdays.map((d) => d.distanceKm), 1);
    const dT = V.niceTicks(dMax, 4); const DH = 90; const dB = 18; const dTop = 7;
    const dy = (v) => dTop + (DH - dTop - dB) * (1 - v / dT.top); const cw = (W - PL) / 7;
    let ds = `<svg class="chart big" viewBox="0 0 ${W} ${DH}" width="${W}" height="${DH}">`;
    dT.ticks.forEach((t) => { ds += `<line x1="${PL}" x2="${W}" y1="${dy(t)}" y2="${dy(t)}" stroke="var(--border)"/><text x="0" y="${dy(t) + 4}">${t}</text>`; });
    for (let i = 0; i <= 7; i++) ds += `<line x1="${PL + i * cw}" x2="${PL + i * cw}" y1="${dTop}" y2="${DH - dB}" stroke="var(--border)" stroke-dasharray="2 3"/>`;
    weekdays.forEach((d, i) => { if (d.distanceKm > 0) ds += `<rect x="${PL + i * cw + cw * 0.15}" y="${dy(d.distanceKm)}" width="${cw * 0.7}" height="${dy(0) - dy(d.distanceKm)}" rx="3" fill="var(--savings)"/>`; ds += `<text x="${PL + i * cw + cw / 2}" y="${DH - 3}" text-anchor="middle">${d.label}</text>`; });
    ds += '</svg>';
    const rhythm = `<div class="card stack" style="--p:18px;gap:14px"><div class="lbl k8">NE ZAMAN SÜRÜYORSUN</div>${hs}<hr class="div">${ds}<span class="c2 m">Üstte saate göre yolculuk sayısı, altta güne göre kilometre.</span></div>`;

    const sp = CL.averageSpeed(trips);
    let character = '';
    if (sp > 0) {
      const share = CL.highSpeedShare(trips); const stops = CL.stopsPer100Km(trips);
      const note = share > 0.5 ? 'Kilometrenin çoğu şehirlerarası yolda geçiyor. Bu profilde tüketim düşük, gişe payı yüksek olur.'
        : sp < 30 ? 'Ağırlıklı şehir içi, dur-kalk trafiği. Bu profilde tüketim katalog değerinin üstüne çıkar.' : 'Şehir içi ve şehirlerarası karışık bir kullanım.';
      character = `<div class="card stack" style="--p:18px;gap:12px"><div class="lbl k8">SÜRÜŞ KARAKTERİ</div><div style="display:flex">${stat(`${Math.round(sp)} km/s`, 'Ort. hız')}${stat(`%${Math.round(share * 100)}`, 'Otoyol payı')}${stops > 0 ? stat(`${stops.toFixed(0)}/100km`, 'Duruş') : ''}</div><p class="c1 t2">${note}</p></div>`;
    }
    const acc = CL.accuracy(trips);
    const accuracy = acc ? `<div class="card stack" style="--p:18px;gap:10px"><div class="lbl k8">TAHMİN NE KADAR TUTUYOR</div><div style="display:flex;align-items:baseline;gap:6px"><span class="sgb" style="font-size:30px;color:var(${acc.averageErrorPercent < 10 ? '--savings' : '--text'})">%${Math.round(acc.averageErrorPercent)}</span><span class="sub t2">ortalama sapma</span></div><p class="c1 t2">${acc.averageSignedPercent > 2 ? 'Tahmin gerçek tutarın ÜSTÜNDE kalıyor — girdiğin fiyatlar güncel olmayabilir.' : acc.averageSignedPercent < -2 ? 'Tahmin gerçek tutarın ALTINDA kalıyor — tüketim gerçekte daha yüksek.' : 'Tahmin iki yöne de dengeli şaşıyor; sistematik bir sapma yok.'}</p><span class="c2 m">${acc.sampleCount} yolculukta gerçek tutar girildi.</span></div>` : '';
    const exp = CL.mostExpensive(trips);
    const expensive = exp.length ? `<div class="card stack" style="--p:18px;gap:10px"><div style="display:flex;gap:6px"><span class="lbl k8">EN PAHALI YOLCULUKLAR</span><span style="flex:1"></span><span class="c2 m" style="opacity:.8">dokunarak aç</span></div>${exp.map((t, i) => `${i ? '<hr class="div">' : ''}<button data-act="trip" data-v="${F.esc(t.id)}" style="display:flex;align-items:center;gap:10px;padding:2px 0;width:100%"><div class="stack" style="gap:2px;flex:1;min-width:0"><span class="sg tp ell" style="font-size:14px;line-height:19px">${F.esc(t.label || 'Adsız yolculuk')}</span><span class="c2 m ell">${Math.round(t.distanceKm)} km · ${F.esc(t.vehicleName)}</span></div><span class="sgb tp" style="font-size:15px">${F.dec(CL.billable(t))} ₺</span><span class="m" style="opacity:.5">${I('chevR', 11)}</span></button>`).join('')}</div>` : '';
    return `<div class="stack gap12" style="padding-inline:16px;padding-block:0">${rangeSeg(r)}${head}${breakdown}${vehicles}${rhythm}${character}${accuracy}${expensive}</div>`;
  };

  // ── Yolculuklar ─────────────────────────────────────────────────────────
  V.tripsSheet = (S) => {
    const r = S.tripsRange; const trips = scoped(S, r);
    if (!trips.length) return `<div class="stack" style="align-items:center;gap:14px;padding:80px 40px;text-align:center"><span class="m" style="opacity:.5">${I('list', 40)}</span><div class="sg tp" style="font-size:18px">Bu dönemde yolculuk yok</div><p class="sub t2">Kaydedilen yolculukların burada araç araç listelenir.</p><div style="width:100%">${rangeSeg(r)}</div></div>`;
    const tt = CL.totals(trips);
    const vcol = (v, l) => `<div class="stack" style="flex:1;align-items:center;gap:3px"><span class="sgb tp ell" style="font-size:17px;line-height:22px">${v}</span><span class="c2 m">${l}</span></div>`;
    const vsep = '<div style="width:1px;height:30px;background:var(--border)"></div>';
    const groups = CL.byVehicle(trips).map((s) => ({ s, list: trips.filter((t) => t.vehicleName === s.name).sort((a, b) => b.date - a.date) }));
    return `<div class="stack gap12" style="padding-inline:16px">${rangeSeg(r)}
      <div class="card" style="display:flex;align-items:center;--p:16px">${vcol(String(tt.tripCount), 'yolculuk')}${vsep}${vcol(`${Math.round(tt.distanceKm)} km`, 'mesafe')}${vsep}${vcol(`${F.dec(tt.spend)} ₺`, 'harcama')}</div>
      ${groups.map(({ s, list }) => {
        const col = S.collapsedVehicles.has(s.name);
        return `<div class="card" style="--p:16px"><button data-act="collapse" data-v="${F.esc(s.name)}" style="display:flex;align-items:center;gap:10px;width:100%">
          <span style="width:30px;height:30px;border-radius:50%;background:color-mix(in srgb,var(--primary) 12%,transparent);color:var(--primary);display:grid;place-items:center">${I('car', 14)}</span>
          <div class="stack" style="gap:2px;flex:1;min-width:0"><span class="sg tp ell" style="font-size:16px;line-height:21px">${F.esc(s.name)}</span><span class="c2 m ell">${s.totals.tripCount} yolculuk · ${Math.round(s.totals.distanceKm)} km · ${F.dec(s.totals.costPerKm)} ₺/km</span></div>
          <span class="sgb tp" style="font-size:16px">${F.dec(s.totals.spend)} ₺</span><span class="m" style="opacity:.6">${I(col ? 'chevD' : 'chevU', 11)}</span></button>
          ${col ? '' : `<hr class="div" style="margin:10px 0">${list.map((t, i) => `${i ? '<hr class="div">' : ''}<button data-act="trip" data-v="${F.esc(t.id)}" style="display:flex;align-items:center;gap:10px;width:100%;padding:7px 0">
            <div class="stack" style="gap:3px;flex:1;min-width:0"><span class="sg tp ell" style="font-size:14px;line-height:19px">${F.esc(t.label || 'Adsız yolculuk')}</span><span class="c2 m ell" style="display:flex;gap:6px"><span>${F.dayShort(t.date)}</span><span>·</span><span>${Math.round(t.distanceKm)} km</span>${t.tollCost > 0.5 ? `<span>·</span><span class="toll">gişe ${F.dec(t.tollCost)} ₺</span>` : ''}${t.wasPassenger ? '<span>·</span><span class="savings">yolcu</span>' : ''}</span></div>
            <div class="stack" style="align-items:flex-end;gap:2px"><span class="sgb tp" style="font-size:15px">${F.dec(CL.billable(t))} ₺</span>${t.wasAuto ? '<span style="font-size:9px;font-weight:600;color:var(--muted);opacity:.8">otomatik</span>' : ''}</div><span class="m" style="opacity:.5">${I('chevR', 11)}</span></button>`).join('')}`}</div>`;
      }).join('')}</div>`;
  };

  // ── Yan menü ────────────────────────────────────────────────────────────
  const MENU = [
    { id: 'calc', t: 'Hesapla', s: 'Yolculuk maliyeti planla', ic: 'fx', c: '--primary' },
    { id: 'analysis', t: 'Analiz', s: 'Harcama, tüketim ve alışkanlıklar', ic: 'chartBars', c: '--savings' },
    { id: 'trips', t: 'Yolculuklar', s: 'Kaydedilen tüm yolculuklar', ic: 'list', c: '--speed-1' },
    { id: 'compare', t: 'Araç Karşılaştır', s: 'Hangi araç daha ucuz', ic: 'car2', c: '--speed-2', pro: true, sep: true },
    { id: 'carplay', t: 'CarPlay', s: 'Araba ekranında içerik', ic: 'carplay', c: '--speed-3', pro: true },
    { id: 'settings', t: 'Ayarlar', s: 'Algılama, bildirim, izinler', ic: 'gear', c: '--text-2' },
  ];
  V.menu = () => `<div class="menu-head"><div style="display:flex;align-items:center"><span class="sg tp" style="font-size:24px;line-height:30px">CarLog</span><span style="flex:1"></span><button data-act="menuclose" style="width:44px;height:44px;display:grid;place-items:center" class="m" aria-label="Menüyü kapat">${I('xmark', 14)}</button></div><div class="lbl k8 savings" style="margin-top:4px">Pro</div></div>
    <div class="stack" style="padding:8px 0;gap:4px;flex:1;overflow:auto">${MENU.map((m) => `${m.sep ? '' : ''}<button class="menu-item" data-act="menu" data-v="${m.id}">
      <span class="menu-icon" style="background:color-mix(in srgb,var(${m.c}) 12%,transparent);color:var(${m.c})">${I(m.ic, 17)}</span>
      <span class="stack" style="gap:2px;flex:1;min-width:0"><span style="display:flex;align-items:center;gap:6px"><span class="sg tp" style="font-size:16px;line-height:21px">${m.t}</span>${m.pro ? '<span class="pro-tag">PRO</span>' : ''}</span><span class="c1 m ell">${m.s}</span></span>
      <span class="m" style="opacity:.5">${I('chevR', 11)}</span></button>${m.id === 'compare' ? '<hr class="div" style="margin:8px 16px">' : ''}`).join('')}</div>
    <div class="c2 m" style="padding:0 16px calc(var(--sab) + 4px);opacity:.7">Web demosu · örnek veri</div>`;

  // ── Garajım ─────────────────────────────────────────────────────────────
  V.vehicleCard = (v, primary, reorder) => {
    const range = v.tank / v.avg * 100;
    return `<div class="card ${primary ? 'sel' : ''}" style="--p:16px;display:flex;gap:10px;align-items:center;cursor:pointer" data-act="vehicle" data-v="${v.id}" role="button" tabindex="0">
      ${reorder ? `<div class="stack" style="gap:8px">${['up', 'down'].map((d) => `<button data-act="move" data-v="${v.id}:${d}" style="width:30px;height:30px;border-radius:50%;background:var(--sunken);display:grid;place-items:center;color:${(d === 'up' ? reorder.up : reorder.down) ? 'var(--primary)' : 'rgba(100,116,139,.3)'}">${I(d === 'up' ? 'chevU' : 'chevD', 13)}</button>`).join('')}</div>` : ''}
      <div class="stack" style="gap:12px;flex:1;min-width:0">
        <div style="display:flex;align-items:flex-start;gap:12px">
          <span style="width:46px;height:46px;border-radius:12px;background:color-mix(in srgb,var(--primary) 12%,transparent);color:var(--primary);display:grid;place-items:center;flex-shrink:0">${I('car', 19)}</span>
          <div class="stack" style="gap:3px;flex:1;min-width:0"><div style="display:flex;align-items:center;gap:6px"><span class="sg tp ell" style="font-size:17px;line-height:22px">${F.esc(v.name)}</span>${primary ? '<span class="lbl" style="font-size:9px;letter-spacing:.5px;color:#fff;background:var(--primary);padding:3px 6px;border-radius:99px">BİRİNCİL</span>' : ''}</div>
          <span class="c1 m ell">${v.year} • ${F.esc(v.brand)} ${F.esc(v.model)} • ${v.fuel}</span></div>
          <span class="m" style="padding:4px">${I('ellipsis', 18)}</span></div>
        <div class="row2" style="--n:2">${V.metric('Karma Tüketim', F.fix(v.avg, 1), 'L/100km', 'var(--text)', 'gauge')}${V.metric('Tam Depo', F.dec(range), 'km', 'var(--text)', 'fuel')}</div>
        <span style="align-self:flex-start;display:inline-flex;align-items:center;gap:4px;padding:4px 8px;border-radius:99px;font-family:var(--font-round);font-size:10px;font-weight:600;color:var(--muted);background:color-mix(in srgb,var(--muted) 10%,transparent)">${I('book', 9)}Katalog değeri</span>
      </div></div>`;
  };
  V.garage = (S) => {
    const now = new Date(); const [s, e] = D.interval('month', now);
    const month = S.trips.filter((t) => t.date >= s && t.date < e);
    const total = CL.sum(month, CL.billable); const toll = CL.sum(month, (t) => t.tollCost); const fuel = Math.max(total - toll, 0); const km = CL.sum(month, (t) => t.distanceKm);
    const order = S.vehicleOrder.map(vehicleById);
    const overview = `<div class="card mx stack" style="--p:20px;gap:14px">
      <div style="display:flex;align-items:flex-start"><div class="stack" style="gap:4px"><span class="lbl k8">${F.upperTR(`${F.MONTHS_LONG[now.getMonth()]} ${now.getFullYear()}`)} MASRAFI</span><div style="display:flex;align-items:baseline;gap:4px"><span class="sgb tp" style="font-size:34px;line-height:40px">${F.dec(total)}</span><span class="sgb cur" style="font-size:18px">₺</span></div></div><span style="flex:1;min-width:8px"></span>
      <div class="stack" style="align-items:flex-end;gap:3px"><span class="c1 w6 t2">${month.length} yolculuk</span>${km > 0 ? `<span class="c2 m">${F.dec(km)} km</span>` : ''}</div></div>
      ${total > 0 ? `${V.splitBar(fuel, toll)}${V.legend([['', `Yakıt ${F.dec(fuel)} ₺`], ['t', `Gişe ${F.dec(toll)} ₺`]])}` : '<span class="c1 m">Bu ay henüz kayıtlı yolculuk yok.</span>'}
      <hr class="div"><div style="display:flex;gap:14px;align-items:center"><span style="display:inline-flex;gap:5px;align-items:center"><span class="primary">${I('car', 11)}</span><span class="c2 w6 t2">${order.length} araç</span></span></div></div>`;
    const banner = S.bannerOn ? `<div class="mx" style="display:flex;align-items:flex-start;gap:10px;padding:14px;border-radius:14px;background:color-mix(in srgb,var(--savings) 9%,transparent)"><span class="savings" style="padding-top:2px">${I('refresh', 14)}</span><div class="stack" style="gap:3px;flex:1"><span class="sub w6 tp">Tüketim verileri güncellendi</span><span class="c1 t2">Golf: şehir içi tüketim 7.3 → 8.4 L/100km olarak güncellendi.</span><span class="c2 m">Elle girdiğin değerlere dokunulmadı.</span></div><button data-act="banner" class="m" style="padding:4px" aria-label="Kapat">${I('xmark', 11)}</button></div>` : '';
    const price = (n, v) => `<div class="tile p10 stack" style="align-items:center;gap:5px;text-align:center"><span class="lbl k5" style="font-size:10px">${n}</span><span class="sgb tp" style="font-size:19px;line-height:24px">${F.comma(v)}</span><span style="font-size:9px;line-height:11px;color:var(--muted)">₺ / Litre</span></div>`;
    const radar = `<div class="mx" style="position:relative"><button class="card stack" data-act="trend" style="--p:18px;gap:12px;width:100%;text-align:left"><div style="display:flex;align-items:center;gap:8px"><span class="toll">${I('fuel', 14)}</span><span class="sg tp" style="font-size:16px;line-height:21px">Akaryakıt Radarı</span></div><div class="row2">${price('BENZİN', PUMP.gasoline)}${price('MOTORİN', PUMP.diesel)}${price('OTOGAZ', PUMP.lpg)}</div><span class="c2 m">Örnek fiyatlar · gerçek uygulama güncel pompa fiyatını çeker</span></button>
      <span class="primary" style="position:absolute;top:10px;right:10px;display:flex;align-items:center;gap:3px;pointer-events:none">${I('chartLine', 10)}<span class="c2 w6">Trend</span></span></div>`;
    const cards = order.map((v, i) => V.vehicleCard(v, i === 0, S.reordering ? { up: i > 0, down: i < order.length - 1 } : null)).join('');
    const list = `<div class="stack" style="gap:14px"><div style="display:flex;align-items:center;padding-inline:16px"><span class="section-h">Araçlarınız</span><span style="flex:1"></span>${order.length > 1 ? `<button data-act="reorder" class="c1 w6 primary">${S.reordering ? 'Bitti' : 'Sıralamayı Düzenle'}</button>` : ''}</div>
      ${S.reordering ? '<p class="c1 m pad-h">Listenin ilk aracı birincil araçtır: canlı sürüş, otomatik kayıt ve analizler onu kullanır.</p>' : ''}<div class="stack mx" style="gap:16px">${cards}</div></div>`;
    const tool = order.length > 1 ? `<div class="mx"><button class="card" data-act="menu" data-v="compare" style="--p:0;width:100%;display:flex;align-items:center;gap:14px;padding:14px;text-align:left"><span style="width:44px;height:44px;border-radius:12px;background:color-mix(in srgb,var(--primary) 12%,transparent);color:var(--primary);display:grid;place-items:center">${I('car2', 18)}</span><span class="stack" style="gap:3px;flex:1"><span class="sg tp" style="font-size:15px">Araçları Karşılaştır</span><span class="c1 m">Aynı yolu hangi aracın daha ucuza gittiğini gör.</span></span><span class="m" style="opacity:.6">${I('chevR', 12)}</span></button></div>` : '';
    return `<div class="stack gap24"><h2 class="tp" style="padding-inline:20px;font-size:34px;line-height:41px;font-weight:700;margin-top:-4px">Garajım</h2>${overview}${banner}${radar}${list}${tool}</div>`;
  };
})();
