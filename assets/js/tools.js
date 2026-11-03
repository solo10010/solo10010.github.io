// Инструменты раздела /tools/. Всё считается в браузере; наружу уходит только DNS-запрос проверки почты.

const $ = (id) => document.getElementById(id);

// Язык страницы: тексты результатов на русском или английском.
const EN = document.documentElement.lang.toLowerCase().startsWith('en');
const LOCALE = EN ? 'en-US' : 'ru-RU';
const t = (ru, en) => (EN ? en : ru);

/* ---------- Общие помощники ---------- */

function copyText(text, button) {
  const done = () => {
    if (!button) return;
    const old = button.textContent;
    button.textContent = t('Скопировано', 'Copied');
    button.classList.add('is-done');
    setTimeout(() => { button.textContent = old; button.classList.remove('is-done'); }, 1500);
  };
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(done);
    return;
  }
  const area = document.createElement('textarea');
  area.value = text;
  document.body.appendChild(area);
  area.select();
  document.execCommand('copy');
  area.remove();
  done();
}

// Таблица «название — значение»; значение копируется по клику.
function renderRows(container, rows) {
  container.textContent = '';
  for (const [label, value, state] of rows) {
    const row = document.createElement('div');
    row.className = 'tool-kv' + (state ? ' is-' + state : '');
    const key = document.createElement('span');
    key.className = 'tool-k';
    key.textContent = label;
    const val = document.createElement('button');
    val.type = 'button';
    val.className = 'tool-v mono';
    val.title = t('Нажмите, чтобы скопировать', 'Click to copy');
    val.textContent = value;
    val.addEventListener('click', () => copyText(String(value), null));
    row.append(key, val);
    container.appendChild(row);
  }
}

function renderMessage(container, text, state) {
  container.textContent = '';
  const p = document.createElement('p');
  p.className = 'tool-msg' + (state ? ' is-' + state : '');
  p.textContent = text;
  container.appendChild(p);
}

function randomInt(max) {
  // Без смещения: отбрасываем значения из «хвоста» диапазона.
  const limit = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  do { crypto.getRandomValues(buf); } while (buf[0] >= limit);
  return buf[0] % max;
}

/* ---------- Вкладки ---------- */

function initTabs() {
  const tabs = document.querySelectorAll('.tool-tab');
  const panels = document.querySelectorAll('.tool');
  const show = (name) => {
    if (!document.querySelector(`.tool[data-tool="${name}"]`)) name = 'subnet';
    tabs.forEach((t) => t.classList.toggle('is-active', t.dataset.tool === name));
    panels.forEach((p) => { p.hidden = p.dataset.tool !== name; });
  };
  tabs.forEach((tab) => tab.addEventListener('click', (e) => {
    e.preventDefault();
    history.replaceState(null, '', '#' + tab.dataset.tool);
    show(tab.dataset.tool);
  }));
  show(location.hash.slice(1));
}

/* ---------- Подсети ---------- */

const ipToInt = (ip) => ip.split('.').reduce((n, o) => (n * 256) + Number(o), 0) >>> 0;
const intToIp = (n) => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
const isIp = (s) => /^(\d{1,3})(\.\d{1,3}){3}$/.test(s) && s.split('.').every((o) => Number(o) <= 255);

function maskToPrefix(mask) {
  const n = ipToInt(mask);
  const prefix = n.toString(2).replace(/0+$/, '').length;
  const rebuilt = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return rebuilt === n ? prefix : -1;
}

