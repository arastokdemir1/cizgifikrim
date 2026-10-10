#!/usr/bin/env python3
"""Demo sayfaları duman testi (Playwright, Python). Yerel sunucu açar, tüm demo sayfalarını 1280 ve 390 px'te gezer. Ayrıca h1 sayısı (=1) ve dokunma hedefi (≥44 px) denetlenir.

Her sayfa için:  konsol/sayfa hatası · ağ hatası (4xx/5xx) · yatay taşma · kırık görsel · kırık #bağlantı · ölü iç bağlantı (HTTP durumu)
                 · görünür her etkileşimli öğe GERÇEK fare/klavye eylemiyle denenir (tıklanamayan = başka öğe üstünde / görünmez; yanıtsız = DOM değişmedi)
Ek olarak ana akış doğrulamaları (e-ticaret sohbet düğmeleri/önayar/yeniden oynat, CarLog sekmeleri, konaklama formu, ...).

Kullanım:  python3 scripts/demo-duman.py [--webkit] [--sayfa=/demo/carlog/] [--hizli]
  --webkit  Safari motoru (Playwright WebKit; `playwright install webkit` gerekir)   --hizli  yalnız 1280, öğe sınırı 25
Çıkış kodu: 0 = temiz, 1 = bulgu var.
"""
import glob, json, os, re, subprocess, sys, time, urllib.parse
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 8841
BASE = f"http://127.0.0.1:{PORT}"
PAGES = ["/demo/e-ticaret/terk-edilmis-sepet/", "/demo/e-ticaret/satis-asistani/", "/demo/e-ticaret/musteri-sadakati/", "/demo/web-sitesi/", "/demo/web-sitesi/kafe/",
         "/demo/web-sitesi/mimarlik/", "/demo/web-sitesi/klinik/", "/demo/web-sitesi/konaklama/", "/demo/web-sitesi/yerel-hizmet/", "/demo/web-sitesi/fotografci/",
         "/demo/web-sitesi/kisisel-portfolyo/", "/demo/web-sitesi/danismanlik/", "/demo/web-sitesi/profesyonel-portfolyo/", "/demo/carlog/", "/demo/piyasa/", "/tr/demo.html",
         "/tr/eticaret-paketi.html", "/tr/projeler.html"]
args = sys.argv[1:]
WEBKIT = "--webkit" in args
FAST = "--hizli" in args
ONLY = [a.split("=", 1)[1] for a in args if a.startswith("--sayfa=")]
SIZES = [(1280, 900)] if FAST else [(1280, 900), (390, 844)]
MAXEL = 25 if FAST else 60

LIST_JS = r"""(function(){
 var sel='a[href],button,input,select,textarea,summary,[role=tab],[role=button]';
 var out=[];[].slice.call(document.querySelectorAll(sel)).forEach(function(e,i){
  var cs=getComputedStyle(e),r=e.getBoundingClientRect();
  if(cs.display==='none'||cs.visibility==='hidden'||r.width<2||r.height<2) return;
  if(e.closest('[hidden],[aria-hidden=true],[inert]')) return;
  if(e.tagName==='INPUT'&&e.type==='hidden') return;
  if(e.closest('.cz-hp,.wa-footer-bar,.skip-link')||e.classList.contains('skip-link')) return;
  e.setAttribute('data-pi',String(i));
  out.push({i:i,tag:e.tagName.toLowerCase(),type:e.type||'',txt:(e.innerText||e.value||e.getAttribute('aria-label')||e.placeholder||'').trim().replace(/\s+/g,' ').slice(0,36),href:e.getAttribute('href')||'',disabled:!!e.disabled,opts:e.options?e.options.length:0})});
 return out})()"""
STATE_JS = r"""(function(){var d=document.documentElement;var wide=[];
 [].forEach.call(document.querySelectorAll('body *'),function(e){var r=e.getBoundingClientRect();if(r.width>0&&r.right>innerWidth+2&&getComputedStyle(e).position!=='fixed'&&!e.closest('[class*=marquee],[class*=slider],[class*=scroll],.demo-presets,.demo-scenario-nav'))wide.push(e.tagName.toLowerCase()+'.'+String(e.className).slice(0,24))});
 return {ov:d.scrollWidth>innerWidth+1,sw:d.scrollWidth,wide:wide.slice(0,4),
  broken:[].filter.call(document.images,function(i){return i.complete&&i.naturalWidth===0&&i.currentSrc}).map(function(i){return (i.getAttribute('src')||'').slice(-40)}),
  hash:[].filter.call(document.querySelectorAll('a[href^="#"]'),function(a){var h=a.getAttribute('href');return h.length>1&&!document.getElementById(h.slice(1))}).map(function(a){return a.getAttribute('href')})}})()"""
