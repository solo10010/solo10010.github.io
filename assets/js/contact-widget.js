// Виджет обратной связи Re:plain (сообщения приходят в Telegram).
// Грузится не сразу, а после первого действия посетителя или через несколько секунд простоя,
// и перекрашивается под тему сайта: окно виджета — iframe того же источника, в него можно добавить стили.

const REPLAIN_ID = '958f1121-9a39-438a-91fd-8cab48dfef53';
const STYLE_ID = 'site-theme';

const WIDGET_CSS = `
  .app {
    --w-bg: #ffffff; --w-bg-2: #f1f5f9; --w-border: #e2e8f0; --w-text: #0f172a; --w-muted: #5b6b82;
    --w-accent: #0d9488; --w-on-accent: #ffffff;
    font-family: Inter, "Segoe UI", system-ui, -apple-system, Arial, sans-serif !important;
  }
  html.site-dark .app {
    --w-bg: #111a2e; --w-bg-2: #16213a; --w-border: #1f2b47; --w-text: #e2e8f0; --w-muted: #94a3b8;
    --w-accent: #14d3b4; --w-on-accent: #07101f;
  }
  html .accent-color-bg { background-color: var(--w-accent) !important; }
  html .accent-color-text { color: var(--w-accent) !important; }
  html .accent-color-fill { fill: var(--w-accent) !important; }
  html .accent-color-border, html .accent-color-border-b { border-color: var(--w-accent) !important; }

  .app .chat, .app .container.-header, .app .container.-footer { background: var(--w-bg) !important; color: var(--w-text) !important; }
  .app .container.-body { background: var(--w-bg) !important; }
  .app .container.-header { border-bottom: 1px solid var(--w-border) !important; box-shadow: none !important; }
  .app .container.-footer { border-top: 1px solid var(--w-border) !important; }
  .app .chat { border-left: 1px solid var(--w-border) !important; }
  .app .header .title { color: var(--w-text) !important; font-weight: 700 !important; }
  .app .header .description, .app .time, .app .powered-link { color: var(--w-muted) !important; }
  .app .header .logo .image { border-radius: 10px !important; }
  .app .button-link svg, .app .button-link svg * { fill: var(--w-muted) !important; }
  .app .button-link:hover svg, .app .button-link:hover svg * { fill: var(--w-accent) !important; }

  .app .message .content { background: var(--w-bg-2) !important; color: var(--w-text) !important; border-radius: 14px !important; box-shadow: none !important; }
  .app .message:not(.-operator) .content { background: var(--w-accent) !important; color: var(--w-on-accent) !important; }
  .app .message:not(.-operator) .content .time { color: var(--w-on-accent) !important; opacity: .7; }
  .app .message .corner { display: none !important; }
  .app .message .name { color: var(--w-accent) !important; }
  .app .message .text { line-height: 1.5 !important; }

  .app .composer .textarea { background: var(--w-bg-2) !important; color: var(--w-text) !important; border: 1px solid var(--w-border) !important; border-radius: 12px !important; padding: 10px 12px !important; }
  .app .composer .textarea:focus { border-color: var(--w-accent) !important; outline: none !important; }
  .app .composer .textarea::placeholder { color: var(--w-muted) !important; }
  .app .submit-button svg, .app .submit-button svg * { fill: var(--w-accent) !important; }

  /* Подсказка: кнопка дважды покачивается, от неё расходится кольцо */
  @keyframes site-nudge { 0%, 100% { transform: rotate(0); } 15% { transform: rotate(-12deg) scale(1.06); } 30% { transform: rotate(10deg) scale(1.06); } 45% { transform: rotate(-6deg); } 60% { transform: rotate(0); } }
  @keyframes site-ring { 0% { box-shadow: 0 0 0 0 rgba(20, 211, 180, .55); } 100% { box-shadow: 0 0 0 18px rgba(20, 211, 180, 0); } }
  html.site-nudge .app:not(.-open) .btn .btn-img { animation: site-nudge 1.1s ease-in-out 2, site-ring 1.1s ease-out 2; }
  @media (prefers-reduced-motion: reduce) { html.site-nudge .app .btn .btn-img { animation: none !important; } }

  /* Кнопка запуска: скруглённый квадрат в цвет акцента, как фавикон сайта */
  .app .btn { border-radius: 18px !important; box-shadow: 0 10px 30px rgba(0, 0, 0, .35) !important; }
  .app .btn .btn-img { border-radius: 18px !important; background: var(--w-accent) !important; }
  .app .btn .btn-img svg *[fill]:not([fill="none"]) { fill: var(--w-on-accent) !important; }
  .app .unreaded-count { background: var(--w-text) !important; color: var(--w-bg) !important; }
  .app .unreaded-count .corner { display: none !important; }
`;

const TEXTS = {
  title: 'Антон Соломатин',
  description: 'ответ придёт сюда же, обычно в течение дня',
  placeholder: 'Напишите сообщение…',
};

function isDark() {
  return document.documentElement.hasAttribute('data-dark-mode');
}

