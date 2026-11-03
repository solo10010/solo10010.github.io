// Автовыбор языка до отрисовки. Работает только на русских страницах: если язык браузера
// не русский (и не казахский/украинский/белорусский), один раз переводим на английскую версию этой страницы.
// Ручной выбор в переключателе (localStorage site-lang) всегда важнее, роботов не трогаем.
(function () {
  try {
    if (localStorage.getItem('site-lang')) return;
    if (/bot|crawl|spider|slurp|preview|lighthouse|headless/i.test(navigator.userAgent)) return;
    if (document.documentElement.lang.slice(0, 2).toLowerCase() !== 'ru') return;
    var langs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || '']);
    var readsRussian = langs.some(function (l) { return /^(ru|kk|uk|be)\b/i.test(l); });
    if (readsRussian) return;
    var alt = document.querySelector('link[rel="alternate"][hreflang="en"]');
    if (alt) location.replace(alt.href + location.hash);
  } catch (e) {
    // localStorage недоступен — просто остаёмся на русской версии.
  }
})();
