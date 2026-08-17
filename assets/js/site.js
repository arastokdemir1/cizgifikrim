// CizgiFikrim — Kinetic Lab (Stitch) tasarımı için gerçek veri render mantığı.
// supabase-client.js'teki fetchAllProjects/fetchFeaturedProjects/fetchProjectBySlug/
// submitContactMessage fonksiyonlarını kullanır. Uydurma commit/aktivite verisi
// ÜRETİLMEZ — gerçek bir senkronizasyon sistemi kurulana kadar o alanlar
// "yakında aktif olacak" dürüst bekleme durumuyla gösterilir.

const STATUS_DOT = {
  live: { cls: 'bg-status-active', label: (l) => l },
  rd:   { cls: 'bg-status-active', label: (l) => l },
  wip:  { cls: 'bg-status-idle',   label: (l) => l },
  concept: { cls: 'bg-status-stale', label: (l) => l },
};

function statusVisual(p) {
  // Radar gibi elle "Bakımda" işaretlenmiş projeler durgun görünsün,
  // altta yatan 'status' alanı ne olursa olsun.
  if (/bakım|durduruldu|pasif/i.test(p.status_label || '')) {
    return { cls: 'bg-status-stale', text: p.status_label };
  }
  const v = STATUS_DOT[p.status] || STATUS_DOT.wip;
  return { cls: v.cls, text: p.status_label };
}

function statusBadgeSmall(p) {
  const v = statusVisual(p);
  return `<span class="font-label-status text-label-status uppercase flex items-center gap-1.5">
    <span class="w-1.5 h-1.5 rounded-full ${v.cls}"></span>${v.text}
  </span>`;
}

const CATEGORY_LABEL = {
  'otonom-ai': 'Otonom AI Sistemleri',
  'mobil': 'Mobil Uygulamalar',
  'finansal': 'Finansal Araçlar',
  'otomotiv': 'Otomotiv',
};
const CATEGORY_ORDER = ['otonom-ai', 'mobil', 'finansal', 'otomotiv'];

// ── Ana Sayfa ──────────────────────────────────────────────────────────────
async function renderHomeActiveProjects() {
  const root = document.getElementById('active-projects-list');
  if (!root) return;
  const featured = await fetchFeaturedProjects();
  root.innerHTML = featured.map(p => {
    const v = statusVisual(p);
    return `
      <div class="flex items-center justify-between p-4 bg-surface rounded-lg border border-subtle hover:border-outline-variant transition-colors group">
        <div class="flex items-center gap-4">
          <div class="w-1 h-12 ${v.cls} rounded-full"></div>
          <div>
            <h3 class="font-body-md text-body-md font-semibold text-on-surface group-hover:text-primary transition-colors">${p.display_name}</h3>
            <p class="font-label-mono text-label-mono text-on-surface-variant mt-1">${p.tagline}</p>
          </div>
        </div>
        <div class="hidden sm:flex items-center gap-2 bg-surface-container px-3 py-1 rounded-full border border-subtle">
          <span class="w-1.5 h-1.5 rounded-full ${v.cls}"></span>
          <span class="font-label-status text-label-status">${v.text.toUpperCase()}</span>
        </div>
      </div>`;
  }).join('');
}

async function renderHomeFeaturedCards() {
  const root = document.getElementById('featured-cards');
  if (!root) return;
  const featured = await fetchFeaturedProjects();
  root.innerHTML = featured.map(p => `
    <a href="projects/${p.slug}.html" class="bg-surface-glass border border-subtle rounded-xl p-6 flex flex-col gap-4 hover:border-primary transition-colors group">
      <div class="flex justify-between items-start">
        <span class="font-label-mono text-label-mono text-on-surface-variant">${p.folder_number || ''}</span>
        <div class="font-label-mono text-label-mono bg-surface px-2 py-1 rounded border border-subtle">${statusBadgeSmall(p)}</div>
      </div>
      <div>
        <h3 class="font-headline-lg-mobile text-headline-lg-mobile text-on-surface group-hover:text-primary transition-colors">${p.display_name}</h3>
        <p class="font-body-md text-body-md text-on-surface-variant mt-2 text-sm line-clamp-2">${p.tagline}</p>
      </div>
      <div class="mt-auto pt-4 border-t border-subtle flex justify-between items-center">
        <span class="font-label-status text-label-status text-primary uppercase">${CATEGORY_LABEL[p.category] || ''}</span>
        <span class="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">arrow_forward</span>
      </div>
    </a>`).join('');
}

