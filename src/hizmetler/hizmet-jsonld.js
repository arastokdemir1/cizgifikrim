// Hizmet detay sayfaları için JSON-LD (BreadcrumbList + Service + FAQPage); sss metni sayfadakiyle birebir aynı veriden gelir.
const ORIGIN = 'https://cizgifikrim.net';
export function hizmetJsonld(h) {
  return [
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Hizmetler', item: `${ORIGIN}/hizmetler/` },
      { '@type': 'ListItem', position: 2, name: h.kirinti, item: `${ORIGIN}/hizmetler/${h.slug}/` },
    ] },
    { '@type': 'Service', name: h.kirinti, description: h.lead, provider: { '@id': `${ORIGIN}/#org` }, areaServed: 'TR' },
    { '@type': 'FAQPage', mainEntity: h.sss.map((q) => ({ '@type': 'Question', name: q[0], acceptedAnswer: { '@type': 'Answer', text: q[1] } })) },
  ];
}
