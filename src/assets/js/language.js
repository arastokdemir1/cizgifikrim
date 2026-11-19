(() => {
  let lang;
  try { lang = localStorage.getItem('cf_language'); } catch {}
  if (!['tr', 'en'].includes(lang)) lang = (navigator.language || '').toLowerCase().startsWith('tr') ? 'tr' : 'en';
  location.replace('/' + lang + '/' + location.search + location.hash);
})();
