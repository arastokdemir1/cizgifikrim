// CizgiFikrim "Çizgi": sayfa boyunca kaydırmayla kendini çizen tek çizgi (SVG).
// Çizgi hero'daki boş sayfada küçük bir kalem izi olarak başlar, "fikir" alanında bir forma döner,
// "ürün" alanında gerçek ürünün (CarLog / PiyasApp) ekran ana hatlarına dönüşür.
// Bağımlılık yok. Tek pasif kaydırma dinleyicisi + rAF. prefers-reduced-motion: çizgi tam çizili ve statik.
(function () {
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  window.initCounters = function () {};   // render.js uyumu: sayılar doğrudan yazılır

  // ───────────── yardımcılar: tohumlu rastgelelik, el titremesi, yumuşatma ─────────────
  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function dist(a, b) { var dx = a[0] - b[0], dy = a[1] - b[1]; return Math.sqrt(dx * dx + dy * dy); }
  // Catmull-Rom ile yumuşat + sabit adımla yeniden örnekle + el titremesi
  function smooth(pts, step, amp, seed) {
    if (pts.length < 2) return pts.slice();
    var r = rng(seed || 7), out = [], p = pts.slice();
    p.unshift([2 * p[0][0] - p[1][0], 2 * p[0][1] - p[1][1]]);
    p.push([2 * p[p.length - 1][0] - p[p.length - 2][0], 2 * p[p.length - 1][1] - p[p.length - 2][1]]);
    var ph1 = r() * 6.28, ph2 = r() * 6.28, k = 0, map = [];
    for (var i = 1; i < p.length - 2; i++) {
      map[i - 1] = out.length;
      var p0 = p[i - 1], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2];
      var n = Math.max(2, Math.ceil(dist(p1, p2) / step));
      for (var j = 0; j < n; j++) {
        var t = j / n, t2 = t * t, t3 = t2 * t;
        var x = 0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);
        var y = 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);
        if (amp) { k++; x += amp * (Math.sin(k * 0.31 + ph1) + 0.5 * Math.sin(k * 0.83 + ph2)) * 0.7; y += amp * (Math.cos(k * 0.27 + ph2) + 0.5 * Math.sin(k * 0.71 + ph1)) * 0.7; }
        out.push([x, y]);
      }
    }
    map[pts.length - 1] = out.length;
    out.push(pts[pts.length - 1].slice());
    out.map = map;
    return out;
  }

  // ───────────── çizim kütüphanesi (kutu birimleri; çizimin kendi en-boy oranı) ─────────────
  function rrect(x, y, w, h, rad, sx, sy, dir) {
    // saat yönünde, (sx,sy) başlangıcına en yakın kenar noktasından başlar (yaklaşık: sol-üst köşeden), sürekli nokta dizisi
    var pts = [], seg = function (cx, cy, a0, a1) { for (var i = 0; i <= 6; i++) { var a = a0 + (a1 - a0) * i / 6; pts.push([cx + rad * Math.cos(a), cy + rad * Math.sin(a)]); } };
    var PI = Math.PI;
    pts.push([x + rad, y]); pts.push([x + w - rad, y]); seg(x + w - rad, y + rad, -PI / 2, 0);
    pts.push([x + w, y + h - rad]); seg(x + w - rad, y + h - rad, 0, PI / 2);
    pts.push([x + rad, y + h]); seg(x + rad, y + h - rad, PI / 2, PI);
    pts.push([x, y + rad]); seg(x + rad, y + rad, PI, 1.5 * PI);
    return pts;
  }
  function rotateStart(pts, idx) { return pts.slice(idx).concat(pts.slice(1, idx + 1)); }
  function circle(cx, cy, r, a0, a1) { var pts = [], n = Math.max(10, Math.round(Math.abs(a1 - a0) / 0.35)); for (var i = 0; i <= n; i++) { var a = a0 + (a1 - a0) * i / n; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return pts; }
  function squig(x, y, w, amp) { var pts = [], n = Math.max(4, Math.round(w / 3.5)); for (var i = 0; i <= n; i++) pts.push([x + w * i / n, y + (i % 2 ? -amp : amp) * (0.5 + 0.5 * Math.sin(i * 1.7))]); return pts; }
  function line(x1, y1, x2, y2) { return [[x1, y1], [(x1 + x2) / 2, (y1 + y2) / 2], [x2, y2]]; }
  function digit8(cx, cy, s) { return circle(cx, cy, 6 * s, -Math.PI / 2, -Math.PI / 2 + 6.5).concat(circle(cx, cy + 13.5 * s, 7.4 * s, -Math.PI / 2, -Math.PI / 2 - 6.5)); }

  var DRAW = {
    // fikir: kendini saran taslak form (yuvarlak köşeli kare) + içinde kıvılcım
    form: { w: 100, h: 100, entry: [96, 6], exit: [96, 6], strokes: function () {
      var sq = rrect(12, 14, 76, 76, 16);
      var s1 = [[100, 4], [92, 10]].concat(sq.slice(0, 9), sq.slice(9), sq.slice(0, 3), [[86, 20]]);
      var s2 = [[50, 40], [50, 52]], s3 = [[38, 56], [62, 56]], s4 = circle(50, 68, 4.5, 0, 6.3);
      return [s1, s2, s3, s4];
    } },
    carlog: { w: 100, h: 200, entry: [0, 40], exit: [50, 198], strokes: function () {
      var out = [];
      var o = rrect(6, 4, 88, 192, 15); var o0 = rotateStart(o, o.length - 4);   // sol kenardan başla
      out.push([[0, 40], [5, 36]].concat(o0.slice(0, o0.length), [[6, 34]]));
      out.push(rrect(38, 9, 24, 6, 3).concat([[41, 9]]));                                          // çentik
      out.push(squig(15, 30, 22, 1.4)); out.push(circle(80, 30, 5.5, 0, 6.3).concat([[84, 34], [88, 38]]));   // başlık + arama
      out.push(rrect(14, 42, 72, 11, 5.5).concat([[14, 47]]));                                      // gün/hafta/ay
      out.push([[18, 44], [30, 52], [24, 44], [36, 52]]);                                             // seçili sekme taraması
      out.push(squig(15, 66, 34, 1.2));                                                               // "toplam gider · bugün"
      out.push(digit8(25, 82, 1)); out.push(digit8(46, 82, 1));                                       // 88
      out.push([[62, 72], [62, 96]], [[56, 82], [72, 78]], [[56, 89], [72, 85]], circle(66, 90, 8, 3.4, 5.7));   // ₺
      out.push([[15, 108], [85, 108], [85, 112], [15, 112], [15, 108]]); out.push([[16, 109.5], [58, 109.5]]);   // ilerleme çubuğu
      [14, 38.5, 63].forEach(function (x) { out.push(rrect(x, 122, 23, 28, 5).concat([[x + 5, 122]])); out.push(circle(x + 6, 132, 2.4, 0, 6.3)); out.push(squig(x + 4, 143, 13, 1)); });
      out.push(squig(15, 162, 28, 1.2));
      var hs = [10, 16, 12, 22, 9, 14, 24, 18, 11, 15, 8, 19, 13, 17];
      var bars = []; hs.forEach(function (h, i) { var x = 16 + i * 5.2; bars.push([x, 184]); bars.push([x, 184 - h]); bars.push([x + 2.2, 184 - h]); bars.push([x + 2.2, 184]); });
      out.push(bars);
      out.push(rrect(20, 186, 60, 7, 3.5).concat([[24, 186]]));
      out.push([[50, 196], [50, 199]]);
      return out;
    } },
    piyasa: { w: 100, h: 200, entry: [0, 40], exit: [50, 198], strokes: function () {
      var out = [];
      var o = rrect(6, 4, 88, 192, 15); var o0 = rotateStart(o, o.length - 4);
      out.push([[0, 40], [5, 36]].concat(o0, [[6, 34]]));
      out.push(rrect(38, 9, 24, 6, 3).concat([[41, 9]]));
      out.push([[10, 60], [30, 54], [52, 66], [74, 58], [90, 64]]); out.push([[12, 150], [34, 138], [56, 152], [78, 142], [90, 148]]);
      out.push([[26, 24], [34, 70], [30, 120], [38, 170]]); out.push([[70, 24], [64, 70], [72, 122], [66, 172]]);
      out.push(circle(50, 104, 14, 0.3, 6.0)); out.push(circle(50, 104, 28, 0.6, 5.7)); out.push(circle(50, 104, 42, 1.0, 5.4));
      out.push(circle(50, 98, 6, 0, 6.3)); out.push([[44.5, 101], [50, 114], [55.5, 101]]);
      out.push(rrect(20, 182, 60, 9, 4.5).concat([[24, 182]]));
      out.push([[50, 196], [50, 199]]);
      return out;
    } },
    underline: { w: 500, h: 100, entry: [0, 56], exit: null, strokes: function () {
      return [[[0, 56], [90, 44], [190, 60], [300, 46], [410, 58], [492, 40]], [[470, 24], [494, 40], [472, 58]]];
    } }
  };

  // ───────────── çizgiyi kur ─────────────
  var svg, segs = [], bp = [], stops = [], pen, total = 0, introT = reduce ? 1 : 0, introStart = 0, curD = -1, built = false;

  function pageX() { return Math.max(document.documentElement.clientWidth, 320); }
  function absRect(el) { var r = el.getBoundingClientRect(); return { l: r.left + window.pageXOffset, t: r.top + window.pageYOffset, w: r.width, h: r.height }; }

  function build() {
    var start = document.querySelector('[data-cz-start]');
    if (!start) return;
    var W = pageX(), H = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    if (svg) svg.parentNode.removeChild(svg);
    svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'cz-line'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
    svg.setAttribute('width', W); svg.setAttribute('height', H); svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.style.height = H + 'px';
    document.body.insertBefore(svg, document.body.firstChild);

    var wrap = document.querySelector('main .cz-wrap') || document.querySelector('main');
    var wr = absRect(wrap), gut = W >= 1100 ? 26 : 8;
    var xs = { l: clamp(wr.l - gut, 8, W - 8), r: clamp(wr.l + wr.w + gut, 8, W - 8) };
    if (W >= 1100) { xs.l = clamp(wr.l - gut, 10, W - 10); xs.r = clamp(wr.l + wr.w + gut, 10, W - 10); } else { xs.l = 9; xs.r = 9; }

    // 1) düğümleri topla
    var nodes = [];
    var sr = absRect(start);
    nodes.push({ kind: 'pt', x: xs.l + (W >= 1100 ? 6 : 0), y: sr.t + Math.min(sr.h * 0.16, 130), start: true });
    nodes.push({ kind: 'pt', x: xs.l, y: sr.t + sr.h - 20 });
    [].slice.call(document.querySelectorAll('[data-cz-side],[data-cz-stop],[data-cz-draw]')).forEach(function (el) {
      var r = absRect(el);
      if (el.hasAttribute('data-cz-draw')) {
        var name = el.getAttribute('data-cz-draw'); if (!DRAW[name]) return;
        nodes.push({ kind: 'draw', name: name, r: r, y: r.t, el: el });
      } else if (el.hasAttribute('data-cz-stop')) {
        nodes.push({ kind: 'pt', x: xs[el.getAttribute('data-cz-stop')] || xs.l, y: r.t + r.h * 0.5, stop: true, y2: r.t + r.h * 0.5 });
      } else {
        var s = el.getAttribute('data-cz-side'), x = xs[s] || xs.l;
        nodes.push({ kind: 'pt', x: x, y: r.t + 20 });
        nodes.push({ kind: 'pt', x: x, y: r.t + r.h - 20 });
      }
    });
    nodes.sort(function (a, b) { return (a.start ? -1e9 : a.y) - (b.start ? -1e9 : b.y); });
    // son nokta: sayfanın sonu (ana içeriğin altı) — çizim bitiş çizgisi yoksa
    var lastNode = nodes[nodes.length - 1];

    // 2) parçalar: seyahat (çok nokta) + çizimler
    segs = []; bp = []; stops = []; total = 0;
    var seed = 11;
    function addPoly(pts, travel) {
      if (pts.length < 2) return null;
      var d = '', len = 0, cum = [0];
      for (var i = 0; i < pts.length; i++) { d += (i ? 'L' : 'M') + pts[i][0].toFixed(1) + ' ' + pts[i][1].toFixed(1) + ' '; if (i) { len += dist(pts[i - 1], pts[i]); cum.push(len); } }
      var s = { d: d, len: len, start: total, pts: pts, cum: cum, travel: travel };
      segs.push(s); total += len; return s;
    }
    var travelPts = [], travelAnch = [];   // anchor: { y, idx }
    function pushTravel(pt, anch) {
      var last = travelPts[travelPts.length - 1];
      if (last && Math.abs(pt[0] - last[0]) > 40 && pt[1] - last[1] > 90) { var dy = pt[1] - last[1]; travelPts.push([last[0], last[1] + dy * 0.34]); travelPts.push([pt[0], last[1] + dy * 0.66]); }
      travelPts.push(pt); if (anch) { anch.idx = travelPts.length - 1; travelAnch.push(anch); }
    }
    function flushTravel() {
      if (travelPts.length < 2) { travelPts = []; travelAnch = []; return; }
      var sm = smooth(travelPts, 16, 1.7, seed++);
      // her anchor için sm içindeki en yakın nokta
      var seg = addPoly(sm, true);
      travelAnch.forEach(function (a) {
        var best = sm.map[a.idx];
        bp.push({ y: a.y, D: seg.start + seg.cum[best] });
        if (a.stop) stops.push({ x: a.pt[0], y: a.pt[1], D: seg.start + seg.cum[best] });
      });
      travelPts = []; travelAnch = [];
    }
    // başlangıç kalem izi: kıvrımlı küçük karalama
    var px = nodes[0].x, py = nodes[0].y;
    travelPts.push([px, py]);
    travelAnch.push({ y: py, pt: [px, py], idx: 0 });
    for (var q = 1; q <= 2; q++) { travelPts.push([px + 14 + q * 9, py + q * 22 - 6]); travelPts.push([px - 6 + q * 3, py + q * 22 + 10]); }
    var curX = px, curY = py + 70;
    for (var n = 1; n < nodes.length; n++) {
      var nd = nodes[n];
      if (nd.kind === 'pt') {
        if (nd.y < curY - 4 && nd.y < nodes[n - 1].y) continue;
        pushTravel([nd.x, nd.y], { y: nd.y, pt: [nd.x, nd.y], stop: !!nd.stop });
        curX = nd.x; curY = nd.y;
      } else {
        var dd = DRAW[nd.name], R = nd.r;
        var sc = Math.min(R.w / dd.w, R.h / dd.h), ox = R.l + (R.w - dd.w * sc) / 2, oy = R.t + (R.h - dd.h * sc) / 2;
        var T = function (p) { return [ox + p[0] * sc, oy + p[1] * sc]; };
        var strokes = dd.strokes();
        var entry = T(dd.entry);
        // seyahat çizimin başlangıcına bağlanır
        pushTravel(entry, { y: R.t - 4, pt: entry });
        flushTravel();
        var D0 = total;
        strokes.forEach(function (st, si) {
          var pts = st.map(T);
          var sm = si === 0 ? smooth(pts, Math.max(4, 5 * sc), 0.9 * Math.min(sc, 2), seed++) : smooth(pts, Math.max(3, 4 * sc), 0.6 * Math.min(sc, 2), seed++);
          addPoly(sm, false);
        });
        bp.push({ y: R.t + R.h * 0.04, D: D0 });
        bp.push({ y: R.t + R.h * 0.92, D: total });
        if (dd.exit) {
          var ex = T(dd.exit); travelPts.push(ex); travelAnch.push({ y: R.t + R.h * 0.96, pt: ex, idx: travelPts.length - 1 });
          bp[bp.length - 1].y = R.t + R.h * 0.9;
        }
        curY = R.t + R.h;
      }
    }
    flushTravel();
    bp.sort(function (a, b) { return a.y - b.y; });
    // monotonik D
    for (var m = 1; m < bp.length; m++) if (bp[m].D < bp[m - 1].D) bp[m].D = bp[m - 1].D;

    // 3) DOM
    segs.forEach(function (s) {
      var p = document.createElementNS(NS, 'path'); p.setAttribute('d', s.d);
      p.style.strokeDasharray = s.len + ' ' + (s.len + 2); p.style.strokeDashoffset = reduce ? 0 : s.len;
      svg.appendChild(p); s.el = p; s.last = -1;
    });
    stops.forEach(function (s) {
      var c = document.createElementNS(NS, 'circle'); c.setAttribute('class', 'cz-stop-dot'); c.setAttribute('cx', s.x); c.setAttribute('cy', s.y); c.setAttribute('r', 8);
      svg.appendChild(c); s.el = c;
    });
    if (!reduce) { pen = document.createElementNS(NS, 'circle'); pen.setAttribute('class', 'cz-pen'); pen.setAttribute('r', 4.2); svg.appendChild(pen); }
    built = true; curD = -1; window.__cz = { bp: bp, segs: segs.length, total: total };
    render();
  }

  function targetD() {
    if (!bp.length) return 0;
    var ys = window.pageYOffset + window.innerHeight * 0.68;
    if (ys <= bp[0].y) return bp[0].D * clamp((ys - (bp[0].y - 200)) / 200, 0, 1) + 0;   // ilk çizgi parçası
    for (var i = 1; i < bp.length; i++) {
      if (ys <= bp[i].y) { var a = bp[i - 1], b = bp[i], t = b.y === a.y ? 1 : (ys - a.y) / (b.y - a.y); return a.D + (b.D - a.D) * t; }
    }
    return total;
  }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function render() {
    if (!built) return;
    var D;
    if (reduce) D = total;
    else {
      var k = introT >= 1 ? 1 : easeOut(introT);
      D = Math.max(targetD(), Math.min(total, 70)) * k;   // kalem izi her zaman görünür, giriş animasyonu ile çizilir
    }
    D = clamp(D, 0, total);
    if (Math.abs(D - curD) < 0.4) return;
    curD = D;
    var headEl = null, headLocal = 0;
    for (var i = 0; i < segs.length; i++) {
      var s = segs[i], drawn = clamp(D - s.start, 0, s.len);
      if (drawn !== s.last) { s.el.style.strokeDashoffset = (s.len - drawn).toFixed(1); s.last = drawn; }
      if (drawn > 0 && drawn < s.len) { headEl = s; headLocal = drawn; }
      else if (drawn >= s.len && D <= s.start + s.len + 0.5) { headEl = s; headLocal = s.len; }
    }
    if (pen) {
      if (headEl && D < total) { var pt = headEl.el.getPointAtLength(headLocal); pen.setAttribute('cx', pt.x); pen.setAttribute('cy', pt.y); pen.style.opacity = 1; }
      else pen.style.opacity = 0;
    }
    stops.forEach(function (s) { s.el.classList.toggle('on', D >= s.D - 2); });
  }

  var dirty = false;
  function onScroll() { if (!dirty) { dirty = true; requestAnimationFrame(function () { dirty = false; render(); }); } }
  var rb;
  function rebuildSoon() { clearTimeout(rb); rb = setTimeout(function () { var keep = introT; build(); introT = keep; }, 160); }

  function init() {
    if (!document.querySelector('[data-cz-start]')) return;
    build();
    if (!reduce) {
      window.addEventListener('scroll', onScroll, { passive: true });
      var t0 = null;
      (function tick(ts) { if (t0 === null) t0 = ts; introT = clamp((ts - t0) / 2200, 0, 1); render(); if (introT < 1) requestAnimationFrame(tick); })(performance.now ? performance.now() : 0);
    }
    window.addEventListener('resize', rebuildSoon);
    window.addEventListener('load', rebuildSoon);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(rebuildSoon);
    if ('ResizeObserver' in window) { var lastH = document.body.scrollHeight; new ResizeObserver(function () { var h = document.body.scrollHeight; if (Math.abs(h - lastH) > 4) { lastH = h; rebuildSoon(); } }).observe(document.body); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  // ───────────── mobil sabit CTA ─────────────
  function sticky() {
    var bar = document.querySelector('.cz-sticky');
    if (!bar || !('IntersectionObserver' in window)) return;
    var after = document.querySelector(bar.getAttribute('data-sticky-after'));
    var until = document.querySelector(bar.getAttribute('data-sticky-until')) || document.querySelector('footer');
    var past = false, atEnd = false;
    var apply = function () { bar.classList.toggle('on', past && !atEnd); };
    document.body.classList.add('has-sticky');
    if (after) new IntersectionObserver(function (e) { var r = e[0]; past = !r.isIntersecting && r.boundingClientRect.top < 0; apply(); }).observe(after);
    if (until) new IntersectionObserver(function (e) { atEnd = e[0].isIntersecting; apply(); }).observe(until);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', sticky); else sticky();
})();
