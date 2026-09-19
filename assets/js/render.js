// CizgiFikrim — Supabase verisinden sayfa render mantığı.
// Her fonksiyon ilgili DOM elemanı yoksa sessizce çıkar; tek dosya tüm sayfalarda güvenle kullanılabilir.

const CATEGORY_ORDER = ['otonom-ai', 'mobil', 'finansal', 'otomotiv'];

// Bu veri son bilinen, repo içinde yayınlanan katalogdur. Ağ/veritabanı
// erişilemediğinde sayfanın boş kalmaması için kullanılır; Supabase yanıtı
// geldiğinde canlı kayıtlar bunun yerini alır.
const STATIC_PROJECTS = [
  ['ultron', 'Emre', 'Otonom Bilişsel Sistem', 'LLM-bağımsız bilişsel karar çekirdeği.', 'otonom-ai', 'rd', 'Ar-Ge / Canlı'],
  ['ersoy', 'Ersoy', 'Web Tabanlı Bilişsel AI Asistanı', 'Web tabanlı bilişsel AI asistanı; hızlı ve ölçeklenebilir bir mimari.', 'otonom-ai', 'wip', 'Geliştiriliyor'],
  ['aka', 'ALP', 'Yerel Yapay Zekâ Asistanı', 'Tamamen yerel çalışan, gizlilik odaklı yapay zekâ asistanı.', 'otonom-ai', 'wip', 'Geliştiriliyor'],
  ['arda', 'Arda', 'Masaüstü & Ses Odaklı AI', 'Doğrudan etkileşim ve otomasyon için tasarlanan bilişsel asistan.', 'otonom-ai', 'wip', 'Geliştiriliyor'],
  ['carlog', 'CarLog', 'iOS Araç Maliyet Uygulaması', 'Araç maliyet yönetimi, yakıt takibi ve verimlilik analizi için mobil çözüm.', 'mobil', 'live', 'Canlı'],
  ['piyasa', 'PiyasApp', 'Konum Tabanlı Sosyal Keşif', 'Çevrende şu an ne olduğunu canlı bir harita üzerinde gösteren sosyal keşif uygulaması.', 'mobil', 'wip', 'Geliştiriliyor'],
  ['focusgrid', 'FocusGrid', 'Minimalist Odaklanma Aracı', 'Odaklanmayı destekleyen minimalist mobil araç.', 'mobil', 'live', 'Canlı'],
  ['flowgraph', 'FlowGraph', 'Kişisel Finans Akışı', 'Kişisel finans akışını görünür kılan mobil uygulama.', 'mobil', 'live', 'Canlı'],
  ['gnomon', 'Gnomon', 'macOS Proje Yönetimi', 'Bağımlılık-kilitleme motorlu proje yönetimi.', 'mobil', 'wip', 'Geliştiriliyor'],
  ['sano', 'Sano', 'Zihinsel Yük & Burnout Analizi', 'Zihinsel yükü 4 boyutta ölçen bilimsel temelli test ve takip.', 'mobil', 'live', 'Canlı'],
  ['better_motors', 'Better Motors', 'ECU & Araç İçi Yazılımlar', 'ECU yazılımları ve araç içi dijital sistemlere yönelik çözüm.', 'otomotiv', 'wip', 'Geliştiriliyor'],
  ['radar', 'Radar', 'BIST Hisse Tarayıcısı', 'Filtre tabanlı BIST hisse tarama uygulaması.', 'finansal', 'wip', 'Bakımda'],
].map(([slug, display_name, tagline, description, category, status, status_label], order_index) => ({
  slug, display_name, tagline, description, category, status, status_label, order_index,
}));

function safeProjectSlug(slug) {
  return /^[a-z0-9._-]+$/i.test(String(slug || '')) ? String(slug) : '';
}

function safeExternalURL(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
  } catch (_) {
    return '';
  }
}

function setStatusNotice(root, message) {
  let notice = root.parentElement?.querySelector('[data-data-status]');
  if (!notice) {
    notice = document.createElement('p');
    notice.className = 'page folio';
    notice.dataset.dataStatus = 'true';
    notice.setAttribute('role', 'status');
    root.before(notice);
  }
  notice.textContent = message;
}

function projectCardHTML(p, num) {
  const slug = safeProjectSlug(p.slug);
  if (!slug) return '';
  return `
    <li class="proj-item">
      <a href="projects/${slug}.html" class="proj-link reveal">
        <span class="folio proj-num-col">№${num}</span>
        <div class="proj-name-col">
          <h3 class="proj-name-main">${escapeHTML(p.display_name)}</h3>
          <p class="proj-tagline-sm">${escapeHTML(p.tagline)}</p>
        </div>
        <p class="proj-desc-col">${escapeHTML((p.description || '').split('\n\n')[0])}</p>
        <div class="proj-status-col">${statusBadgeHTML(p.status, p.status_label)}</div>
      </a>
    </li>`;
}

async function renderProductsPage() {
  const root = document.getElementById('products-categories');
  if (!root) return;

  const remoteProjects = await fetchAllProjects();
  const projects = remoteProjects?.length ? remoteProjects : STATIC_PROJECTS;
  if (!remoteProjects) setStatusNotice(root, 'Katalogun güncel verisi alınamadı; son yayınlanan katalog gösteriliyor.');
  if (remoteProjects && !remoteProjects.length) setStatusNotice(root, 'Katalogda şu anda yayınlanmış proje bulunmuyor.');
  const order = ['otonom-ai', 'mobil', 'finansal', 'otomotiv'];
  const grouped = {};
  projects.forEach(p => { (grouped[p.category] ||= []).push(p); });

  root.innerHTML = order
    .filter(cat => grouped[cat] && grouped[cat].length)
    .map(cat => {
      const meta = CATEGORY_META[cat];
      const items = grouped[cat]
        .map((p, i) => projectCardHTML(p, String(i + 1).padStart(2, '0')))
        .join('');
      return `
        <section class="page cat-section">
          <header class="cat-header">
            <span class="folio">${meta.folioNum}</span>
            <h2 class="cat-name">${meta.name}</h2>
            <span class="folio cat-count">${grouped[cat].length} adet</span>
          </header>
          <ul class="proj-list">${items}</ul>
        </section>`;
    })
    .join('');
  root.setAttribute('aria-busy', 'false');

  if (window.initReveal) window.initReveal();
}

function featuredCardHTML(p, num) {
  const slug = safeProjectSlug(p.slug);
  if (!slug) return '';
  return `
    <a href="projects/${slug}.html" class="feat-card reveal">
      <div class="feat-meta">
        ${statusBadgeHTML(p.status, p.status_label)}
        <span class="feat-num">№ ${num}</span>
      </div>
      <h3 class="feat-name">${escapeHTML(p.display_name)}</h3>
      <p class="feat-tagline">${escapeHTML(p.tagline)}</p>
      <p class="feat-desc">${escapeHTML((p.description || '').split('\n\n')[0])}</p>
      <div class="feat-footer">
        <span class="feat-cat">${CATEGORY_META[p.category]?.name || ''}</span>
        <span>oku →</span>
      </div>
    </a>`;
}

async function renderFeaturedProjects() {
  const root = document.getElementById('featured-grid');
  if (!root) return;

  const remoteFeatured = await fetchFeaturedProjects();
  const featured = remoteFeatured?.length ? remoteFeatured : STATIC_PROJECTS.slice(0, 3);
  if (!remoteFeatured) setStatusNotice(root, 'Güncel inşa verisi alınamadı; son yayınlanan öne çıkan projeler gösteriliyor.');
  root.innerHTML = featured
    .map((p, i) => featuredCardHTML(p, String(i + 1).padStart(3, '0')))
    .join('');

  if (window.initReveal) window.initReveal();
}

// ── İnşa Durumu (build status) — canlı ve geliştirme varyantı ─────────────
// Uydurma veri yok: canlı projelerde gerçek App Store linki/test notu,
// geliştirme aşamasındaki projelerde gerçek yerel git commit istatistikleri
// gösterilir (bkz. Projeler/site-canli-donusum/VERI_MIMARISI.md).

