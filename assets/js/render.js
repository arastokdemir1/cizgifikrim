// CizgiFikrim — Supabase verisinden sayfa render mantığı.
// Her fonksiyon ilgili DOM elemanı yoksa sessizce çıkar; tek dosya tüm sayfalarda güvenle kullanılabilir.

const CATEGORY_ORDER = ['otonom-ai', 'mobil', 'finansal', 'otomotiv'];

function projectCardHTML(p, num) {
  return `
    <li class="proj-item">
      <a href="projects/${p.slug}.html" class="proj-link reveal">
        <span class="folio proj-num-col">№${num}</span>
        <div class="proj-name-col">
          <h3 class="proj-name-main">${p.display_name}</h3>
          <p class="proj-tagline-sm">${p.tagline}</p>
        </div>
        <p class="proj-desc-col">${(p.description || '').split('\n\n')[0]}</p>
        <div class="proj-status-col">${statusBadgeHTML(p.status, p.status_label)}</div>
      </a>
    </li>`;
}

async function renderProductsPage() {
  const root = document.getElementById('products-categories');
  if (!root) return;

  const projects = await fetchAllProjects();
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

  if (window.initReveal) window.initReveal();
}

function featuredCardHTML(p, num) {
  return `
    <a href="projects/${p.slug}.html" class="feat-card reveal">
      <div class="feat-meta">
        ${statusBadgeHTML(p.status, p.status_label)}
        <span class="feat-num">№ ${num}</span>
      </div>
      <h3 class="feat-name">${p.display_name}</h3>
      <p class="feat-tagline">${p.tagline}</p>
      <p class="feat-desc">${(p.description || '').split('\n\n')[0]}</p>
      <div class="feat-footer">
        <span class="feat-cat">${CATEGORY_META[p.category]?.name || ''}</span>
        <span>oku →</span>
      </div>
    </a>`;
}

