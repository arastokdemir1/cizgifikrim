# Çalışma alanı olay akışı

`project_activity_events`, proje sayfasındaki ofis katının gerçek zamanlı, yayınlanabilir sinyal kaynağıdır.

Tarayıcı yalnızca `is_public = true` satırlarını okur. Olay ekleme işlemi anonim istemciden yapılmaz; güvenilir agent runner veya sunucu, service-role ile kısa ve arındırılmış bir olay yazmalıdır.

Migration gerçek Supabase projesine uygulandıktan ve güvenilir writer hazır olduktan sonra `assets/js/supabase-client.js` içindeki `PROJECT_ACTIVITY_FEED_ENABLED` değeri `true` yapılır. Bu iki adım tamamlanmadan UI, hata üretmeden yerel prototip modunda kalır.

| Alan | Amaç |
| --- | --- |
| `project_slug` | Proje sayfası eşlemesi, örn. `ersoy` |
| `event_type` | `status`, `message`, `movement` veya `task` |
| `agent_key` | Projede tanımlı rol anahtarı, örn. `frontend-codex` |
| `target_agent_key` | Mesaj veya masa ziyareti hedefi; isteğe bağlı |
| `summary` | En fazla 280 karakter, kullanıcıya gösterilmesi güvenli özet |
| `status` | `working`, `reviewing`, `waiting` veya `done` |
| `occurred_at` | Olay zamanı |

Örnek güvenli olay:

```json
{
  "project_slug": "ersoy",
  "event_type": "message",
  "agent_key": "frontend-codex",
  "target_agent_key": "backend-claude",
  "summary": "Arayüz sözleşmesindeki alan adlarını birlikte doğruluyor.",
  "status": "working"
}
```

Kod, token, kişisel veri, dosya yolu, ham terminal çıktısı veya hassas hata ayrıntısı bu akışa yazılmamalıdır.
