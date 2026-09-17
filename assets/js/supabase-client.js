// CizgiFikrim — Supabase bağlantısı ve veri erişim yardımcıları.
// anon key public'tir, güvenlik RLS politikalarıyla sağlanır (bkz. Supabase şeması).
const SUPABASE_URL = 'https://iekdktdhhryqewvcrnmr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlla2RrdGRoaHJ5cWV3dmNybm1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzMTA4NjIsImV4cCI6MjA5OTg4Njg2Mn0.1R70BzCmDdXbTpVGGk19y9ThY9n7dDJ7SMcJWc5Uhl4';

// Migration uzaktaki projeye uygulanıp güvenilir agent runner olay yazmaya
// başladığında bunu true yap. Uygulanmamış tabloda 404 isteği üretmek yerine
// çalışma alanı dürüstçe yerel prototip modunda kalır.
const PROJECT_ACTIVITY_FEED_ENABLED = false;

const sb = window.supabase ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const STATUS_META = {
  live:    { dotClass: 'dot-live',    labelClass: 'label-live' },
  rd:      { dotClass: 'dot-rd',      labelClass: 'label-rd' },
  wip:     { dotClass: 'dot-wip',     labelClass: 'label-wip' },
  concept: { dotClass: 'dot-concept', labelClass: 'label-concept' },
};

const CATEGORY_META = {
  'otonom-ai': { name: 'Otonom AI / Bilişsel Sistemler', folioNum: '01' },
  'mobil':     { name: 'Mobil Uygulamalar',              folioNum: '02' },
  'finansal':  { name: 'Finansal Sistemler',              folioNum: '03' },
  'otomotiv':  { name: 'Otomotiv',                        folioNum: '04' },
};

function isSafeProjectSlug(value) {
  return /^[a-z0-9._-]+$/i.test(String(value || ''));
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  }[char]));
}

async function fetchAllProjects() {
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from('projects')
      .select('*')
      .order('order_index', { ascending: true });
    if (error) { console.error('fetchAllProjects', error); return null; }
    return data || [];
  } catch (error) {
    console.error('fetchAllProjects', error);
    return null;
  }
}

async function fetchFeaturedProjects() {
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from('projects')
      .select('*')
      .eq('is_featured', true)
      .order('order_index', { ascending: true });
    if (error) { console.error('fetchFeaturedProjects', error); return null; }
    return data || [];
  } catch (error) {
    console.error('fetchFeaturedProjects', error);
    return null;
  }
}

async function fetchProjectBySlug(slug) {
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from('projects')
      .select('*')
      .eq('slug', slug)
      .single();
    if (error) { console.error('fetchProjectBySlug', error); return null; }
    return data;
  } catch (error) {
    console.error('fetchProjectBySlug', error);
    return null;
  }
}

// Çalışma alanı, yalnızca yayınlanması güvenli olay özetlerini okur.
// Tablo/migration henüz bağlı değilse çağıran katman bunu yerel prototip olarak
// işaretler; boş bir "canlı" görünüm üretmez.
async function fetchProjectActivityEvents(slug, limit = 12) {
  if (!PROJECT_ACTIVITY_FEED_ENABLED || !sb || !isSafeProjectSlug(slug)) return { available: false, events: [] };
  try {
    // Tablo migration'ı henüz uygulanmamış bir ortamda PostgREST'in 404'ü
    // Supabase istemcisi tarafından konsola hata olarak yazılabiliyor. Ham
    // fetch ile yanıtı kontrollü biçimde ele alıp UI'yi prototip moduna
    // geçiriyoruz; başarılı ortamda aynı public REST sözleşmesi kullanılır.
    const url = new URL(`${SUPABASE_URL}/rest/v1/project_activity_events`);
    url.searchParams.set('select', 'id,project_slug,event_type,agent_key,target_agent_key,summary,status,occurred_at');
    url.searchParams.set('project_slug', `eq.${slug}`);
    url.searchParams.set('is_public', 'eq.true');
    url.searchParams.set('order', 'occurred_at.desc');
    url.searchParams.set('limit', String(Math.min(Math.max(Number(limit) || 12, 1), 30)));
    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    if (!response.ok) return { available: false, events: [] };
    const events = await response.json();
    return { available: true, events: Array.isArray(events) ? events : [] };
  } catch (_) {
    return { available: false, events: [] };
  }
}

function subscribeToProjectActivityEvents(slug, onEvent, onStatus) {
  if (!PROJECT_ACTIVITY_FEED_ENABLED || !sb || !isSafeProjectSlug(slug) || typeof onEvent !== 'function') return null;
  const channel = sb
    .channel(`project-office:${slug}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'project_activity_events',
      filter: `project_slug=eq.${slug}`,
    }, ({ new: event }) => {
      if (event?.is_public !== false) onEvent(event);
    })
    .subscribe((status) => {
      if (typeof onStatus === 'function') onStatus(status);
    });
  return channel;
}

async function submitContactMessage({ name, email, subject, message }) {
  if (!sb) return false;
  try {
    const { error } = await sb
      .from('contact_messages')
      .insert([{ name, email, subject, message }]);
    return !error;
  } catch (error) {
    console.error('submitContactMessage', error);
    return false;
  }
}

function statusBadgeHTML(status, statusLabel) {
  const meta = STATUS_META[status] || STATUS_META.wip;
  return `<span class="status-badge"><span class="status-dot ${meta.dotClass}"></span><span class="${meta.labelClass}">${escapeHTML(statusLabel || 'Geliştiriliyor')}</span></span>`;
}