MUT_START = r"""(function(){window.__mc=0;if(window.__mo)window.__mo.disconnect();window.__mo=new MutationObserver(function(m){window.__mc+=m.length});window.__mo.observe(document.documentElement,{subtree:true,childList:true,attributes:true,characterData:true});window.__u=location.href;window.__sy=scrollY;window.__ae=document.activeElement;})()"""
MUT_END = r"""(function(){return {m:window.__mc,nav:location.href!==window.__u,sc:Math.abs(scrollY-window.__sy)>2,fo:document.activeElement!==window.__ae}})()"""

A11Y_JS = """(function(){
 var h1=[].filter.call(document.querySelectorAll('h1'),function(h){var r=h.getBoundingClientRect();return (r.width>0&&r.height>0)||h.classList.contains('sr-only-h1')||h.classList.contains('visually-hidden')}).length;
 var small=[];
 document.querySelectorAll('a[href],button,input:not([type=hidden]):not([type=checkbox]):not([type=radio]),select,textarea,summary,[role=tab]').forEach(function(e){
  var cs=getComputedStyle(e),r=e.getBoundingClientRect();
  if(cs.display==='none'||cs.visibility==='hidden'||r.width<1||r.height<1)return;
  if(e.closest('[hidden],[aria-hidden=true],[inert],.cz-hp,.skip-link'))return;
  if(r.left>innerWidth+5||r.right<-5)return;
  if(r.height<43.5||r.width<43.5){if(e.tagName==='A'&&r.height>=43.5)return;small.push(e.tagName.toLowerCase()+'.'+String(e.className).trim().replace(/\\s+/g,'.').slice(0,26)+' '+Math.round(r.width)+'x'+Math.round(r.height)+' «'+(e.innerText||e.value||e.getAttribute('aria-label')||'').trim().replace(/\\s+/g,' ').slice(0,18)+'»')}});
 return {h1:h1,small:small}})()"""

findings = []
def bad(page, w, msg):
    findings.append((page, w, msg)); print(f"    ✗ {msg}", flush=True)

def launch(p):
    if WEBKIT:
        return p.webkit.launch()
    try:
        return p.chromium.launch()
    except Exception:
        for c in sorted(glob.glob(os.path.expanduser("~/Library/Caches/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-mac-arm64/chrome-headless-shell")) + glob.glob(os.path.expanduser("~/.cache/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-linux/chrome-headless-shell")), reverse=True):
            try: return p.chromium.launch(executable_path=c)
            except Exception: continue
        raise

STATEFUL = ("/demo/carlog/",)
HIT_JS = """(function(i){var e=document.querySelector('[data-pi="'+i+'"]');if(!e)return null;
 e.scrollIntoView({block:'center',inline:'center'});var r=e.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
 var inView=cx>=0&&cy>=0&&cx<=innerWidth&&cy<=innerHeight,t=inView?document.elementFromPoint(cx,cy):null;
 var ok=!!t&&(t===e||e.contains(t)),clipped=!t||t===document.body||t===document.documentElement;
 return {x:cx,y:cy,inView:inView,ok:ok,clipped:clipped,hit:t?(t.tagName.toLowerCase()+'.'+String(t.className).slice(0,26)):''}})"""
SET_RANGE = """(i)=>{var e=document.querySelector('[data-pi="'+i+'"]');e.value=String(Math.round((+e.min+ +e.max)/2));e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))}"""

def reset(pg, path):
    pg.goto(BASE + path); pg.wait_for_timeout(900); pg.evaluate(LIST_JS)