async function renderFeaturedProjects() {
  const root = document.getElementById('featured-grid');
  if (!root) return;

  const featured = await fetchFeaturedProjects();
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
          <p>${p.latest_update_text}</p>
        </div>` : ''}
        ${p.test_status ? `
        <div class="build-status-row">
          <span class="folio">Test Durumu</span>
          <p>${p.test_status}</p>
        </div>` : ''}
        ${p.live_url ? `<a href="${p.live_url}" target="_blank" rel="noopener" class="btn-primary build-status-cta">App Store'da Gör<span class="btn-arrow">→</span></a>` : ''}
      </div>`;
  }

  const total = p.commit_count_total || 0;
  const d30 = p.commit_count_30d || 0;
  const d7 = p.commit_count_7d || 0;
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
        <p>${p.latest_update_text}</p>
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

// ── Atölye — mekansal masa görünümü (tüm projeler, bölge/kategori bazlı) ──
function initialsOf(name) {
  return (name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
}

function deskHTML(p) {
  const isActive = (p.commit_count_7d || 0) > 0 || p.status === 'live';
  const dotClass = { live: 'dot-live', rd: 'dot-rd', wip: 'dot-wip', concept: 'dot-concept' }[p.status] || 'dot-wip';
  return `
    <div class="desk-wrap">
      <button class="desk" data-slug="${p.slug}" aria-expanded="false">
        <span class="desk-light ${dotClass}${isActive ? ' pulse' : ''}"></span>
        <span class="desk-avatar">${initialsOf(p.display_name)}</span>
        <span class="desk-name">${p.display_name}</span>
        <span class="desk-toggle">+</span>
      </button>
      <div class="desk-terminal" id="terminal-${p.slug}" hidden></div>
    </div>`;
}

async function renderAtolye() {
  const root = document.getElementById('atolye-zones');
  if (!root) return;

  const all = await fetchAllProjects();
  const grouped = {};
  all.forEach(p => { (grouped[p.category] ||= []).push(p); });

  root.innerHTML = CATEGORY_ORDER
    .filter(cat => grouped[cat] && grouped[cat].length)
    .map(cat => `
      <section class="atolye-zone">
        <header class="atolye-zone-header">
          <span class="folio">${CATEGORY_META[cat].folioNum}</span>
          <h2>${CATEGORY_META[cat].name}</h2>
          <span class="atolye-zone-count">${grouped[cat].length} masa</span>
        </header>
        <div class="atolye-desks">${grouped[cat].map(deskHTML).join('')}</div>
      </section>`)
    .join('');

  const cache = {};
  root.querySelectorAll('.desk').forEach(btn => {
    btn.addEventListener('click', async () => {
      const slug = btn.dataset.slug;
      const panel = document.getElementById(`terminal-${slug}`);
      const nowOpen = btn.getAttribute('aria-expanded') !== 'true';

      // Aynı bölgedeki diğer açık terminalleri kapat (tek seferde bir masa)
      root.querySelectorAll('.desk[aria-expanded="true"]').forEach(other => {
        if (other !== btn) {
          other.setAttribute('aria-expanded', 'false');
          const otherPanel = document.getElementById(`terminal-${other.dataset.slug}`);
          if (otherPanel) otherPanel.hidden = true;
        }
      });

      btn.setAttribute('aria-expanded', String(nowOpen));
      panel.hidden = !nowOpen;
      if (nowOpen && !cache[slug]) {
        const project = await fetchProjectBySlug(slug);
        cache[slug] = true;
        panel.innerHTML = `<p class="desk-terminal-prompt">cat ${slug}/activity.log</p>` + buildStatusHTML(project);
      }
    });
  });
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
  const headCx = deskX + 45, headCy = deskY - 34;
  const plateX = x + 130, plateY = y + 82;
  const delay = i * 160;
  return `
    <g class="office-char${isActive ? ' office-char-active' : ''}" style="--office-delay:${delay}ms">
      <rect class="office-zone" x="${x}" y="${y}" width="260" height="110" rx="10" fill="url(#office-checker-${i})"></rect>
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
      <g class="office-figure">
        <circle class="office-char-head" cx="${headCx}" cy="${headCy}" r="8"></circle>
        <rect class="office-char-body" x="${headCx - 10}" y="${headCy + 6}" width="20" height="16" rx="6"></rect>
      </g>
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

function officeOfficePaneHTML(project, team, statusDotClass, isActive) {
  const activeCount = isActive ? team.length : 0;
  return `
    <div class="am-pane am-pane-office">
      <div class="am-pane-head"><span class="am-pane-title">Ofis</span><span class="am-pane-badge">${activeCount}/${team.length}</span></div>
      ${officeSceneSVG(team, statusDotClass, isActive)}
      <p class="am-office-caption"><span class="am-dot ${statusDotClass}${isActive ? ' office-pulse' : ''}"></span>${project.display_name} — ${project.status_label || (isActive ? 'aktif' : 'beklemede')}</p>
    </div>`;
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
        <p class="am-term-line">$ ${a.cli} run --project ${project.slug} --role ${a.role.toLowerCase()}</p>
        <p class="am-term-desc"># ${a.desc}</p>
      </div>
    </div>`;
}

function officeTerminalPaneHTML(team, project) {
  return `
    <div class="am-pane am-pane-terminal">
      <div class="am-pane-head"><span class="am-pane-title">Terminal</span><span class="am-pane-badge">${team.length} açık</span></div>
      <div class="am-terminals">${team.map((id, i) => terminalWindowHTML(id, i, project)).join('')}</div>
    </div>`;
}

function officeTasksPaneHTML(project) {
  const d7 = project.commit_count_7d ?? null;
  const d30 = project.commit_count_30d ?? null;
  const total = project.commit_count_total ?? null;
  return `
    <div class="am-pane am-pane-tasks">
      <div class="am-pane-head"><span class="am-pane-title">Görevler</span><span class="am-pane-badge">${total ?? '—'} toplam</span></div>
      <div class="am-board">
        <div class="am-col">
          <p class="am-col-head">SON GÜNCELLEME</p>
          ${project.latest_update_text ? `
          <div class="am-card">
            <p class="am-card-title">${project.latest_update_text}</p>
            ${project.latest_update_at ? `<p class="am-card-meta">${relativeTimeTR(project.latest_update_at)}</p>` : ''}
          </div>` : `<p class="am-card-empty">Henüz kayıt yok.</p>`}
          ${project.show_commit_detail === false ? `<p class="am-card-privacy">Güvenlik protokolleri gereği detay paylaşılmıyor.</p>` : ''}
        </div>
        <div class="am-col">
          <p class="am-col-head">BU HAFTA</p>
          <div class="am-card am-card-stat">${d7 ?? '—'}</div>
        </div>
        <div class="am-col">
          <p class="am-col-head">BU AY</p>
          <div class="am-card am-card-stat">${d30 ?? '—'}</div>
        </div>
      </div>
    </div>`;
}

async function renderProjectOffice() {
  const root = document.getElementById('office-root');
  if (!root) return;
  const slug = location.pathname.split('/').pop().replace('.html', '');
  const project = await fetchProjectBySlug(slug);
  if (!project) return;
  const team = TEAM_BY_CATEGORY[project.category] || TEAM_BY_CATEGORY['otonom-ai'];
  const statusDotClass = { live: 'dot-live', rd: 'dot-rd', wip: 'dot-wip', concept: 'dot-concept' }[project.status] || 'dot-wip';
  const isActive = (project.commit_count_7d || 0) > 0 || project.status === 'live';

  root.innerHTML = `
    <div class="am-frame">
      <div class="am-topbar">
        <span class="am-window-dots"><i></i><i></i><i></i></span>
        <span class="am-brand"><span class="am-brand-dot"></span>cizgifikrim <span class="am-brand-sub">ofis</span></span>
        <span class="am-tab am-tab-active">${project.display_name} <span class="am-tab-count">${isActive ? team.length : 0}/${team.length}</span></span>
      </div>
      <div class="am-grid">
        ${officeOfficePaneHTML(project, team, statusDotClass, isActive)}
        ${officeTerminalPaneHTML(team, project)}
        ${officeTasksPaneHTML(project)}
      </div>
      <p class="am-note">Kurgusal ekip görünümü — kişiler temsili, ışık ve sayılar gerçek aktivite verisi.</p>
    </div>`;
}

async function renderHomeBuildStatus() {
  const root = document.getElementById('home-build-status');
  if (!root) return;
  const project = await fetchProjectBySlug(root.dataset.slug || 'ersoy');
  if (!project) return;
  root.innerHTML = `
    <a href="projects/${project.slug}.html" class="build-status-home-link">
      <p class="folio">${project.display_name} — ${project.tagline}</p>
    </a>
    ${buildStatusHTML(project)}`;
}

async function renderProjectDetail() {
  const nameEl = document.getElementById('project-name');
  if (!nameEl) return;

  const slug = location.pathname.split('/').pop().replace('.html', '');
  const [project, all] = await Promise.all([fetchProjectBySlug(slug), fetchAllProjects()]);

  if (!project) {
    nameEl.textContent = 'Proje bulunamadı';
    return;
  }

  document.title = `${project.display_name} — ${project.tagline} | CizgiFikrim`;
  nameEl.innerHTML = `${project.display_name}<span class="project-dot">.</span>`;
  document.getElementById('project-tagline').textContent = project.tagline;
  document.getElementById('project-body').innerHTML = (project.description || '')
    .split('\n\n')
    .map(para => `<p class="project-para">${para}</p>`)
    .join('');
  document.getElementById('meta-status').innerHTML = statusBadgeHTML(project.status, project.status_label);
  document.getElementById('meta-category').textContent = CATEGORY_META[project.category]?.name || '';
  document.getElementById('meta-folder').textContent = project.folder_number || '';
  const folioEl = document.getElementById('folio-category');
  if (folioEl) folioEl.textContent = `Dosya · ${CATEGORY_META[project.category]?.name || ''}`;

  const idx = all.findIndex(p => p.slug === slug);
  const prev = all[(idx - 1 + all.length) % all.length];
  const next = all[(idx + 1) % all.length];

  document.getElementById('nav-prev').innerHTML = `
    <a href="${prev.slug}.html" class="proj-nav-a">
      <p class="folio">← Önceki</p>
      <p class="proj-nav-name">${prev.display_name}</p>
    </a>`;
  document.getElementById('nav-next').innerHTML = `
    <a href="${next.slug}.html" class="proj-nav-a">
      <p class="folio">Sonraki →</p>
      <p class="proj-nav-name">${next.display_name}</p>
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
    if (submitBtn) submitBtn.disabled = true;

    const ok = await submitContactMessage({
      name: formData.get('name'),
      email: formData.get('email'),
      subject: formData.get('subject') || 'Diğer',
      message: formData.get('message') || '',
    });

    if (submitBtn) submitBtn.disabled = false;
    if (ok) {
      form.reset();
      if (sentMsg) sentMsg.style.display = 'inline';
    } else if (sentMsg) {
      sentMsg.textContent = 'Bir sorun oluştu — lütfen tekrar dene ya da e-posta gönder.';
      sentMsg.style.display = 'inline';
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
  renderAtolye();
  initContactFormSupabase();
});
