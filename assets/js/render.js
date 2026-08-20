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

// Mekansal ofis sahnesi — SVG. Karakter yerine "terminal/masa" ikonu:
// bunlar insan değil AI ajan, o yüzden soyut bir masaüstü ekranı olarak
// çizildi. Işık = o projenin gerçek aktivite durumu (uydurma değil).
const ZONE_LAYOUT = [
  { x: 20,  y: 20  }, { x: 300, y: 20  },
  { x: 20,  y: 140 }, { x: 300, y: 140 },
];

function officeZoneSVG(agentId, i, statusDotClass, isActive) {
  const a = AGENT_ROSTER[agentId];
  const { x, y } = ZONE_LAYOUT[i];
  const deskX = x + 85, deskY = y + 50;
  const monX = deskX + 25, monY = deskY - 24;
  return `
    <g class="office-char" data-agent="${agentId}" tabindex="0" role="button" aria-expanded="false">
      <rect class="office-zone office-zone-${i % 4}" x="${x}" y="${y}" width="260" height="100" rx="10"></rect>
      <rect class="office-desk" x="${deskX}" y="${deskY}" width="90" height="30" rx="3"></rect>
      <rect class="office-monitor" x="${monX}" y="${monY}" width="40" height="26" rx="3"></rect>
      <rect class="office-monitor-line" x="${monX + 6}" y="${monY + 8}" width="20" height="2"></rect>
      <rect class="office-monitor-line" x="${monX + 6}" y="${monY + 14}" width="12" height="2"></rect>
      <circle class="office-status-dot ${statusDotClass}${isActive ? ' office-pulse' : ''}" cx="${monX + 34}" cy="${monY + 2}" r="4"></circle>
      <text class="office-label" x="${x + 130}" y="${y + 92}" text-anchor="middle">${a.role.toUpperCase()}</text>
    </g>`;
}

function officeSceneSVG(team, statusDotClass, isActive) {
  return `
    <svg class="office-scene" viewBox="0 0 580 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Proje ekibi ofisi">
      ${team.map((agentId, i) => officeZoneSVG(agentId, i, statusDotClass, isActive)).join('')}
    </svg>`;
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
    <div class="office-box">
      <div class="build-status-header">
        <h3 class="build-status-headline" style="color:var(--ink)">Ofis</h3>
        <span class="folio">${team.length} masa</span>
      </div>
      <p class="build-status-live-note">${project.display_name} üzerinde çalışan gerçek ajan rolleri. Bir masaya tıkla, sorumluluğunu gör.</p>
      ${officeSceneSVG(team, statusDotClass, isActive)}
      <div class="office-terminal" id="office-terminal-panel" hidden></div>
    </div>`;

  const panel = document.getElementById('office-terminal-panel');
  root.querySelectorAll('.office-char').forEach(g => {
    const activate = () => {
      const agentId = g.dataset.agent;
      const nowOpen = g.getAttribute('aria-expanded') !== 'true';
      root.querySelectorAll('.office-char[aria-expanded="true"]').forEach(o => o.setAttribute('aria-expanded', 'false'));
      g.setAttribute('aria-expanded', String(nowOpen));
      if (!nowOpen) { panel.hidden = true; return; }
      const a = AGENT_ROSTER[agentId];
      panel.hidden = false;
      panel.innerHTML = `
        <p class="desk-terminal-prompt">whoami — ${agentId}</p>
        <p style="font-size:0.9rem;"><strong>${a.role}</strong> · ${CLI_LABEL[a.cli]} CLI</p>
        <p style="font-size:0.9rem; color:var(--muted-fg); margin-top:0.35rem;">${a.desc}</p>`;
    };
    g.addEventListener('click', activate);
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); } });
  });
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