function addressType(ip) {
  const n = ipToInt(ip);
  const inNet = (net, bits) => (n >>> (32 - bits)) === (ipToInt(net) >>> (32 - bits));
  if (inNet('10.0.0.0', 8) || inNet('172.16.0.0', 12) || inNet('192.168.0.0', 16)) return t('частный (RFC 1918)', 'private (RFC 1918)');
  if (inNet('100.64.0.0', 10)) return 'CGNAT (RFC 6598)';
  if (inNet('127.0.0.0', 8)) return 'loopback';
  if (inNet('169.254.0.0', 16)) return 'link-local';
  if (inNet('224.0.0.0', 4)) return 'multicast';
  if (inNet('192.0.2.0', 24) || inNet('198.51.100.0', 24) || inNet('203.0.113.0', 24)) return t('для документации', 'documentation range');
  if (inNet('0.0.0.0', 8) || inNet('240.0.0.0', 4)) return t('зарезервирован', 'reserved');
  return t('публичный', 'public');
}

function initSubnet() {
  const input = $('subnet-in');
  const out = $('subnet-out');
  const update = () => {
    const parts = input.value.trim().split(/[\s/]+/);
    const ip = parts[0];
    let prefix = parts[1] === undefined ? 32 : (isIp(parts[1]) ? maskToPrefix(parts[1]) : Number(parts[1]));
    if (!isIp(ip) || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
      renderMessage(out, t('Введите адрес IPv4 с префиксом (/0–/32) или маской.', 'Enter an IPv4 address with a prefix (/0–/32) or a mask.'), 'bad');
      return;
    }
    const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
    const network = (ipToInt(ip) & mask) >>> 0;
    const broadcast = (network | (~mask >>> 0)) >>> 0;
    const total = 2 ** (32 - prefix);
    let first = network + 1, last = broadcast - 1, hosts = total - 2;
    if (prefix === 31) { first = network; last = broadcast; hosts = 2; }
    if (prefix === 32) { first = network; last = network; hosts = 1; }
    renderRows(out, [
      [t('Сеть', 'Network'), `${intToIp(network)}/${prefix}`],
      [t('Маска', 'Mask'), intToIp(mask)],
      ['Wildcard', intToIp(~mask >>> 0)],
      [t('Широковещательный', 'Broadcast'), prefix >= 31 ? '—' : intToIp(broadcast)],
      [t('Первый хост', 'First host'), intToIp(first)],
      [t('Последний хост', 'Last host'), intToIp(last)],
      [t('Адресов для хостов', 'Usable hosts'), hosts.toLocaleString(LOCALE)],
      [t('Всего адресов', 'Total addresses'), total.toLocaleString(LOCALE)],
      [t('Тип адреса', 'Address type'), addressType(ip)],
    ]);
  };
  input.addEventListener('input', update);
  update();
}

/* ---------- Пароли ---------- */