function relativeTimeTR(dateStr) {
  if (!dateStr) return '';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'az önce';
  if (mins < 60) return `${mins} dk önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  return `${days} gün önce`;
}

// cf-sync'in yazdığı filtrelenmiş geliştirme notları (yalnızca
// show_commit_detail=true projelerde dolu gelir).
function recentUpdatesHTML(p) {
  if (p.show_commit_detail === false || !Array.isArray(p.recent_updates) || !p.recent_updates.length) return '';
  const items = p.recent_updates.slice(0, 6).map((u) => `
        <li><time datetime="${escapeHTML(u.at)}">${escapeHTML(relativeTimeTR(u.at))}</time><span>${escapeHTML(u.text)}</span></li>`).join('');
  return `
      <div class="build-status-row">
        <span class="folio">Son geliştirmeler</span>
        <ol class="build-updates">${items}
        </ol>
      </div>`;
}

// Tüm projelerde tek düzen (CarLog'daki gibi): durum başlığı, aktivite satırı,
// son geliştirmeler listesi. Notlar yalnızca show_commit_detail=true projelerde.
function buildStatusHTML(p) {
  const isLive = p.status === 'live';
  const total = Math.max(0, Number(p.commit_count_total) || 0);
  const d30 = Math.max(0, Number(p.commit_count_30d) || 0);
  const d7 = Math.max(0, Number(p.commit_count_7d) || 0);
  const liveURL = safeExternalURL(p.live_url);
  // cf-sync'in ürettiği genel "Son N günde…" cümlesi aktivite satırını tekrar eder.
  const autoNote = /^Son (7|30) günde \d+ geliştirme yapıldı/.test(p.latest_update_text || '');

  let activity;
  if (d30 > 0) activity = `Son 30 günde ${d30} geliştirme${d7 > 0 ? `, son 7 günde ${d7}` : ''}.`;
  else if (total > 0) activity = `Toplam ${total} geliştirme. Son 30 günde yeni bir değişiklik yok.`;
  else activity = isLive ? 'Ürün yayında ve kullanıma açık.' : 'Aktivite verisi henüz senkronize edilmedi.';

  const updates = recentUpdatesHTML(p) || (p.latest_update_text && !autoNote ? `
      <div class="build-status-row">
        <span class="folio">Son geliştirme${p.latest_update_at ? ' · ' + relativeTimeTR(p.latest_update_at) : ''}</span>
        <p>${escapeHTML(p.latest_update_text)}</p>
      </div>` : '');

  return `
    <div class="build-status ${isLive ? 'build-status--live' : 'build-status--building'}">
      <div class="build-status-header">
        <h3 class="build-status-headline">${isLive ? 'Canlı — yayında' : 'Geliştirme durumu'}</h3>
        ${statusBadgeHTML(p.status, p.status_label)}
      </div>
      <div class="build-status-row">
        <span class="folio">Aktivite${p.latest_update_at ? ' · son değişiklik ' + relativeTimeTR(p.latest_update_at) : ''}</span>
        <p>${activity}</p>
      </div>
      ${updates}
      ${p.test_status ? `
      <div class="build-status-row">
        <span class="folio">Test durumu</span>
        <p>${escapeHTML(p.test_status)}</p>
      </div>` : ''}
      ${p.show_commit_detail === false ? `<p class="build-status-privacy-note">Bu projede kaynak kod ve değişiklik detayları paylaşılmıyor; yalnızca aktivite gösteriliyor.</p>` : ''}
      ${isLive && liveURL ? `<a href="${liveURL}" target="_blank" rel="noopener" class="btn-primary build-status-cta">App Store'da gör<span class="btn-arrow">→</span></a>` : ''}
    </div>`;
}

function homeBuildNoteHTML(p) {
  const slug = safeProjectSlug(p.slug);
  const status = escapeHTML(p.status_label || 'Geliştiriliyor');
  const update = escapeHTML(p.latest_update_text || 'Bu çalışma için yeni bir kısa not henüz yayınlanmadı.');
  const category = escapeHTML(CATEGORY_META[p.category]?.name || 'Çalışma kaydı');
  if (!slug) return '';
  return `
    <article class="lab-home-note">
      <div class="lab-home-note-meta">
        <span>${category}</span>
        <span>${p.latest_update_at ? escapeHTML(relativeTimeTR(p.latest_update_at)) : status}</span>
      </div>
      <h3>${escapeHTML(p.display_name || 'Çalışma notu')}</h3>
      <p>${update}</p>
      <a href="projects/${slug}.html">Çalışmaya git <span aria-hidden="true">↗</span></a>
    </article>`;
}

async function renderProjectBuildStatus() {
  const root = document.getElementById('build-status-root');
  if (!root) return;
  const slug = location.pathname.split('/').pop().replace('.html', '');
  const project = await fetchProjectBySlug(slug);
  if (!project) return;
  root.innerHTML = buildStatusHTML(project);
}

// ── Proje Ofisi — her proje için ayrı ekip kompozisyonu ──
// Gerçek Fleet/Paperclip ajan kadrosundan (AJANLAR.md) — canlı görev durumu
// değil, o projeye atanmış ajan rolleri ve sorumlulukları.
const AGENT_ROSTER = {
  'mimar-claude':      { role: 'Mimar',       cli: 'claude', desc: 'Hedef bölme, mimari, kontratlar.' },
  'backend-claude':    { role: 'Backend',     cli: 'claude', desc: 'API, servis, auth, hata yönetimi.' },
  'frontend-codex':    { role: 'Frontend',    cli: 'codex',  desc: 'UI, formlar, panel akışları.' },
  'ui-codex':          { role: 'UI',          cli: 'codex',  desc: 'Tekil bileşen üretimi.' },
  'test-codex':        { role: 'Test',        cli: 'codex',  desc: 'Test yazma ve koşturma.' },
  'veritabani-agy':    { role: 'Veritabanı',  cli: 'agy',    desc: 'Şema/veri analizi, migration planı.' },
  'denetleyici-claude':{ role: 'Denetleyici', cli: 'claude', desc: 'Çıktı denetimi, risk kararı.' },
};
const TEAM_BY_CATEGORY = {
  'otonom-ai': ['mimar-claude', 'backend-claude', 'test-codex', 'denetleyici-claude'],
  'mobil':     ['frontend-codex', 'ui-codex', 'test-codex', 'denetleyici-claude'],
  'finansal':  ['backend-claude', 'veritabani-agy', 'test-codex', 'denetleyici-claude'],
  'otomotiv':  ['backend-claude', 'veritabani-agy', 'test-codex', 'denetleyici-claude'],
};
const TEAM_BY_PROJECT = {
  ultron: ['mimar-claude', 'backend-claude', 'test-codex', 'denetleyici-claude'],
  aka: ['backend-claude', 'ui-codex', 'test-codex', 'denetleyici-claude'],
  ersoy: ['frontend-codex', 'backend-claude', 'ui-codex', 'denetleyici-claude'],
  arda: ['frontend-codex', 'ui-codex', 'test-codex', 'denetleyici-claude'],
  carlog: ['frontend-codex', 'backend-claude', 'test-codex', 'denetleyici-claude'],
  focusgrid: ['frontend-codex', 'ui-codex', 'test-codex', 'denetleyici-claude'],
  flowgraph: ['frontend-codex', 'veritabani-agy', 'test-codex', 'denetleyici-claude'],
  gnomon: ['mimar-claude', 'backend-claude', 'test-codex', 'denetleyici-claude'],
  piyasa: ['frontend-codex', 'backend-claude', 'veritabani-agy', 'test-codex'],
  radar: ['backend-claude', 'veritabani-agy', 'test-codex', 'denetleyici-claude'],
  better_motors: ['backend-claude', 'veritabani-agy', 'test-codex', 'denetleyici-claude'],
  sano: ['frontend-codex', 'backend-claude', 'test-codex', 'denetleyici-claude'],
};
const CLI_LABEL = { claude: 'Claude', codex: 'Codex', agy: 'Antigravity' };
// Jenerik karakter isimleri — kurgusal, dekoratif. Gerçek Fleet ajan
// kimlikleriyle karıştırılmasın diye bilerek farklı/kurgusal isimler.
const CHARACTER_NAMES = ['Ela', 'Deniz', 'Kaan', 'Mira'];
const ROLE_BUBBLES = {
  frontend: 'arayüz akışı',
  backend: 'servis katmanı',
  ui: 'ekran düzeni',
  test: 'test koşuyor',
  denetleyici: 'çıktı denetimi',
  mimar: 'kontrat çiziyor',
  veritabanı: 'veri modeli',
};

// Ofis kat planı — 4 bölge, her biri kendi karo dokusu ve mobilyasıyla.
const ZONE_LAYOUT = [
  { x: 20,  y: 20  }, { x: 300, y: 20  },
  { x: 20,  y: 150 }, { x: 300, y: 150 },
];

function officeZoneSVG(agentId, i, statusDotClass, isActive, realUpdateText) {
  const a = AGENT_ROSTER[agentId];
  const name = CHARACTER_NAMES[i];
  const { x, y } = ZONE_LAYOUT[i];
  const deskX = x + 85, deskY = y + 44;
  const monX = deskX + 25, monY = deskY - 24;
  const plateX = x + 130, plateY = y + 82;
  const delay = i * 160;
  // Zone 0 (lider rol) gerçek son-güncelleme metnini gösterir — Muratify
  // referansındaki "canlı" balon fikri, ama uydurma değil, gerçek veriyle.
  // Diğer 3 balon zaten dekoratif/kurgusal olarak etiketlenmiş genel roldür.
  const isLeadBubble = i === 0 && isActive && realUpdateText;
  const rawBubble = isLeadBubble ? realUpdateText : (ROLE_BUBBLES[a.role.toLowerCase()] || 'görev üzerinde');
  const bubbleText = escapeHTML(rawBubble.length > 46 ? rawBubble.slice(0, 45) + '…' : rawBubble);
  const bubbleWidth = Math.min(220, Math.max(118, bubbleText.length * 5.4 + 20));
  const bubbleX = x + 130 - bubbleWidth / 2;
  return `
    <g class="office-char${isActive ? ' office-char-active' : ''}${isLeadBubble ? ' office-char-lead' : ''}" style="--office-delay:${delay}ms">
      <rect class="office-zone${isLeadBubble ? ' office-zone-lead' : ''}" x="${x}" y="${y}" width="260" height="110" rx="10" fill="url(#office-checker-${i})"></rect>
      ${isActive
        ? `<g class="office-speech${isLeadBubble ? ' office-speech-real' : ''}"><rect x="${bubbleX}" y="${y + 7}" width="${bubbleWidth}" height="18" rx="5"></rect><text x="${x + 130}" y="${y + 19}" text-anchor="middle">${bubbleText}</text></g>`
        : `<text class="office-zone-tag" x="${x + 10}" y="${y + 16}">// ${escapeHTML(a.role.toUpperCase())}</text>`}
      <ellipse class="office-plant-pot office-zone-${i % 4}" cx="${x + 22}" cy="${y + 84}" rx="7" ry="4"></ellipse>
      <circle class="office-plant-leaf office-zone-${i % 4}" cx="${x + 22}" cy="${y + 72}" r="9"></circle>
      <rect class="office-cabinet office-zone-${i % 4}" x="${x + 224}" y="${y + 14}" width="24" height="30" rx="2"></rect>
      <line class="office-cabinet-line" x1="${x + 224}" y1="${y + 24}" x2="${x + 248}" y2="${y + 24}"></line>
      <line class="office-cabinet-line" x1="${x + 224}" y1="${y + 34}" x2="${x + 248}" y2="${y + 34}"></line>
      <ellipse class="office-rug" cx="${deskX + 45}" cy="${deskY + 20}" rx="55" ry="14"></ellipse>
      <rect class="office-desk" x="${deskX}" y="${deskY}" width="90" height="30" rx="3"></rect>
      <rect class="office-monitor" x="${monX}" y="${monY}" width="40" height="26" rx="3"></rect>
      <rect class="office-monitor-line" x="${monX + 6}" y="${monY + 8}" width="20" height="2"></rect>
      <rect class="office-monitor-line" x="${monX + 6}" y="${monY + 14}" width="12" height="2"></rect>
      <circle class="office-status-dot ${statusDotClass}${isActive ? ' office-pulse' : ''}" cx="${monX + 34}" cy="${monY + 2}" r="4"></circle>
      <rect class="office-nameplate office-zone-${i % 4}" x="${plateX - 40}" y="${plateY}" width="80" height="24" rx="4"></rect>
      <text class="office-name" x="${plateX}" y="${plateY + 12}" text-anchor="middle">${name}</text>
      <text class="office-label" x="${plateX}" y="${plateY + 21}" text-anchor="middle">${a.role.toUpperCase()}</text>
    </g>`;
}

function officeSceneSVG(team, statusDotClass, isActive, realUpdateText) {
  return `
    <svg class="office-scene" viewBox="0 0 580 280" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Proje ekibi ofisi">
      <defs>
        ${team.map((_, i) => `
        <pattern id="office-checker-${i}" width="13" height="13" patternUnits="userSpaceOnUse">
          <rect width="13" height="13" class="office-checker-a office-zone-${i % 4}"></rect>
          <rect width="6.5" height="6.5" class="office-checker-b office-zone-${i % 4}"></rect>
          <rect x="6.5" y="6.5" width="6.5" height="6.5" class="office-checker-b office-zone-${i % 4}"></rect>
        </pattern>`).join('')}
      </defs>
      ${team.map((agentId, i) => officeZoneSVG(agentId, i, statusDotClass, isActive, realUpdateText)).join('')}
    </svg>`;
}

// Piksel figürler — kıyafet/saç/ten tonu CSS custom property ile verilen,
// 4 katmanlı (saç/yüz/gövde/bacak) tamamen CSS'ten çizilen kurgusal kişiler.
const PIXEL_PALETTES = [
  { shirt: 'var(--accent)', hair: '#3b2a20', skin: '#e8b98c' },
  { shirt: 'var(--wip)',    hair: '#1f2430', skin: '#caa274' },
  { shirt: 'var(--accent-strong)', hair: '#5c4632', skin: '#f0c9a0' },
  { shirt: 'var(--live)',   hair: '#241b14', skin: '#b8886a' },
];

function pixelAgentHTML(i, isActive) {
  const { x, y } = ZONE_LAYOUT[i];
  const leftPct = ((x + 130) / 580 * 100).toFixed(2);
  // Figürü kendi masasının önüne yerleştir: ofis kat planı ve ekip listesi
  // aynı kişiyi aynı yerde göstermeli.
  const topPct = ((y + 72) / 280 * 100).toFixed(2);
  const p = PIXEL_PALETTES[i % PIXEL_PALETTES.length];
  const delay = i * 160;
  return `
    <div class="pixel-agent${isActive ? ' working' : ''}" style="left:${leftPct}%;top:${topPct}%;--shirt:${p.shirt};--hair:${p.hair};--skin:${p.skin};--office-delay:${delay}ms">
      <span class="pixel-person" aria-hidden="true"><i class="hair"></i><i class="face"></i><i class="body"></i><i class="legs"></i></span>
    </div>`;
}

function officeAgentLayerHTML(team, isActive) {
  return `<div class="office-agent-layer">${team.map((_, i) => pixelAgentHTML(i, isActive)).join('')}</div>`;
}

function officeOfficePaneHTML(project, team, statusDotClass, isActive) {
  const activeCount = isActive ? team.length : 0;
  // Gizlilik protokolü olan projelerde (ör. Ersoy) ham commit metni sahnede
  // de gösterilmez — buildStatusHTML'deki aynı kural burada da geçerli.
  const realUpdateText = project.show_commit_detail !== false ? project.latest_update_text : null;
  return `
    <section class="am-pane am-pane-office" aria-labelledby="office-team-title">
      <div class="am-pane-head">
        <div>
          <span class="am-eyebrow">EKİP</span>
          <h2 class="am-pane-title am-pane-heading" id="office-team-title">Çalışma alanı</h2>
        </div>
        <span class="am-pane-badge">${activeCount}/${team.length} aktif</span>
      </div>
      <div class="am-team-context">
        <span class="am-team-project">${escapeHTML(project.display_name)}</span>
        <span class="am-team-status"><span class="am-dot ${statusDotClass}${isActive ? ' office-pulse' : ''}"></span>${escapeHTML(project.status_label || (isActive ? 'aktif' : 'beklemede'))}</span>
      </div>
      <div class="am-office-stage">
        ${officeSceneSVG(team, statusDotClass, isActive, realUpdateText)}
        ${officeAgentLayerHTML(team, isActive)}
        <span class="am-stage-badge">${isActive ? 'CANLI ÇALIŞMA' : 'BEKLEMEDE'}</span>
      </div>
      <ul class="am-member-grid" aria-label="Proje ekibi">
        ${team.map((agentId, i) => {
          const a = AGENT_ROSTER[agentId];
          const name = CHARACTER_NAMES[i];
          return `<li class="am-member" data-agent-index="${i}" role="button" tabindex="0" aria-controls="agent-command-${i}">
            <span class="am-member-avatar am-avatar-${i % 4}" aria-hidden="true">${name.charAt(0)}</span>
            <span class="am-member-copy"><strong>${escapeHTML(name)}</strong><span>${escapeHTML(a.role)}</span></span>
            <span class="am-member-state">${isActive ? 'aktif' : 'beklemede'}</span>
          </li>`;
        }).join('')}
      </ul>
      <p class="am-office-caption"><span class="am-dot ${statusDotClass}${isActive ? ' office-pulse' : ''}"></span>${isActive ? 'Ekip bu proje üzerinde çalışıyor.' : 'Ekip bekleme durumunda.'}</p>
    </section>`;
}

function terminalWindowHTML(agentId, i, project) {
  const a = AGENT_ROSTER[agentId];
  const name = CHARACTER_NAMES[i];
  return `
    <div class="am-term">
      <div class="am-term-bar">
        <span class="am-term-dots"><i></i><i></i><i></i></span>
        <span class="am-term-title">${name} — ${a.role}</span>
      </div>
      <div class="am-term-body">
        <p class="am-term-line">$ ${a.cli} run --project ${escapeHTML(safeProjectSlug(project.slug))} --role ${a.role.toLowerCase()}</p>
        <p class="am-term-desc"># ${a.desc}</p>
      </div>
    </div>`;
}

function officeTerminalPaneHTML(team, project) {
  return `
    <section class="am-pane am-pane-terminal" aria-labelledby="office-flow-title">
      <div class="am-pane-head"><div><span class="am-eyebrow">AKIŞ</span><h2 class="am-pane-title am-pane-heading" id="office-flow-title">Çalışan komutlar</h2></div><span class="am-pane-badge">${team.length} açık</span></div>
      <ol class="am-command-list">
        ${team.map((id, i) => {
          const a = AGENT_ROSTER[id];
          const name = CHARACTER_NAMES[i];
          return `<li class="am-command-row" id="agent-command-${i}" data-agent-index="${i}">
            <span class="am-command-index">${String(i + 1).padStart(2, '0')}</span>
            <span class="am-command-copy"><strong>${escapeHTML(name)} · ${escapeHTML(a.role)}</strong><code>$ ${escapeHTML(a.cli)} run --project ${escapeHTML(safeProjectSlug(project.slug))} --role ${escapeHTML(a.role.toLowerCase())}</code></span>
            <span class="am-command-state">izleniyor</span>
          </li>`;
        }).join('')}
      </ol>
    </section>`;
}

function officeTasksPaneHTML(project, team, isActive) {
  const d7 = project.commit_count_7d ?? null;
  const d30 = project.commit_count_30d ?? null;
  const total = project.commit_count_total ?? null;
  const categoryLabel = CATEGORY_META[project.category]?.name || '';
  const activeCount = isActive ? team.length : 0;
  const statCard = (num, tag) => `<div class="am-card am-card-stat"><span class="am-card-num">${num ?? '—'}</span><span class="am-card-tag">${tag}</span></div>`;
  return `
    <section class="am-pane am-pane-tasks" aria-labelledby="office-activity-title">
      <div class="am-pane-head"><div><span class="am-eyebrow">SİNYAL</span><h2 class="am-pane-title am-pane-heading" id="office-activity-title">Aktivite özeti</h2></div><span class="am-pane-badge">${total ?? '—'} commit</span></div>
      <div class="am-board">
        <div class="am-col am-col-wide">
          <p class="am-col-head">AKTİVİTE</p>
          ${project.latest_update_text ? `
          <div class="am-card am-card-activity">
            <span class="am-card-tag">GIT${project.latest_update_at ? ' · ' + relativeTimeTR(project.latest_update_at) : ''}</span>
            <p class="am-card-title">${escapeHTML(project.latest_update_text)}</p>
            <p class="am-card-foot">${categoryLabel}${total != null ? ' · ' + total + ' toplam commit' : ''}</p>
          </div>` : `<p class="am-card-empty">Henüz kayıt yok.</p>`}
          ${project.show_commit_detail === false ? `<p class="am-card-privacy">Güvenlik protokolleri gereği detay paylaşılmıyor.</p>` : ''}
        </div>
        <div class="am-col">
          <p class="am-col-head">BU HAFTA</p>
          ${statCard(d7, 'COMMIT')}
        </div>
        <div class="am-col">
          <p class="am-col-head">BU AY</p>
          ${statCard(d30, 'COMMIT')}
        </div>
        <div class="am-col">
          <p class="am-col-head">TOPLAM</p>
          ${statCard(total, 'COMMIT')}
        </div>
        <div class="am-col">
          <p class="am-col-head">EKİP</p>
          ${statCard(`${activeCount}/${team.length}`, 'AKTİF')}
        </div>
      </div>
    </section>`;
}

function legacyOfficeFrameHTML(project) {
  const team = TEAM_BY_PROJECT[project.slug] || TEAM_BY_CATEGORY[project.category] || TEAM_BY_CATEGORY['otonom-ai'];
  const statusDotClass = { live: 'dot-live', rd: 'dot-rd', wip: 'dot-wip', concept: 'dot-concept' }[project.status] || 'dot-wip';
  // Canlı/Ar-Ge/Geliştiriliyor projeleri ofiste görevde görünür; konseptler
  // beklemede kalır. Ekip çizimi temsilidir, commit istatistikleri gerçek kalır.
  const isActive = project.status !== 'concept';

  return `
    <div class="am-frame">
      <div class="am-topbar">
        <span class="am-window-dots"><i></i><i></i><i></i></span>
        <span class="am-brand"><span class="am-brand-dot"></span>cizgifikrim <span class="am-brand-sub">çalışma alanı</span></span>
        <span class="am-tab am-tab-active">${escapeHTML(project.display_name)} <span class="am-tab-count">${isActive ? team.length : 0}/${team.length}</span></span>
      </div>
      <div class="am-grid">
        ${officeOfficePaneHTML(project, team, statusDotClass, isActive)}
        ${officeTerminalPaneHTML(team, project)}
        ${officeTasksPaneHTML(project, team, isActive)}
      </div>
      <p class="am-note">Kurgusal ekip görünümü — kişiler ve çalışma ışıkları temsili; istatistikler gerçek aktivite verisi.</p>
    </div>`;
}

async function legacyRenderProjectOffice() {
  const root = document.getElementById('office-root');
  if (!root) return;
  const slug = location.pathname.split('/').pop().replace('.html', '');
  const project = await fetchProjectBySlug(slug);
  if (!project) return;
  root.innerHTML = legacyOfficeFrameHTML(project);
}

// ── Canlı çalışma katı ──────────────────────────────────────────────────────
// UI, `project_activity_events` yayın akışını kullanır. Bu kaynak yoksa aynı
// senaryoyu "yerel prototip" diye açıkça etiketleyerek sahnenin etkileşimini
// gösterebilir; dekoratif hareket hiçbir zaman gerçek çalışma diye sunulmaz.
// Koordinatlar drawOfficeCanvas'ın 1000×620'lik planından yüzdeye çevrilir
// (x/10, y/6.2). Ajan noktası = karakterin ayak ucu; masaların hemen önünde durur.
const OFFICE_STATIONS = [
  { id: 'product', label: 'Ürün masası', x: 17.8, y: 32.3, visitX: 23.2, visitY: 32.3 },
  { id: 'research', label: 'Araştırma masası', x: 50, y: 32.3, visitX: 55.4, visitY: 32.3 },
  { id: 'build', label: 'Uygulama masası', x: 82.2, y: 32.3, visitX: 87.6, visitY: 32.3 },
  { id: 'design', label: 'Tasarım masası', x: 17.8, y: 79.4, visitX: 23.2, visitY: 79.4 },
  { id: 'meeting', label: 'Ortak alan', x: 42, y: 79.4, visitX: 47.4, visitY: 79.4 },
  { id: 'review', label: 'İnceleme masası', x: 82.2, y: 79.4, visitX: 87.6, visitY: 79.4 },
];

const OFFICE_ROOMS = [
  { id: 'product', label: 'ÜRÜN', x: 1, y: 2, w: 30, h: 45, decor: 'shelf' },
  { id: 'research', label: 'ARAŞTIRMA', x: 33, y: 2, w: 31, h: 45, decor: 'books' },
  { id: 'build', label: 'UYGULAMA', x: 66, y: 2, w: 33, h: 45, decor: 'server' },
  { id: 'design', label: 'TASARIM', x: 1, y: 50, w: 30, h: 48, decor: 'board' },
  { id: 'shared', label: 'ORTAK ALAN', x: 33, y: 50, w: 31, h: 48, decor: 'table' },
  { id: 'review', label: 'İNCELEME', x: 66, y: 50, w: 33, h: 48, decor: 'archive' },
];

const OFFICE_PROTOTYPE_EVENTS = [
  { event_type: 'task', agent_key: 'frontend-codex', summary: 'Ekran akışını gözden geçiriyor.', status: 'working' },
  { event_type: 'message', agent_key: 'frontend-codex', target_agent_key: 'backend-claude', summary: 'Veri sözleşmesindeki alanları birlikte doğruluyor.', status: 'working' },
  { event_type: 'movement', agent_key: 'backend-claude', target_agent_key: 'frontend-codex', summary: 'Ela’nın çalışma alanına kısa bir eşleştirme için gidiyor.', status: 'working' },
  { event_type: 'task', agent_key: 'ui-codex', summary: 'Bileşen durumlarını kontrol ediyor.', status: 'reviewing' },
  { event_type: 'message', agent_key: 'denetleyici-claude', target_agent_key: 'ui-codex', summary: 'İnceleme notunu paylaşıyor.', status: 'reviewing' },
  { event_type: 'movement', agent_key: 'denetleyici-claude', target_agent_key: 'backend-claude', summary: 'Deniz’in çalışma alanına çıktıyı birlikte kontrol etmeye gidiyor.', status: 'reviewing' },
];

const OFFICE_STATUS_LABEL = {
  working: 'çalışıyor',
  reviewing: 'inceliyor',
  waiting: 'bekliyor',
  done: 'tamamlandı',
};

function officeTeam(project) {
  return TEAM_BY_PROJECT[project.slug] || TEAM_BY_CATEGORY[project.category] || TEAM_BY_CATEGORY['otonom-ai'];
}

function officeCharacter(agentId, index) {
  return CHARACTER_NAMES[index] || `Ajan ${index + 1}`;
}

function officeAgentIndex(team, agentKey) {
  const index = team.indexOf(agentKey);
  return index >= 0 ? index : 0;
}

function officeEventAgentName(team, agentKey) {
  const index = team.indexOf(agentKey);
  return index >= 0 ? officeCharacter(agentKey, index) : 'Sistem';
}

function officeEventText(team, event) {
  const from = officeEventAgentName(team, event.agent_key);
  const to = event.target_agent_key && team.includes(event.target_agent_key)
    ? ` → ${officeEventAgentName(team, event.target_agent_key)}`
    : '';
  return `${from}${to}: ${String(event.summary || 'Durum güncellendi.')}`;
}

function officePersonHTML(team, agentId, index) {
  const agent = AGENT_ROSTER[agentId];
  const station = OFFICE_STATIONS[index] || OFFICE_STATIONS[0];
  const palette = PIXEL_PALETTES[index % PIXEL_PALETTES.length];
  const name = officeCharacter(agentId, index);
  return `
    <button class="lo-agent lo-agent-${index}" type="button" data-office-agent="${escapeHTML(agentId)}" data-office-x="${station.x}" data-office-y="${station.y}" aria-label="${escapeHTML(name)} — ${escapeHTML(agent.role)} ajanı" aria-pressed="false" style="--agent-x:${station.x}%;--agent-y:${station.y}%;--shirt:${palette.shirt};--hair:${palette.hair};--skin:${palette.skin}">
      <span class="lo-agent-presence" aria-hidden="true"></span>
      <span class="lo-agent-avatar pixel-person" aria-hidden="true"><i class="hair"></i><i class="face"></i><i class="body"></i><i class="legs"></i></span>
      <span class="lo-agent-label"><strong>${escapeHTML(name)}</strong><small>${escapeHTML(agent.role)}</small></span>
    </button>`;
}

function officeStationHTML(station, index) {
  const label = station.id === 'meeting' ? 'ORTAK MASA' : String(index + 1).padStart(2, '0');
  return `<div class="lo-station lo-station-${index}" data-office-station="${station.id}" style="--station-x:${station.x}%;--station-y:${station.y}%">
    <span class="lo-station-screen" aria-hidden="true"></span>
    <span class="lo-station-label">${label}</span>
  </div>`;
}

function officeRoomHTML(room) {
  return `<section class="lo-room lo-room-${room.id}" aria-label="${room.label}" style="--room-x:${room.x}%;--room-y:${room.y}%;--room-w:${room.w}%;--room-h:${room.h}%">
    <span class="lo-room-label">${room.label}</span>
    <span class="lo-room-window" aria-hidden="true"></span>
    <span class="lo-room-shelf lo-decor-${room.decor}" aria-hidden="true"></span>
    <span class="lo-room-plant" aria-hidden="true"></span>
  </section>`;
}

// Özgün, tarayıcıda çizilen piksel kat planı. Bir üçüncü tarafın sprite veya
// tile varlıklarını taşımaz; yalnızca ofis akışının görsel bağlamını üretir.
function drawOfficeCanvas(canvas) {
  const bounds = canvas.getBoundingClientRect();
  const width = Math.max(320, Math.round(bounds.width));
  const height = Math.max(300, Math.round(bounds.height));
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.imageSmoothingEnabled = false;

  const scaleX = width / 1000;
  const scaleY = height / 620;
  const ux = (value) => Math.round(value * scaleX);
  const uy = (value) => Math.round(value * scaleY);
  const rect = (x, y, w, h, fill) => { ctx.fillStyle = fill; ctx.fillRect(ux(x), uy(y), Math.max(1, ux(w)), Math.max(1, uy(h))); };
  const stroke = (x, y, w, h, color, line = 2) => { ctx.strokeStyle = color; ctx.lineWidth = Math.max(1, Math.min(ux(line), uy(line))); ctx.strokeRect(ux(x), uy(y), ux(w), uy(h)); };

  ctx.fillStyle = '#0c1020';
  ctx.fillRect(0, 0, width, height);
  rect(12, 12, 976, 596, '#12203a');
  stroke(12, 12, 976, 596, '#4774b8', 3);

  const rooms = [
    { x: 28, y: 28, w: 300, h: 262, floor: ['#768895', '#879aa6'], accent: '#a6c9e2', kind: 'product' },
    { x: 350, y: 28, w: 300, h: 262, floor: ['#704b32', '#81583a'], accent: '#d59b5c', kind: 'research' },
    { x: 672, y: 28, w: 300, h: 262, floor: ['#466a82', '#5a7f97'], accent: '#8ab6d2', kind: 'build' },
    { x: 28, y: 312, w: 300, h: 278, floor: ['#a5c8be', '#bbddd2'], accent: '#d5eee4', kind: 'design' },
    { x: 350, y: 312, w: 300, h: 278, floor: ['#cf9665', '#e5ae79'], accent: '#f2c78e', kind: 'shared' },
    { x: 672, y: 312, w: 300, h: 278, floor: ['#1d2439', '#262e45'], accent: '#4d5b7e', kind: 'review' },
  ];

  const tileRoom = (room) => {
    rect(room.x, room.y, room.w, room.h, '#11172a');
    const tile = 22;
    for (let row = 0; row < Math.ceil(room.h / tile); row += 1) {
      for (let col = 0; col < Math.ceil(room.w / tile); col += 1) {
        rect(room.x + col * tile + 1, room.y + row * tile + 1, tile - 2, tile - 2, (row + col) % 2 ? room.floor[0] : room.floor[1]);
      }
    }
    stroke(room.x, room.y, room.w, room.h, '#2b3454', 3);
  };

  const plant = (x, y) => {
    rect(x + 6, y + 20, 16, 12, '#754936');
    rect(x + 2, y + 8, 11, 14, '#45a776');
    rect(x + 15, y + 4, 13, 18, '#55bc7f');
    rect(x + 9, y, 10, 18, '#32916a');
  };
  const desk = (x, y, flip = false) => {
    rect(x, y, 80, 13, '#1b2131');
    rect(x + 4, y + 3, 72, 7, '#c28c4b');
    rect(x + 8, y + 13, 8, 10, '#252b40');
    rect(x + 64, y + 13, 8, 10, '#252b40');
    rect(x + (flip ? 48 : 16), y - 24, 25, 22, '#1a2034');
    rect(x + (flip ? 51 : 19), y - 21, 19, 14, '#5d9be6');
    rect(x + (flip ? 54 : 22), y - 18, 13, 8, '#2f74c7');
    rect(x + (flip ? 58 : 26), y - 3, 5, 5, '#252b40');
  };
  const shelf = (x, y, rows = 3) => {
    rect(x, y, 34, 13 * rows + 4, '#252b3d');
    for (let row = 0; row < rows; row += 1) {
      rect(x + 4, y + 4 + row * 13, 26, 7, row % 2 ? '#d0b36e' : '#bd7153');
      rect(x + 8, y + 4 + row * 13, 3, 7, '#7db5c7');
      rect(x + 19, y + 4 + row * 13, 3, 7, '#4d93d7');
    }
  };
  const cabinet = (x, y) => {
    rect(x, y, 28, 45, '#202b38');
    rect(x + 4, y + 5, 20, 7, '#90aabe');
    rect(x + 4, y + 17, 20, 7, '#90aabe');
    rect(x + 4, y + 29, 20, 7, '#90aabe');
  };

  rooms.forEach(tileRoom);
  rooms.forEach((room, index) => {
    plant(room.x + 16, room.y + room.h - 46);
    if (index !== 4) desk(room.x + 110, room.y + Math.round(room.h * .54), index % 2 === 0);
  });
  shelf(46, 68, 3); shelf(566, 58, 3); cabinet(920, 176); cabinet(50, 470);
  shelf(580, 454, 2); shelf(735, 350, 3); cabinet(918, 468);
  rect(448, 92, 42, 19, '#c58d4c'); rect(453, 97, 32, 8, '#efce67');
  rect(481, 180, 38, 17, '#242b3d'); rect(486, 184, 28, 9, '#d6d9b7');
  rect(434, 393, 132, 22, '#6a4834');
  for (let chair = 0; chair < 5; chair += 1) { rect(442 + chair * 25, 421, 15, 17, '#303b57'); rect(445 + chair * 25, 437, 3, 8, '#20263a'); }
  rect(465, 500, 65, 37, '#343c49'); rect(473, 508, 49, 19, '#5ca8b8');
  rect(738, 83, 58, 33, '#ece4c9'); rect(743, 88, 48, 23, '#7eaac0');
  rect(836, 75, 25, 48, '#b36c4f'); rect(841, 80, 15, 12, '#edce70'); rect(841, 97, 15, 12, '#db8a62');
  rect(103, 424, 68, 18, '#e3cf8f'); rect(106, 428, 62, 10, '#7f5a40');
  rect(246, 501, 40, 24, '#252b3e'); rect(251, 506, 30, 14, '#e6d5a4');
  rect(808, 510, 66, 20, '#121827'); rect(814, 515, 54, 10, '#367fd8');
  rect(902, 342, 31, 64, '#303b51'); rect(907, 348, 21, 12, '#8cc7d5');

  // Oda girişleri ile koridorların oluşturduğu tek kat hissi.
  rect(322, 156, 34, 32, '#151a2c'); rect(644, 156, 34, 32, '#151a2c');
  rect(322, 432, 34, 32, '#151a2c'); rect(644, 432, 34, 32, '#151a2c');
  stroke(322, 156, 34, 32, '#4c587f', 2); stroke(644, 156, 34, 32, '#4c587f', 2);
  stroke(322, 432, 34, 32, '#4c587f', 2); stroke(644, 432, 34, 32, '#4c587f', 2);
}

function initialiseOfficeCanvas(root) {
  const canvas = root.querySelector('[data-office-canvas]');
  if (!canvas) return;
  const redraw = () => drawOfficeCanvas(canvas);
  redraw();
  const observer = new ResizeObserver(redraw);
  observer.observe(canvas);
  root._officeCanvasObserver = observer;
}

function liveOfficeFrameHTML(project, team) {
  const count = project.status === 'concept' ? 0 : team.length;
  return `
    <section class="live-office" aria-labelledby="live-office-title" data-office-project="${escapeHTML(project.slug)}">
      <header class="lo-header">
        <div><span class="lo-product-word">PRODUCT</span><h2 id="live-office-title">${escapeHTML(project.display_name)} çalışma alanı</h2></div>
        <div class="lo-header-status"><span class="lo-active-count">${count}/${team.length} aktif</span><div class="lo-connection"><span class="lo-connection-dot" aria-hidden="true"></span><span data-office-mode>AKIŞ KONTROL EDİLİYOR</span></div></div>
      </header>
      <div class="lo-layout">
        <section class="lo-floor-wrap" aria-label="Etkileşimli proje ofisi">
            <div class="lo-floor" data-office-floor>
            <canvas class="lo-pixel-canvas" data-office-canvas aria-hidden="true"></canvas>
            <div class="lo-conversation" data-office-dialog role="status" aria-live="polite">Akış hazırlanıyor…</div>
            ${team.map((agentId, index) => officePersonHTML(team, agentId, index)).join('')}
          </div>
          <p class="lo-floor-help">Bir ajana tıkla: görevini, bulunduğu alanı ve son sinyali öne çıkar.</p>
        </section>
        <aside class="lo-activity" aria-label="Görev ve konuşma akışı">
          <div class="lo-activity-head"><div><span class="lo-overline">AKIŞ</span><h3>Ofis sinyalleri</h3></div></div>
          <p class="lo-source-note" data-office-source>Bağlantı sınanıyor.</p>
          <ol class="lo-event-log" data-office-log aria-live="polite"></ol>
        </aside>
      </div>
      <div class="lo-team" aria-label="Proje ajanları">
        ${team.map((agentId, index) => {
          const agent = AGENT_ROSTER[agentId];
          return `<button class="lo-team-member" type="button" data-office-agent="${escapeHTML(agentId)}" aria-pressed="false"><span class="lo-team-index">${String(index + 1).padStart(2, '0')}</span><span><strong>${escapeHTML(officeCharacter(agentId, index))}</strong><small>${escapeHTML(agent.role)}</small></span><em data-agent-status="${escapeHTML(agentId)}">çalışıyor</em></button>`;
        }).join('')}
      </div>
      <p class="lo-disclosure" data-office-disclosure>Bağlantı sonucu bekleniyor. Kişiler arayüzdeki temsili proje ajanlarıdır.</p>
    </section>`;
}

function appendOfficeEvent(root, team, event, source) {
  const log = root.querySelector('[data-office-log]');
  const dialog = root.querySelector('[data-office-dialog]');
  if (!log || !dialog) return;
  const item = document.createElement('li');
  const eventType = ['message', 'movement', 'task', 'status'].includes(event.event_type) ? event.event_type : 'status';
  const time = event.occurred_at ? relativeTimeTR(event.occurred_at) : 'şimdi';
  item.className = `lo-event lo-event-${eventType}`;
  const timeEl = document.createElement('time');
  timeEl.textContent = time;
  const textEl = document.createElement('p');
  textEl.textContent = officeEventText(team, event);
  item.append(timeEl, textEl);
  log.prepend(item);
  while (log.children.length > 5) log.lastElementChild.remove();
  dialog.textContent = officeEventText(team, event);
  dialog.dataset.source = source;
}

// Yürüme ağı — drawOfficeCanvas'taki gerçek kapı ve koridorlarla birebir:
// odalar 3×2 ızgara; komşu odalar arasında kapılar (x 339 / 661; üst sıra y 172,
// alt sıra y 448), dikey koridorlar kapı hattında, yatay koridor y 301'de.
// Ajan önce odasının "yürüme çizgisinde" (masaların önü) kapıya yürür, kapıdan
// koridora girer, koridor boyunca hedef odanın kapısına gider, sonra masaya.
const OFFICE_NAV = {
  colOf: (x) => (x < 339 ? 0 : x < 661 ? 1 : 2),
  rowOf: (y) => (y < 301 ? 0 : 1),
  doorsX: [[339], [339, 661], [661]],
  doorY: [172, 448],
  walkY: [200, 492],
  corridorY: 301,
  // Kapı ağzının oda içindeki karşılığı (duvarın 18 birim içi).
  innerX: (doorX, col) => (doorX === 339 ? (col === 0 ? 310 : 368) : (col === 1 ? 632 : 690)),
};

function officeWalkPath(from, to) {
  const toUnits = (p) => ({ x: p.x * 10, y: p.y * 6.2 });
  const toPct = (p) => ({ x: +(p.x / 10).toFixed(2), y: +(p.y / 6.2).toFixed(2) });
  const a = toUnits(from);
  const b = toUnits(to);
  const n = OFFICE_NAV;
  const ca = n.colOf(a.x); const ra = n.rowOf(a.y);
  const cb = n.colOf(b.x); const rb = n.rowOf(b.y);
  const pts = [a];

  if (ca === cb && ra === rb) {
    // Aynı oda: masaların önündeki yürüme çizgisi üzerinden.
    pts.push({ x: a.x, y: n.walkY[ra] }, { x: b.x, y: n.walkY[rb] }, b);
  } else {
    const dist = (p, q) => Math.abs(p.x - q.x) + Math.abs(p.y - q.y);
    const corridor = (d1, d2) => {
      if (d1.x === d2.x && d1.y === d2.y) return [];
      if (d1.x === d2.x) return [d2];
      return [{ x: d1.x, y: n.corridorY }, { x: d2.x, y: n.corridorY }, d2];
    };
    let best = null;
    n.doorsX[ca].forEach((dxA) => n.doorsX[cb].forEach((dxB) => {
      const dA = { x: dxA, y: n.doorY[ra] };
      const dB = { x: dxB, y: n.doorY[rb] };
      const route = [
        { x: a.x, y: n.walkY[ra] },
        { x: n.innerX(dxA, ca), y: n.walkY[ra] },
        { x: n.innerX(dxA, ca), y: dA.y },
        dA,
        ...corridor(dA, dB),
        { x: n.innerX(dxB, cb), y: dB.y },
        { x: n.innerX(dxB, cb), y: n.walkY[rb] },
        { x: b.x, y: n.walkY[rb] },
        b,
      ];
      let len = 0; let prev = a;
      route.forEach((p) => { len += dist(prev, p); prev = p; });
      if (!best || len < best.len) best = { len, route };
    }));
    pts.push(...best.route);
  }
  return pts
    .filter((p, i, all) => i === 0 || Math.abs(p.x - all[i - 1].x) > .5 || Math.abs(p.y - all[i - 1].y) > .5)
    .map(toPct);
}

function walkOfficeAgent(moving, destination) {
  const from = {
    x: Number.parseFloat(moving.dataset.officeX) || OFFICE_STATIONS[0].x,
    y: Number.parseFloat(moving.dataset.officeY) || OFFICE_STATIONS[0].y,
  };
  const path = officeWalkPath(from, destination);
  moving.getAnimations().forEach((animation) => animation.cancel());
  moving.classList.add('is-walking');
  moving.style.setProperty('--agent-x', `${destination.x}%`);
  moving.style.setProperty('--agent-y', `${destination.y}%`);
  moving.dataset.officeX = String(destination.x);
  moving.dataset.officeY = String(destination.y);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || path.length < 2) {
    moving.classList.remove('is-walking');
    return;
  }
  // Sabit yürüme hızı: her ara noktanın zamanı, o ana kadar yürünen mesafeyle
  // orantılı (plan birimi cinsinden; x ve y ölçekleri farklı olduğu için).
  const seg = path.slice(1).map((p, i) => Math.hypot((p.x - path[i].x) * 10, (p.y - path[i].y) * 6.2));
  const total = seg.reduce((sum, d) => sum + d, 0) || 1;
  let walked = 0;
  const frames = path.map((point, index) => {
    if (index > 0) walked += seg[index - 1];
    return { left: `${point.x}%`, top: `${point.y}%`, offset: Math.min(1, walked / total) };
  });
  const animation = moving.animate(frames, { duration: Math.max(900, total * 5.2), easing: 'linear', fill: 'none' });
  animation.addEventListener('finish', () => {
    moving.classList.remove('is-walking');
    moving.classList.add('is-moving');
    window.setTimeout(() => moving.classList.remove('is-moving'), 550);
  }, { once: true });
}

function moveOfficeAgent(root, team, event) {
  if (!team.includes(event.agent_key)) return;
  const moving = root.querySelector(`.lo-agent[data-office-agent="${CSS.escape(event.agent_key)}"]`);
  if (!moving) return;
  const index = officeAgentIndex(team, event.agent_key);
  const targetIndex = event.target_agent_key && team.includes(event.target_agent_key)
    ? officeAgentIndex(team, event.target_agent_key)
    : -1;
  // Konuşma ve ziyaretler ortak alan kısayoluna değil, hedef ajanın kendi
  // ofisindeki ziyaret konumuna yönlenir. Görev olayı ise ajanı kendi masasına döndürür.
  const targetStation = targetIndex >= 0 ? OFFICE_STATIONS[targetIndex] : null;
  const destination = (event.event_type === 'movement' || event.event_type === 'message') && targetStation && targetIndex !== index
    ? { x: targetStation.visitX, y: targetStation.visitY }
    : OFFICE_STATIONS[index] || OFFICE_STATIONS[0];
  walkOfficeAgent(moving, destination);
  const status = root.querySelector(`[data-agent-status="${CSS.escape(event.agent_key)}"]`);
  if (status) status.textContent = OFFICE_STATUS_LABEL[event.status] || 'çalışıyor';
}

function applyOfficeEvent(root, team, event, source) {
  appendOfficeEvent(root, team, event, source);
  moveOfficeAgent(root, team, event);
}

function setOfficeMode(root, mode, sourceText, disclosure) {
  const modeEl = root.querySelector('[data-office-mode]');
  const sourceEl = root.querySelector('[data-office-source]');
  const disclosureEl = root.querySelector('[data-office-disclosure]');
  root.dataset.officeMode = mode;
  if (modeEl) modeEl.textContent = mode === 'live' ? 'CANLI AKIŞ BAĞLI' : 'YEREL PROTOTİP';
  if (sourceEl) sourceEl.textContent = sourceText;
  if (disclosureEl) disclosureEl.textContent = disclosure;
}

function activateOfficeAgent(root, agentKey) {
  root.querySelectorAll('[data-office-agent]').forEach((element) => {
    const active = element.dataset.officeAgent === agentKey;
    element.classList.toggle('is-selected', active);
    element.setAttribute('aria-pressed', String(active));
  });
}

function startPrototypeOffice(root, team) {
  let sequence = 0;
  const emit = () => {
    const base = OFFICE_PROTOTYPE_EVENTS[sequence % OFFICE_PROTOTYPE_EVENTS.length];
    const event = { ...base, agent_key: team.includes(base.agent_key) ? base.agent_key : team[sequence % team.length], occurred_at: new Date().toISOString() };
    if (event.target_agent_key && (!team.includes(event.target_agent_key) || event.target_agent_key === event.agent_key)) {
      const agentIndex = Math.max(0, team.indexOf(event.agent_key));
      event.target_agent_key = team[(agentIndex + 1) % team.length];
    }
    applyOfficeEvent(root, team, event, 'prototype');
    sequence += 1;
  };
  emit();
  const timer = window.setInterval(emit, 5200);
  root._officeStop = () => window.clearInterval(timer);
  root._officeResume = () => startPrototypeOffice(root, team);
}

async function renderProjectOffice() {
  const root = document.getElementById('office-root');
  if (!root) return;
  const slug = location.pathname.split('/').pop().replace('.html', '');
  const remoteProject = await fetchProjectBySlug(slug);
  const project = remoteProject || STATIC_PROJECTS.find(p => p.slug === slug);
  if (!project) return;
  const team = officeTeam(project);
  root.innerHTML = liveOfficeFrameHTML(project, team);
  initialiseOfficeCanvas(root);

  root.addEventListener('click', (event) => {
    const agentControl = event.target.closest('[data-office-agent]');
    if (agentControl) activateOfficeAgent(root, agentControl.dataset.officeAgent);
  });

  const result = await fetchProjectActivityEvents(project.slug);
  if (!result.available) {
    setOfficeMode(root, 'prototype', 'Canlı olay kaynağı bağlı değil; hareket ve konuşmalar yerel prototipte üretiliyor.', 'Yerel prototip: hareketler ve konuşmalar temsili. Gerçek zamanlı akış için project_activity_events migration’ı ve güvenilir bir agent runner gerekir.');
    startPrototypeOffice(root, team);
    return;
  }

  setOfficeMode(root, 'live', result.events.length ? 'Yayınlanmış çalışma olayları gerçek zamanlı izleniyor.' : 'Akış bağlı; yayınlanmış ilk olay bekleniyor.', 'Canlı akış: yalnızca güvenli, yayınlanmış olay özetleri gösterilir. Ajan kimlikleri arayüzde temsili rol adlarıyla gösterilir.');
  result.events.slice().reverse().forEach((event) => applyOfficeEvent(root, team, event, 'live'));
  root._officeChannel = subscribeToProjectActivityEvents(project.slug, (event) => applyOfficeEvent(root, team, event, 'live'), (status) => {
    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      setOfficeMode(root, 'prototype', 'Canlı akış kesildi; yerel prototip gösteriliyor.', 'Yerel prototip: canlı bağlantı yeniden kurulana kadar temsili hareket ve konuşmalar gösterilir.');
      if (!root._officeStop) startPrototypeOffice(root, team);
    }
  });
}

async function renderHomeBuildStatus() {
  const root = document.getElementById('home-build-status');
  if (!root) return;
  // En son geliştirme yapılan 3 proje (cf-sync'in yazdığı latest_update_at'e göre).
  const remote = await fetchAllProjects();
  const active = (remote || [])
    .filter((p) => p.latest_update_at && p.latest_update_text)
    .sort((a, b) => new Date(b.latest_update_at) - new Date(a.latest_update_at))
    .slice(0, 3);
  if (!active.length) {
    const fallback = STATIC_PROJECTS.find((p) => p.slug === (root.dataset.slug || 'ersoy'));
    if (!fallback) return;
    setStatusNotice(root, 'Güncel aktivite verisi alınamadı; son yayınlanan bilgi gösteriliyor.');
    root.innerHTML = homeBuildNoteHTML(fallback);
    return;
  }
  root.innerHTML = `<div class="home-activity">${active.map(homeBuildNoteHTML).join('')}</div>`;
}

async function renderProjectDetail() {
  const nameEl = document.getElementById('project-name');
  if (!nameEl) return;

  const slug = location.pathname.split('/').pop().replace('.html', '');
  const [remoteProject, remoteAll] = await Promise.all([fetchProjectBySlug(slug), fetchAllProjects()]);
  const project = remoteProject || STATIC_PROJECTS.find(p => p.slug === slug);
  const all = remoteAll?.length ? remoteAll : STATIC_PROJECTS;

  if (!project) {
    nameEl.textContent = 'Proje bilgisi bulunamadı';
    const body = document.getElementById('project-body');
    if (body) body.textContent = 'Bu bağlantı için yayınlanmış bir proje kaydı yok. Tüm projeleri katalogdan inceleyebilirsin.';
    return;
  }

  if (!remoteProject) {
    const notice = document.createElement('p');
    notice.className = 'folio project-data-notice';
    notice.setAttribute('role', 'status');
    notice.textContent = 'Güncel proje verisi alınamadı; son yayınlanan proje özeti gösteriliyor.';
    document.getElementById('project-tagline')?.before(notice);
  }
  document.title = `${project.display_name} — ${project.tagline} | CizgiFikrim`;
  nameEl.replaceChildren(document.createTextNode(project.display_name || 'Proje'), Object.assign(document.createElement('span'), { className: 'project-dot', textContent: '.' }));
  document.getElementById('project-tagline').textContent = project.tagline || '';
  const body = document.getElementById('project-body');
  body.replaceChildren(...String(project.description || 'Bu proje için henüz ayrıntılı açıklama yayınlanmadı.').split('\n\n').map(para => Object.assign(document.createElement('p'), { className: 'project-para', textContent: para })));
  document.getElementById('meta-status').innerHTML = statusBadgeHTML(project.status, project.status_label);
  document.getElementById('meta-category').textContent = CATEGORY_META[project.category]?.name || '';
  document.getElementById('meta-folder').textContent = project.folder_number || '';
  const folioEl = document.getElementById('folio-category');
  if (folioEl) folioEl.textContent = `Dosya · ${CATEGORY_META[project.category]?.name || ''}`;

  const idx = all.findIndex(p => p.slug === slug);
  if (!all.length || idx < 0) {
    document.getElementById('nav-prev').replaceChildren();
    document.getElementById('nav-next').replaceChildren();
    return;
  }
  const prev = all[(idx - 1 + all.length) % all.length];
  const next = all[(idx + 1) % all.length];

  document.getElementById('nav-prev').innerHTML = `
    <a href="${safeProjectSlug(prev.slug)}.html" class="proj-nav-a">
      <p class="folio">← Önceki</p>
      <p class="proj-nav-name">${escapeHTML(prev.display_name)}</p>
    </a>`;
  document.getElementById('nav-next').innerHTML = `
    <a href="${safeProjectSlug(next.slug)}.html" class="proj-nav-a">
      <p class="folio">Sonraki →</p>
      <p class="proj-nav-name">${escapeHTML(next.display_name)}</p>
    </a>`;
}

function initContactFormSupabase() {
  const form = document.getElementById('contact-form');
  const sentMsg = document.getElementById('form-sent');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    if (formData.get('_gotcha')) return; // honeypot

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.setAttribute('aria-busy', 'true');
    }
    if (sentMsg) {
      sentMsg.hidden = false;
      sentMsg.textContent = 'Mesaj gönderiliyor…';
    }

    const ok = await submitContactMessage({
      name: formData.get('name'),
      email: formData.get('email'),
      subject: formData.get('subject') || 'Diğer',
      message: formData.get('message') || '',
    });

    if (ok) {
      form.reset();
      if (sentMsg) sentMsg.textContent = 'Mesaj gönderildi — teşekkürler.';
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.removeAttribute('aria-busy');
      }
      return;
    }

    // Supabase kapalıysa formun HTML'deki mevcut Formspree hedefi kullanılır.
    // Test verisi göndermeden bu yol yalnız gerçek kullanıcı gönderiminde çalışır.
    try {
      const response = await fetch(form.action, {
        method: form.method || 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error(`Formspree ${response.status}`);
      form.reset();
      if (sentMsg) sentMsg.textContent = 'Mesaj gönderildi — teşekkürler.';
    } catch (error) {
      console.error('contact form fallback', error);
      if (sentMsg) {
        sentMsg.textContent = 'Mesaj şu anda gönderilemedi. Lütfen hello@cizgifikrim.net adresine e-posta gönder.';
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.removeAttribute('aria-busy');
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderProductsPage();
  renderFeaturedProjects();
  renderProjectDetail();
  renderProjectOffice();
  renderProjectBuildStatus();
  renderHomeBuildStatus();
  initContactFormSupabase();
});
