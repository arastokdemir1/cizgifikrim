#!/usr/bin/env python3
"""Yerel geliştirme sunucusu: siteyi statik sunar + `/__lead` adresinde SAHTE submit-lead uç noktası.

Kullanım:   python3 scripts/dev-server.py [port]        (varsayılan 8800)
Sonra:      http://127.0.0.1:8800/tr/contact.html?lead=mock   (ya da randevu.html?lead=mock)
`?lead=mock` yalnız localhost/127.0.0.1'de formu açar ve istemciyi `/__lead`e bağlar (assets/js/lead-config.js).

Sahte uç nokta, supabase/functions/submit-lead/handler.ts sözleşmesini taklit eder (veritabanı yok, bellekte tutar):
  GET  /__lead            → {ok, token}   (HMAC imzalı, IP'ye bağlı)
  POST /__lead            → honeypot (`website` dolu) sahte 200 | token ≥3 sn ve ≤2 saat (yoksa 429 too_fast / 400 token_*) |
                            doğrulama (422 invalid_input) | bağlantı sezgisi (sahte 200) | IP başına saatte 5 (429 rate_limited) |
                            aynı e-posta+tür 10 dk içinde çift kayıt (200, aynı ref)
  Test e-postaları:       fail@example.test → 500 server_error · busy@example.test → 429 busy · slow@example.test → 4 sn gecikme
  GET  /__lead/_log       → alınan kayıtlar (yalnız geliştirme) · POST /__lead/_reset → sıfırla
Gerçek uç nokta değildir; canlı sitede kullanılmaz.
"""
import hashlib, hmac, http.server, json, os, re, socketserver, sys, threading, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SECRET = b"dev-only-secret"
MIN_FILL_S, MAX_AGE_S, DUP_S, MAX_PER_IP = 3, 2 * 3600, 600, 5
KINDS = {"contact", "quote", "waitlist", "order_request"}
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
STORE, LOG, LOCK = [], [], threading.Lock()


def sig(t: int, ip: str) -> str:
    return hmac.new(SECRET, f"form:{t}:{ip}".encode(), hashlib.sha256).hexdigest()


def text(v, mx, required=False):
    """None=boş, False=geçersiz (handler.ts `text()` ile aynı mantık)."""
    if v in (None, ""): return False if required else None
    if not isinstance(v, str): return False
    s = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", v).strip()
    if not s: return False if required else None
    return False if len(s) > mx else s


def urls(*vals):
    return sum(len(re.findall(r"https?://|www\.", v, re.I)) for v in vals if v)


class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)

    def log_message(self, fmt, *args):
        if "/__lead" in (args[0] if args else ""): sys.stderr.write("[lead] " + fmt % args + "\n")

    def _json(self, status, body):
        raw = json.dumps(body).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json"); self.send_header("Cache-Control", "no-store"); self.send_header("Content-Length", str(len(raw)))
        self.end_headers(); self.wfile.write(raw)

    def do_GET(self):
        if self.path.split("?")[0] == "/__lead":
            t = int(time.time() * 1000); return self._json(200, {"ok": True, "token": f"{t}.{sig(t, self.client_address[0])}"})
        if self.path.split("?")[0] == "/__lead/_log":
            with LOCK: return self._json(200, {"ok": True, "items": STORE, "log": LOG[-50:]})
        return super().do_GET()

    def do_POST(self):
        path = self.path.split("?")[0]
        if path == "/__lead/_reset":
            with LOCK: STORE.clear(); LOG.clear()
            return self._json(200, {"ok": True})
        if path != "/__lead": return self._json(404, {"ok": False})
        n = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(n).decode("utf-8", "replace")
        if len(raw) > 16 * 1024: return self._json(413, {"ok": False, "error": "too_large"})
        try:
            body = json.loads(raw)
            if not isinstance(body, dict): raise ValueError
        except Exception:
            return self._json(400, {"ok": False, "error": "invalid_json"})
        ip = self.client_address[0]
        if isinstance(body.get("website"), str) and body["website"] != "":
            with LOCK: LOG.append("honeypot")
            return self._json(200, {"ok": True, "ref": 0})
        tok = body.get("form_token") if isinstance(body.get("form_token"), str) else ""
        try:
            ts, sg = tok.split(".", 1); t = int(ts)
        except Exception:
            return self._json(400, {"ok": False, "error": "token_missing"})
        if not hmac.compare_digest(sg, sig(t, ip)): return self._json(400, {"ok": False, "error": "token_invalid"})
        age = time.time() * 1000 - t
        if age < MIN_FILL_S * 1000:
            with LOCK: LOG.append("too_fast")
            return self._json(429, {"ok": False, "error": "too_fast"})
        if age > MAX_AGE_S * 1000: return self._json(400, {"ok": False, "error": "token_expired"})
        kind = body.get("kind") if isinstance(body.get("kind"), str) else ""
        name, email_raw = text(body.get("name"), 120), text(body.get("email"), 254, True)
        email = email_raw.lower() if isinstance(email_raw, str) else email_raw
        phone, company, subject = text(body.get("phone"), 30), text(body.get("company"), 160), text(body.get("subject"), 200)
        message, ver = text(body.get("message"), 4000), text(body.get("consent_version"), 40, True)
        bad = (kind not in KINDS or name is False or (name is None and kind != "waitlist") or not isinstance(email, str) or not EMAIL_RE.match(email)
               or phone is False or company is False or subject is False or message is False or body.get("consent") is not True or not isinstance(ver, str))
        if bad:
            with LOCK: LOG.append("invalid_input")
            return self._json(422, {"ok": False, "error": "invalid_input"})
        if urls(name, company, subject) > 0 or urls(message) > 2:
            with LOCK: LOG.append("url_heuristic")
            return self._json(200, {"ok": True, "ref": 0})
        if email == "busy@example.test": return self._json(429, {"ok": False, "error": "busy"})
        if email == "slow@example.test": time.sleep(4)
        if email == "fail@example.test": return self._json(500, {"ok": False, "error": "server_error"})
        with LOCK:
            hour = [x for x in STORE if x["ip"] == ip and time.time() - x["at"] < 3600]
            if len(hour) >= MAX_PER_IP:
                LOG.append("rate_limited"); return self._json(429, {"ok": False, "error": "rate_limited"})
            dup = next((x for x in STORE if x["email"] == email and x["kind"] == kind and time.time() - x["at"] < DUP_S), None)
            if dup: return self._json(200, {"ok": True, "ref": dup["id"]})
            row = {"id": len(STORE) + 1, "at": time.time(), "ip": ip, "kind": kind, "name": name, "email": email, "phone": phone, "message": message,
                   "consent_version": ver, "source_page": body.get("source_page"), "utm": body.get("utm"), "age_ms": int(age)}
            STORE.append(row); LOG.append("ok")
        return self._json(200, {"ok": True, "ref": row["id"]})


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8800
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(("127.0.0.1", port), H) as srv:
        print(f"dev-server: http://127.0.0.1:{port}/  (sahte uç nokta: /__lead; formu açmak için sayfa adresine ?lead=mock ekleyin)")
        srv.serve_forever()
