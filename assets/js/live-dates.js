// Пересчитывает возраст и стаж на сегодняшний день (значения при сборке могут устареть,
// если сайт давно не пересобирали) и прячет пасхалку на случай, если автору больше 100 лет.

function monthsSince(iso, now = new Date()) {
  const [y, m, d] = iso.split('-').map(Number);
  let months = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m);
  if (now.getDate() < d) months -= 1;
  return months;
}

function plural(n, one, few, many) {
  const n10 = n % 10, n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return one;
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return few;
  return many;
}

function format(months, mode) {
  if (mode === 'duration') {
    const y = Math.floor(months / 12), m = months % 12;
    return [y > 0 ? `${y} г.` : '', m > 0 || y === 0 ? `${m} мес.` : ''].filter(Boolean).join(' ');
  }
  const n = mode === 'years' ? Math.floor((months + 6) / 12) : Math.floor(months / 12);
  return `${n} ${plural(n, 'год', 'года', 'лет')}`;
}

document.querySelectorAll('[data-since]').forEach((el) => {
  el.textContent = format(monthsSince(el.dataset.since), el.dataset.mode);
});
document.querySelectorAll('[data-year]').forEach((el) => {
  el.textContent = new Date().getFullYear();
});

/* ---------- Пасхалка ---------- */
// Если по расчётам автору 100+ лет, сайт, скорее всего, пережил своего создателя.
// Посмотреть заранее: добавьте к адресу #rip.

const birth = document.body.dataset.birth;
const age = birth ? Math.floor(monthsSince(birth) / 12) : 0;
const preview = location.hash === '#rip';

function showRip(years) {
  try {
    if (!preview && sessionStorage.getItem('rip-shown')) return;
    sessionStorage.setItem('rip-shown', '1');
  } catch (e) { /* без sessionStorage просто покажем */ }

  const badge = document.querySelector('.status-badge');
  if (badge) {
    badge.classList.add('is-offline');
    badge.textContent = 'Больше не открыт к предложениям';
  }

  let respects = 0;
  try { respects = Number(localStorage.getItem('rip-respects')) || 0; } catch (e) { /* не важно */ }

  const overlay = document.createElement('div');
  overlay.className = 'rip-overlay';
  overlay.innerHTML = `
    <div class="rip-modal" role="dialog" aria-modal="true" aria-labelledby="rip-title">
      <div class="rip-bar"><span></span><span></span><span></span><code>root@hom: ~</code></div>
      <pre class="rip-term"><span class="rip-prompt">$</span> systemctl status anton.service
<span class="rip-dot">●</span> anton.service — Антон Соломатин, специалист по ИБ
     Loaded: loaded (/earth/kazakhstan/karaganda; enabled)
     Active: <span class="rip-dead">inactive (dead)</span>
     Uptime: ${years} ${plural(years, 'год', 'года', 'лет')} — подозрительно долго для человека</pre>
      <h2 id="rip-title">Похоже, автор сайта больше не на связи</h2>
      <p>По расчётам скрипта, Антону сейчас <strong>${years} ${plural(years, 'год', 'года', 'лет')}</strong>. Либо он нашёл уязвимость в старении и закрыл её под NDA, либо сайт пережил своего создателя.</p>
      <p>Wazuh всё ещё собирает алерты, статьи всё ещё учат закрывать порты, а виджет обратной связи шлёт сообщения в Telegram, который никто не читает.</p>
      <div class="rip-actions">
        <button type="button" class="btn-accent rip-f">Нажмите F, чтобы отдать дань уважения</button>
        <button type="button" class="btn-ghost rip-close">Закрыть</button>
      </div>
      <p class="rip-count" aria-live="polite"></p>
    </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('is-visible'));

  const count = overlay.querySelector('.rip-count');
  const payRespects = () => {
    respects += 1;
    try { localStorage.setItem('rip-respects', respects); } catch (e) { /* не важно */ }
    count.textContent = `F ×${respects}. Уважение засчитано.`;
  };
  const close = () => {
    overlay.classList.remove('is-visible');
    document.removeEventListener('keydown', onKey);
    setTimeout(() => overlay.remove(), 300);
  };
  const onKey = (e) => {
    if (e.key === 'Escape') close();
    if (e.key === 'f' || e.key === 'F' || e.key === 'а' || e.key === 'А') payRespects();
  };
  overlay.querySelector('.rip-f').addEventListener('click', payRespects);
  overlay.querySelector('.rip-close').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', onKey);
  overlay.querySelector('.rip-f').focus();
}

if (age >= 100 || preview) {
  setTimeout(() => showRip(preview && age < 100 ? 101 : age), 1200);
}