def sweep(pg, path, w):
    els = pg.evaluate(LIST_JS)
    n = 0
    for k, el in enumerate(els[:MAXEL]):
        label = f'{el["tag"]}{("[" + el["type"] + "]") if el["type"] and el["tag"] == "input" else ""} «{el["txt"]}»'
        if el["disabled"]: continue
        if el["tag"] == "a":
            h = el["href"]
            if h.startswith(("mailto:", "tel:", "javascript:")): continue
            if not h.startswith("#"):
                u = urllib.parse.urljoin(BASE + path, h)
                if not u.startswith(BASE): continue
                st = pg.request.get(u.split("#")[0]).status
                if st != 200: bad(path, w, f"ölü bağlantı: {label} → {h} ({st})")
                continue
        if k and (k % 10 == 0 or path in STATEFUL): reset(pg, path)   # durum sızmasın (CarLog gibi uygulamalarda her öğeden önce)
        loc = pg.locator(f'[data-pi="{el["i"]}"]')
        hit = pg.evaluate(f"({HIT_JS})({el['i']})")
        if not hit or not hit["inView"] or (not hit["ok"] and hit["clipped"]): continue   # kapalı çekmece / kırpılmış / kaydırma kabı dışı: kullanıcı göremez
        if not hit["ok"]:
            bad(path, w, f"tıklanamadı: {label}: başka öğe üstünde ({hit['hit']})")
            reset(pg, path); continue
        pg.evaluate(MUT_START)
        try:
            if el["tag"] == "input" and el["type"] in ("text", "email", "tel", "search", "url", "number", ""):
                pg.mouse.click(hit["x"], hit["y"]); pg.keyboard.press("Control+A"); pg.keyboard.insert_text("5" if el["type"] == "number" else "deneme")
            elif el["tag"] == "input" and el["type"] == "range":
                pg.evaluate(SET_RANGE, el["i"])
            elif el["tag"] == "input" and el["type"] == "date":
                loc.fill("2030-06-10", timeout=1500)
            elif el["tag"] == "textarea":
                pg.mouse.click(hit["x"], hit["y"]); pg.keyboard.insert_text("deneme mesajı")
            elif el["tag"] == "select":
                if el["opts"] > 1: loc.select_option(index=1, timeout=1500)
            else:
                pg.mouse.click(hit["x"], hit["y"])
        except Exception as e:
            bad(path, w, f"eylem çalışmadı: {label}: {str(e).splitlines()[0][:80]}")
            continue
        pg.wait_for_timeout(260)
        r = pg.evaluate(MUT_END); n += 1
        if r["nav"]: reset(pg, path)
        elif r["m"] == 0 and not r["sc"] and not r["fo"] and el["tag"] != "select":
            bad(path, w, f"yanıtsız: {label}")
    return n

def flow_checks(pg, path, w):
    """Ana akış doğrulamaları (sayfaya özgü)."""
    if path.startswith("/demo/e-ticaret/"):
        acts = {"terk-edilmis-sepet": ["js-btn-complete-cart", "js-btn-ask-size"], "satis-asistani": ["js-btn-buy-instant", "js-btn-view-terms"], "musteri-sadakati": ["js-btn-review-5star", "js-btn-repeat-order"]}[path.strip("/").split("/")[-1]]
        for a in acts:
            pg.goto(BASE + path); pg.wait_for_selector("#wa-chat-body ." + a, timeout=8000); pg.wait_for_timeout(500)
            before = pg.evaluate("document.querySelector('#wa-chat-body').children.length")
            pg.locator("#wa-chat-body ." + a).click(timeout=2500); pg.wait_for_timeout(4500)
            after = pg.evaluate("document.querySelector('#wa-chat-body').children.length")
            if after <= before: bad(path, w, f"sohbet düğmesi {a} yeni mesaj eklemedi ({before}→{after})")
        pg.goto(BASE + path); pg.wait_for_selector("#wa-chat-body", timeout=8000)
        if w < 600: pg.locator("#tab-mobile-controls").click(timeout=2500); pg.wait_for_timeout(300)
        pg.locator(".demo-preset-btn").nth(1).click(timeout=2500); pg.wait_for_timeout(900)
        if "Lumina" not in pg.inner_text("#wa-header-name"): bad(path, w, "ön ayar başlığı güncellemedi")
        pg.fill("#input-store", "Deneme Mağaza"); pg.wait_for_timeout(300)
        if "Deneme Mağaza" not in pg.inner_text("#wa-header-name"): bad(path, w, "mağaza adı yazınca sohbet başlığı güncellenmedi")
        if w < 600: pg.locator("#tab-mobile-preview").click(timeout=2500); pg.wait_for_timeout(300)
        # sohbet girdisi (gerçek giriş): yazılan mesaj balon olarak eklenmeli
        inp = pg.locator("#wa-user-input")
        if inp.count():
            b0 = pg.evaluate("document.querySelector('#wa-chat-body').children.length"); inp.fill("Beden tablosu var mı?"); inp.press("Enter"); pg.wait_for_timeout(2600)
            if pg.evaluate("document.querySelector('#wa-chat-body').children.length") <= b0 + 1: bad(path, w, "sohbet girdisi: yazılan mesaja örnek yanıt gelmedi")
        else: bad(path, w, "sohbet girdisi gerçek bir alan değil (#wa-user-input yok)")
        pg.locator("#btn-replay").click(timeout=2500); pg.wait_for_timeout(300)
    elif path == "/demo/carlog/":
        pg.goto(BASE + path); pg.wait_for_timeout(1200)
        for name in ("Canlı Sürüş", "Garajım", "Özet"):
            pg.get_by_role("button", name=name).first.click(timeout=2500); pg.wait_for_timeout(400)
            if not pg.evaluate("(function(n){var on=document.querySelector('.tabbar .on,[class*=tab] .on');return !!on&&on.innerText.indexOf(n)>=0})", name): bad(path, w, f"sekme {name} etkinleşmedi")
    elif path == "/demo/web-sitesi/konaklama/":
        pg.goto(BASE + path); pg.wait_for_timeout(800)
        pg.fill("#stay-arrival", "2030-06-10"); pg.fill("#stay-departure", "2030-06-12"); pg.locator("#stay-request-form button[type=submit]").click(timeout=2500); pg.wait_for_timeout(400)
        if "Ekranınızda hazırlanan örnek" not in pg.inner_text("#stay-request-result"): bad(path, w, "konaklama formu örnek özeti göstermedi")
    elif path == "/tr/demo.html":
        pg.goto(BASE + path); pg.wait_for_timeout(1500)
        if "/demo/e-ticaret/" not in pg.url: bad(path, w, f"yönlendirme demo sayfasına gitmedi: {pg.url}")

