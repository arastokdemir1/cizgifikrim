// CizgiFikrim — Supabase verisinden sayfa render mantığı.
// Her fonksiyon ilgili DOM elemanı yoksa sessizce çıkar; tek dosya tüm sayfalarda güvenle kullanılabilir.

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
  renderProjectBuildStatus();
  renderHomeBuildStatus();
  initContactFormSupabase();
});