function initPassword() {
  const sets = {
    lower: 'abcdefghijklmnopqrstuvwxyz',
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    digits: '0123456789',
    symbols: '!@#$%^&*()-_=+[]{};:,.?/~',
  };
  const ambiguous = /[Il1O0o|`'"]/g;
  const len = $('pw-len');
  const generate = () => {
    $('pw-len-val').textContent = len.value;
    const chosen = Object.keys(sets)
      .filter((k) => $('pw-' + k).checked)
      .map((k) => ($('pw-ambiguous').checked ? sets[k].replace(ambiguous, '') : sets[k]));
    if (!chosen.length) {
      $('pw-out').textContent = t('Выберите хотя бы один набор символов', 'Pick at least one character set');
      $('pw-entropy').textContent = '';
      $('pw-meter').style.width = '0';
      return;
    }
    const alphabet = chosen.join('');
    const length = Number(len.value);
    let password;
    // Повторяем, пока в пароле не окажется хотя бы по одному символу каждого набора.
    do {
      password = Array.from({ length }, () => alphabet[randomInt(alphabet.length)]).join('');
    } while (!chosen.every((set) => [...password].some((c) => set.includes(c))));
    const bits = Math.round(length * Math.log2(alphabet.length));
    const level = bits < 50 ? [t('слабый', 'weak'), 'bad'] : bits < 80 ? [t('средний', 'fair'), 'warn'] : bits < 110 ? [t('сильный', 'strong'), 'good'] : [t('очень сильный', 'very strong'), 'good'];
    $('pw-out').textContent = password;
    $('pw-meter').style.width = Math.min(bits / 128, 1) * 100 + '%';
    $('pw-meter').className = 'is-' + level[1];
    $('pw-entropy').textContent = t(`Энтропия ≈ ${bits} бит — ${level[0]}. Алфавит: ${alphabet.length} символов.`, `Entropy ≈ ${bits} bits — ${level[0]}. Alphabet: ${alphabet.length} characters.`);
  };
  document.querySelectorAll('#tool-password input').forEach((el) => el.addEventListener('input', generate));
  $('pw-gen').addEventListener('click', generate);
  generate();
}

/* ---------- Почта домена ---------- */

async function dnsQuery(name, type) {
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`;
  const res = await fetch(url, { headers: { accept: 'application/dns-json' } });
  if (!res.ok) throw new Error('DNS ' + res.status);
  const json = await res.json();
  return (json.Answer || []).filter((a) => a.type === { MX: 15, TXT: 16 }[type]).map((a) => a.data);
}

// TXT может прийти кусками в кавычках: "v=spf1 ..." "...". Склеиваем.
const txtValue = (data) => data.replace(/^"|"$/g, '').replace(/"\s*"/g, '');

function initMail() {
  const out = $('mail-out');
  $('mail-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const domain = $('mail-in').value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^.*@/, '');
    if (!/^([a-z0-9-]+\.)+[a-z0-9-]{2,}$/.test(domain)) {
      renderMessage(out, t('Введите домен, например example.com', 'Enter a domain, e.g. example.com'), 'bad');
      return;
    }
    renderMessage(out, t('Запрашиваю записи…', 'Fetching records…'));
    try {
      const [mx, txt, dmarcTxt] = await Promise.all([dnsQuery(domain, 'MX'), dnsQuery(domain, 'TXT'), dnsQuery('_dmarc.' + domain, 'TXT')]);
      const rows = [];

      if (mx.length) {
        mx.map((r) => r.split(' ')).sort((a, b) => a[0] - b[0])
          .forEach(([pref, host]) => rows.push([`MX ${pref}`, host.replace(/\.$/, ''), 'good']));
      } else {
        rows.push(['MX', t('нет записей — домен не принимает почту', 'no records — the domain does not accept mail'), 'warn']);
      }

      const spf = txt.map(txtValue).filter((t) => /^v=spf1(\s|$)/i.test(t));
      if (!spf.length) {
        rows.push(['SPF', t('нет записи — любой сервер может слать письма от имени домена', 'no record — any server can send mail as this domain'), 'bad']);
      } else if (spf.length > 1) {
        rows.push(['SPF', t(`${spf.length} записи — это ошибка, должна быть ровно одна`, `${spf.length} records — that is an error, there must be exactly one`), 'bad']);
      } else {
        const record = spf[0];
        const all = (record.match(/([-~?+]?)all\b/i) || [])[1];
        const lookups = (record.match(/\b(include|a|mx|ptr|exists|redirect)\b[:=]?/gi) || []).length;
        rows.push(['SPF', record, all === '-' ? 'good' : all === '~' ? 'warn' : 'bad']);
        rows.push([t('Политика SPF', 'SPF policy'), all === '-' ? t('-all: чужие письма отклоняются', '-all: unauthorized mail is rejected') : all === '~' ? t('~all: чужие письма помечаются, но доходят', '~all: unauthorized mail is marked but delivered') : all === undefined ? t('нет механизма all', 'no all mechanism') : t(`${all || '+'}all: проверка фактически отключена`, `${all || '+'}all: the check is effectively disabled`), all === '-' ? 'good' : all === '~' ? 'warn' : 'bad']);
        if (lookups > 10) rows.push([t('DNS-запросов в SPF', 'DNS lookups in SPF'), t(`${lookups} — больше лимита 10, запись может не работать`, `${lookups} — over the limit of 10, the record may fail`), 'bad']);
      }

      const dmarc = dmarcTxt.map(txtValue).filter((t) => /^v=DMARC1/i.test(t));
      if (!dmarc.length) {
        rows.push(['DMARC', t('нет записи — подделку отправителя никто не отклонит', 'no record — nobody will reject a spoofed sender'), 'bad']);
      } else {
        const tags = Object.fromEntries(dmarc[0].split(';').map((p) => p.trim().split('=').map((s) => s.trim())).filter((p) => p[0]));
        const policy = (tags.p || '').toLowerCase();
        rows.push(['DMARC', dmarc[0], policy === 'reject' ? 'good' : policy === 'quarantine' ? 'good' : 'warn']);
        rows.push([t('Политика DMARC', 'DMARC policy'), policy === 'reject' ? t('reject: поддельные письма отклоняются', 'reject: spoofed mail is rejected') : policy === 'quarantine' ? t('quarantine: поддельные письма уходят в спам', 'quarantine: spoofed mail goes to spam') : t('none: только мониторинг, письма доставляются', 'none: monitoring only, mail is delivered'), policy === 'none' || !policy ? 'warn' : 'good']);
        rows.push([t('Отчёты (rua)', 'Reports (rua)'), tags.rua || t('не настроены — вы не узнаете о попытках подделки', 'not set — you will not learn about spoofing attempts'), tags.rua ? 'good' : 'warn']);
      }
      renderRows(out, rows);
    } catch (err) {
      renderMessage(out, t('Не удалось получить записи: ', 'Could not fetch records: ') + err.message, 'bad');
    }
  });
}