function honestPlaceholder(root, msg) {
  if (!root) return;
  root.innerHTML = `
    <div class="flex flex-col items-center justify-center text-center py-8 gap-2 opacity-70">
      <span class="material-symbols-outlined text-3xl text-on-surface-variant">hourglass_top</span>
      <p class="font-body-md text-body-md text-on-surface-variant text-sm max-w-xs">${msg}</p>
    </div>`;
}

// ── Ürünler Sayfası ──────────────────────────────────────────────────────────
async function renderProductsGrid() {
  const root = document.getElementById('products-categories');
  if (!root) return;
  const all = await fetchAllProjects();
  const grouped = {};
  all.forEach(p => { (grouped[p.category] ||= []).push(p); });

  root.innerHTML = CATEGORY_ORDER.filter(c => grouped[c]?.length).map(cat => {
    const items = grouped[cat].map(p => {
      const v = statusVisual(p);
      return `
        <a href="projects/${p.slug}.html" class="bg-surface-glass border border-subtle rounded-lg p-5 relative overflow-hidden group hover:bg-surface-container-low transition-colors duration-300 flex flex-col h-full min-h-[160px]">
          <div class="absolute left-0 top-0 bottom-0 w-[2px] ${v.cls}"></div>
          <div class="flex flex-col gap-3 z-10 flex-grow">
            <div class="flex justify-between items-start">
              <span class="font-label-mono text-label-mono ${v.cls.replace('bg-', 'text-')} bg-surface-container-high/50 px-2 py-0.5 rounded-full flex items-center gap-1.5 border border-subtle text-[10px]">
                <span class="w-1.5 h-1.5 rounded-full ${v.cls}"></span> ${v.text}
              </span>
              <span class="font-label-mono text-on-surface-variant text-[10px]">${p.folder_number || ''}</span>
            </div>
            <div>
              <h3 class="font-headline-lg text-lg text-on-surface mb-1 truncate">${p.display_name}</h3>
              <p class="font-body-md text-sm text-on-surface-variant line-clamp-2">${p.tagline}</p>
            </div>
          </div>
        </a>`;
    }).join('');
    return `
      <section>
        <div class="flex items-center gap-4 mb-6 border-b border-subtle pb-2">
          <h2 class="font-headline-lg text-2xl text-on-surface">${CATEGORY_LABEL[cat]}</h2>
          <span class="font-label-mono text-xs text-on-surface-variant bg-surface-container-high px-2 py-1 rounded">${grouped[cat].length} Proje</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter w-full">${items}</div>
      </section>`;
  }).join('');
}

