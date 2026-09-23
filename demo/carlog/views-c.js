// CarLog web demosu — Canlı Sürüş, Hesapla (rota + maliyet) ve yardımcı sayfalar
// (LiveDriveView, TripPlanView, TripMapView, RouteComparisonView'ın karşılığı).
// Hesapla'daki rota ve gişe verileri örnektir; maliyet motoru CostCalculatorEngine'in
// sadeleştirilmiş bir karşılığıdır (tüketim eğrisi, trafik, arazi, sürüş tarzı, klima).
(() => {
  'use strict';
  const { F, VEHICLES, vehicleById, PUMP, V } = CL;
  const I = CLIcon;

  // ── Örnek güzergâhlar ───────────────────────────────────────────────────
  CL.PLACES = [
    { id: 'kocaeli', name: 'Kocaeli', sub: 'Kocaeli Merkez', routes: [
      { name: 'Kuzey Marmara Otoyolu', km: 100.8, min: 68, ideal: 66, city: 0.05, hwy: 0.85, tolls: [{ label: 'Kuzey Marmara Otoyolu (Samandıra – Muallimköy)', amount: 49, km: 14 }], note: 'Matris ücreti: SAMANDIRA – MUALLİMKÖY', traffic: 2 },
      { name: 'Anadolu Otoyolu', km: 80.5, min: 65, ideal: 58, city: 0.08, hwy: 0.86, tolls: [{ label: 'Anadolu Otoyolu (Çamlıca)', amount: 92, km: 13 }, { label: 'Anadolu Otoyolu (Gebze)', amount: 95, km: 46 }], note: 'Matris ücreti: SAMANDIRA LİMAN', traffic: 20 },
      { name: 'D-100 Karayolu', km: 92.4, min: 82, ideal: 68, city: 0.3, hwy: 0.5, tolls: [], note: 'Gişe yok', traffic: 28 },
    ] },
    { id: 'bursa', name: 'Bursa', sub: 'Osmangazi, Bursa', routes: [
      { name: 'Anadolu Otoyolu + Osmangazi Köprüsü', km: 143.5, min: 146, ideal: 106, city: 0.05, hwy: 0.88, tolls: [{ label: 'Osmangazi Köprüsü', amount: 995, km: 62 }, { label: 'Gebze – Orhangazi Otoyolu', amount: 759, km: 40 }], note: 'Matris ücreti: ANADOLU (ÇAMLICA) – ORHANLI', traffic: 37 },
      { name: 'D-100 Karayolu', km: 142.8, min: 169, ideal: 118, city: 0.28, hwy: 0.45, tolls: [{ label: 'Osmangazi Köprüsü', amount: 995, km: 62 }], note: 'Tahmini ücret: Osmangazi Köprüsü', traffic: 45 },
    ] },
    { id: 'airport', name: 'Havalimanı', sub: 'Sabiha Gökçen Havalimanı', routes: [
      { name: 'O-4 Anadolu Otoyolu', km: 41.3, min: 47, ideal: 33, city: 0.15, hwy: 0.75, tolls: [{ label: 'O-4 Anadolu Otoyolu (Kavacık)', amount: 78, km: 21 }], note: 'Matris ücreti: KAVACIK', traffic: 28 },
      { name: 'D-100 Karayolu', km: 39.8, min: 58, ideal: 40, city: 0.55, hwy: 0.25, tolls: [], note: 'Gişe yok', traffic: 55 },
    ] },
    { id: 'office', name: 'Ofis', sub: 'Beşiktaş, İstanbul', routes: [
      { name: '15 Temmuz Şehitler Köprüsü', km: 12.2, min: 31, ideal: 18, city: 0.7, hwy: 0.1, tolls: [], note: 'Gişe yok', traffic: 52 },
      { name: 'FSM Köprüsü', km: 17.9, min: 34, ideal: 24, city: 0.5, hwy: 0.3, tolls: [{ label: 'FSM Köprüsü', amount: 78, km: 9 }], note: 'Matris ücreti: FSM', traffic: 30 },
    ] },
  ];

  // ── Maliyet motoru (sadeleştirilmiş) ────────────────────────────────────
  const realWorld = (v, cityHeavy, hwyHeavy) => {
    const large = v.hwy >= 8; const small = v.hwy < 5.5;
    if (cityHeavy) return large ? 1.30 : small ? 1.18 : 1.23;
    if (hwyHeavy) return large ? 1.14 : small ? 1.06 : 1.10;
    return large ? 1.20 : small ? 1.12 : 1.16;
  };
  const unitPrice = (v) => (v.fuel === 'Dizel' ? PUMP.diesel : PUMP.gasoline);
  CL.estimate = (route, v, o) => {
    const mixed = Math.max(0, 1 - route.city - route.hwy);
    const rw = realWorld(v, route.city > 0.6, route.hwy > 0.6);
    const base = (v.city * route.city + v.hwy * route.hwy + v.avg * mixed) * rw;
    const delay = Math.max(1, route.min / route.ideal);
    const traffic = 1 + (delay - 1) * 0.35;
    const terrain = 1 + o.terrain * 1.05 * (route.hwy > 0.6 ? 0.34 : 0.24);
    const hwyReality = route.hwy > 0.55 ? 1 + ((route.hwy - 0.55) / 0.45) * 0.13 : 1;
    const climate = o.climate ? 1.08 : 1;
    const price = o.fuelPrice || unitPrice(v);
    const km = route.km; const before = base * traffic * terrain * hwyReality * o.style;
    const baseFuel = km / 100 * base * price; const beforeCost = km / 100 * before * price; const totalFuel = km / 100 * before * climate * price;
    const toll = o.toll != null ? o.toll : route.tolls.reduce((a, s) => a + s.amount, 0);
    return { baseFuel, traffic: beforeCost - baseFuel, climate: totalFuel - beforeCost, fuel: totalFuel, toll, total: totalFuel + toll, liters: km / 100 * before * climate, rate: before * climate, delay, avgSpeed: km / (route.min / 60) };
  };
  const minsText = (m) => { const t = Math.round(m); const h = Math.floor(t / 60); const mm = t % 60; return h === 0 ? `${mm}dk` : mm === 0 ? `${h}s` : `${h}s ${mm}dk`; };
  const durText = (m) => { const t = Math.round(m); return t >= 60 ? `${Math.floor(t / 60)} sa ${t % 60} dk` : `${t} dk`; };
  CL.routeView = (S, place, idx) => {
    const c = S.calc; const v = vehicleById(c.vehicleId); const route = place.routes[idx];
    const mult = c.roundTrip ? 2 : 1;
    const opts = { terrain: c.terrain, style: c.style, climate: c.climate, fuelPrice: c.manual && parseFloat(c.fuelText.replace(',', '.')) > 0 ? parseFloat(c.fuelText.replace(',', '.')) : null, toll: c.manual && c.tollText !== '' && !isNaN(parseFloat(c.tollText.replace(',', '.'))) ? parseFloat(c.tollText.replace(',', '.')) : null };
    const e = CL.estimate(route, v, opts);
    return { route, e, mult };
  };

  // ── Canlı Sürüş ─────────────────────────────────────────────────────────
  const liveCost = (S, veh) => (S.live ? S.live.dist * veh.avg / 100 * CL.FUEL_PRICE[veh.fuel] : 0);
  V.live = (S) => {
    const L = S.live; const order = S.vehicleOrder.map(vehicleById);
    if (!L) {
      const info = (ic, t, d) => `<div style="display:flex;align-items:flex-start;gap:12px"><span class="primary" style="width:24px;display:grid;place-items:center;padding-top:2px">${I(ic, 15)}</span><div class="stack" style="gap:3px"><span class="sg tp" style="font-size:14px;line-height:19px">${t}</span><span class="c1 m">${d}</span></div></div>`;
      return `<div class="stack gap12 mx">
        <div class="card stack" style="--p:24px;align-items:center;gap:12px;text-align:center"><span style="width:68px;height:68px;border-radius:50%;background:color-mix(in srgb,var(--primary) 10%,transparent);display:grid;place-items:center" class="primary">${I('car', 28)}</span>
          <span class="sg tp" style="font-size:19px;line-height:24px">Sürüş bekleniyor</span><span class="sub t2">Araca bindiğinde kendiliğinden başlayacak. Konum izni "Her Zaman" ise uygulamayı açık tutmana gerek yok.</span></div>
        <div style="display:flex;align-items:flex-start;gap:10px;padding:14px;border-radius:12px;background:var(--sunken)"><span class="primary" style="width:22px;display:grid;place-items:center;padding-top:2px">${I('location', 15)}</span><div class="stack" style="gap:3px"><span class="sg tp" style="font-size:14px">Hareket ve hız izleniyor</span><span class="c1 m">Araçta CarPlay veya Bluetooth yoksa da çalışır: hareket sensörü ve GPS hızı araca bindiğini anlar.</span></div></div>
        <button class="btn soft" data-act="startlive" style="font-size:16px;padding:15px 0">${I('playCircle', 17)} Yolculuğu Şimdi Başlat</button>
        <div class="card stack" style="--p:18px;gap:14px">${info('speedometer', 'Hızını burada görürsün', 'Sürüş başladığında hız ve biriken yakıt masrafı bu ekranda canlı ilerler.')}${info('lock', 'Telefon kilitliyken de', 'Kilit ekranında ve Dynamic Island\'da aynı bilgiler görünür.')}${info('map', 'Gişe için rota gerekir', 'Otomatik kayıtta yalnızca yakıt hesaplanır. Gişe dahil maliyet için menüdeki Hesapla sayfasından rota kur.')}</div>
        <p class="c2 m" style="text-align:center;padding:4px 12px">Web demosunda sürüş, şehir içi bir güzergâh canlandırılarak simüle edilir.</p></div>`;
    }
    const act = vehicleById(L.vehicleId); const cost = liveCost(S, act);
    return `<div class="stack gap12 mx">
      <div style="display:flex;align-items:center;gap:8px;padding-inline:4px"><span class="rec-dot"></span><span class="lbl k8 savings">ELLE BAŞLATILDI</span><span style="flex:1"></span><span class="c1 m">${F.esc(act.name)}</span></div>
      <div class="card" style="--p:14px"><div style="display:flex;padding-bottom:8px"><span class="lbl k8">HANGİ ARAÇTASIN</span><span style="flex:1"></span><span class="c2 m" style="opacity:.8">dokunarak değiştir</span></div>
        ${order.map((v, i) => `${i ? '<hr class="div" style="margin-left:26px">' : ''}<button data-act="livevehicle" data-v="${v.id}" style="display:flex;align-items:center;gap:10px;width:100%;padding:9px 0"><span class="radio ${v.id === L.vehicleId ? 'on' : ''}"></span><span class="sg ell" style="font-size:14px;color:var(${v.id === L.vehicleId ? '--text' : '--text-2'})">${F.esc(v.name)}</span><span style="flex:1"></span><span class="sgb" data-live="cost-${v.id}" style="font-size:15px;color:var(${v.id === L.vehicleId ? '--text' : '--muted'})">${F.dec(liveCost(S, v))} ₺</span></button>`).join('')}</div>
      <div class="card stack" style="--p:20px;gap:14px;align-items:stretch"><div style="display:flex;align-items:baseline;justify-content:center;gap:6px"><span class="sgb tp" data-live="speed" style="font-size:72px;line-height:80px">${Math.round(L.speed)}</span><span class="sg m" style="font-size:18px">km/s</span></div>
        <hr class="div"><div style="display:flex"><span class="sub t2">Ortalama tüketim</span><span style="flex:1"></span><span class="sgb tp" style="font-size:16px">${F.fix(act.avg, 1)} L/100km</span></div></div>
      <div class="card stack" style="--p:20px;gap:12px"><div class="lbl k8">BU YOLCULUKTA</div><div style="display:flex;align-items:baseline;gap:4px"><span class="sgb tp" data-live="total" style="font-size:40px;line-height:46px">${F.dec(cost)}</span><span class="sgb cur" style="font-size:22px">₺</span></div>
        <span class="c1 m">${cost > 0 ? 'Yalnızca yakıt. Gişeden geçilirse otomatik eklenecek.' : 'Yola çıkınca masraf burada birikmeye başlayacak.'}</span></div></div>`;
  };
  V.liveActions = () => `<div class="live-actions stack" style="gap:8px"><button class="btn" data-act="finishlive">${I('flag', 16)} Yolculuğu Bitir</button><span class="c2 m" style="text-align:center">Durduğunda kendiliğinden de kaydedilir.</span><button class="btn danger" data-act="cancellive">${I('xmarkCircleOutline', 15)} Bu bir yolculuk değil, iptal et</button></div>`;

  // ── Hesapla ─────────────────────────────────────────────────────────────
  const collapsible = (title, open, key, inner) => `<div class="coll ${open ? 'open' : ''}"><button data-act="coll" data-v="${key}"><span>${title}</span>${I('chevD', 12)}</button>${open ? `<div style="padding-bottom:12px">${inner}</div>` : ''}</div>`;
  const pseg = (title, key, options, cur) => `<div class="stack" style="gap:8px"><div class="section-h">${title}</div><div class="pseg">${options.map(([val, t]) => `<button class="${String(cur) === String(val) ? 'on' : ''}" data-act="cset" data-v="${key}:${val}">${t}</button>`).join('')}</div></div>`;
  const toggleRow = (ic, t, key, on) => `<button data-act="ctoggle" data-v="${key}" style="display:flex;align-items:center;gap:8px;width:100%;padding:2px 0"><span class="tp">${I(ic, 16)}</span><span class="tp" style="font-family:var(--font-round);font-weight:700;font-size:15px">${t}</span><span style="flex:1"></span><span class="toggle ${on ? 'on' : ''}"></span></button>`;
  const styleCaption = { 0.85: 'Sakin sürüş · otoyolda ~95-105 km/s · düşük tüketim', 1: 'Dengeli sürüş · otoyolda ~115-125 km/s · standart tüketim', 1.3: 'Hızlı sürüş · otoyolda ~135+ km/s · yüksek tüketim' };
  V.quickRoutes = () => `<div class="stack" style="gap:14px"><div class="section-h" style="padding-left:20px">Hızlı Rotalar</div>
    <div style="display:flex;gap:16px;overflow-x:auto;padding:0 16px 8px;scrollbar-width:none">${CL.PLACES.map((p) => `<button data-act="pickplace" data-v="${p.id}" class="card stack" style="--p:16px;flex:0 0 120px;height:120px;gap:10px"><span style="width:36px;height:36px;border-radius:50%;background:rgba(0,122,255,.1);color:#007AFF;display:grid;place-items:center">${I('pin', 17)}</span><span style="font-size:15px;line-height:19px;font-weight:700" class="tp">${p.name}</span><span class="c2 m ell">${p.sub}</span></button>`).join('')}
    <button data-act="toast" data-v="Web demosunda yeni hızlı rota eklenmez." class="card stack" style="--p:0;flex:0 0 120px;height:120px;align-items:center;justify-content:center;gap:12px;color:#007AFF"><span style="font-size:22px;font-weight:700">+</span><span class="c1 w7 tp">Yeni Ekle</span></button></div></div>`;
  V.config = (S) => {
    const c = S.calc; const place = c.place && CL.PLACES.find((p) => p.id === c.place);
    const dist = place ? place.routes[c.pick].km : 0;
    const levels = [[0.125, 'E'], [0.25, '¼'], [0.5, '½'], [0.75, '¾'], [1, 'F']];
    const fill = c.fuelLevel < 0.26 ? '#FF3B30' : c.fuelLevel < 0.51 ? '#FF9500' : c.fuelLevel < 0.76 ? '#FFCC00' : '#34C759';
    return `<div class="card stack" style="--p:24px;gap:24px;margin-inline:16px;margin-bottom:6px">
      <button class="btn grad" data-act="openroutemap" style="border-radius:18px;font-family:var(--font-round);font-weight:700;font-size:17px;box-shadow:0 5px 10px rgba(0,122,255,.2)">${I('mapFill', 17)} ${dist > 0 ? `${dist.toFixed(1)} km` : 'Haritadan Rota Seç'}</button>
      <div class="stack" style="gap:10px"><div class="m" style="display:flex;align-items:center;gap:6px;font-family:var(--font-round);font-weight:700;font-size:12px">${I('fuel', 13)} Depo Seviyesi</div>
        <div class="fuelseg">${levels.map(([val, t]) => `<button data-act="cset" data-v="fuelLevel:${val}" class="${c.fuelLevel >= val ? 'on' : ''}" style="${c.fuelLevel >= val ? `background:${fill}` : ''}">${t}</button>`).join('')}</div>
        ${c.fuelLevel <= 0.25 ? '<span class="c2" style="color:#FF9500">Düşük yakıt — yolculuğu planlarken doldurmayı unutma.</span>' : ''}</div>
      <div class="stack" style="gap:18px">
        ${pseg('Yolculuk Tipi', 'roundTrip', [['false', 'Tek Yön'], ['true', 'Gidiş-Dönüş']], c.roundTrip)}
        ${pseg('Yol Tipi', 'tripType', [[0, 'Şehir İçi'], [1, 'Uzun Yol'], [2, 'Karma']], c.tripType)}
        ${pseg('Yol Şartları', 'terrain', [[0, 'Düz'], [0.2, 'Engebeli'], [0.5, 'Dağlık']], c.terrain)}
        <div class="stack" style="gap:6px">${pseg('Sürüş Tarzı', 'style', [[0.85, 'Eko'], [1, 'Normal'], [1.3, 'Hızlı']], c.style)}<div class="m" style="display:flex;gap:5px;align-items:flex-start;font-size:11px;line-height:14px">${I('info', 10)}<span>${styleCaption[c.style]}</span></div></div>
        ${toggleRow('fan', 'Klima', 'climate', c.climate)}</div>
      <div class="stack" style="gap:16px">${toggleRow('sliders', 'Manuel fiyat düzeltmeleri', 'manual', c.manual)}
        ${c.manual ? `<div class="stack" style="gap:10px"><div class="m" style="font-family:var(--font-round);font-weight:700;font-size:12px">Yakıt Fiyatı</div><label style="display:flex;align-items:center;padding:14px;border-radius:16px;background:var(--surface);box-shadow:inset 0 0 0 1px var(--border)"><input data-role="fuelText" inputmode="decimal" placeholder="Otomatik" value="${F.esc(c.fuelText)}" style="flex:1;border:0;background:none;outline:none;font-family:var(--font-round);font-weight:600;font-size:17px"><span class="c1 w7 m" style="padding:4px 8px;border-radius:99px;background:rgba(120,120,128,.1)">TL/L</span></label></div>
        <div class="stack" style="gap:10px"><div class="m" style="font-family:var(--font-round);font-weight:700;font-size:12px">Tahmini Gişe</div><label style="display:flex;align-items:center;padding:14px;border-radius:16px;background:var(--surface);box-shadow:inset 0 0 0 1px var(--border)"><input data-role="tollText" inputmode="decimal" placeholder="Otomatik" value="${F.esc(c.tollText)}" style="flex:1;border:0;background:none;outline:none;font-family:var(--font-round);font-weight:600;font-size:17px"><span class="c1 w7 m" style="padding:4px 8px;border-radius:99px;background:rgba(120,120,128,.1)">TL</span></label></div>` : ''}</div></div>`;
  };

  V.calc = (S) => {
    const c = S.calc; const v = vehicleById(c.vehicleId);
    const place = c.place && CL.PLACES.find((p) => p.id === c.place);
    const price = unitPrice(v);
    const vehicleRow = `<button data-act="vehiclepick" style="display:flex;align-items:center;gap:12px;width:calc(100% - 32px);margin:16px 16px 0;padding:13px 16px;border-radius:12px;background:var(--sunken)"><span style="width:38px;height:38px;border-radius:12px;background:color-mix(in srgb,var(--primary) 12%,transparent);color:var(--primary);display:grid;place-items:center">${I('car', 16)}</span>
      <span class="stack" style="gap:2px;min-width:0;flex:1"><span class="sg tp ell" style="font-size:15px;line-height:19px">${F.esc(v.name)}</span><span class="c2 m ell">${F.fix(v.avg, 1)} L/100km • ${v.fuel} • ${F.comma(price)} ₺/L</span></span>
      <span class="lbl k4" style="font-size:9px;color:var(--primary);padding:4px 7px;border-radius:99px;background:color-mix(in srgb,var(--primary) 10%,transparent)">HGS ${v.cls}. SINIF</span><span class="m" style="opacity:.7">${I('chevUD', 12)}</span></button>`;
    // Bir üstteki kart varış noktasını gösteriyor; onun altındaki boşluk (12) stack ile.
    const routeTitle = place ? `${place.name}` : 'Varış noktası seç';
    const view = place ? CL.routeView(S, place, c.pick) : null;
    const pointsCard = `<button class="card stack" data-act="openroutemap" style="--p:16px;gap:10px;width:100%;text-align:left"><div style="display:flex;align-items:center;gap:12px">
        <div class="stack" style="align-items:center;gap:3px"><span class="dot7" style="width:10px;height:10px;background:var(--primary)"></span><span style="width:1.5px;height:18px;background:var(--border)"></span><span class="dot7" style="width:10px;height:10px;background:var(--toll)"></span></div>
        <div class="stack" style="gap:10px;flex:1;min-width:0"><span class="sg tp ell" style="font-size:15px;line-height:19px">Mevcut Konum</span><span class="sg ell" style="font-size:15px;line-height:19px;color:var(${place ? '--text' : '--muted'})">${routeTitle}</span></div>
        <span class="primary">${I(place ? 'turnDiamond' : 'search', 17)}</span></div><hr class="div">
      <div style="display:flex;align-items:center"><span class="primary" style="display:inline-flex;align-items:center;gap:5px">${I('plusCircle', 12)}<span class="c1 w6">Ara Durak Ekle</span></span><span style="flex:1"></span>${view ? `<span class="c1 m">${(view.route.km * view.mult).toFixed(0)} km • Toplam Yol</span>` : ''}</div></button>`;

    let body = '';
    if (!place) {
      body = `<div class="card mx stack" style="--p:0;align-items:center;gap:10px;padding:34px 0"><span class="m" style="opacity:.5">${I('map', 34)}</span><span class="sub m">Rota seçin, maliyet hesaplansın</span></div>`;
    } else {
      const { route, e, mult } = view;
      const fuel = Math.max(e.total * mult - e.toll * mult, 0); const toll = e.toll * mult; const total = e.total * mult;
      const alts = place.routes.map((r, i) => ({ r, i, e: CL.estimate(r, v, { terrain: c.terrain, style: c.style, climate: c.climate }) }));
      const cheapest = Math.min(...alts.map((a) => a.e.total)); const fastest = Math.min(...alts.map((a) => a.r.min));
      const ordered = [alts.find((a) => a.i === c.pick), ...alts.filter((a) => a.i !== c.pick).sort((a, b) => a.e.total - b.e.total)];
      const label = (k) => String.fromCharCode(65 + k);
      const switcher = alts.length > 1 ? `<div class="stack" style="gap:8px"><div class="lbl k8">ROTA SEÇENEKLERİ</div><div class="stack" style="gap:8px">${ordered.map((a, k) => {
        const cheap = a.e.total <= cheapest + 0.5; const delta = a.r.min - fastest;
        return `<button class="route-opt ${k === 0 ? 'on' : ''}" data-act="pickroute" data-v="${a.i}"><div style="display:flex;align-items:flex-start;gap:10px"><span class="badge" style="${k === 0 ? 'background:var(--primary);color:#fff' : 'background:var(--sunken);color:var(--text-2)'}">ROTA ${label(k)}</span><span class="sg tp" style="font-size:15px;line-height:20px;flex:1">${F.esc(a.r.name)}</span><span style="display:flex;align-items:baseline;gap:2px;flex-shrink:0"><b class="sgb" style="font-size:19px;color:var(${cheap ? '--savings' : '--text'})">${F.dec(a.e.total * mult)}</b><span class="sgb" style="font-size:12px;color:var(${cheap ? '--savings' : '--primary'})">₺</span></span></div>
          <div style="display:flex;align-items:center;gap:8px;margin-top:8px" class="c1 w5 t2"><span>${minsText(a.r.min)}</span><i style="width:3px;height:3px;border-radius:50%;background:rgba(100,116,139,.4)"></i><span>${(a.r.km * mult).toFixed(0)} km</span><i style="width:3px;height:3px;border-radius:50%;background:rgba(100,116,139,.4)"></i>${a.e.toll > 0 ? `<span class="toll w6">${F.dec(a.e.toll * mult)} ₺ gişe</span>` : '<span class="savings w6">Gişesiz</span>'}<span style="flex:1"></span>${delta >= 5 ? `<span class="c2 w6 m" style="padding:3px 7px;border-radius:99px;background:var(--sunken)">+${minsText(delta)}</span>` : ''}</div></button>`;
      }).join('')}</div></div>` : '';
      const trafficLabel = e.delay < 1.15 ? ['Akıcı', '#34C759'] : e.delay < 1.45 ? ['Yoğun', '#FF9500'] : ['Kilit', '#FF3B30'];
      const totalBlock = `<div class="card stack" style="--p:16px;gap:14px"><div style="display:flex;align-items:flex-start"><div class="stack" style="gap:4px"><span class="lbl k8">TOPLAM MALİYET</span><div style="display:flex;align-items:baseline;gap:4px"><span class="sgb tp" style="font-size:40px;line-height:46px">${F.dec(total)}</span><span class="sgb cur" style="font-size:20px">₺</span></div></div><span style="flex:1;min-width:8px"></span>
        <div class="stack" style="align-items:flex-end;gap:5px"><span class="c2 w6 t2">${c.roundTrip ? 'Gidiş · Dönüş' : 'Gidiş · Tek Yön'}</span><div style="display:flex;align-items:center;gap:6px"><span class="c2 w6 m" style="padding:3px 7px;border-radius:99px;background:var(--sunken)">${(route.km * mult).toFixed(0)} km</span><button data-act="resetroute" class="m" style="opacity:.5" aria-label="Rotayı temizle">${I('xmarkCircle', 15)}</button></div></div></div>
        ${V.splitBar(fuel, toll, 9)}<div class="row2" style="--n:2">${V.metric('Akaryakıt', F.dec(fuel), '₺', 'var(--primary)', 'fuel')}${V.metric(route.tolls.length ? 'Gişe' : 'Gişe', F.dec(toll), '₺', 'var(--toll)', 'roadLanes')}</div></div>`;
      const tollSection = `<div class="card" style="--p:0;overflow:hidden"><div style="position:relative">${V.previewMap(route, place, mult)}</div>
        ${route.tolls.length ? `<div style="padding:14px"><div style="display:flex;padding-bottom:10px"><span class="lbl k8">GEÇİŞ NOKTALARI</span><span style="flex:1"></span><span class="sgb toll" style="font-size:13px">${F.dec(route.tolls.reduce((a, s) => a + s.amount, 0) * mult)} ₺</span></div>
          ${route.tolls.map((s, i) => `${i ? '<hr class="div" style="margin-left:34px">' : ''}<div style="display:flex;align-items:center;gap:12px;padding:10px 0"><span class="sgb m" style="width:22px;height:22px;border-radius:50%;background:var(--sunken);display:grid;place-items:center;font-size:12px">${i + 1}</span><div class="stack" style="gap:2px;flex:1;min-width:0"><span class="sg tp ell" style="font-size:14px;line-height:19px">${F.esc(s.label)}</span><span class="c2 m">KM ${s.km}</span></div><span class="sgb toll" style="font-size:15px">${F.dec(s.amount)} ₺</span></div>`).join('')}
          ${c.roundTrip ? '<span class="c2 m">Dönüşte aynı ücretler tekrar ödenir.</span>' : ''}</div>` : ''}</div>`;
      const details = `<div class="card" style="--p:16px"><button data-act="coll" data-v="details" style="display:flex;align-items:center;width:100%"><span class="sg t2" style="font-size:14px">Hesap ayrıntıları</span><span style="flex:1"></span><span class="primary" style="transition:transform .2s;transform:rotate(${c.detailsOpen ? 90 : 0}deg)">${I('chevR', 12)}</span></button>
        ${c.detailsOpen ? `<div class="stack" style="gap:10px;padding-top:14px"><div style="display:flex;gap:8px;align-items:center"><span style="display:inline-flex;align-items:center;gap:5px;padding:5px 10px;border-radius:99px;font-size:11px;font-weight:900;background:${trafficLabel[1]}1a;color:${trafficLabel[1]}">${I('car', 11)} ${trafficLabel[0]}</span></div>
          <div class="row2" style="gap:10px">${[['clock', 'Süre', String(Math.round(route.min)), 'dk', '#FF9500'], ['speedometer', 'Trafik Hızı', String(Math.round(e.avgSpeed)), 'km/s', '#007AFF'], ['roadLanes', 'Gişe', F.dec(e.toll), '₺', 'var(--toll)']].map(([ic, l, val, u, col]) => `<div class="stack" style="gap:8px;padding:12px;border-radius:16px;background:color-mix(in srgb,${col} 5%,transparent)"><span style="width:32px;height:32px;border-radius:10px;background:color-mix(in srgb,${col} 10%,transparent);color:${col};display:grid;place-items:center">${I(ic, 14)}</span><span><span style="display:inline-flex;align-items:baseline;gap:2px"><b style="font-family:var(--font-round);font-weight:900;font-size:20px;line-height:24px" class="tp">${val}</b><span class="c1 w7 m">${u}</span></span><br><span style="font-size:10px;font-weight:700" class="m">${l}</span></span></div>`).join('')}</div>
          <div style="display:flex;align-items:center;gap:10px;padding:6px 10px;border-radius:10px;background:rgba(120,120,128,.05)"><span style="display:inline-flex;align-items:center;gap:4px" class="m"><span class="dot7" style="width:6px;height:6px;background:#FF9500"></span><span style="font-size:10px;font-weight:600">Örnek yakıt fiyatı</span></span><span style="display:inline-flex;align-items:center;gap:4px" class="m"><span class="dot7" style="width:6px;height:6px;background:#FF9500"></span><span style="font-size:10px;font-weight:600">Örnek gişe tablosu</span></span><span style="flex:1"></span><span style="font-size:11px;font-weight:900;color:var(--muted)">DEMO</span></div>
          <p class="c2 m">Bu bir web demosu: rota, gişe ve trafik verileri örnektir, tüketim eğrisi uygulamanın hesabının sadeleştirilmiş halidir.</p></div>` : ''}</div>`;
      const actions = `<div class="stack" style="gap:8px;padding-top:4px"><button class="btn" data-act="toast" data-v="Gerçek uygulamada burada adım adım navigasyon başlar." style="font-size:16px;padding:15px 0">${I('navNorth', 15)} Navigasyonu Başlat</button>
        <button class="btn soft" data-act="savetrip" style="${c.saved ? 'background:rgba(16,185,129,.12);color:var(--savings)' : ''}">${I(c.saved ? 'check' : 'saveDown', 15)} ${c.saved ? 'Kaydedildi' : 'Yolculuğu Kaydet'}</button>
        <div style="display:flex;gap:8px"><button class="btn line" data-act="toast" data-v="Gerçek uygulamada Apple Haritalar, Google Haritalar ve Yandex'te açılır." style="flex:1">${I('openApp', 15)} Haritada Aç</button><button class="btn line" data-act="menu" data-v="compare" style="flex:1">${I('branch', 15)} Karşılaştır</button></div></div>`;
      body = `${switcher}${totalBlock}${tollSection}${details}${actions}`;
      body = `<div class="stack mx" style="gap:12px">${body}</div>`;
    }
    const tool = `<div class="mx"><button class="card" data-act="routetypes" style="--p:0;width:100%;display:flex;align-items:center;gap:14px;padding:14px;text-align:left"><span style="width:44px;height:44px;border-radius:12px;background:color-mix(in srgb,var(--toll) 12%,transparent);color:var(--toll);display:grid;place-items:center">${I('roadLanes', 18)}</span><span class="stack" style="gap:3px;flex:1"><span class="sg tp" style="font-size:15px">Rota Tiplerini Karşılaştır</span><span class="c1 m">Şehir içi, karma ve otoyol senaryolarında 100 km kaça mal olur.</span></span><span class="m" style="opacity:.6">${I('chevR', 12)}</span></button></div>`;
    return `<div class="stack gap12" style="padding-bottom:8px">
      <div class="stack" style="gap:12px"><div class="stack mx" style="gap:12px;margin-top:0">${vehicleRow ? '' : ''}</div>
      <div class="stack" style="gap:12px">${vehicleRow}<div class="mx">${pointsCard}</div>${place ? '' : ''}</div>${body}</div>
      ${collapsible('Hızlı Rotalar', c.quickOpen, 'quick', V.quickRoutes())}${collapsible('Yolculuk Ayarları', c.settingsOpen, 'settings', V.config(S))}${tool}</div>`;
  };

  // Hesapla'daki küçük harita önizlemesi (RoutePreviewMap).
  V.previewMap = (route, place, mult) => {
    const rand = CL.rng(CL.hashStr(route.name + place.id));
    let bg = '';
    for (let i = 0; i < 9; i++) bg += `<path d="M${-20 + rand() * 60} ${rand() * 150} C ${100 + rand() * 60} ${rand() * 150}, ${200 + rand() * 60} ${rand() * 150}, 360 ${rand() * 150}" stroke="#fff" stroke-width="${1 + rand() * 2}" fill="none" opacity=".9"/>`;
    const traffic = route.traffic < 25 ? ['Trafik akıcı', '#34C759'] : route.traffic < 45 ? ['Trafik yoğun', '#FF9500'] : ['Trafik kilit', '#FF3B30'];
    const path = 'M40 118 C 90 96, 130 60, 190 76 S 280 50, 300 32';
    const chips = `<div style="position:absolute;top:10px;left:10px;display:inline-flex;align-items:center;gap:6px;padding:6px 9px;border-radius:99px;background:rgba(255,255,255,.82);backdrop-filter:blur(14px);font-size:12px;font-weight:600;color:#000"><span class="dot7" style="width:6px;height:6px;background:${traffic[1]}"></span>${traffic[0]}</div>${route.tolls.length ? `<div style="position:absolute;top:10px;right:10px;display:inline-flex;align-items:center;gap:6px;padding:6px 9px;border-radius:99px;background:rgba(255,255,255,.82);backdrop-filter:blur(14px);font-size:12px;font-weight:600;color:#000"><span class="dot7" style="width:6px;height:6px;background:var(--toll)"></span>${route.tolls.length} gişe noktası</div>` : ''}`;
    return `<div style="position:relative;height:150px;background:#EEF0F2;overflow:hidden"><svg viewBox="0 0 340 150" preserveAspectRatio="xMidYMid slice" width="100%" height="100%"><rect width="340" height="150" fill="#EEF0F2"/><path d="M0 120 C 60 100, 110 138, 200 124 S 300 112, 340 130 L340 150 L0 150 Z" fill="#B9DDF3"/><path d="M180 20 C 220 10, 260 30, 300 20 L310 60 C 270 70, 230 56, 190 66 Z" fill="#CFE8C8"/>${bg}
      <path d="${path}" stroke="#007AFF" stroke-width="5" fill="none" stroke-linecap="round"/>${route.tolls.map((_, i) => `<circle cx="${110 + i * 90}" cy="${74 - i * 12}" r="5" fill="var(--toll)" stroke="#fff" stroke-width="2"/>`).join('')}<circle cx="40" cy="118" r="6" fill="#007AFF" stroke="#fff" stroke-width="2.500"/></svg>${chips}</div>`;
  };

  // ── Rota seçimi (TripMapView) ───────────────────────────────────────────
  V.routeMapSheet = (S) => {
    const c = S.calc; const v = vehicleById(c.vehicleId);
    const place = c.mapPlace && CL.PLACES.find((p) => p.id === c.mapPlace);
    const close = `<button data-act="closesheet" aria-label="Kapat" style="position:absolute;top:22px;left:20px;z-index:3;width:32px;height:32px;border-radius:50%;background:#fff;color:#8e8e93;display:grid;place-items:center;box-shadow:0 2px 8px rgba(0,0,0,.15)">${I('xmark', 13)}</button>`;
    const mapBg = (dest) => { const rand = CL.rng(41 + (dest ? dest.length : 0)); let bg = ''; for (let i = 0; i < 14; i++) bg += `<path d="M${-30 + rand() * 80} ${rand() * 460} C ${120 + rand() * 80} ${rand() * 460}, ${240 + rand() * 80} ${rand() * 460}, 440 ${rand() * 460}" stroke="#fff" stroke-width="${1 + rand() * 2.4}" fill="none" opacity=".9"/>`; return `<svg viewBox="0 0 440 460" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" style="position:absolute;inset:0"><rect width="440" height="460" fill="#EAF3DA"/><path d="M0 330 C 90 300, 150 350, 250 330 S 380 300, 440 330 L440 460 L0 460 Z" fill="#9AD1F2"/><path d="M0 60 C 80 40, 140 90, 210 70 S 330 40, 440 70 L440 0 L0 0 Z" fill="#B9DDF3"/><g>${bg}</g>`; };
    if (!place) {
      return `<div style="position:absolute;inset:0;background:#EAF3DA">${mapBg('')}</svg>${close}
        <div class="rsheet stack" style="gap:14px;padding:22px 20px calc(var(--sab) + 26px)"><div style="display:flex;align-items:center"><span style="font-family:var(--font-round);font-weight:700;font-size:20px;line-height:25px" class="tp">Nereye gidiyorsun?</span></div>
          <div style="display:flex;align-items:center;gap:10px;padding:13px 14px;border-radius:14px;background:var(--surface)" class="m">${I('search', 15)}<span class="sub">Varış noktası ara…</span></div>
          <div class="stack" style="gap:2px">${CL.PLACES.map((p) => `<button data-act="mappick" data-v="${p.id}" style="display:flex;align-items:center;gap:12px;padding:10px 4px;width:100%"><span style="width:34px;height:34px;border-radius:50%;background:rgba(0,122,255,.1);color:#007AFF;display:grid;place-items:center">${I('pin', 16)}</span><span class="stack" style="gap:1px"><span class="sg tp" style="font-size:15px">${p.name}</span><span class="c1 m">${p.sub}</span></span></button>`).join('')}</div></div></div>`;
    }
    const alts = place.routes.map((r, i) => ({ r, i, e: CL.estimate(r, v, { terrain: c.terrain, style: c.style, climate: c.climate }) }));
    const cheapest = alts.reduce((a, b) => (b.e.total < a.e.total ? b : a));
    const rest = alts.filter((a) => a !== cheapest); const fastest = rest.length ? rest.reduce((a, b) => (b.r.min < a.r.min ? b : a)) : null;
    const norm = (val, arr) => { const lo = Math.min(...arr); const hi = Math.max(...arr); return hi - lo > 1e-4 ? (val - lo) / (hi - lo) : 0; };
    const scores = alts.map((a) => norm(a.e.total, alts.map((x) => x.e.total)) * 0.4 + norm(a.r.min, alts.map((x) => x.r.min)) * 0.4 + norm(a.e.delay, alts.map((x) => x.e.delay)) * 0.2);
    const best = scores.indexOf(Math.min(...scores));
    const tagOf = (a) => (a === cheapest ? (a.e.toll === 0 ? 'En Ucuz (Gişesiz)' : 'En Ucuz') : a === fastest ? 'En Hızlı' : a.e.toll === 0 ? 'Gişesiz' : 'Dengeli');
    const tagCol = (t) => (t.startsWith('En Ucuz') || t === 'Gişesiz' ? '#34C759' : t === 'En Hızlı' ? '#007AFF' : '#FF9500');
    const sel = alts.find((a) => a.i === c.mapPick) || alts[best];
    const trafficCol = (p) => (p < 25 ? '#34C759' : p < 45 ? '#FF9500' : '#FF3B30');
    const cards = alts.map((a, k) => { const tag = tagOf(a); const on = a.i === sel.i;
      const diff = a === cheapest ? '' : (() => { const d = a.e.total - cheapest.e.total; return d > 0.5 ? `+${Math.round(d)} TL` : ''; })();
      return `<button class="rcard ${on ? 'on' : ''}" data-act="mappickroute" data-v="${a.i}"><div style="display:flex;align-items:flex-start"><div class="stack" style="gap:2px;align-items:flex-start">${k === best ? '<span class="tag" style="background:#AF52DE">★ Önerilen</span>' : ''}<span class="tag" style="background:${tagCol(tag)}">${tag}</span><span style="font-family:var(--font-round);font-weight:900;font-size:28px;line-height:34px" class="tp">${a.r.km.toFixed(1)}</span><span class="sub w7 m" style="line-height:18px">km</span><span style="display:inline-flex;align-items:center;gap:6px;margin-top:2px;font-family:var(--font-round);font-weight:700;font-size:13px" class="m">${I('clock', 13)} ${durText(a.r.min)}</span></div><span style="flex:1"></span>
        <div class="stack" style="align-items:flex-end;gap:6px"><span style="width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:${a.e.toll > 0 ? 'rgba(255,149,0,.15)' : 'rgba(52,199,89,.15)'};color:${a.e.toll > 0 ? '#FF9500' : '#34C759'}">${I(a.e.toll > 0 ? 'roadLanes' : 'check', 14)}</span><span class="tag" style="font-size:10px;color:${trafficCol(a.r.traffic)};background:${trafficCol(a.r.traffic)}1a">Trafik %${a.r.traffic}</span></div></div>
        <div class="stack" style="gap:4px;margin-top:12px"><span style="font-family:var(--font-round);font-weight:600;font-size:15px;line-height:20px;height:40px" class="tp">${F.esc(a.r.name)}</span>${diff ? `<span style="font-family:var(--font-round);font-weight:700;font-size:11px" class="m">${diff}</span>` : ''}
        <span style="font-family:var(--font-round);font-weight:900;font-size:17px" class="tp">Toplam ₺${Math.round(a.e.total)}</span><span style="font-family:var(--font-round);font-weight:700;font-size:12px;color:${a.e.toll > 0 ? '#FF9500' : '#34C759'}">Gişe ₺${Math.round(a.e.toll)}</span><span class="m" style="font-family:var(--font-round);font-weight:600;font-size:11px;line-height:14px">${F.esc(a.r.note)}</span></div></button>`; }).join('');
    const tile = (col, ic, t, v2) => `<div style="padding:8px 12px;border-radius:12px;background:${col}14"><div style="display:flex;align-items:center;gap:4px;color:${col};font-size:10px;font-weight:700">${I(ic, 10)}${t}</div><div style="font-family:var(--font-round);font-weight:900;font-size:14px" class="tp">₺${v2.toFixed(1)}</div></div>`;
    return `<div style="position:absolute;inset:0">${mapBg(place.id)}<path d="M70 290 C 130 260, 170 180, 240 200 S 340 150, 380 110" stroke="#007AFF" stroke-width="7" fill="none" stroke-linecap="round" stroke-opacity=".95"/><circle cx="70" cy="290" r="14" fill="#007AFF" stroke="#fff" stroke-width="3"/><circle cx="380" cy="110" r="14" fill="#FF3B30" stroke="#fff" stroke-width="3"/></svg>${close}
      <button data-act="chooseroute" style="position:absolute;top:22px;right:20px;z-index:3;padding:10px 20px;border-radius:99px;background:#007AFF;color:#fff;font-family:var(--font-round);font-weight:700;font-size:17px;box-shadow:0 4px 12px rgba(0,122,255,.35)">Rotayı Seç</button>
      <div class="rsheet stack" style="gap:15px;padding-top:20px"><div style="display:flex;align-items:center;padding-inline:25px"><span style="font-family:var(--font-round);font-weight:700;font-size:20px" class="tp">Önerilen Rotalar</span><span style="flex:1"></span><button data-act="mapreset" style="padding:6px 12px;border-radius:99px;background:rgba(0,122,255,.1);color:#007AFF;font-size:12px;font-weight:700">Yeni Ara</button></div>
        <div style="padding-inline:25px"><button data-act="toast" data-v="Web demosunda ara durak eklenmez." style="display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:12px 0;border-radius:14px;background:#00C7BE;color:#fff;font-family:var(--font-round);font-weight:700;font-size:15px">${I('plusCircleFill', 16)} Rotaya Durak Ekle</button></div>
        <div style="display:flex;gap:12px;padding-inline:25px">${tile('#007AFF', 'fuel', 'Yakıt', sel.e.fuel)}${sel.e.toll > 0 ? tile('#FF9500', 'roadLanes', 'Gişe', sel.e.toll) : ''}</div>
        <div style="display:flex;gap:16px;overflow-x:auto;padding:0 25px 36px;scrollbar-width:none">${cards}</div></div></div>`;
  };

  // ── Rota Tiplerini Karşılaştır (RouteComparisonView, genel senaryolar) ──
  V.routeTypes = (S) => {
    const v = vehicleById(S.calc.vehicleId); const km = 100;
    const rows = [['Şehir İçi', 'building', '--speed-3', { city: 0.85, hwy: 0.05, km, min: 176, ideal: 176, tolls: [] }, 34], ['Karma', 'map', '--primary', { city: 0.35, hwy: 0.35, km, min: 103, ideal: 103, tolls: [] }, 58], ['Otoyol', 'roadLanes', '--toll', { city: 0.05, hwy: 0.85, km, min: 65, ideal: 65, tolls: [{ amount: km * 0.42 * v.cls }] }, 92]]
      .map(([l, ic, col, r, sp]) => ({ l, ic: ic === 'building' ? 'list' : ic, col, sp, e: CL.estimate(r, v, { terrain: 0.04, style: 1, climate: false, toll: r.tolls.length ? r.tolls[0].amount : 0 }) }));
    const best = rows.reduce((a, b) => (b.e.total < a.e.total ? b : a));
    return `<div class="stack" style="gap:16px;padding-inline:16px"><div class="card" style="--p:16px;display:flex;align-items:center;gap:16px"><span style="width:44px;height:44px;border-radius:50%;background:rgba(0,122,255,.1);color:#007AFF;display:grid;place-items:center">${I('car', 18)}</span><div class="stack" style="gap:3px"><span style="font-size:15px;font-weight:700" class="tp">${F.esc(v.name)}</span><span class="c1 m">100 km için 3 genel senaryo</span></div></div>
      ${rows.map((r) => `<div class="card stack" style="--p:16px;gap:12px"><div style="display:flex;align-items:center;gap:10px"><span style="width:36px;height:36px;border-radius:10px;background:color-mix(in srgb,var(${r.col}) 12%,transparent);color:var(${r.col});display:grid;place-items:center">${I(r.ic, 15)}</span><div class="stack" style="gap:2px;flex:1"><span style="font-size:15px;font-weight:700" class="tp">${r.l}</span><span class="c1 m">Ort. ${r.sp} km/s</span></div>${r === best ? '<span class="tag" style="background:rgba(52,199,89,.15);color:#34C759;padding:4px 8px">En Ekonomik</span>' : ''}<span style="font-family:var(--font-round);font-weight:900;font-size:20px;color:var(${r === best ? '--savings' : r.col})">₺${Math.round(r.e.total)}</span></div>
        <div class="split" style="--h:6px;width:100%"><i class="f" style="width:${r.e.fuel / Math.max(r.e.total, 1) * 100}%"></i><i class="t" style="flex:1"></i></div>
        <div style="display:flex;gap:16px" class="c1 m"><span>Yakıt ₺${Math.round(r.e.fuel)}</span>${r.e.toll > 0 ? `<span class="toll">Gişe ₺${Math.round(r.e.toll)}</span>` : ''}<span>Tüketim ${r.e.liters.toFixed(1)} L</span></div></div>`).join('')}
      <div class="callout" style="background:rgba(52,199,89,.08)"><span class="savings">${I('sparkles', 14)}</span><span class="sub tp"><b>${best.l}</b> senaryosu 100 km için en düşük maliyeti veriyor. Gerçek rotalarda sonuç trafiğe ve gişelere göre değişir.</span></div></div>`;
  };

  // ── Küçük sayfalar ──────────────────────────────────────────────────────
  V.info = (title, text) => `<div class="stack" style="align-items:center;gap:12px;padding:70px 32px;text-align:center"><span class="primary">${I('info', 34)}</span><div class="sg tp" style="font-size:18px">${F.esc(title)}</div><p class="sub t2">${F.esc(text)}</p></div>`;
  V.actualCost = (t, S) => `<div class="stack" style="gap:20px;padding-inline:16px"><div class="card stack" style="--p:0;gap:0"><div style="padding:12px 16px" class="lbl">Gerçek Maliyet</div><hr class="div"><label style="display:flex;align-items:center;padding:14px 16px;gap:8px"><input data-role="actual" inputmode="decimal" placeholder="Ödediğiniz tutar (₺)" value="${t.actualCost != null ? Math.round(t.actualCost) : ''}" style="flex:1;border:0;background:none;outline:none;font-size:17px"></label></div>
    <div class="card stack" style="--p:0;gap:0"><div style="display:flex;padding:14px 16px"><span>Tahmin</span><span style="flex:1"></span><b>₺${Math.round(t.totalCost)}</b></div><div data-role="actualDiff"></div></div>
    <button class="btn" data-act="saveactual" data-v="${F.esc(t.id)}" style="border-radius:14px">Kaydet</button></div>`;
  V.vehiclePick = (S) => `<div class="stack" style="gap:10px;padding-inline:16px">${S.vehicleOrder.map(vehicleById).map((v) => `<button class="card" data-act="vehiclechosen" data-v="${v.id}" style="--p:14px;display:flex;align-items:center;gap:12px;text-align:left"><span style="width:38px;height:38px;border-radius:12px;background:color-mix(in srgb,var(--primary) 12%,transparent);color:var(--primary);display:grid;place-items:center">${I('car', 16)}</span><span class="stack" style="gap:2px;flex:1"><span class="sg tp" style="font-size:15px">${F.esc(v.name)}</span><span class="c1 m">${v.year} • ${F.esc(v.brand)} ${F.esc(v.model)}</span></span>${S.calc.vehicleId === v.id ? `<span class="primary">${I('check', 18)}</span>` : ''}</button>`).join('')}</div>`;
  V.datePicker = (S) => {
    const m = S.pickMonth; const first = new Date(m.getFullYear(), m.getMonth(), 1);
    const lead = (first.getDay() + 6) % 7; const days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate(); const now = new Date();
    const cells = []; for (let i = 0; i < lead; i++) cells.push('<span></span>');
    for (let d = 1; d <= days; d++) { const date = new Date(m.getFullYear(), m.getMonth(), d, S.anchor.getHours(), S.anchor.getMinutes()); const future = date > now && !CL.D.sameDay(date, now); const sel = CL.D.sameDay(date, S.anchor); const today = CL.D.sameDay(date, now);
      cells.push(`<button data-act="pickday" data-v="${d}" ${future ? 'disabled' : ''} style="height:40px;border-radius:50%;font-size:19px;${sel ? 'background:var(--primary);color:#fff;' : today ? 'color:var(--primary);' : ''}${future ? 'opacity:.3;' : ''}">${d}</button>`); }
    return `<div class="stack" style="gap:8px;padding-inline:16px"><div style="display:flex;align-items:center"><span class="sg tp" style="font-size:19px">${F.MONTHS_LONG[m.getMonth()]} ${m.getFullYear()}</span><span style="flex:1"></span><button data-act="pickmonth" data-v="-1" class="primary" style="padding:8px 14px">${I('chevL', 16)}</button><button data-act="pickmonth" data-v="1" class="primary" style="padding:8px 14px">${I('chevR', 16)}</button></div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);text-align:center;gap:4px 0" class="m">${['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((x) => `<span class="c1 w6">${x}</span>`).join('')}${cells.join('')}</div></div>`;
  };
})();
