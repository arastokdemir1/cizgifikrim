// CizgiFikrim — Supabase bağlantısı ve veri erişim yardımcıları.
// anon key public'tir, güvenlik RLS politikalarıyla sağlanır (bkz. Supabase şeması).
const SUPABASE_URL = 'https://iekdktdhhryqewvcrnmr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlla2RrdGRoaHJ5cWV3dmNybm1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzMTA4NjIsImV4cCI6MjA5OTg4Njg2Mn0.1R70BzCmDdXbTpVGGk19y9ThY9n7dDJ7SMcJWc5Uhl4';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

async function fetchAllProjects() {
  const { data, error } = await sb
    .from('projects')
    .select('*')
    .order('order_index', { ascending: true });
  if (error) { console.error('fetchAllProjects', error); return []; }
  return data;
}

async function fetchFeaturedProjects() {
  const { data, error } = await sb
    .from('projects')
    .select('*')
    .eq('is_featured', true)
    .order('order_index', { ascending: true });
  if (error) { console.error('fetchFeaturedProjects', error); return []; }
  return data;
}

async function fetchProjectBySlug(slug) {
  const { data, error } = await sb
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .single();
  if (error) { console.error('fetchProjectBySlug', error); return null; }
  return data;
}

async function submitContactMessage({ name, email, subject, message }) {
  const { error } = await sb
    .from('contact_messages')
    .insert([{ name, email, subject, message }]);
  return !error;
}

function statusBadgeHTML(status, statusLabel) {
  const meta = STATUS_META[status] || STATUS_META.wip;
  return `<span class="status-badge"><span class="status-dot ${meta.dotClass}"></span><span class="${meta.labelClass}">${statusLabel}</span></span>`;
}
