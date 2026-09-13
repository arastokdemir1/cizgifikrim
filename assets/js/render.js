// CizgiFikrim — Supabase verisinden sayfa render mantığı.
// Her fonksiyon ilgili DOM elemanı yoksa sessizce çıkar; tek dosya tüm sayfalarda güvenle kullanılabilir.

const CATEGORY_ORDER = ['otonom-ai', 'mobil', 'finansal', 'otomotiv'];

// Bu veri son bilinen, repo içinde yayınlanan katalogdur. Ağ/veritabanı
// erişilemediğinde sayfanın boş kalmaması için kullanılır; Supabase yanıtı
// geldiğinde canlı kayıtlar bunun yerini alır.
const STATIC_PROJECTS = [
  ['ultron', 'Emre', 'Otonom Bilişsel Sistem', 'LLM-bağımsız bilişsel karar çekirdeği.', 'otonom-ai', 'rd', 'Ar-Ge / Canlı'],
  ['aka', 'ALP', 'Yerel Yapay Zekâ Asistanı', 'Tamamen yerel çalışan, gizlilik odaklı yapay zekâ asistanı.', 'otonom-ai', 'wip', 'Geliştiriliyor'],
  ['ersoy', 'Ersoy', 'Web Tabanlı Bilişsel AI', 'Web tabanlı bilişsel AI asistanı; hızlı ve ölçeklenebilir bir mimari.', 'otonom-ai', 'wip', 'Geliştiriliyor'],
  ['arda', 'Arda', 'Masaüstü ve Ses Odaklı AI', 'Doğrudan etkileşim ve otomasyon için tasarlanan bilişsel asistan.', 'otonom-ai', 'wip', 'Geliştiriliyor'],
  ['my_b', 'Yerel Kodlama Ajanı', 'Geliştiriciler için Yerel Asistan', 'Yerel ortamda çalışan kodlama asistanı.', 'otonom-ai', 'rd', 'Ar-Ge'],
  ['wix4.1', 'Kişilik Sürekliliği', 'Dijital İkiz Ar-Ge', 'Dijital ikiz ve kişilik sürekliliği üzerine Ar-Ge çalışması.', 'otonom-ai', 'concept', 'Konsept'],
  ['carlog', 'CarLog', 'iOS Araç Maliyet Uygulaması', 'Araç maliyet yönetimi, yakıt takibi ve verimlilik analizi için mobil çözüm.', 'mobil', 'live', 'Canlı'],
  ['focusgrid', 'FocusGrid', 'Minimalist Odaklanma Aracı', 'Odaklanmayı destekleyen minimalist mobil araç.', 'mobil', 'live', 'Canlı'],
  ['flowgraph', 'FlowGraph', 'Kişisel Finans Akışı', 'Kişisel finans akışını görünür kılan mobil uygulama.', 'mobil', 'live', 'Canlı'],
  ['formafit', 'FormaFit', 'Sağlık ve Fitness Platformu', 'Kişiselleştirilmiş sağlık ve fitness takip platformu.', 'mobil', 'wip', 'Geliştiriliyor'],
  ['gnomon', 'Gnomon', 'macOS Proje Yönetimi', 'Bağımlılık-kilitleme motorlu proje yönetimi.', 'mobil', 'wip', 'Geliştiriliyor'],
  ['trade_bot', 'Trade', 'Quant ve Algoritmik Ticaret', 'Veriden stratejiye uzanan kantitatif ticaret altyapısı.', 'finansal', 'rd', 'Ar-Ge'],
  ['piyasa', 'Piyasa', 'Finansal Piyasa Uygulaması', 'Piyasa verileri ve finansal karar akışları üzerine mobil çalışma.', 'finansal', 'wip', 'Geliştiriliyor'],
  ['radar', 'Radar', 'Piyasa İzleme Sistemi', 'Piyasa sinyallerini izlemeye yönelik çalışma.', 'finansal', 'wip', 'Geliştiriliyor'],
  ['better_motors', 'Better Motors', 'ECU ve Araç İçi Yazılımlar', 'ECU yazılımları ve araç içi dijital sistemlere yönelik çözüm.', 'otomotiv', 'wip', 'Geliştiriliyor'],
  ['sano', 'Sano', 'Sağlık Teknolojileri', 'Sağlık odaklı ürün geliştirme çalışması.', 'mobil', 'wip', 'Geliştiriliyor'],
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

function buildStatusHTML(p) {
  const latestUpdate = escapeHTML(p.latest_update_text);
  const testStatus = escapeHTML(p.test_status);
  const liveURL = safeExternalURL(p.live_url);
  if (p.status === 'live') {
    return `
      <div class="build-status build-status--live">
        <div class="build-status-header">
          <h3 class="build-status-headline">Canlı — yayında</h3>
          ${statusBadgeHTML(p.status, p.status_label)}
        </div>
        ${p.latest_update_text ? `
        <div class="build-status-row">
          <span class="folio">Son Düzeltme</span>
          <p>${latestUpdate}</p>
        </div>` : ''}
        ${p.test_status ? `
        <div class="build-status-row">
          <span class="folio">Test Durumu</span>
          <p>${testStatus}</p>
        </div>` : ''}
        ${liveURL ? `<a href="${liveURL}" target="_blank" rel="noopener" class="btn-primary build-status-cta">App Store'da Gör<span class="btn-arrow">→</span></a>` : ''}
      </div>`;
  }

  const total = Math.max(0, Number(p.commit_count_total) || 0);
  const d30 = Math.max(0, Number(p.commit_count_30d) || 0);
  const d7 = Math.max(0, Number(p.commit_count_7d) || 0);
  const pct = (n) => (total > 0 ? Math.round((n / total) * 100) : 0);

  return `
    <div class="build-status build-status--building">
      <div class="build-status-header">
        <h3 class="build-status-headline">İnşa Durumu</h3>
        ${statusBadgeHTML(p.status, p.status_label)}
      </div>
      ${total ? `
      <div class="build-graph">
        <div class="build-graph-row">
          <span class="build-graph-label">Son 7 gün</span>
          <div class="build-graph-track"><div class="build-graph-fill" style="width:${pct(d7)}%"></div></div>
          <span class="build-graph-value">${d7}</span>
        </div>
        <div class="build-graph-row">
          <span class="build-graph-label">Son 30 gün</span>
          <div class="build-graph-track"><div class="build-graph-fill" style="width:${pct(d30)}%"></div></div>
          <span class="build-graph-value">${d30}</span>
        </div>
        <div class="build-graph-row">
          <span class="build-graph-label">Toplam</span>
          <div class="build-graph-track"><div class="build-graph-fill" style="width:100%"></div></div>
          <span class="build-graph-value">${total}</span>
        </div>
      </div>` : `<p class="build-status-live-note">Aktivite verisi henüz senkronize edilmedi.</p>`}
      ${p.latest_update_text ? `
      <div class="build-status-row">
        <span class="folio">Son Güncelleme${p.latest_update_at ? ' · ' + relativeTimeTR(p.latest_update_at) : ''}</span>
        <p>${latestUpdate}</p>
      </div>` : ''}
      ${p.show_commit_detail === false ? `<p class="build-status-privacy-note">Detaylı commit kayıtları güvenlik protokolleri gereği paylaşılmıyor — sadece aktivite istatistikleri gösteriliyor.</p>` : ''}
    </div>`;
}

async function renderProjectBuildStatus() {
  const root = document.getElementById('build-status-root');
  if (!root) return;
  const slug = location.pathname.split('/').pop().replace('.html', '');
  const project = await fetchProjectBySlug(slug);
  if (!project) return;
  root.innerHTML = buildStatusHTML(project);
}

// ── Proje Ofisi — her projenin kendi ekip görünümü (proje detay sayfası) ──
// Gerçek Fleet/Paperclip ajan kadrosundan (AJANLAR.md) — canlı görev durumu
// değil, o kategoride gerçekten çalışan ajan rolleri ve sorumlulukları.
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

function officeZoneSVG(agentId, i, statusDotClass, isActive) {
  const a = AGENT_ROSTER[agentId];
  const name = CHARACTER_NAMES[i];
  const { x, y } = ZONE_LAYOUT[i];
  const deskX = x + 85, deskY = y + 44;
  const monX = deskX + 25, monY = deskY - 24;
  const plateX = x + 130, plateY = y + 82;
  const delay = i * 160;
  const bubbleText = ROLE_BUBBLES[a.role.toLowerCase()] || 'görev üzerinde';
  return `
    <g class="office-char${isActive ? ' office-char-active' : ''}" style="--office-delay:${delay}ms">
      <rect class="office-zone" x="${x}" y="${y}" width="260" height="110" rx="10" fill="url(#office-checker-${i})"></rect>
      ${isActive ? `<g class="office-speech"><rect x="${x + 42}" y="${y + 7}" width="118" height="18" rx="5"></rect><text x="${x + 101}" y="${y + 19}" text-anchor="middle">${bubbleText}</text></g>` : ''}
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

function officeSceneSVG(team, statusDotClass, isActive) {
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
      ${team.map((agentId, i) => officeZoneSVG(agentId, i, statusDotClass, isActive)).join('')}
    </svg>`;
}

// Piksel figürler — kıyafet/saç/ten tonu CSS custom property ile verilen,
// 4 katmanlı (saç/yüz/gövde/bacak) tamamen CSS'ten çizilen kurgusal kişiler.
const PIXEL_PALETTES = [
  { shirt: 'var(--accent)', hair: '#3b2a20', skin: '#e8b98c' },
  { shirt: 'var(--wip)',    hair: '#1f2430', skin: '#caa274' },
  { shirt: 'var(--rd)',     hair: '#5c4632', skin: '#f0c9a0' },
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
        ${officeSceneSVG(team, statusDotClass, isActive)}
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

function officeFrameHTML(project) {
  const team = TEAM_BY_CATEGORY[project.category] || TEAM_BY_CATEGORY['otonom-ai'];
  const statusDotClass = { live: 'dot-live', rd: 'dot-rd', wip: 'dot-wip', concept: 'dot-concept' }[project.status] || 'dot-wip';
  const isActive = (project.commit_count_7d || 0) > 0 || project.status === 'live';

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
      <p class="am-note">Kurgusal ekip görünümü — kişiler temsili, ışık ve sayılar gerçek aktivite verisi.</p>
    </div>`;
}

async function renderProjectOffice() {
  const root = document.getElementById('office-root');
  if (!root) return;
  const slug = location.pathname.split('/').pop().replace('.html', '');
  const project = await fetchProjectBySlug(slug);
  if (!project) return;
  root.innerHTML = officeFrameHTML(project);
}

async function renderHomeBuildStatus() {
  const root = document.getElementById('home-build-status');
  if (!root) return;
  const remoteProject = await fetchProjectBySlug(root.dataset.slug || 'ersoy');
  const project = remoteProject || STATIC_PROJECTS.find(p => p.slug === (root.dataset.slug || 'ersoy'));
  if (!project) return;
  if (!remoteProject) setStatusNotice(root, 'Güncel aktivite verisi alınamadı; son yayınlanan bilgi gösteriliyor.');
  const slug = safeProjectSlug(project.slug);
  root.innerHTML = `
    <a href="projects/${slug}.html" class="build-status-home-link">
      <p class="folio">${escapeHTML(project.display_name)} — ${escapeHTML(project.tagline)}</p>
    </a>
    ${officeFrameHTML(project)}`;
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