function initProductsSort() {
  const select = document.getElementById('products-sort');
  if (!select) return;
  select.addEventListener('change', async () => {
    const root = document.getElementById('products-categories');
    if (select.value === 'name') {
      const all = (await fetchAllProjects()).sort((a, b) => a.display_name.localeCompare(b.display_name, 'tr'));
      root.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter w-full">${
        all.map(p => {
          const v = statusVisual(p);
          return `<a href="projects/${p.slug}.html" class="bg-surface-glass border border-subtle rounded-lg p-5 relative overflow-hidden group hover:bg-surface-container-low transition-colors duration-300 flex flex-col h-full min-h-[160px]">
            <div class="absolute left-0 top-0 bottom-0 w-[2px] ${v.cls}"></div>
            <div class="flex flex-col gap-3 z-10 flex-grow">
              <div class="flex justify-between items-start">
                <span class="font-label-mono text-label-mono ${v.cls.replace('bg-', 'text-')} text-[10px]">${v.text}</span>
                <span class="font-label-mono text-on-surface-variant text-[10px]">${p.folder_number || ''}</span>
              </div>
              <div><h3 class="font-headline-lg text-lg text-on-surface mb-1 truncate">${p.display_name}</h3>
              <p class="font-body-md text-sm text-on-surface-variant line-clamp-2">${p.tagline}</p></div>
            </div></a>`;
        }).join('')
      }</div>`;
    } else {
      renderProductsGrid();
    }
  });
}

// ── Proje Detay ──────────────────────────────────────────────────────────────
async function renderProjectDetail() {
  const nameEl = document.getElementById('project-name');
  if (!nameEl) return;
  const slug = location.pathname.split('/').pop().replace('.html', '');
  const [project, all] = await Promise.all([fetchProjectBySlug(slug), fetchAllProjects()]);
  if (!project) { nameEl.textContent = 'Proje bulunamadı'; return; }

  document.title = `CizgiFikrim - ${project.display_name} Proje Detayı`;
  nameEl.textContent = project.display_name;
  document.getElementById('project-category-badge').textContent =
    `Kategori: ${CATEGORY_LABEL[project.category] || ''} / ${project.folder_number || ''}`;
  document.getElementById('project-tagline').textContent = project.tagline;
  document.getElementById('project-description').textContent = project.description || '';

  const v = statusVisual(project);
  document.getElementById('project-status-badge').innerHTML = `
    <span class="relative flex h-3 w-3">
      <span class="relative inline-flex rounded-full h-3 w-3 ${v.cls}"></span>
    </span>
    <span class="font-label-status text-label-status uppercase tracking-widest">${v.text}</span>`;

  honestPlaceholder(document.getElementById('activity-chart-area'),
    'Aktivite grafiği yakında aktif olacak — proje verisi commit senkronizasyon sistemi kurulduktan sonra burada gösterilecek.');
  honestPlaceholder(document.getElementById('commit-feed-area'),
    'Commit geçmişi henüz bağlı değil. Bu bölüm yakında gerçek geliştirme verisiyle güncellenecek.');
  const statsEl = document.getElementById('project-stats');
  if (statsEl) statsEl.innerHTML = `<p class="font-body-md text-body-md text-on-surface-variant text-sm">Detaylı istatistikler yakında.</p>`;

  const idx = all.findIndex(p => p.slug === slug);
  const prev = all[(idx - 1 + all.length) % all.length];
  const next = all[(idx + 1) % all.length];
  const prevEl = document.getElementById('nav-prev');
  const nextEl = document.getElementById('nav-next');
  if (prevEl) prevEl.innerHTML = `<a href="${prev.slug}.html" class="flex flex-col gap-1 group">
      <span class="font-label-mono text-label-mono text-outline uppercase tracking-widest flex items-center gap-2">
        <span class="material-symbols-outlined text-[16px] group-hover:-translate-x-1 transition-transform">arrow_left</span> Önceki Proje</span>
      <span class="font-headline-lg-mobile text-headline-lg-mobile text-on-surface group-hover:text-primary transition-colors">${prev.display_name}</span></a>`;
  if (nextEl) nextEl.innerHTML = `<a href="${next.slug}.html" class="flex flex-col gap-1 text-right group">
      <span class="font-label-mono text-label-mono text-outline uppercase tracking-widest flex items-center gap-2 justify-end">
        Sonraki Proje <span class="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_right</span></span>
      <span class="font-headline-lg-mobile text-headline-lg-mobile text-on-surface group-hover:text-primary transition-colors">${next.display_name}</span></a>`;
}

// ── Aktivite Akışı (henüz veri yok — dürüst bekleme durumu) ─────────────────
function renderActivityPage() {
  const root = document.getElementById('activity-feed-root');
  if (!root) return;
  honestPlaceholder(root,
    'Aktivite akışı yakında aktif olacak. Bu sayfa, projelerin gerçek commit geçmişine bağlandığında burada canlı olarak dolacak.');
  const statsEl = document.getElementById('activity-sidebar-stats');
  if (statsEl) statsEl.innerHTML = `<p class="font-body-md text-body-md text-on-surface-variant text-sm">İstatistikler yakında.</p>`;
}

// ── İletişim Formu ───────────────────────────────────────────────────────────
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const feedback = document.getElementById('contact-feedback');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    const ok = await submitContactMessage({
      name: fd.get('name'), email: fd.get('email'),
      subject: fd.get('subject') || 'Diğer', message: fd.get('message') || '',
    });
    if (btn) btn.disabled = false;
    if (feedback) {
      feedback.textContent = ok ? 'Mesajın gönderildi — teşekkürler.' : 'Bir sorun oluştu, tekrar dene.';
      feedback.classList.remove('hidden');
    }
    if (ok) form.reset();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderHomeActiveProjects();
  renderHomeFeaturedCards();
  renderProductsGrid();
  initProductsSort();
  renderProjectDetail();
  renderActivityPage();
  initContactForm();
});
