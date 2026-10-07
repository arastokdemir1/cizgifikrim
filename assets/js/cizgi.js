// CizgiFikrim "Çizgi v2": canlı ağ (canvas), kaydırmayla çizilen ışıklı devre izi (SVG), öğrenen ağ sahnesi,
// canlı mini arayüz, sayaçlar, yatay ürün şeridi, imleç ışığı, manyetik düğmeler.
// Bağımlılık yok. TEK rAF döngüsü; canvas'lar yalnız görünürken çizilir; kare süresi izlenir, yavaşsa otomatik sadeleşir.
// prefers-reduced-motion / veri tasarrufu / düşük güç: ağlar tek statik kare, çizgi tam çizili, sayaçlar son değerde.
(function () {
  'use strict';
  var D = document, W = window, root = D.documentElement;
  var reduce = !!(W.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var conn = navigator.connection || {};
  var lowPower = !!(conn.saveData || (navigator.deviceMemory && navigator.deviceMemory <= 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2));
  var STATIC = reduce || lowPower;
  var fine = !!(W.matchMedia && matchMedia('(pointer: fine)').matches);
  var narrow = function () { return W.innerWidth < 760; };
  if (STATIC) root.classList.add('cz-simple', 'cz-static');
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  function rng(seed) { var s = (seed >>> 0) || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function smooth(x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }

  // ───────────── tek rAF döngüsü + otomatik sadeleşme ─────────────
  var tasks = [], running = false, lastT = 0, slow = 0, degrade = 0, nets = [];
  function addTask(fn) { tasks.push(fn); if (!running && !STATIC) { running = true; requestAnimationFrame(frame); } }
  function frame(t) {
    var dt = t - lastT; lastT = t;
    if (dt > 0 && dt < 250) { slow = dt > 26 ? slow + 1 : Math.max(0, slow - 0.5); if (slow > 40) { slow = 0; degradeStep(); } } else dt = 16;
    for (var i = 0; i < tasks.length; i++) tasks[i](t, dt);
    requestAnimationFrame(frame);
  }
  function degradeStep() {
    degrade++;
    nets.forEach(function (n) { n.thin(degrade); });
    if (degrade >= 3) { root.classList.add('cz-simple'); }
  }

  // ───────────── renkler: CSS belirteçlerinden, TUVALİN KENDİ bağlamından okunur (açık zemin ya da koyu bant) ─────────────
  var colCache = {};
  function colorsFor(el) {
    var cs = getComputedStyle(el || root);
    function v(n, d) { var t = cs.getPropertyValue(n).trim(); return t || d; }
    var acc = v('--k-acc-rgb', '154 87 16').split(/[\s,]+/).join(','), fg = v('--k-fg-rgb', '28 26 23').split(/[\s,]+/).join(','), boost = parseFloat(v('--k-net-boost', '1')) || 1, blend = v('--k-blend', 'lighter'), spr = parseFloat(v('--k-spr', '1')) || 1;
    var key = [acc, fg, boost, blend, spr].join('|'); if (colCache[key]) return colCache[key];
    var c = { acc: 'rgb(' + acc + ')', accA: 'rgba(' + acc + ',', fgA: 'rgba(' + fg + ',', boost: boost, blend: blend, spr: spr };
    var sp = D.createElement('canvas'); sp.width = sp.height = 64; var x = sp.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, c.accA + (.5 * spr) + ')'); g.addColorStop(.3, c.accA + (.16 * spr) + ')'); g.addColorStop(1, c.accA + '0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64); c.sprite = sp; colCache[key] = c; return c;
  }
  var C = colorsFor(root), sprite = C.sprite, layerz = [];
  W.czRecolor = function () { colCache = {}; nets.forEach(function (n) { n.col = colorsFor(n.c); if (STATIC && n.draw) n.draw(); }); layerz.forEach(function (l) { l.col = colorsFor(l.c); if (STATIC) l.draw(1); }); };

  // ───────────── Net: canlı sinir ağı (düğümler + kenarlar + veri paketleri) ─────────────
  function Net(canvas, o) {
    this.c = canvas; this.col = colorsFor(canvas); this.x = canvas.getContext('2d'); this.o = o; this.nodes = []; this.pulses = []; this.edges = []; this.adj = [];
    this.vis = true; this.p = null; this.rand = rng(o.seed || 7); this.scale = 1;
    this.resize(); this.populate();
    var self = this;
    if ('IntersectionObserver' in W) new IntersectionObserver(function (e) { self.vis = e[0].isIntersecting; if (self.vis && STATIC) self.draw(); }, { rootMargin: '120px' }).observe(canvas);
    if (o.pointer && fine && !STATIC) {
      var host = canvas.parentElement.parentElement || canvas.parentElement;
      host.addEventListener('pointermove', function (e) { var r = self.c.getBoundingClientRect(); self.p = { x: e.clientX - r.left, y: e.clientY - r.top }; }, { passive: true });
      host.addEventListener('pointerleave', function () { self.p = null; });
    }
    W.addEventListener('resize', function () { self.resize(); self.populate(); if (STATIC) self.draw(); });
    nets.push(this);
    if (STATIC) { for (var i = 0; i < 90; i++) this.step(16); this.draw(); }
    else addTask(function (t, dt) { if (self.vis) { self.step(dt); self.draw(); } });
  }
  Net.prototype.resize = function () {
    var dpr = Math.min(W.devicePixelRatio || 1, 1.75), w = this.c.clientWidth, h = this.c.clientHeight;
    this.w = w; this.h = h; this.dpr = dpr; this.c.width = Math.max(1, Math.round(w * dpr)); this.c.height = Math.max(1, Math.round(h * dpr));
    this.x.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  Net.prototype.populate = function () {
    var o = this.o, n = o.count * (narrow() ? 0.45 : 1) * this.scale; n = Math.max(8, Math.round(n));
    var r = this.rand; this.nodes.length = 0;
    for (var i = 0; i < n; i++) this.nodes.push({ x: r() * this.w, y: r() * this.h, vx: (r() - .5) * .03, vy: (r() - .5) * .03, r: 1.2 + r() * 1.6, hot: r() < .1, ph: r() * 6.28 });
    this.link = clamp(o.link || Math.min(this.w, this.h) * .22, 70, 190);
    this.pulses.length = 0;
  };
  Net.prototype.thin = function (level) { this.scale = level >= 2 ? .3 : .55; this.o.pulses = Math.max(1, Math.round(this.o.pulses * .5)); this.o.pointer = false; this.p = null; this.populate(); };
  Net.prototype.step = function (dt) {
    var N = this.nodes, w = this.w, h = this.h, p = this.p, k = dt;
    for (var i = 0; i < N.length; i++) {
      var a = N[i];
      if (p) { var dx = p.x - a.x, dy = p.y - a.y, d2 = dx * dx + dy * dy; if (d2 < 40000 && d2 > 100) { var f = 0.000012 * k; a.vx += dx * f; a.vy += dy * f; } }
      a.x += a.vx * k; a.y += a.vy * k;
      a.vx *= .9995; a.vy *= .9995;
      if (Math.abs(a.vx) < .006) a.vx += (this.rand() - .5) * .004; if (Math.abs(a.vy) < .006) a.vy += (this.rand() - .5) * .004;
      if (a.x < -20) a.x = w + 20; else if (a.x > w + 20) a.x = -20;
      if (a.y < -20) a.y = h + 20; else if (a.y > h + 20) a.y = -20;
    }
  };
  Net.prototype.draw = function () {
    C = this.col; sprite = C.sprite;
    var x = this.x, N = this.nodes, L = this.link, L2 = L * L, E = this.edges, adj = this.adj, i, j;
    x.clearRect(0, 0, this.w, this.h);
    E.length = 0; adj.length = N.length; for (i = 0; i < N.length; i++) adj[i] = [];
    x.lineWidth = 1;
    for (i = 0; i < N.length; i++) for (j = i + 1; j < N.length; j++) {
      var dx = N[i].x - N[j].x, dy = N[i].y - N[j].y, d2 = dx * dx + dy * dy;
      if (d2 < L2) { var d = Math.sqrt(d2); E.push([i, j, d]); adj[i].push(j); adj[j].push(i); x.strokeStyle = C.accA + ((1 - d / L) * .27 * C.boost).toFixed(3) + ')'; x.beginPath(); x.moveTo(N[i].x, N[i].y); x.lineTo(N[j].x, N[j].y); x.stroke(); }
    }
    if (this.p) {
      for (i = 0; i < N.length; i++) { var px = this.p.x - N[i].x, py = this.p.y - N[i].y, pd = Math.sqrt(px * px + py * py); if (pd < 170) { x.strokeStyle = C.accA + ((1 - pd / 170) * .6 * C.boost).toFixed(3) + ')'; x.beginPath(); x.moveTo(this.p.x, this.p.y); x.lineTo(N[i].x, N[i].y); x.stroke(); } }
      x.drawImage(sprite, this.p.x - 22, this.p.y - 22, 44, 44);
    }
    x.globalCompositeOperation = C.blend;
    for (i = 0; i < N.length; i++) {
      var a = N[i];
      if (a.hot) { var pulse = .55 + .45 * Math.sin(performance.now() * .002 + a.ph); x.globalAlpha = pulse; x.drawImage(sprite, a.x - 15, a.y - 15, 30, 30); x.globalAlpha = 1; }
    }
    x.globalCompositeOperation = 'source-over';
    for (i = 0; i < N.length; i++) { var n = N[i]; x.fillStyle = n.hot ? C.acc : (C.fgA + '.55)'); x.beginPath(); x.arc(n.x, n.y, n.hot ? n.r + 1.2 : n.r + .3, 0, 6.2832); x.fill(); }
    // veri paketleri
    var P = this.pulses, want = this.o.pulses || 0;
    if (!STATIC) {
      while (P.length < want && E.length) { var e = E[(this.rand() * E.length) | 0]; P.push({ a: e[0], b: e[1], t: 0, sp: .16 + this.rand() * .12 }); }
      x.globalCompositeOperation = C.blend;
      for (i = P.length - 1; i >= 0; i--) {
        var q = P[i], A = N[q.a], B = N[q.b], ddx = B.x - A.x, ddy = B.y - A.y, dist = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
        if (dist > L * 1.05) { P.splice(i, 1); continue; }
        q.t += (q.sp * 16) / dist;
        if (q.t >= 1) { var nb = adj[q.b], nx = -1; if (nb && nb.length) { for (var tries = 0; tries < 4; tries++) { var c = nb[(this.rand() * nb.length) | 0]; if (c !== q.a) { nx = c; break; } } } if (nx < 0) { P.splice(i, 1); continue; } q.a = q.b; q.b = nx; q.t = 0; continue; }
        var hx = A.x + ddx * q.t, hy = A.y + ddy * q.t, tx = A.x + ddx * Math.max(0, q.t - .22), ty = A.y + ddy * Math.max(0, q.t - .22);
        var g = x.createLinearGradient(tx, ty, hx, hy); g.addColorStop(0, C.accA + '0)'); g.addColorStop(1, C.accA + '.6)');
        x.strokeStyle = g; x.lineWidth = 1.4; x.beginPath(); x.moveTo(tx, ty); x.lineTo(hx, hy); x.stroke();
        x.drawImage(sprite, hx - 6, hy - 6, 12, 12);
      }
      x.globalCompositeOperation = 'source-over';
    }
  };

  // ───────────── Layers: kaydırmayla öğrenen katmanlı ağ ─────────────
  function Layers(canvas) {
    this.c = canvas; this.col = colorsFor(canvas); layerz.push(this); this.x = canvas.getContext('2d'); this.p = STATIC ? 1 : 0; this.focus = 0; this.vis = false; this.pulses = []; this.rand = rng(99);
    this.resize(); var self = this;
    if ('IntersectionObserver' in W) new IntersectionObserver(function (e) { self.vis = e[0].isIntersecting; if (self.vis && STATIC) self.draw(1); }, { rootMargin: '80px' }).observe(canvas);
    W.addEventListener('resize', function () { self.resize(); if (STATIC) self.draw(1); });
    if (STATIC) this.draw(1); else addTask(function (t, dt) { if (self.vis) self.draw(dt); });
  }
  Layers.prototype.resize = function () {
    var dpr = Math.min(W.devicePixelRatio || 1, 1.75), w = this.c.clientWidth, h = this.c.clientHeight;
    this.w = w; this.h = h; this.c.width = Math.round(w * dpr); this.c.height = Math.round(h * dpr); this.x.setTransform(dpr, 0, 0, dpr, 0, 0);
    var spec = narrow() ? [2, 4, 4, 2] : [3, 5, 6, 5, 3]; this.layers = [];
    var padX = w * (narrow() ? .06 : .12), padY = h * .2;
    for (var k = 0; k < spec.length; k++) {
      var col = []; var x = padX + (w - padX * 2) * (k / (spec.length - 1));
      for (var i = 0; i < spec[k]; i++) col.push({ x: x, y: padY + (h - padY * 2) * ((i + .5) / spec[k]) + ((k % 2) ? 14 : -14) });
      this.layers.push(col);
    }
  };
  Layers.prototype.draw = function (dt) {
    C = this.col; sprite = C.sprite;
    var x = this.x, Ls = this.layers, n = Ls.length, p = this.p, t = performance.now();
    x.clearRect(0, 0, this.w, this.h);
    var k, i, j;
    for (k = 0; k < n - 1; k++) {
      var ea = clamp(p * n - k - .55, 0, 1); if (ea <= 0) continue;
      for (i = 0; i < Ls[k].length; i++) for (j = 0; j < Ls[k + 1].length; j++) {
        var A = Ls[k][i], B = Ls[k + 1][j];
        x.strokeStyle = C.accA + (ea * (this.focus === k || this.focus === k + 1 ? .22 : .1) * C.boost).toFixed(3) + ')'; x.lineWidth = 1;
        x.beginPath(); x.moveTo(A.x, A.y); x.lineTo(A.x + (B.x - A.x) * ea, A.y + (B.y - A.y) * ea); x.stroke();
      }
    }
    x.globalCompositeOperation = C.blend;
    for (k = 0; k < n; k++) {
      var la = clamp(p * n - k, 0, 1); if (la <= 0) continue;
      for (i = 0; i < Ls[k].length; i++) {
        var nd = Ls[k][i], hot = this.focus === k, tw = .6 + .4 * Math.sin(t * .003 + i * 1.7 + k);
        x.globalAlpha = la * (hot ? .8 : .3 + .2 * tw); var sz = hot ? 26 : 16; x.drawImage(sprite, nd.x - sz / 2, nd.y - sz / 2, sz, sz);
      }
    }
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    for (k = 0; k < n; k++) { var a2 = clamp(p * n - k, 0, 1); for (i = 0; i < Ls[k].length; i++) { x.fillStyle = this.focus === k ? C.accA + a2 + ')' : C.fgA + (a2 * .8) + ')'; x.beginPath(); x.arc(Ls[k][i].x, Ls[k][i].y, 3.4, 0, 6.2832); x.fill(); } }
    if (!STATIC && p > .15) {
      var vis = Math.max(1, Math.min(n - 1, Math.floor(p * n)));
      while (this.pulses.length < 5) { var kk = (this.rand() * vis) | 0; this.pulses.push({ k: kk, i: (this.rand() * Ls[kk].length) | 0, j: (this.rand() * Ls[kk + 1].length) | 0, t: 0, sp: .0006 + this.rand() * .0005 }); }
      x.globalCompositeOperation = C.blend;
      for (i = this.pulses.length - 1; i >= 0; i--) {
        var q = this.pulses[i]; q.t += q.sp * (dt || 16);
        if (q.t >= 1 || q.k >= vis) { this.pulses.splice(i, 1); continue; }
        var A2 = Ls[q.k][q.i], B2 = Ls[q.k + 1][q.j]; if (!A2 || !B2) { this.pulses.splice(i, 1); continue; }
        var hx = A2.x + (B2.x - A2.x) * q.t, hy = A2.y + (B2.y - A2.y) * q.t;
        x.drawImage(sprite, hx - 7, hy - 7, 14, 14);
      }
      x.globalCompositeOperation = 'source-over';
    }
  };

  // ───────────── sayfa çizgisi: ışıklı devre izi ─────────────
  var NS = 'http://www.w3.org/2000/svg';
  function dist(a, b) { var dx = a[0] - b[0], dy = a[1] - b[1]; return Math.sqrt(dx * dx + dy * dy); }
  function rrect(x, y, w, h, rad) {
    var pts = [], PI = Math.PI, seg = function (cx, cy, a0, a1) { for (var i = 0; i <= 6; i++) { var a = a0 + (a1 - a0) * i / 6; pts.push([cx + rad * Math.cos(a), cy + rad * Math.sin(a)]); } };
    pts.push([x + rad, y]); pts.push([x + w / 2, y]); pts.push([x + w - rad, y]); seg(x + w - rad, y + rad, -PI / 2, 0);
    pts.push([x + w, y + h / 2]); pts.push([x + w, y + h - rad]); seg(x + w - rad, y + h - rad, 0, PI / 2);
    pts.push([x + w / 2, y + h]); pts.push([x + rad, y + h]); seg(x + rad, y + h - rad, PI / 2, PI);
    pts.push([x, y + h / 2]); pts.push([x, y + rad]); seg(x + rad, y + rad, PI, 1.5 * PI); return pts;
  }
  function circle(cx, cy, r, a0, a1) { var pts = [], n = Math.max(10, Math.round(Math.abs(a1 - a0) / 0.3)); for (var i = 0; i <= n; i++) { var a = a0 + (a1 - a0) * i / n; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return pts; }
  function phone() {
    var o = rrect(6, 4, 88, 192, 15), k = 0, best = 1e9;
    for (var i = 0; i < o.length; i++) { var d = Math.abs(o[i][0] - 6) + Math.abs(o[i][1] - 100); if (d < best) { best = d; k = i; } }
    return [[0, 100]].concat(o.slice(k).concat(o.slice(0, k + 1)));
  }
  var DRAW = {
    carlog: { w: 100, h: 200, entry: [0, 100], exit: [6, 192], strokes: function () {
      var out = [phone()]; out.push(rrect(38, 9, 24, 6, 3).concat([[41, 9]]));
      out.push([[15, 30], [37, 30]], circle(80, 30, 5.5, 0, 6.3).concat([[84, 34], [88, 38]]));
      out.push(rrect(14, 42, 72, 11, 5.5).concat([[14, 47]]));
      out.push([[15, 66], [49, 66]]);
      out.push(circle(25, 76, 6, -1.57, 4.7).concat(circle(25, 90, 7.4, -1.57, -7.8)), circle(46, 76, 6, -1.57, 4.7).concat(circle(46, 90, 7.4, -1.57, -7.8)));
      out.push([[62, 72], [62, 96]], [[56, 82], [72, 78]], [[56, 89], [72, 85]]);
      out.push([[15, 108], [85, 108], [85, 112], [15, 112], [15, 108]]);
      [14, 38.5, 63].forEach(function (x) { out.push(rrect(x, 122, 23, 28, 5).concat([[x + 5, 122]])); });
      out.push([[15, 162], [43, 162]]);
      var hs = [10, 16, 12, 22, 9, 14, 24, 18, 11, 15, 8, 19, 13, 17], bars = []; hs.forEach(function (h, i) { var x = 16 + i * 5.2; bars.push([x, 184], [x, 184 - h], [x + 2.2, 184 - h], [x + 2.2, 184]); }); out.push(bars);
      out.push(rrect(20, 186, 60, 7, 3.5).concat([[24, 186]])); out.push([[50, 196], [50, 199]]);
      return out; } },
    piyasa: { w: 100, h: 200, entry: [0, 100], exit: [6, 192], strokes: function () {
      var out = [phone()]; out.push(rrect(38, 9, 24, 6, 3).concat([[41, 9]]));
      out.push(circle(50, 104, 14, .3, 6), circle(50, 104, 28, .6, 5.7), circle(50, 104, 42, 1.0, 5.4), circle(50, 98, 6, 0, 6.3), [[44.5, 101], [50, 114], [55.5, 101]]);
      out.push([[26, 24], [34, 70], [30, 120], [38, 170]], [[70, 24], [64, 70], [72, 122], [66, 172]], rrect(20, 182, 60, 9, 4.5).concat([[24, 182]]), [[50, 196], [50, 199]]);
      return out; } }
  };
  var maxFrac = 0, svg = null, segs = [], bp = [], dots = [], draws = [], total = 0, built = false, curD = -1, introT = (STATIC ? 1 : 0), pen = null, penGlow = null, packets = [];

  function route(pts) {
    var out = [pts[0].slice()];
    for (var i = 1; i < pts.length; i++) {
      var A = pts[i - 1], B = pts[i], dx = B[0] - A[0], dy = B[1] - A[1];
      if (Math.abs(dx) < 2 || dy < 8) { out.push(B.slice()); continue; }
      var s = Math.min(Math.abs(dx), dy * .8), ym = A[1] + (dy - s) / 2, sg = dx > 0 ? 1 : -1;
      out.push([A[0], ym], [A[0] + sg * Math.min(s, Math.abs(dx)), ym + s]); out.push([B[0], ym + s]); out.push(B.slice());
    }
    return out;
  }
  function absRect(el) { var r = el.getBoundingClientRect(); return { l: r.left + W.pageXOffset, t: r.top + W.pageYOffset, w: r.width, h: r.height }; }

  function buildLine() {
    var start = D.querySelector('[data-cz-start]'); if (!start) return;
    var Wd = Math.max(root.clientWidth, 320), H = Math.max(root.scrollHeight, D.body.scrollHeight);
    if (svg && svg.parentNode) svg.parentNode.removeChild(svg);
    svg = D.createElementNS(NS, 'svg'); svg.setAttribute('class', 'cz-line'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
    svg.setAttribute('width', Wd); svg.setAttribute('height', H); svg.setAttribute('viewBox', '0 0 ' + Wd + ' ' + H); svg.style.height = H + 'px';
    D.body.insertBefore(svg, D.body.firstChild);
    var wrap = D.querySelector('main .cz-wrap') || D.querySelector('main'), wr = absRect(wrap), gut = Wd >= 1100 ? 26 : 8, xs = {};
    if (Wd >= 1100) { xs.l = clamp(wr.l - gut, 10, Wd - 10); xs.r = clamp(wr.l + wr.w + gut, 10, Wd - 10); } else { xs.l = 9; xs.r = 9; }
    var nodes = [], sr = absRect(start);
    nodes.push({ kind: 'pt', x: xs.l, y: sr.t + Math.min(sr.h * .12, 90), start: true });
    nodes.push({ kind: 'pt', x: xs.l, y: sr.t + sr.h - 20 });
    [].slice.call(D.querySelectorAll('[data-cz-side],[data-cz-stop],[data-cz-draw]')).forEach(function (el) {
      var r = absRect(el);
      if (el.hasAttribute('data-cz-draw')) {
        var nm = el.getAttribute('data-cz-draw'), psc = el.closest('[data-pscene]');
        if (DRAW[nm] && psc) {   // sabit sahne: tel çizimi telefonun içinde yerel çizilir; sayfa çizgisi başlangıç ve bitiş noktasına bağlanır
          var stg = psc.querySelector('.cz-pscene-sticky'), rel = el.getBoundingClientRect().top - stg.getBoundingClientRect().top, sT = absRect(psc).t;
          var r0 = { l: r.l, t: sT + rel, w: r.w, h: r.h }, r1 = { l: r.l, t: sT + psc.offsetHeight - stg.offsetHeight + rel, w: r.w, h: r.h };
          nodes.push({ kind: 'pdraw', name: nm, r0: r0, r1: r1, y: r0.t, el: el });
        } else if (DRAW[nm]) nodes.push({ kind: 'draw', name: nm, r: r, y: r.t, el: el });
      }
      else if (el.hasAttribute('data-cz-stop')) nodes.push({ kind: 'pt', x: xs[el.getAttribute('data-cz-stop')] || xs.l, y: r.t + r.h * .5, dot: true });
      else { var x = xs[el.getAttribute('data-cz-side')] || xs.l; nodes.push({ kind: 'pt', x: x, y: r.t + 20, dot: true }); nodes.push({ kind: 'pt', x: x, y: r.t + r.h - 20 }); }
    });
    nodes.sort(function (a, b) { return (a.start ? -1e9 : a.y) - (b.start ? -1e9 : b.y); });
    segs = []; bp = []; dots = []; draws = []; total = 0; packets = [];
    function addPoly(pts, travel) {
      if (pts.length < 2) return null; var d = '', len = 0, cum = [0];
      for (var i = 0; i < pts.length; i++) { d += (i ? 'L' : 'M') + pts[i][0].toFixed(1) + ' ' + pts[i][1].toFixed(1) + ' '; if (i) { len += dist(pts[i - 1], pts[i]); cum.push(len); } }
      var s = { d: d, len: len, start: total, cum: cum }; segs.push(s); total += len; return s;
    }
    var tp = [], ta = [];
    function push(pt, anch) { tp.push(pt); if (anch) { anch.idx = tp.length - 1; ta.push(anch); } }
    function flush() {
      if (tp.length < 2) { tp = []; ta = []; return; }
      var rt = route(tp), idxmap = [], ri = 0;
      // route() noktaları arttırdığı için anchor indekslerini yeniden eşle
      var cursor = 0; idxmap[0] = 0;
      for (var i = 1; i < tp.length; i++) { var A = tp[i - 1], B = tp[i], dx = B[0] - A[0], dy = B[1] - A[1]; cursor += (Math.abs(dx) < 2 || dy < 8) ? 1 : 4; idxmap[i] = cursor; }
      var seg = addPoly(rt, true);
      ta.forEach(function (a) { var D0 = seg.start + seg.cum[Math.min(idxmap[a.idx], seg.cum.length - 1)]; bp.push({ y: a.y, D: D0 }); if (a.dot) dots.push({ x: a.pt[0], y: a.pt[1], D: D0 }); });
      tp = []; ta = [];
    }
    var first = nodes[0]; push([first.x, first.y], { y: first.y, pt: [first.x, first.y] });
    for (var n = 1; n < nodes.length; n++) {
      var nd = nodes[n];
      if (nd.kind === 'pt') { if (nd.y < tp[tp.length - 1][1] - 4) continue; push([nd.x, nd.y], { y: nd.y, pt: [nd.x, nd.y], dot: !!nd.dot }); }
      else if (nd.kind === 'pdraw') {
        var pd = DRAW[nd.name], P0 = nd.r0, P1 = nd.r1;
        var psc0 = Math.min(P0.w / pd.w, P0.h / pd.h), pox = P0.l + (P0.w - pd.w * psc0) / 2, poy = P0.t + (P0.h - pd.h * psc0) / 2;
        var pentry = [pox + pd.entry[0] * psc0, poy + pd.entry[1] * psc0], pesd = (P0.l + P0.w / 2) <= Wd / 2 + 8 ? 'l' : 'r', ppre = [xs[pesd], pentry[1] - 70];
        if (ppre[1] > tp[tp.length - 1][1]) push(ppre, { y: ppre[1], pt: ppre }); push(pentry, { y: P0.t - 4, pt: pentry }); flush();
        bp.push({ y: P0.t + P0.h * .04, D: total });
        var psc1 = Math.min(P1.w / pd.w, P1.h / pd.h), qox = P1.l + (P1.w - pd.w * psc1) / 2, qoy = P1.t + (P1.h - pd.h * psc1) / 2;
        var pex = [qox + pd.exit[0] * psc1, qoy + pd.exit[1] * psc1];
        bp.push({ y: P1.t + P1.h * .9, D: total });
        tp.push(pex); ta.push({ y: P1.t + P1.h * .96, pt: pex, idx: tp.length - 1 });
      }
      else {
        var dd = DRAW[nd.name], R = nd.r, sc = Math.min(R.w / dd.w, R.h / dd.h), ox = R.l + (R.w - dd.w * sc) / 2, oy = R.t + (R.h - dd.h * sc) / 2;
        var T = function (p) { return [ox + p[0] * sc, oy + p[1] * sc]; };
        var entry = T(dd.entry), esd = (R.l + R.w / 2) <= Wd / 2 + 8 ? 'l' : 'r', pre = [xs[esd], entry[1] - 70]; if (pre[1] > tp[tp.length - 1][1]) push(pre, { y: pre[1], pt: pre }); push(entry, { y: R.t - 4, pt: entry }); flush();
        var D0 = total; dd.strokes().forEach(function (st) { addPoly(st.map(T), false); });
        bp.push({ y: R.t + R.h * .04, D: D0 }); bp.push({ y: R.t + R.h * .9, D: total });
        draws.push({ el: nd.el, endD: total });
        var ex = T(dd.exit); tp.push(ex); ta.push({ y: R.t + R.h * .96, pt: ex, idx: tp.length - 1 });
      }
    }
    flush();
    bp.sort(function (a, b) { return a.y - b.y; }); for (var m = 1; m < bp.length; m++) if (bp[m].D < bp[m - 1].D) bp[m].D = bp[m - 1].D;
    segs.forEach(function (s) {
      ['g', 'm', 'c'].forEach(function (cl) { var p = D.createElementNS(NS, 'path'); p.setAttribute('class', cl); p.setAttribute('d', s.d); p.style.strokeDasharray = s.len + ' ' + (s.len + 2); p.style.strokeDashoffset = STATIC ? 0 : s.len; svg.appendChild(p); (s.els = s.els || []).push(p); });
      s.last = -1;
    });
    dots.forEach(function (dt) {
      var h = D.createElementNS(NS, 'circle'); h.setAttribute('class', 'halo'); h.setAttribute('cx', dt.x); h.setAttribute('cy', dt.y); h.setAttribute('r', 15); svg.appendChild(h);
      var c = D.createElementNS(NS, 'circle'); c.setAttribute('class', 'dot'); c.setAttribute('cx', dt.x); c.setAttribute('cy', dt.y); c.setAttribute('r', 4); svg.appendChild(c); dt.el = c; dt.halo = h;
    });
    if (!STATIC) {
      penGlow = D.createElementNS(NS, 'circle'); penGlow.setAttribute('class', 'penglow'); penGlow.setAttribute('r', 14); svg.appendChild(penGlow);
      pen = D.createElementNS(NS, 'circle'); pen.setAttribute('class', 'pen'); pen.setAttribute('r', 3.2); svg.appendChild(pen);
      packets = []; for (var k = 0; k < 1; k++) { var pk = D.createElementNS(NS, 'circle'); pk.setAttribute('class', 'pk'); pk.setAttribute('r', 2.2); svg.appendChild(pk); packets.push({ el: pk, o: k / 1 }); }
    }
    built = true; curD = -1; renderLine(0);
  }
  function targetD() {
    if (!bp.length) return 0;
    var ys = W.pageYOffset + W.innerHeight * .62;
    if (ys <= bp[0].y) return 0;
    for (var i = 1; i < bp.length; i++) if (ys <= bp[i].y) { var a = bp[i - 1], b = bp[i], t = b.y === a.y ? 1 : (ys - a.y) / (b.y - a.y); return a.D + (b.D - a.D) * t; }
    return total;
  }
  function segAt(g) { for (var i = 0; i < segs.length; i++) if (g <= segs[i].start + segs[i].len) return segs[i]; return segs[segs.length - 1]; }
  function renderLine(t) {
    if (!built) return;
    var Dd = STATIC ? total : Math.max(targetD(), Math.min(total, 60)) * (introT >= 1 ? 1 : 1 - Math.pow(1 - introT, 3));
    Dd = clamp(Dd, 0, total);
    // RATCHET: bir kez çizilen çizgi geri sarılmaz (yeniden kurulumda oran korunur)
    Dd = Math.max(Dd, maxFrac * total); maxFrac = total ? Dd / total : 0;
    if (Math.abs(Dd - curD) >= .4) {
      curD = Dd; var head = null, loc = 0;
      for (var i = 0; i < segs.length; i++) {
        var s = segs[i], dr = clamp(Dd - s.start, 0, s.len);
        if (dr !== s.last) { var off = (s.len - dr).toFixed(1); for (var k = 0; k < 3; k++) s.els[k].style.strokeDashoffset = off; s.last = dr; }
        if (dr > 0 && dr < s.len) { head = s; loc = dr; }
      }
      if (pen) { if (head && Dd < total) { var pt = head.els[2].getPointAtLength(loc); pen.setAttribute('cx', pt.x); pen.setAttribute('cy', pt.y); penGlow.setAttribute('cx', pt.x); penGlow.setAttribute('cy', pt.y); pen.style.opacity = penGlow.style.opacity = 1; } else pen.style.opacity = penGlow.style.opacity = 0; }
      dots.forEach(function (d) { if (Dd >= d.D - 2) { d.el.classList.add('on'); d.halo.classList.add('on'); } });
      draws.forEach(function (d) { if (Dd >= d.endD - 3) d.el.classList.add('is-done'); });
    }
    if (!STATIC && packets.length && curD > 120) {
      for (var p = 0; p < packets.length; p++) { var pk = packets[p], g = ((t * .00006 + pk.o) % 1) * curD, sg = segAt(g); if (!sg) continue; var loc2 = clamp(g - sg.start, 0, sg.len); if (g > sg.start + sg.len) continue; var q = sg.els[2].getPointAtLength(loc2); pk.el.setAttribute('cx', q.x); pk.el.setAttribute('cy', q.y); }
    }
  }
  var rb;
  function rebuildSoon() { clearTimeout(rb); rb = setTimeout(function () { var k = introT; buildLine(); introT = k; }, 160); }

  // ───────────── sayaçlar, canlı sayılar, yazı efekti ─────────────
  var tweenIO = ('IntersectionObserver' in W) ? new IntersectionObserver(function (es, o) { es.forEach(function (e) { if (e.isIntersecting) { tween(e.target); o.unobserve(e.target); } }); }, { threshold: .5 }) : null;
  function tween(el) {
    var end = parseInt(el.getAttribute('data-count'), 10); if (isNaN(end)) return;
    if (STATIC) { el.textContent = String(end); return; }
    var t0 = null; el.textContent = '0';
    requestAnimationFrame(function step(ts) { if (t0 === null) t0 = ts; var p = Math.min(1, (ts - t0) / 1600); el.textContent = String(Math.round(end * (1 - Math.pow(1 - p, 4)))); if (p < 1) requestAnimationFrame(step); });
  }
  W.initCounters = function () {
    [].slice.call(D.querySelectorAll('[data-count]:not([data-count-bound])')).forEach(function (el) {
      el.setAttribute('data-count-bound', '1');
      if (STATIC || !tweenIO) { el.textContent = el.getAttribute('data-count'); return; }
      tweenIO.observe(el);
    });
  };
  function liveNumbers() {
    var els = [].slice.call(D.querySelectorAll('[data-live]')); if (!els.length || STATIC) return;
    els.forEach(function (el) {
      var base = parseInt(el.getAttribute('data-live'), 10), max = parseInt(el.getAttribute('data-live-max') || (base + 14), 10), val = base;
      var vis = true; if ('IntersectionObserver' in W) new IntersectionObserver(function (e) { vis = e[0].isIntersecting; }).observe(el);
      var iv = setInterval(function () { if (!vis || D.hidden) return; var d = el.closest('[data-cz-draw]'); if (d && !d.classList.contains('is-done')) return; val += 1 + ((Math.random() * 3) | 0); if (val >= max) { val = max; clearInterval(iv); } el.textContent = String(val); }, 1700);
    });
  }
  function typing() {
    var el = D.querySelector('[data-type]'); if (!el) return;
    var lines = (el.getAttribute('data-type') || '').split('|'); if (!lines.length) return;
    if (STATIC) { el.innerHTML = lines[0]; return; }
    var li = 0, ci = 0, vis = true;
    if ('IntersectionObserver' in W) new IntersectionObserver(function (e) { vis = e[0].isIntersecting; }).observe(el);
    (function tick() { if (!vis || D.hidden) return setTimeout(tick, 800); var s = lines[li]; ci++; el.innerHTML = s.slice(0, ci) + '<span class="cur"></span>'; if (ci >= s.length) { if (li >= lines.length - 1) { el.innerHTML = s; return; } ci = 0; li++; return setTimeout(tick, 1800); } setTimeout(tick, 38); })();
  }

  // ───────────── sahne (öğrenen ağ), şerit, imleç, manyetik ─────────────
  function scene() {
    var sc = D.querySelector('[data-scene]'); if (!sc) return;
    var cv = sc.querySelector('canvas'), L = cv ? new Layers(cv) : null, steps = [].slice.call(sc.querySelectorAll('.cz-step2')), dotsEl = [].slice.call(sc.querySelectorAll('.cz-dots i')), last = -1;
    function upd() {
      var r = sc.getBoundingClientRect(), vh = W.innerHeight, q = clamp(-r.top / Math.max(1, r.height - vh), 0, 1);
      var idx = clamp(Math.floor(q * steps.length * .999), 0, steps.length - 1);
      if (L) { L.p = Math.max(L.p, clamp(q * 1.25, 0, 1)); L.focus = idx; W.__cz = W.__cz || {}; W.__cz.layersP = L.p; }
      if (idx !== last) { last = idx; steps.forEach(function (s, i) { s.classList.toggle('on', i === idx); }); dotsEl.forEach(function (d, i) { d.classList.toggle('on', i === idx); }); }
    }
    if (STATIC) { steps.forEach(function (s) { s.classList.add('on'); }); return; }
    var dirty = true; W.addEventListener('scroll', function () { dirty = true; }, { passive: true }); W.addEventListener('resize', function () { dirty = true; });
    addTask(function () { if (dirty) { dirty = false; upd(); } }); upd();
  }

  // ───────────── sabit ürün sahnesi (pinned) ─────────────
  // 0–30 % tel çerçeve çizilir · 30–55 % arayüz belirir ve dolar · 55–70 % sayılar + notlar · 70–100 % bekleme. İlerleme en büyük değerde tutulur (ratchet).
  function pscene(sc) {
    var st = sc.querySelector('.cz-pscene-sticky'), box = sc.querySelector('.cz-phonebox'), wrap = sc.querySelector('.cz-phonewrap'), cell = box && box.parentNode;
    if (!st || !box || !wrap) return;
    var dd = DRAW[box.getAttribute('data-cz-draw')], notes = [].slice.call(sc.querySelectorAll('.cz-callout[data-note]')).sort(function (a, b) { return a.getAttribute('data-note') - b.getAttribute('data-note'); });
    var acts = sc.querySelector('.cz-pactions'), lives = [].slice.call(sc.querySelectorAll('[data-live]')), svgw = null, paths = [], total = 0, pen = null, P = 0, ps = 1;
    function fit() {
      var w0 = wrap.offsetWidth, h0 = wrap.offsetHeight; if (!w0 || !h0) return;
      ps = STATIC ? 1 : clamp(Math.min(cell.clientHeight / h0, cell.clientWidth / w0), .3, 1);
      box.style.width = Math.round(w0 * ps) + 'px'; box.style.height = Math.round(h0 * ps) + 'px'; wrap.style.transform = ps < 1 ? 'scale(' + ps.toFixed(4) + ')' : '';
    }
    function build() {
      if (svgw && svgw.parentNode) svgw.parentNode.removeChild(svgw);
      svgw = null; paths = []; total = 0; pen = null;
      if (!dd || STATIC) return;
      var w0 = wrap.offsetWidth, h0 = wrap.offsetHeight, k = Math.min(w0 / dd.w, h0 / dd.h), ox = (w0 - dd.w * k) / 2, oy = (h0 - dd.h * k) / 2;
      svgw = D.createElementNS(NS, 'svg'); svgw.setAttribute('class', 'cz-pwire'); svgw.setAttribute('viewBox', '0 0 ' + w0 + ' ' + h0); svgw.setAttribute('aria-hidden', 'true'); svgw.setAttribute('focusable', 'false');
      dd.strokes().forEach(function (pts) {
        var d = '', len = 0, prev = null;
        pts.forEach(function (q, i) { var x = ox + q[0] * k, y = oy + q[1] * k; d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1) + ' '; if (prev) len += dist(prev, [x, y]); prev = [x, y]; });
        var el = D.createElementNS(NS, 'path'); el.setAttribute('d', d); el.style.strokeDasharray = len + ' ' + (len + 2); el.style.strokeDashoffset = len; svgw.appendChild(el);
        paths.push({ el: el, len: len, start: total }); total += len;
      });
      pen = D.createElementNS(NS, 'circle'); pen.setAttribute('class', 'pen'); pen.setAttribute('r', 3); svgw.appendChild(pen);
      wrap.insertBefore(svgw, wrap.firstChild);
    }
    function apply() {
      var fade = clamp((P - .30) / .10, 0, 1), bars = clamp((P - .32) / .20, 0, 1), num = clamp((P - .38) / .17, 0, 1), wire = clamp(P / .30, 0, 1);
      sc.style.setProperty('--fade', fade.toFixed(3)); sc.style.setProperty('--bars', bars.toFixed(3)); sc.style.setProperty('--num', num.toFixed(3));
      var Dd = total * wire, head = null, loc = 0;
      paths.forEach(function (s) { var dr = clamp(Dd - s.start, 0, s.len); s.el.style.strokeDashoffset = (s.len - dr).toFixed(1); if (dr > 0 && dr < s.len) { head = s; loc = dr; } });
      if (pen) { if (head && wire < 1) { var pt = head.el.getPointAtLength(loc); pen.setAttribute('cx', pt.x); pen.setAttribute('cy', pt.y); pen.style.opacity = 1; } else pen.style.opacity = 0; }
      if (num < 1) lives.forEach(function (el) { el.textContent = String(Math.round(parseInt(el.getAttribute('data-live'), 10) * num)); });
      var cur = -1; notes.forEach(function (n, i) { var on = P >= .55 + .15 * (i + 1) / (notes.length + 1); n.classList.toggle('on', on); if (on) cur = i; });
      notes.forEach(function (n, i) { n.classList.toggle('cur', i === cur); });
      if (acts) acts.classList.toggle('on', P >= .68);
      if (num >= 1) box.classList.add('is-done');
      sc.setAttribute('data-p', P.toFixed(3)); W.__cz = W.__cz || {}; W.__cz.pscene = P;
    }
    function upd() {
      var r = sc.getBoundingClientRect(), vh = st.clientHeight || W.innerHeight, p = clamp(-r.top / Math.max(1, r.height - vh), 0, 1);
      if (p > P + .0005) { P = p; apply(); }
    }
    fit(); build();
    if ('ResizeObserver' in W && !STATIC) new ResizeObserver(function () { fit(); rebuildSoon(); }).observe(cell);   // sabit CTA çubuğu vb. sonradan yer değiştirirse telefon yeniden sığar
    if (STATIC) { P = 1; apply(); box.classList.add('is-done'); return; }
    apply(); upd();
    sc.addEventListener('focusin', function () { if (P < 1) { P = 1; apply(); } });   // klavye odağı gizli bir nota/bağlantıya giderse sahne tamamlanır
    var dirty = true; W.addEventListener('scroll', function () { dirty = true; }, { passive: true });
    W.addEventListener('resize', function () { fit(); build(); apply(); dirty = true; });
    addTask(function () { if (dirty) { dirty = false; upd(); } });
  }
  function pscenes() { [].slice.call(D.querySelectorAll('[data-pscene]')).forEach(pscene); }
  function strip() {
    var st = D.querySelector('.cz-strip'); if (!st) return;
    var bar = D.querySelector('.cz-prog i'), btns = [].slice.call(D.querySelectorAll('.cz-strip-ctl button'));
    function prog() { if (!bar) return; var m = st.scrollWidth - st.clientWidth; bar.style.width = (m > 0 ? 20 + 80 * (st.scrollLeft / m) : 100) + '%'; }
    st.addEventListener('scroll', prog, { passive: true }); prog();
    btns.forEach(function (b, i) { b.addEventListener('click', function () { st.scrollBy({ left: (i ? 1 : -1) * st.clientWidth * .8, behavior: STATIC ? 'auto' : 'smooth' }); }); });
    if (fine) {
      var down = false, sx = 0, sl = 0, moved = false;
      st.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = st.scrollLeft; });
      W.addEventListener('pointermove', function (e) { if (!down) return; var dx = e.clientX - sx; if (Math.abs(dx) > 4) { moved = true; st.classList.add('drag'); } st.scrollLeft = sl - dx; });
      W.addEventListener('pointerup', function () { down = false; st.classList.remove('drag'); });
      st.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    }
  }
  function pointerFx() {
    if (!fine || STATIC) return;
    var light = D.createElement('div'); light.className = 'cz-light'; D.body.insertBefore(light, D.body.firstChild);
    var mags = [], px = 0, py = 0, raf = 0;
    function mags_update() { raf = 0; mags.forEach(function (m) { var r = m.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, dx = px - cx, dy = py - cy, d = Math.sqrt(dx * dx + dy * dy); if (d < 110) m.style.transform = 'translate(' + (dx * .22).toFixed(1) + 'px,' + (dy * .3).toFixed(1) + 'px)'; else if (m.style.transform) m.style.transform = ''; }); }
    function collect() { mags = [].slice.call(D.querySelectorAll('.cz-btn, .site-header .nav-cta')); }
    collect(); W.addEventListener('load', collect);
    D.addEventListener('pointermove', function (e) {
      light.style.setProperty('--mx', e.clientX + 'px'); light.style.setProperty('--my', e.clientY + 'px'); light.classList.add('on'); px = e.clientX; py = e.clientY;
      var pnl = e.target.closest && e.target.closest('.cz-panel, .proj-link'); if (pnl) { var r = pnl.getBoundingClientRect(); pnl.style.setProperty('--px', (e.clientX - r.left) + 'px'); pnl.style.setProperty('--py', (e.clientY - r.top) + 'px'); }
      if (!raf) raf = requestAnimationFrame(mags_update);
    }, { passive: true });
    D.addEventListener('pointerleave', function () { light.classList.remove('on'); });
  }
  function split() {
    if (STATIC) return;
    [].slice.call(D.querySelectorAll('[data-split]')).forEach(function (h) {
      var words = h.textContent.trim().split(/\s+/), i = 0; h.setAttribute('aria-label', h.textContent.trim()); h.textContent = '';
      words.forEach(function (w, k) { var s = D.createElement('span'); s.className = 'cz-word-in'; s.setAttribute('aria-hidden', 'true'); s.style.setProperty('--i', k); s.textContent = w; if (h.hasAttribute('data-acc') && w.replace(/[.,]/g, '') === h.getAttribute('data-acc')) s.classList.add('cz-acc'); h.appendChild(s); h.appendChild(D.createTextNode(' ')); });
    });
  }

  // ───────────── canvas ağlarını başlat ─────────────
  var CFG = { hero: { count: 68, link: 0, pulses: 7, pointer: true }, head: { count: 30, link: 0, pulses: 2, pointer: true }, cta: { count: 40, link: 0, pulses: 3, pointer: true }, emblem: { count: 16, link: 78, pulses: 2, pointer: false }, mini: { count: 12, link: 66, pulses: 1, pointer: false } };
  function initNets() {
    [].slice.call(D.querySelectorAll('canvas[data-net]:not([data-net-bound])')).forEach(function (cv) {
      cv.setAttribute('data-net-bound', '1'); var k = cv.getAttribute('data-net'), c = CFG[k] || CFG.head;
      new Net(cv, { count: c.count, link: c.link, pulses: c.pulses, pointer: c.pointer, seed: hash(cv.getAttribute('data-seed') || k) });
    });
  }
  W.czRefresh = function () { initNets(); W.initCounters(); };

  // ───────────── mobil sabit CTA ─────────────
  function sticky() {
    var bar = D.querySelector('.cz-sticky'); if (!bar || !('IntersectionObserver' in W)) return;
    var after = D.querySelector(bar.getAttribute('data-sticky-after')), until = D.querySelector(bar.getAttribute('data-sticky-until')) || D.querySelector('footer'), past = false, atEnd = false;
    var apply = function () { bar.classList.toggle('on', past && !atEnd); }; D.body.classList.add('has-sticky');
    if (after) new IntersectionObserver(function (e) { var r = e[0]; past = !r.isIntersecting && r.boundingClientRect.top < 0; apply(); }).observe(after);
    if (until) new IntersectionObserver(function (e) { atEnd = e[0].isIntersecting; apply(); }).observe(until);
  }

  function tiles() {
    var ts = [].slice.call(D.querySelectorAll('.cz-tile'));
    if (!ts.length) return;
    if (STATIC || !('IntersectionObserver' in W)) { ts.forEach(function (t) { t.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }); }, { threshold: .35 });
    ts.forEach(function (t) { io.observe(t); });
  }
  function init() {
    split(); tiles(); initNets(); W.initCounters(); scene(); pscenes(); strip(); pointerFx(); liveNumbers(); typing(); sticky();
    if (!D.querySelector('[data-cz-draw]')) root.classList.add('no-line-draw');
    if (D.querySelector('[data-cz-start]')) {
      buildLine();
      if (!STATIC) {
        var t0 = null, dirty = true; W.addEventListener('scroll', function () { dirty = true; }, { passive: true });
        addTask(function (t) { if (t0 === null) t0 = t; if (introT < 1) { introT = clamp((t - t0) / 2000, 0, 1); dirty = true; } if (dirty || curD > 120) { dirty = false; renderLine(t); } });
      }
      W.addEventListener('resize', rebuildSoon); W.addEventListener('load', rebuildSoon);
      if (D.fonts && D.fonts.ready) D.fonts.ready.then(rebuildSoon);
      if ('ResizeObserver' in W) { var lastH = D.body.scrollHeight; new ResizeObserver(function () { var h = D.body.scrollHeight; if (Math.abs(h - lastH) > 4) { lastH = h; rebuildSoon(); } }).observe(D.body); }
    }
    // çizim yoksa (iç sayfa) mini arayüzler hemen görünür
    if (STATIC) [].slice.call(D.querySelectorAll('[data-cz-draw]')).forEach(function (e) { e.classList.add('is-done'); });
  }
  // Randevu bağlantısına yaklaşılınca (hover/odak/dokunma) Cal.com'a bağlantı önceden kurulur; üçüncü taraf dosyası kopyalanmaz.
  (function () {
    var warmed = false;
    function warm(e) {
      if (warmed || !e.target || !e.target.closest) return;
      var a = e.target.closest('a[href*="randevu"]'); if (!a) return;
      warmed = true;
      ['preconnect', 'dns-prefetch'].forEach(function (rel) { var l = D.createElement('link'); l.rel = rel; l.href = 'https://app.cal.com'; if (rel === 'preconnect') l.crossOrigin = ''; D.head.appendChild(l); });
    }
    ['pointerover', 'focusin', 'touchstart'].forEach(function (ev) { D.addEventListener(ev, warm, { passive: true, capture: true }); });
  })();
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', init); else init();
})();
