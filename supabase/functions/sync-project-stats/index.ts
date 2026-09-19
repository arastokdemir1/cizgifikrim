// Yerel cf-sync aracından gelen proje istatistiklerini projects tablosuna yazar.
// verify_jwt=false: istemci Supabase kullanıcısı değil; kimlik x-sync-token
// başlığıyla doğrulanır (public.sync_tokens'taki SHA-256 özetine karşı).
// Yazılabilen alanlar dar tutulur: yalnızca commit sayıları, son güncelleme
// zamanı/notu ve filtrelenmiş kısa notlar. Açıklama, durum vb. değiştirilemez.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const SLUG_RE = /^[a-z0-9._-]{1,64}$/i;
// İstemci tarafı filtreden kaçan bir şey olursa burada ikinci kez elenir.
const SENSITIVE_RE = /(token|secret|password|şifre|parola|api[ _-]?key|service[_ ]role|anon|rls|polic|izin|izni|grant|revoke|execute|auth|güvenlik|security|vuln|exploit|cve|leak|sızıntı|credential|\.env|revert)/i;

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const int = (v: unknown, max = 1_000_000) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) ? Math.min(Math.max(n, 0), max) : 0;
};

const isoOrNull = (v: unknown) => {
  if (typeof v !== "string") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) || d.getTime() > Date.now() + 86_400_000 ? null : d.toISOString();
};

function cleanNote(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const text = v.replace(/[<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, 140);
  if (text.length < 4 || SENSITIVE_RE.test(text)) return null;
  return text;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });

  const token = req.headers.get("x-sync-token") || "";
  if (token.length < 32) return new Response("unauthorized", { status: 401 });
  const { data: tokenRow } = await supabase
    .from("sync_tokens").select("id").eq("token_sha256", await sha256Hex(token)).is("revoked_at", null).maybeSingle();
  if (!tokenRow) return new Response("unauthorized", { status: 401 });

  let body: any;
  try { body = await req.json(); } catch { return new Response("invalid json", { status: 400 }); }
  const items = Array.isArray(body?.projects) ? body.projects.slice(0, 50) : [];

  const results: Record<string, string> = {};
  for (const item of items) {
    const slug = String(item?.slug || "");
    if (!SLUG_RE.test(slug)) continue;
    const { data: project } = await supabase
      .from("projects").select("slug, show_commit_detail").eq("slug", slug).maybeSingle();
    if (!project) { results[slug] = "unknown-slug"; continue; }

    const total = int(item.commit_count_total);
    const d30 = Math.min(int(item.commit_count_30d), total);
    const d7 = Math.min(int(item.commit_count_7d), d30);
    const lastAt = isoOrNull(item.last_commit_at);
    const showDetail = project.show_commit_detail !== false;

    const recent = showDetail && Array.isArray(item.recent)
      ? item.recent.slice(0, 6).map((r: any) => ({ at: isoOrNull(r?.at), text: cleanNote(r?.text) }))
          .filter((r: any) => r.at && r.text)
      : [];

    const update: Record<string, unknown> = {
      commit_count_total: total,
      commit_count_30d: d30,
      commit_count_7d: d7,
      recent_updates: recent,
      stats_synced_at: new Date().toISOString(),
    };
    if (lastAt) update.latest_update_at = lastAt;
    // Not yalnızca son 30 günde hareket varsa yenilenir; sessiz projede elle
    // yazılmış not korunur.
    if (d30 > 0) {
      update.latest_update_text = recent.length
        ? recent[0].text
        : d7 > 0
          ? `Son 7 günde ${d7} geliştirme yapıldı. Kaynak kod ve değişiklik detayları paylaşılmıyor; yalnızca aktivite gösteriliyor.`
          : `Son 30 günde ${d30} geliştirme yapıldı. Kaynak kod ve değişiklik detayları paylaşılmıyor; yalnızca aktivite gösteriliyor.`;
    }

    const { error } = await supabase.from("projects").update(update).eq("slug", slug);
    results[slug] = error ? "db-error" : "ok";
    if (error) console.error("sync update failed", slug, error);
  }

  return Response.json({ ok: true, results });
});
