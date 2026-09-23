// CarLog web demosu — veri ve hesap katmanı.
// Örnek veri: CarLog/Utils/DemoSeed.swift (Egea + Golf, 45 gün).
// Hesaplar: AnalysisEngine.swift ve TripHistoryView'daki gruplama kurallarının
// birebir karşılığı. Hiçbir sunucuya veri gönderilmez.
(() => {
  'use strict';

  // ── Biçim ─────────────────────────────────────────────────────────────────
  const nfDec = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0, useGrouping: 'always' });
  const MONTHS_LONG = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  const DAYS_LONG = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

  const F = {
    esc: (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
    // TripHistoryView.decimal — Türkçe binlik ayracı, ondalık yok (12.650).
    dec: (v) => nfDec.format(Math.round(v)),
    // String(format: "%.Nf") — uygulama burada nokta kullanıyor.
    fix: (v, n = 1) => Number(v).toFixed(n),
    comma: (v, n = 2) => Number(v).toFixed(n).replace('.', ','),
    pad: (n) => String(n).padStart(2, '0'),
    time: (d) => `${F.pad(d.getHours())}:${F.pad(d.getMinutes())}`,
    mediumDateTime: (d) => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()} ${F.time(d)}`,
    fullDate: (d) => `${d.getDate()} ${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()} · ${F.time(d)}`,
    dayShort: (d) => `${d.getDate()} ${MONTHS[d.getMonth()]}`,
    upperTR: (s) => s.toLocaleUpperCase('tr-TR'),
    MONTHS, MONTHS_LONG, DAYS_LONG,
  };

  // ── Tarih ─────────────────────────────────────────────────────────────────
  const D = {
    startOfDay: (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()),
    addDays: (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, d.getHours(), d.getMinutes()),
    startOfWeek: (d) => D.addDays(D.startOfDay(d), -((d.getDay() + 6) % 7)), // Pazartesi
    sameDay: (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(),
    interval(kind, anchor) {
      if (kind === 'day') { const s = D.startOfDay(anchor); return [s, D.addDays(s, 1)]; }
      if (kind === 'week') { const s = D.startOfWeek(anchor); return [s, D.addDays(s, 7)]; }
      const s = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
      return [s, new Date(s.getFullYear(), s.getMonth() + 1, 1)];
    },
    step(kind, anchor, n) {
      if (kind === 'day') return D.addDays(anchor, n);
      if (kind === 'week') return D.addDays(anchor, 7 * n);
      return new Date(anchor.getFullYear(), anchor.getMonth() + n, Math.min(anchor.getDate(), 28), anchor.getHours(), anchor.getMinutes());
    },
    sameGranularity(a, b, kind) {
      const [s, e] = D.interval(kind, b);
      return a >= s && a < e;
    },
    isToday: (d) => D.sameDay(d, new Date()),
    isYesterday: (d) => D.sameDay(d, D.addDays(new Date(), -1)),
  };

  // ── Örnek veri (DemoSeed.swift) ───────────────────────────────────────────
  const VEHICLES = [
    { id: 'egea', name: 'Egea', brand: 'Fiat', model: 'Egea 1.6 Multijet 130 HP', year: 2022, fuel: 'Dizel', avg: 4.5, city: 5.0, hwy: 4.1, tank: 50, cls: 1, source: 'catalog_exact' },
    { id: 'golf', name: 'Golf', brand: 'Volkswagen', model: 'Golf 1.5 TSI', year: 2020, fuel: 'Benzin', avg: 6.0, city: 7.3, hwy: 5.1, tank: 50, cls: 1, source: 'catalog_derived' },
  ];
  const FUEL_PRICE = { Dizel: 52.0, Benzin: 49.5 }; // DemoSeed'deki birim fiyatlar
  const PUMP = { gasoline: 80.23, diesel: 100.25, lpg: 32.30 }; // Akaryakıt Radarı örnek fiyatları
  const ROUTES = [
    ['Ev – Ofis', 18.4, 0], ['Ofis – Ev', 19.1, 0], ['Kadıköy – Beşiktaş', 12.2, 0],
    ['Osmangazi Köprüsü', 148.0, 995], ['Ev – Market', 4.6, 0], ['İstanbul – Bursa', 152.0, 995],
    ['Ev – Havalimanı', 41.3, 78],
  ];
  const vehicleById = (id) => VEHICLES.find((v) => v.id === id) || VEHICLES[0];

  // Tekrarlanabilir rastgelelik: aynı yolculuk her açılışta aynı hız çizelgesini üretir.
  function rng(seed) {
    let s = seed >>> 0;
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  function hashStr(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  // 15 sn aralıklı, gerçekçi bir hız çizelgesi: dur-kalk parçaları + seyir.
  function speedTimeline(km, hwy, seed) {
    const rand = rng(seed);
    const avg = hwy ? 96 : 38;
    const peak = hwy ? 122 : 66;
    const points = Math.max(12, Math.round((km / avg) * 3600 / 15));
    const out = [];
    let v = 0; let target = 0; let hold = 0;
    for (let i = 0; i < points; i++) {
      if (hold <= 0) {
        const r = rand();
        if (hwy) target = i < 6 || i > points - 6 ? 25 + rand() * 30 : 88 + rand() * (peak - 88);
        else target = r < 0.22 ? 0 : 18 + rand() * (peak - 18) * (r > 0.85 ? 1 : 0.62);
        hold = 2 + Math.floor(rand() * (hwy ? 14 : 5));
      }
      v += (target - v) * 0.55 + (rand() - 0.5) * 3;
      v = Math.max(0, Math.min(peak, v));
      out.push(Math.round(v * 10) / 10);
      hold -= 1;
    }
    out[out.length - 1] = Math.min(out[out.length - 1], 8);
    return out;
  }

  function driveStats(speeds, interval = 15) {
    const n = speeds.length || 1;
    const mean = speeds.reduce((a, b) => a + b, 0) / n;
    const max = Math.max(0, ...speeds);
    let fast = 0; let stops = 0; let stopped = false;
    speeds.forEach((s) => {
      if (s >= 100) fast += 1;
      if (s < 3) { if (!stopped) { stops += 1; stopped = true; } } else if (s > 8) stopped = false;
    });
    return { avg: mean, max, highShare: fast / n, stops, seconds: n * interval };
  }

  function makeTrip({ label, km, toll, vehicle, date, auto = true, speeds, route }) {
    const rate = vehicle.avg;
    const litres = km * rate / 100;
    const fuel = litres * FUEL_PRICE[vehicle.fuel];
    const hwy = km > 100;
    const seed = hashStr(`${label}|${date.getTime()}`);
    const timeline = speeds || speedTimeline(km, hwy, seed);
    const st = driveStats(timeline);
    return {
      id: `${date.getTime()}-${hashStr(label) % 9973}`,
      label, distanceKm: km, tollCost: toll, fuelCost: fuel, totalCost: fuel + toll,
      liters: litres, rate, date, vehicleId: vehicle.id, vehicleName: vehicle.name,
      wasAuto: auto, wasPassenger: false, actualCost: null,
      speeds: timeline, interval: 15, avgSpeed: st.avg, maxSpeed: st.max, highShare: st.highShare, stops: st.stops,
      highwayShare: hwy ? 0.62 : 0.04, route: route || null, seed,
    };
  }

  function seedTrips() {
    const trips = [];
    let index = 0;
    const now = new Date();
    for (let day = 0; day < 45; day++) {
      const count = day % 3 === 0 ? 2 : (day % 5 === 0 ? 0 : 1);
      for (let slot = 0; slot < count; slot++) {
        const [label, km, toll] = ROUTES[index % ROUTES.length];
        index += 1;
        const vehicle = index % 4 === 0 ? VEHICLES[1] : VEHICLES[0];
        const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day, slot === 0 ? 8 : 18, 25);
        trips.push(makeTrip({ label, km, toll, vehicle, date }));
      }
    }
    return trips;
  }

  // ── AnalysisEngine ────────────────────────────────────────────────────────
  const billable = (t) => (t.wasPassenger ? 0 : t.totalCost);
  const sum = (arr, f) => arr.reduce((a, t) => a + f(t), 0);
  function totals(trips) {
    const r = { tripCount: 0, distanceKm: 0, spend: 0, fuelSpend: 0, tollSpend: 0, liters: 0, passengerTrips: 0 };
    trips.forEach((t) => {
      r.tripCount += 1; r.distanceKm += t.distanceKm; r.spend += billable(t); r.liters += t.liters;
      if (t.wasPassenger) { r.passengerTrips += 1; return; }
      r.fuelSpend += t.fuelCost; r.tollSpend += t.tollCost;
    });
    r.costPerKm = r.distanceKm > 0 ? r.spend / r.distanceKm : 0;
    r.consumptionPer100 = r.distanceKm > 0 ? r.liters / r.distanceKm * 100 : 0;
    r.averageTripKm = r.tripCount > 0 ? r.distanceKm / r.tripCount : 0;
    return r;
  }
  function byVehicle(trips) {
    const groups = {};
    trips.forEach((t) => { (groups[t.vehicleName] = groups[t.vehicleName] || []).push(t); });
    return Object.entries(groups).map(([name, list]) => ({ name, totals: totals(list) })).sort((a, b) => b.totals.spend - a.totals.spend);
  }
  function byHour(trips) {
    const c = Array(24).fill(0);
    trips.forEach((t) => { c[t.date.getHours()] += 1; });
    return c.map((n, i) => ({ id: i, tripCount: n }));
  }
  const WEEK = [['Pzt', 1], ['Sal', 2], ['Çar', 3], ['Per', 4], ['Cum', 5], ['Cmt', 6], ['Paz', 0]];
  function byWeekday(trips) {
    return WEEK.map(([label, dow]) => ({ label, distanceKm: sum(trips.filter((t) => t.date.getDay() === dow), (t) => t.distanceKm) }));
  }
  const weightedBy = (trips, f) => {
    const m = trips.filter((t) => t.avgSpeed > 0 && t.distanceKm > 0);
    const km = sum(m, (t) => t.distanceKm);
    return km > 0 ? sum(m, (t) => f(t) * t.distanceKm) / km : 0;
  };
  const averageSpeed = (trips) => weightedBy(trips, (t) => t.avgSpeed);
  const highSpeedShare = (trips) => Math.min(Math.max(weightedBy(trips, (t) => t.highShare), 0), 1);
  function stopsPer100Km(trips) {
    const w = trips.filter((t) => t.distanceKm > 0 && t.stops > 0);
    const km = sum(w, (t) => t.distanceKm);
    return km > 0 ? sum(w, (t) => t.stops) / km * 100 : 0;
  }
  function accuracy(trips) {
    const samples = trips.map((t) => (t.actualCost > 0 && t.totalCost > 0 ? (t.totalCost - t.actualCost) / t.actualCost * 100 : null)).filter((x) => x !== null);
    if (!samples.length) return null;
    return { sampleCount: samples.length, averageErrorPercent: samples.reduce((a, b) => a + Math.abs(b), 0) / samples.length, averageSignedPercent: samples.reduce((a, b) => a + b, 0) / samples.length };
  }
  const mostExpensive = (trips, n = 5) => trips.filter((t) => !t.wasPassenger && billable(t) > 0).sort((a, b) => billable(b) - billable(a)).slice(0, n);

  // ── Özet grupları (groupByDayAndPeriod) ───────────────────────────────────
  const PERIODS = [
    { name: 'Sabah', icon: 'sunrise' }, { name: 'Öğleden sonra', icon: 'sun' },
    { name: 'Akşam', icon: 'sunset' }, { name: 'Gece', icon: 'moon' },
  ];
  const periodIndex = (h) => (h >= 5 && h < 12 ? 0 : h >= 12 && h < 17 ? 1 : h >= 17 && h < 22 ? 2 : 3);
  function dayLabel(d) {
    if (D.isToday(d)) return 'Bugün';
    if (D.isYesterday(d)) return 'Dün';
    return d.getFullYear() === new Date().getFullYear()
      ? `${d.getDate()} ${MONTHS_LONG[d.getMonth()]} ${DAYS_LONG[d.getDay()]}`
      : `${d.getDate()} ${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
  }
  function groupByDayAndPeriod(trips, includeDay = true) {
    const order = []; const map = {};
    trips.forEach((t) => {
      const key = `${D.startOfDay(t.date).getTime()}#${periodIndex(t.date.getHours())}`;
      if (!map[key]) { map[key] = []; order.push(key); }
      map[key].push(t);
    });
    return order.map((key) => {
      const list = map[key]; const first = list[0]; const p = periodIndex(first.date.getHours());
      return { id: key, title: includeDay ? `${dayLabel(first.date)} · ${PERIODS[p].name}` : PERIODS[p].name, icon: PERIODS[p].icon, trips: list, totalCost: sum(list, (t) => t.totalCost) };
    });
  }

  // ── Yolculuk rotası (örnek çizim) ─────────────────────────────────────────
  // Uygulamada rota Apple Haritalar üstünde çiziliyor; burada aynı bilgiyi
  // (hıza göre renkli güzergâh) örnek bir sokak dokusu üstünde çiziyoruz.
  function routePoints(trip) {
    const rand = rng(trip.seed);
    const n = Math.max(6, Math.min(26, trip.speeds.length));
    const pts = []; let x = 40 + rand() * 30; let y = 30 + rand() * 30; let ang = 0.5 + rand() * 0.6;
    for (let i = 0; i < n; i++) {
      pts.push([x, y]);
      ang += (rand() - 0.5) * 0.9;
      const len = 20 + rand() * 16;
      x += Math.cos(ang) * len * 1.35; y += Math.sin(ang) * len * 0.75;
      x = Math.max(24, Math.min(316, x)); y = Math.max(28, Math.min(172, y));
    }
    return pts;
  }

  window.CL = { F, D, VEHICLES, vehicleById, FUEL_PRICE, PUMP, ROUTES, makeTrip, seedTrips, speedTimeline, driveStats, billable, sum,
    totals, byVehicle, byHour, byWeekday, averageSpeed, highSpeedShare, stopsPer100Km, accuracy, mostExpensive,
    PERIODS, periodIndex, dayLabel, groupByDayAndPeriod, routePoints, hashStr, rng };
})();
