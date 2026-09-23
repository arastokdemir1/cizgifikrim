// CarLog web demosu — ikonlar. Apple'ın SF Symbols'ü web'de kullanılamadığı
// için uygulamadaki simgelerin karşılıkları elle çizilmiş SVG'lerdir.
(() => {
  'use strict';
  const S = (d, o = {}) => ({ d, vb: o.vb || '0 0 24 24', fill: o.fill !== false && !o.stroke, sw: o.sw || 2 });
  const stroke = (d, sw = 2) => ({ d, vb: '0 0 24 24', fill: false, sw });
  const fill = (d, vb = '0 0 24 24') => ({ d, vb, fill: true, sw: 0 });

  const CAR = 'M6 8l2.4-5A3 3 0 0 1 11.1 1h7.8a3 3 0 0 1 2.7 2L24 8a3 3 0 0 1 3 3v6a2 2 0 0 1-2 2h-1a3 3 0 0 1-6 0h-6a3 3 0 0 1-6 0H5a2 2 0 0 1-2-2v-6a3 3 0 0 1 3-3zm3.6-.2h10.8l-1.5-3.4a1 1 0 0 0-.9-.6h-6a1 1 0 0 0-.9.6zM8 12.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm14 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z';

  const ICONS = {
    menu: fill('M2 5.4h20v2.4H2zM2 10.8h20v2.4H2zM2 16.2h20v2.4H2z'),
    search: stroke('M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM15.4 15.4L21 21', 2.6),
    plus: stroke('M12 4v16M4 12h16', 3),
    plusCircle: stroke('M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8v8M8 12h8', 1.7),
    plusCircleFill: { d: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z', vb: '0 0 24 24', fill: true, sw: 0, extra: '<path d="M12 7v10M7 12h10" stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none"/>' },
    chevL: stroke('M15 5l-7 7 7 7', 2.8),
    chevR: stroke('M9 5l7 7-7 7', 2.8),
    chevU: stroke('M5 15l7-7 7 7', 2.8),
    chevD: stroke('M5 9l7 7 7-7', 2.8),
    chevUD: stroke('M7 9l5-5 5 5M7 15l5 5 5-5', 2.4),
    xmark: stroke('M6 6l12 12M18 6L6 18', 2.8),
    xmarkCircle: { d: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z', vb: '0 0 24 24', fill: true, sw: 0, extra: '<path d="M8.5 8.5l7 7M15.5 8.5l-7 7" stroke="#fff" stroke-width="2.2" stroke-linecap="round" fill="none"/>' },
    xmarkCircleOutline: stroke('M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9 9l6 6M15 9l-6 6', 1.8),
    location: fill('M21.5 2.5L2.8 10.6l7.4 2.6 2.6 7.4z'),
    roadLanes: stroke('M3.5 21L8.5 3M20.5 21L15.5 3M12 4v3.5M12 10.5v3M12 16.5v3.5', 2.4),
    car: { d: CAR, vb: '0 0 30 22', fill: true, sw: 0 },
    infinity: stroke('M12 12c-2.2-3.2-4.3-4.6-6.2-4.6C3.7 7.4 2 9 2 12s1.700 4.600 3.800 4.600c1.900 0 4-1.400 6.200-4.600s4.300-4.600 6.200-4.600c2.100 0 3.800 1.600 3.800 4.600s-1.700 4.600-3.800 4.600c-1.900 0-4-1.400-6.200-4.600z', 1.9),
    calendar: { d: 'M6 3.5h12a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-11a3 3 0 0 1 3-3z', vb: '0 0 24 24', fill: true, sw: 0, extra: '<path d="M3 9h18" stroke="#fff" stroke-width="1.6"/><g fill="#fff"><circle cx="8" cy="12.5" r="1.1"/><circle cx="12" cy="12.5" r="1.1"/><circle cx="16" cy="12.5" r="1.1"/><circle cx="8" cy="16.5" r="1.1"/><circle cx="12" cy="16.5" r="1.1"/><circle cx="16" cy="16.5" r="1.1"/></g>' },
    lock: fill('M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm-3 8V7a3 3 0 0 1 6 0v3z'),
    sunrise: { d: 'M12 8v-5M9 5l3-3 3 3M2 20h20M5.500 16a6.500 6.500 0 0 1 13 0M4.500 11.500l1.300 1.300M19.500 11.500l-1.300 1.300', vb: '0 0 24 24', fill: false, sw: 2 },
    sun: stroke('M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2.500M12 19.500V22M2 12h2.500M19.500 12H22M4.900 4.900l1.800 1.800M17.300 17.300l1.800 1.800M4.900 19.100l1.800-1.800M17.300 6.700l1.800-1.800', 2),
    sunset: { d: 'M12 3v5M9 6l3 3 3-3M2 20h20M5.500 16a6.500 6.500 0 0 1 13 0M4.500 11.500l1.300 1.300M19.500 11.500l-1.300 1.300', vb: '0 0 24 24', fill: false, sw: 2 },
    moon: fill('M20 14.500A8.500 8.500 0 0 1 9.500 4a8.500 8.500 0 1 0 10.500 10.500zM17 3l.7 1.800L19.500 5.500l-1.800.7L17 8l-.7-1.800L14.500 5.500l1.800-.7z'),
    fuel: fill('M4 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16h1v1.500H3V21zm3-15v5h5V6zM17 7.500l2.700 2.700a3 3 0 0 1 .8 2V17a1.200 1.200 0 0 0 2.400 0v-6l-3.500-3.500z'),
    gauge: { d: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', vb: '0 0 24 24', fill: false, sw: 2, extra: '<path d="M12 12.500l3.300-3.800" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M6.500 12h.01M12 6.500v.01M17.500 12h.01M8.200 8.200l.01.01M15.800 8.200l.01.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12.500" r="1.400" fill="currentColor"/>' },
    book: fill('M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm1 3v1.500h2V5zm5 0v6.500l2-1.500 2 1.500V5z'),
    ellipsis: fill('M4 10.500a1.500 1.500 0 1 0 0 3 1.500 1.500 0 0 0 0-3zM12 10.500a1.500 1.500 0 1 0 0 3 1.500 1.500 0 0 0 0-3zM20 10.500a1.500 1.500 0 1 0 0 3 1.500 1.500 0 0 0 0-3z'),
    chartLine: { d: 'M3 2v18a1 1 0 0 0 1 1h18', vb: '0 0 24 24', fill: false, sw: 2.400, extra: '<path d="M6 15l4.500-5 3.500 3.500L19.500 6" stroke="currentColor" stroke-width="2.200" stroke-linecap="round" stroke-linejoin="round" fill="none"/><g fill="currentColor"><circle cx="10.500" cy="10" r="1.800"/><circle cx="19.500" cy="6" r="1.800"/></g>' },
    chartBars: fill('M4 20V10h3v10zM9.500 20V4h3v16zM15 20v-7h3v7zM20.500 20V8H22v12z'),
    flag: fill('M5 2h1.800v20H5zM8 3h11l-2.500 4.500L19 12H8z'),
    playCircle: { d: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z', vb: '0 0 24 24', fill: true, sw: 0, extra: '<path d="M10 8l6 4-6 4z" fill="#fff"/>' },
    sparkles: fill('M9 3l1.600 4.400L15 9l-4.400 1.600L9 15l-1.600-4.400L3 9l4.400-1.600zM18 13l.9 2.600 2.600.9-2.600.9L18 20l-.9-2.600-2.600-.9 2.600-.9z'),
    hand: fill('M8 11V5.500a1.500 1.500 0 0 1 3 0V10h.5V3.500a1.500 1.500 0 0 1 3 0V10h.5V5a1.500 1.500 0 0 1 3 0v8.500c0 4-2.500 7.500-6.500 7.500-3 0-4.700-1.600-6-4.300L4.500 13a1.500 1.500 0 0 1 2.500-1.600z'),
    clock: { d: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z', vb: '0 0 24 24', fill: true, sw: 0, extra: '<path d="M12 6.500V12l3.500 2" stroke="#fff" stroke-width="2.200" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' },
    steering: { d: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', vb: '0 0 24 24', fill: false, sw: 2, extra: '<circle cx="12" cy="12" r="2.200" fill="currentColor"/><path d="M3.500 10.500c5 .8 12 .8 17 0M12 14.200V21M7 18.500l3-3.500M17 18.500l-3-3.500" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>' },
    pin: { d: 'M12 2a5 5 0 0 0-1.400 9.800V16', vb: '0 0 24 24', fill: false, sw: 2.400, extra: '<circle cx="12" cy="7" r="2" fill="currentColor"/><path d="M5 18.500c0 1.900 3.100 3.500 7 3.500s7-1.600 7-3.500-3.100-3.500-7-3.500" stroke="currentColor" stroke-width="2.200" fill="none" stroke-linecap="round"/>' },
    map: stroke('M3 6.500l6-2.500 6 2.500 6-2.500v13.500l-6 2.500-6-2.500-6 2.500zM9 4v13.500M15 6.500V20', 1.900),
    mapFill: fill('M2.500 6l6.500-2.500v14.500L2.500 20.500zM10.500 3.500l5 2.500v14.500l-5-2.500zM17 6l4.500-2.500v14.500L17 20.500z'),
    list: stroke('M6 2.500h12a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-15a2 2 0 0 1 2-2zM8 8h.01M8 12h.01M8 16h.01M11 8h6M11 12h6M11 16h6', 2),
    car2: { d: CAR, vb: '-2 -2 34 26', fill: true, sw: 0 },
    carplay: { d: 'M12 20.500c-4 0-6-.5-6-3.500v-2a2 2 0 0 1 1.200-1.800L8.500 10a2.500 2.500 0 0 1 2.300-1.500h2.400A2.500 2.500 0 0 1 15.500 10l1.300 3.200A2 2 0 0 1 18 15v2c0 3-2 3.500-6 3.500z', vb: '0 0 24 24', fill: true, sw: 0, extra: '<path d="M8.500 4.500a5 5 0 0 1 7 0M6 2.200a8.500 8.500 0 0 1 12 0" stroke="currentColor" stroke-width="1.800" stroke-linecap="round" fill="none"/><circle cx="8.600" cy="16" r="1.100" fill="#fff"/><circle cx="15.400" cy="16" r="1.100" fill="#fff"/>' },
    gear: { d: 'M12 8.500a3.500 3.500 0 1 0 0 7 3.500 3.500 0 0 0 0-7z', vb: '0 0 24 24', fill: false, sw: 2, extra: '<path d="M12 2.500v3M12 18.500v3M2.500 12h3M18.500 12h3M5.300 5.300l2.100 2.100M16.600 16.600l2.100 2.100M5.300 18.700l2.100-2.100M16.600 7.400l2.100-2.100" stroke="currentColor" stroke-width="3.200" stroke-linecap="round"/><circle cx="12" cy="12" r="5.500" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="2.600" fill="var(--surface, #fff)" stroke="none"/>' },
    info: stroke('M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v5.500M12 7.700v.01', 1.900),
    arrowUR: stroke('M7 17L17 7M8 7h9v9', 2.400),
    arrowDR: stroke('M7 7l10 10M17 8v9H8', 2.400),
    arrowLR: stroke('M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4', 2),
    turnDiamond: { d: 'M12 1.500L22.500 12 12 22.500 1.500 12z', vb: '0 0 24 24', fill: true, sw: 0, extra: '<path d="M9.500 16v-4.500a1.500 1.500 0 0 1 1.500-1.500h4M13.500 7.500l2.500 2.500-2.500 2.500" stroke="#fff" stroke-width="1.900" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' },
    navNorth: fill('M12 2l7 19-7-4-7 4zM11 22v0'),
    saveDown: stroke('M12 3v11M8 10l4 4 4-4M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5', 2),
    openApp: { d: 'M5 3h14a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z', vb: '0 0 24 24', fill: true, sw: 0, extra: '<path d="M8.500 15.500l7-7M9.500 8.500h6v6" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' },
    branch: stroke('M12 21v-8M12 13c0-3-5-3-5-8M12 13c0-3 5-3 5-8M4.500 8L7 4.500 9.500 8M14.500 8L17 4.500 19.500 8', 2),
    fan: fill('M12 12c0-4 1-8.500 4.500-8.500S19 8 15.500 10.500C14.500 11.200 13 12 12 12zM12 12c4 0 8.500 1 8.500 4.500S16 19 13.500 15.500C12.800 14.500 12 13 12 12zM12 12c0 4-1 8.500-4.500 8.500S5 16 8.500 13.500C9.500 12.800 11 12 12 12zM12 12c-4 0-8.500-1-8.500-4.500S8 5 10.500 8.500c.7 1 1.500 2.500 1.500 3.500z'),
    sliders: stroke('M4 7h9M17 7h3M4 17h3M11 17h9M13 4.500v5M7 14.500v5', 2.200),
    check: fill('M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1.500 14.500L6 12l1.600-1.600 2.900 2.900 5.900-5.900L18 9.100z'),
    warn: fill('M12 2.500a2 2 0 0 1 1.700 1l8.200 14.500a2 2 0 0 1-1.700 3H3.800a2 2 0 0 1-1.700-3L10.300 3.500a2 2 0 0 1 1.700-1zM11 9v5h2V9zm0 7v2h2v-2z'),
    refresh: stroke('M20 12a8 8 0 0 1-14 5.300M4 12a8 8 0 0 1 14-5.300M18 2.500v4.500h-4.500M6 21.500V17h4.500', 2.200),
    pencil: stroke('M4 20l1-4L16.500 4.500a2 2 0 0 1 3 3L8 19z', 2.200),
    crown: fill('M3 8l4.500 4L12 5l4.500 7L21 8l-2 11H5z'),
    fx: { d: '', vb: '0 0 24 24', fill: true, sw: 0, extra: '<text x="12" y="16.500" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-weight="700" font-size="13" fill="currentColor">ƒ(x)</text>' },
    userTrip: { d: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z', vb: '0 0 24 24', fill: false, sw: 2 },
    speedometer: { d: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', vb: '0 0 24 24', fill: false, sw: 2.200, extra: '<path d="M12 13.500l3.400-4.400" stroke="currentColor" stroke-width="2.400" stroke-linecap="round"/><path d="M6.200 13a6 6 0 0 1 .3-2M12 6.200V7M17.800 13a6 6 0 0 0-.3-2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' },
  };

  window.CLIcon = function icon(name, size = 16, cls = '', style = '') {
    const i = ICONS[name];
    if (!i) return '';
    const paint = i.fill ? 'fill="currentColor"' : `fill="none" stroke="currentColor" stroke-width="${i.sw}" stroke-linecap="round" stroke-linejoin="round"`;
    const w = i.vb.split(' ');
    const ratio = Number(w[2]) / Number(w[3]);
    return `<svg class="ic ${cls}" width="${Math.round(size * ratio * 10) / 10}" height="${size}" viewBox="${i.vb}" ${paint} aria-hidden="true" style="${style}"><path d="${i.d}"/>${i.extra || ''}</svg>`;
  };
})();