/* ---------- Кодировщик ---------- */

const utf8 = new TextEncoder();
const fromUtf8 = new TextDecoder();

function bytesToB64(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function b64ToBytes(text) {
  let s = text.trim().replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function decodeHtml(text) {
  // textarea не исполняет разметку — безопасный способ раскодировать сущности.
  const area = document.createElement('textarea');
  area.innerHTML = text;
  return area.value;
}

function formatClaimTime(value) {
  const date = new Date(value * 1000);
  return `${date.toLocaleString(LOCALE)} (${date.getTime() < Date.now() ? t('в прошлом', 'in the past') : t('в будущем', 'in the future')})`;
}

function decodeJwt(token) {
  const parts = token.trim().split('.');
  if (parts.length < 2) throw new Error(t('это не JWT: нужно минимум две части через точку', 'not a JWT: at least two dot-separated parts are required'));
  const header = JSON.parse(fromUtf8.decode(b64ToBytes(parts[0])));
  const payload = JSON.parse(fromUtf8.decode(b64ToBytes(parts[1])));
  const notes = [];
  for (const claim of ['iat', 'nbf', 'exp']) {
    if (typeof payload[claim] === 'number') notes.push(`${claim}: ${formatClaimTime(payload[claim])}`);
  }
  if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) notes.push(t('⚠ токен просрочен', '⚠ token expired'));
  if (String(header.alg).toLowerCase() === 'none') notes.push(t('⚠ alg: none — токен без подписи', '⚠ alg: none — unsigned token'));
  return `// Header\n${JSON.stringify(header, null, 2)}\n\n// Payload\n${JSON.stringify(payload, null, 2)}` + (notes.length ? `\n\n// ${t('Время и проверки', 'Times and checks')}\n${notes.join('\n')}` : '');
}

function initEncode() {
  const input = $('enc-in');
  const out = $('enc-out');
  const ops = {
    b64e: (s) => bytesToB64(utf8.encode(s)),
    b64d: (s) => fromUtf8.decode(b64ToBytes(s)),
    urle: (s) => encodeURIComponent(s),
    urld: (s) => decodeURIComponent(s.replace(/\+/g, ' ')),
    htmle: (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'),
    htmld: decodeHtml,
    hexe: (s) => Array.from(utf8.encode(s), (b) => b.toString(16).padStart(2, '0')).join(''),
    hexd: (s) => {
      const hex = s.replace(/0x|\\x|[\s:,-]/gi, '');
      if (!/^([0-9a-f]{2})*$/i.test(hex)) throw new Error(t('строка не похожа на hex', 'the string does not look like hex'));
      return fromUtf8.decode(Uint8Array.from(hex.match(/../g) || [], (h) => parseInt(h, 16)));
    },
    jwt: decodeJwt,
  };
  document.querySelectorAll('[data-enc]').forEach((btn) => btn.addEventListener('click', () => {
    out.classList.remove('is-bad');
    try {
      out.textContent = ops[btn.dataset.enc](input.value);
    } catch (err) {
      out.classList.add('is-bad');
      out.textContent = t('Ошибка: ', 'Error: ') + err.message;
    }
  }));
}

/* ---------- Хэши ---------- */

async function digestAll(buffer) {
  const algs = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];
  const results = await Promise.all(algs.map((a) => crypto.subtle.digest(a, buffer)));
  return algs.map((a, i) => [a, Array.from(new Uint8Array(results[i]), (b) => b.toString(16).padStart(2, '0')).join('')]);
}

function initHash() {
  const out = $('hash-out');
  if (!window.crypto || !crypto.subtle) {
    renderMessage(out, t('Браузер не поддерживает Web Crypto на этой странице.', 'This browser does not support Web Crypto on this page.'), 'bad');
    return;
  }
  let timer;
  const fromText = () => {
    clearTimeout(timer);
    timer = setTimeout(async () => renderRows(out, await digestAll(utf8.encode($('hash-in').value))), 150);
  };
  $('hash-in').addEventListener('input', () => { $('hash-file').value = ''; fromText(); });
  $('hash-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    renderMessage(out, t(`Считаю хэши файла ${file.name}…`, `Hashing ${file.name}…`));
    const rows = await digestAll(await file.arrayBuffer());
    renderRows(out, [[t('Файл', 'File'), `${file.name} · ${file.size.toLocaleString(LOCALE)} ${t('байт', 'bytes')}`], ...rows]);
  });
  fromText();
}