def main():
    srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT), "--bind", "127.0.0.1"], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1.0)
    t0 = time.time()
    try:
        with sync_playwright() as p:
            br = launch(p)
            for path in (ONLY or PAGES):
                for (w, h) in SIZES:
                    ctx = br.new_context(viewport={"width": w, "height": h}, is_mobile=w < 600 and not WEBKIT, has_touch=w < 600)
                    pg = ctx.new_page(); errs = []
                    pg.on("console", lambda m: errs.append("konsol: " + m.text[:100]) if m.type == "error" else None)
                    pg.on("pageerror", lambda e: errs.append("sayfa hatası: " + str(e)[:100]))
                    pg.on("response", lambda r: errs.append(f"ağ {r.status}: {r.url[-70:]}") if r.status >= 400 and r.url.startswith(BASE) else None)
                    print(f"{path} @{w}", flush=True)
                    try:
                        pg.goto(BASE + path, wait_until="load"); pg.wait_for_timeout(1800)
                        st = pg.evaluate(STATE_JS)
                        if st["ov"]: bad(path, w, f"yatay taşma: kaydırma genişliği {st['sw']} > {w}; taşan: {st['wide']}")
                        for b in st["broken"]: bad(path, w, f"kırık görsel: {b}")
                        for hsh in st["hash"]: bad(path, w, f"kırık # bağlantı: {hsh}")
                        ay = pg.evaluate(A11Y_JS)
                        if path != "/tr/demo.html" and ay["h1"] != 1: bad(path, w, f"h1 sayısı {ay['h1']} (1 olmalı)")
                        for sm in ay["small"][:8]: bad(path, w, f"küçük dokunma hedefi (<44 px): {sm}")
                        n = sweep(pg, path, w)
                        flow_checks(pg, path, w)
                        for e in errs[:6]: bad(path, w, e)
                        print(f"    {n} öğe denendi", flush=True)
                    except Exception as e:
                        bad(path, w, "test çalışmadı: " + str(e).split("\n")[0][:120])
                    ctx.close()
            for (w, h) in SIZES:   # parça sayfa tek başına açıldığında da h1 + dokunma hedefi
                ctx = br.new_context(viewport={"width": w, "height": h}); pg = ctx.new_page()
                pg.goto(BASE + "/demo/e-ticaret/shared/widget.html", wait_until="load"); pg.wait_for_timeout(1200)
                print(f"/demo/e-ticaret/shared/widget.html @{w}", flush=True)
                ay = pg.evaluate(A11Y_JS)
                if ay["h1"] != 1: bad("/demo/e-ticaret/shared/widget.html", w, f"h1 sayısı {ay['h1']} (1 olmalı)")
                for sm in ay["small"][:8]: bad("/demo/e-ticaret/shared/widget.html", w, f"küçük dokunma hedefi (<44 px): {sm}")
                ctx.close()
            br.close()
    finally:
        srv.terminate()
    print(f"\n{'WEBKIT' if WEBKIT else 'CHROMIUM'}: {len(findings)} bulgu, {time.time() - t0:.0f} sn")
    for f in findings: print("  -", f[0], f[1], f[2])
    sys.exit(1 if findings else 0)

if __name__ == "__main__":
    main()