function themeWidget(doc) {
  const app = doc.querySelector('.app');
  if (!app) return false;

  if (!doc.getElementById(STYLE_ID)) {
    const style = doc.createElement('style');
    style.id = STYLE_ID;
    style.textContent = WIDGET_CSS;
    doc.head.appendChild(style);
  }
  doc.documentElement.classList.toggle('site-dark', isDark());

  // Тексты рисует Vue внутри виджета, поэтому проставляем их при каждом изменении.
  const set = (selector, apply) => doc.querySelectorAll(selector).forEach(apply);
  set('.header .title', (el) => { if (el.textContent !== TEXTS.title) el.textContent = TEXTS.title; });
  set('.header .description', (el) => { if (el.textContent !== TEXTS.description) el.textContent = TEXTS.description; });
  set('.composer .textarea', (el) => { if (el.placeholder !== TEXTS.placeholder) el.placeholder = TEXTS.placeholder; });
  set('.header .logo .image', (el) => {
    const icon = new URL('/favicon.svg', location.origin).href;
    if (el.src !== icon) el.src = icon;
  });
  return true;
}

function watchWidget() {
  let observed = null;
  const tryTheme = () => {
    const frame = document.getElementById('__replain_widget_iframe');
    let doc = null;
    try { doc = frame && frame.contentDocument; } catch (e) { return; }
    if (!doc || !themeWidget(doc)) return;
    if (observed !== doc) {
      observed = doc;
      let busy = false;
      new MutationObserver(() => {
        if (busy) return;
        busy = true;
        requestAnimationFrame(() => { themeWidget(doc); busy = false; });
      }).observe(doc.body, { childList: true, subtree: true, characterData: true });
    }
  };
  // Виджет создаёт iframe асинхронно и наполняет его не сразу — проверяем, пока окно не появится.
  let attempts = 0;
  const poll = setInterval(() => {
    tryTheme();
    if (observed || ++attempts > 120) clearInterval(poll);
  }, 250);
  // Тема сайта переключается атрибутом на <html>.
  new MutationObserver(tryTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-dark-mode'] });
}

function loadWidget() {
  if (window.replainSettings) return;
  window.replainSettings = { id: REPLAIN_ID };
  watchWidget();
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://widget.replain.cc/dist/client.js';
  document.body.appendChild(script);
}

/* ---------- Ненавязчивая подсказка ---------- */
// Один раз за визит: когда посетитель пролистал около трети страницы или пробыл на сайте 25 секунд.

const NUDGE_KEY = 'contact-nudge-shown';

function widgetDoc() {
  try {
    const frame = document.getElementById('__replain_widget_iframe');
    return frame && frame.contentDocument && frame.contentDocument.querySelector('.app') ? frame.contentDocument : null;
  } catch (e) {
    return null;
  }
}

function openWidget() {
  const doc = widgetDoc();
  const target = doc && (doc.querySelector('.btn-img') || doc.querySelector('.btn'));
  if (!target) return;
  // Виджет слушает полную последовательность событий мыши, одного click недостаточно.
  for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']) {
    target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: doc.defaultView }));
  }
}

function showNudge() {
  const doc = widgetDoc();
  if (!doc || doc.querySelector('.app.-open')) return;
  try { sessionStorage.setItem(NUDGE_KEY, '1'); } catch (e) { /* без sessionStorage покажем ещё раз — не страшно */ }

  doc.documentElement.classList.add('site-nudge');
  setTimeout(() => doc.documentElement.classList.remove('site-nudge'), 2600);

  const bubble = document.createElement('div');
  bubble.className = 'contact-nudge';
  bubble.setAttribute('role', 'status');
  bubble.innerHTML = '<button type="button" class="contact-nudge-text">'
    + '<strong>Есть вопрос или предложение?</strong>'
    + '<span>Напишите прямо здесь — сообщение придёт мне в Telegram.</span></button>'
    + '<button type="button" class="contact-nudge-close" aria-label="Скрыть подсказку">×</button>';
  document.body.appendChild(bubble);
  requestAnimationFrame(() => bubble.classList.add('is-visible'));

  const hide = () => {
    bubble.classList.remove('is-visible');
    setTimeout(() => bubble.remove(), 300);
  };
  bubble.querySelector('.contact-nudge-text').addEventListener('click', () => { hide(); openWidget(); });
  bubble.querySelector('.contact-nudge-close').addEventListener('click', hide);
  setTimeout(hide, 9000);
}

function scheduleNudge() {
  try { if (sessionStorage.getItem(NUDGE_KEY)) return; } catch (e) { /* продолжаем */ }
  let fired = false;
  const fire = () => {
    if (fired) return;
    fired = true;
    window.removeEventListener('scroll', onScroll);
    clearTimeout(timer);
    // Ждём, пока виджет догрузится, если посетитель листает быстро.
    let tries = 0;
    const wait = setInterval(() => {
      if (widgetDoc() || ++tries > 40) { clearInterval(wait); showNudge(); }
    }, 250);
  };
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    if (max > 0 && scrollY / max > 0.3) fire();
  };
  const timer = setTimeout(fire, 25000);
  window.addEventListener('scroll', onScroll, { passive: true });
}

scheduleNudge();

const events = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
const start = () => {
  events.forEach((e) => window.removeEventListener(e, start));
  loadWidget();
};
events.forEach((e) => window.addEventListener(e, start, { once: true, passive: true }));
setTimeout(start, 4000);