/* ---------- chmod ---------- */

function initChmod() {
  const boxes = document.querySelectorAll('#tool-chmod [data-bit]');
  const octal = $('chmod-octal');
  const notes = {
    '644': t('обычные файлы: владелец пишет, остальные читают', 'regular files: owner writes, everyone reads'),
    '600': t('приватные файлы: ключи SSH, конфиги с паролями', 'private files: SSH keys, configs with passwords'),
    '640': t('конфиги, которые читает группа сервиса', 'configs readable by the service group'),
    '700': t('приватный каталог или скрипт владельца', 'private directory or owner-only script'),
    '750': t('каталоги и скрипты для владельца и группы', 'directories and scripts for owner and group'),
    '755': t('каталоги и исполняемые файлы', 'directories and executables'),
    '777': t('полный доступ всем — почти всегда ошибка и риск', 'full access for everyone — almost always a mistake and a risk'),
    '666': t('запись всем — опасно для веб-каталогов', 'world-writable — dangerous for web directories'),
  };
  const render = (mode, special) => {
    const sym = 'rwxrwxrwx'.split('').map((ch, i) => (mode & (256 >> i) ? ch : '-'));
    if (special & 4) sym[2] = sym[2] === 'x' ? 's' : 'S';
    if (special & 2) sym[5] = sym[5] === 'x' ? 's' : 'S';
    if (special & 1) sym[8] = sym[8] === 'x' ? 't' : 'T';
    const code = (special ? String(special) : '') + mode.toString(8).padStart(3, '0');
    $('chmod-sym').textContent = `-${sym.join('')}   chmod ${code} file`;
    const note = notes[mode.toString(8).padStart(3, '0')];
    const extra = special & 4 ? t(' · SUID: файл исполняется с правами владельца — проверяйте такие файлы при аудите', ' · SUID: the file runs with its owner’s privileges — review such files during audits') : '';
    $('chmod-note').textContent = (note || '') + extra;
  };
  const fromBoxes = () => {
    const mode = Array.from(boxes).reduce((m, b) => m | (b.checked ? Number(b.dataset.bit) : 0), 0);
    const special = octal.value.length === 4 ? Number(octal.value[0]) : 0;
    octal.value = (special ? String(special) : '') + mode.toString(8).padStart(3, '0');
    render(mode, special);
  };
  const fromOctal = () => {
    const v = octal.value.trim();
    if (!/^[0-7]{3,4}$/.test(v)) return;
    const mode = parseInt(v.slice(-3), 8);
    boxes.forEach((b) => { b.checked = Boolean(mode & Number(b.dataset.bit)); });
    render(mode, v.length === 4 ? Number(v[0]) : 0);
  };
  boxes.forEach((b) => b.addEventListener('change', fromBoxes));
  octal.addEventListener('input', fromOctal);
  fromOctal();
}

