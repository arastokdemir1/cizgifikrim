// Cal.com webhook alıcısı — randevu oluşunca public.bookings'e gerçek kaydı yazar.
// verify_jwt=false: Cal.com bize Supabase JWT'si göndermez, kendi imza
// başlığını (x-cal-signature-256) gönderir; kimlik doğrulamayı biz
// CAL_WEBHOOK_SECRET ile burada yapıyoruz.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const CAL_WEBHOOK_SECRET = Deno.env.get("CAL_WEBHOOK_SECRET");
const CAL_API_KEY = Deno.env.get("CAL_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function hmacHex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Webhook payload'ı bazen eksik/güncel olmayabilir; kanonik veriyi Cal.com
// API v2'den doğrulamak için API key'i burada, sadece sunucu tarafında kullanıyoruz.
async function fetchCanonicalBooking(uid: string) {
  if (!CAL_API_KEY) return null;
  try {
    const res = await fetch(`https://api.cal.com/v2/bookings/${uid}`, {
      headers: {
        Authorization: `Bearer ${CAL_API_KEY}`,
        "cal-api-version": "2024-08-13",
      },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("method not allowed", { status: 405 });
  }

  const rawBody = await req.text();

  if (CAL_WEBHOOK_SECRET) {
    const signature = req.headers.get("x-cal-signature-256") || "";
    const expected = await hmacHex(CAL_WEBHOOK_SECRET, rawBody);
    if (signature !== expected) {
      return new Response("invalid signature", { status: 401 });
    }
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("invalid json", { status: 400 });
  }

  const triggerEvent = payload?.triggerEvent as string | undefined;
  const booking = payload?.payload;
  if (!booking?.uid) {
    return new Response("ignored: no booking uid", { status: 200 });
  }

  const canonical = await fetchCanonicalBooking(booking.uid);
  const source = canonical || booking;

  const statusMap: Record<string, string> = {
    BOOKING_CREATED: "confirmed",
    BOOKING_RESCHEDULED: "rescheduled",
    BOOKING_CANCELLED: "cancelled",
  };

  const attendee = Array.isArray(source.attendees) ? source.attendees[0] : source.attendee;

  const { error } = await supabase.from("bookings").upsert({
    cal_booking_uid: booking.uid,
    event_type: source.eventType?.title || source.title || null,
    attendee_name: attendee?.name || null,
    attendee_email: attendee?.email || null,
    start_time: source.startTime || null,
    end_time: source.endTime || null,
    status: statusMap[triggerEvent || ""] || "confirmed",
    raw_payload: payload,
  }, { onConflict: "cal_booking_uid" });

  if (error) {
    console.error("bookings upsert failed", error);
    return new Response("db error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
});