/* ---------- Unix-время ---------- */

function relative(ms) {
  const diff = Math.round((ms - Date.now()) / 1000);
  const abs = Math.abs(diff);
  const units = [[t('год', 'yr'), 31536000], [t('дн.', 'd'), 86400], [t('ч', 'h'), 3600], [t('мин', 'min'), 60], [t('с', 's'), 1]];
  for (const [name, sec] of units) {
    if (abs >= sec || sec === 1) {
      const n = Math.floor(abs / sec);
      return diff < 0 ? t(`${n} ${name} назад`, `${n} ${name} ago`) : t(`через ${n} ${name}`, `in ${n} ${name}`);
    }
  }
  return '';
}

function initTime() {
  const input = $('time-in');
  const out = $('time-out');
  const tick = () => { $('time-now').textContent = Math.floor(Date.now() / 1000); };
  tick();
  setInterval(tick, 1000);
  input.value = Math.floor(Date.now() / 1000);
  const update = () => {
    const v = input.value.trim();
    let ms;
    if (/^-?\d+(\.\d+)?$/.test(v)) ms = Number(v) * (v.replace('-', '').split('.')[0].length > 11 ? 1 : 1000);
    else ms = Date.parse(v);
    if (!Number.isFinite(ms)) {
      renderMessage(out, t('Введите Unix-время (секунды или миллисекунды) или дату, например 2026-11-03 14:30.', 'Enter Unix time (seconds or milliseconds) or a date, e.g. 2026-11-03 14:30.'), 'bad');
      return;
    }
    const d = new Date(ms);
    renderRows(out, [
      [t('Локальное время', 'Local time'), d.toLocaleString(LOCALE, { dateStyle: 'long', timeStyle: 'medium' })],
      ['UTC', d.toUTCString()],
      ['ISO 8601', d.toISOString()],
      [t('Unix, секунды', 'Unix, seconds'), Math.floor(ms / 1000)],
      [t('Unix, миллисекунды', 'Unix, milliseconds'), Math.floor(ms)],
      [t('Относительно сейчас', 'Relative to now'), relative(ms)],
    ]);
  };
  input.addEventListener('input', update);
  update();
}

/* ---------- Запуск ---------- */

function initCopyButtons() {
  document.querySelectorAll('[data-copy]').forEach((btn) => btn.addEventListener('click', () => copyText($(btn.dataset.copy).textContent, btn)));
  document.querySelectorAll('[data-copy-text]').forEach((btn) => btn.addEventListener('click', () => copyText(btn.dataset.copyText, btn)));
}

initTabs();
initCopyButtons();
for (const init of [initSubnet, initPassword, initMail, initEncode, initHash, initChmod, initTime]) {
  try { init(); } catch (err) { console.error(err); }
}
