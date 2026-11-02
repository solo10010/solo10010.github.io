// Инструменты раздела /tools/. Всё считается в браузере; наружу уходит только DNS-запрос проверки почты.

const $ = (id) => document.getElementById(id);

/* ---------- Общие помощники ---------- */

function copyText(text, button) {
  const done = () => {
    if (!button) return;
    const old = button.textContent;
    button.textContent = 'Скопировано';
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
    val.title = 'Нажмите, чтобы скопировать';
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
  if (inNet('10.0.0.0', 8) || inNet('172.16.0.0', 12) || inNet('192.168.0.0', 16)) return 'частный (RFC 1918)';
  if (inNet('100.64.0.0', 10)) return 'CGNAT (RFC 6598)';
  if (inNet('127.0.0.0', 8)) return 'loopback';
  if (inNet('169.254.0.0', 16)) return 'link-local';
  if (inNet('224.0.0.0', 4)) return 'multicast';
  if (inNet('192.0.2.0', 24) || inNet('198.51.100.0', 24) || inNet('203.0.113.0', 24)) return 'для документации';
  if (inNet('0.0.0.0', 8) || inNet('240.0.0.0', 4)) return 'зарезервирован';
  return 'публичный';
}

function initSubnet() {
  const input = $('subnet-in');
  const out = $('subnet-out');
  const update = () => {
    const parts = input.value.trim().split(/[\s/]+/);
    const ip = parts[0];
    let prefix = parts[1] === undefined ? 32 : (isIp(parts[1]) ? maskToPrefix(parts[1]) : Number(parts[1]));
    if (!isIp(ip) || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
      renderMessage(out, 'Введите адрес IPv4 с префиксом (/0–/32) или маской.', 'bad');
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
      ['Сеть', `${intToIp(network)}/${prefix}`],
      ['Маска', intToIp(mask)],
      ['Wildcard', intToIp(~mask >>> 0)],
      ['Широковещательный', prefix >= 31 ? '—' : intToIp(broadcast)],
      ['Первый хост', intToIp(first)],
      ['Последний хост', intToIp(last)],
      ['Адресов для хостов', hosts.toLocaleString('ru-RU')],
      ['Всего адресов', total.toLocaleString('ru-RU')],
      ['Тип адреса', addressType(ip)],
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
      $('pw-out').textContent = 'Выберите хотя бы один набор символов';
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
    const level = bits < 50 ? ['слабый', 'bad'] : bits < 80 ? ['средний', 'warn'] : bits < 110 ? ['сильный', 'good'] : ['очень сильный', 'good'];
    $('pw-out').textContent = password;
    $('pw-meter').style.width = Math.min(bits / 128, 1) * 100 + '%';
    $('pw-meter').className = 'is-' + level[1];
    $('pw-entropy').textContent = `Энтропия ≈ ${bits} бит — ${level[0]}. Алфавит: ${alphabet.length} символов.`;
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
      renderMessage(out, 'Введите домен, например example.com', 'bad');
      return;
    }
    renderMessage(out, 'Запрашиваю записи…');
    try {
      const [mx, txt, dmarcTxt] = await Promise.all([dnsQuery(domain, 'MX'), dnsQuery(domain, 'TXT'), dnsQuery('_dmarc.' + domain, 'TXT')]);
      const rows = [];

      if (mx.length) {
        mx.map((r) => r.split(' ')).sort((a, b) => a[0] - b[0])
          .forEach(([pref, host]) => rows.push([`MX ${pref}`, host.replace(/\.$/, ''), 'good']));
      } else {
        rows.push(['MX', 'нет записей — домен не принимает почту', 'warn']);
      }

      const spf = txt.map(txtValue).filter((t) => /^v=spf1(\s|$)/i.test(t));
      if (!spf.length) {
        rows.push(['SPF', 'нет записи — любой сервер может слать письма от имени домена', 'bad']);
      } else if (spf.length > 1) {
        rows.push(['SPF', `${spf.length} записи — это ошибка, должна быть ровно одна`, 'bad']);
      } else {
        const record = spf[0];
        const all = (record.match(/([-~?+]?)all\b/i) || [])[1];
        const lookups = (record.match(/\b(include|a|mx|ptr|exists|redirect)\b[:=]?/gi) || []).length;
        rows.push(['SPF', record, all === '-' ? 'good' : all === '~' ? 'warn' : 'bad']);
        rows.push(['Политика SPF', all === '-' ? '-all: чужие письма отклоняются' : all === '~' ? '~all: чужие письма помечаются, но доходят' : all === undefined ? 'нет механизма all' : `${all || '+'}all: проверка фактически отключена`, all === '-' ? 'good' : all === '~' ? 'warn' : 'bad']);
        if (lookups > 10) rows.push(['DNS-запросов в SPF', `${lookups} — больше лимита 10, запись может не работать`, 'bad']);
      }

      const dmarc = dmarcTxt.map(txtValue).filter((t) => /^v=DMARC1/i.test(t));
      if (!dmarc.length) {
        rows.push(['DMARC', 'нет записи — подделку отправителя никто не отклонит', 'bad']);
      } else {
        const tags = Object.fromEntries(dmarc[0].split(';').map((p) => p.trim().split('=').map((s) => s.trim())).filter((p) => p[0]));
        const policy = (tags.p || '').toLowerCase();
        rows.push(['DMARC', dmarc[0], policy === 'reject' ? 'good' : policy === 'quarantine' ? 'good' : 'warn']);
        rows.push(['Политика DMARC', policy === 'reject' ? 'reject: поддельные письма отклоняются' : policy === 'quarantine' ? 'quarantine: поддельные письма уходят в спам' : 'none: только мониторинг, письма доставляются', policy === 'none' || !policy ? 'warn' : 'good']);
        rows.push(['Отчёты (rua)', tags.rua || 'не настроены — вы не узнаете о попытках подделки', tags.rua ? 'good' : 'warn']);
      }
      renderRows(out, rows);
    } catch (err) {
      renderMessage(out, 'Не удалось получить записи: ' + err.message, 'bad');
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
  return `${date.toLocaleString('ru-RU')} (${date.getTime() < Date.now() ? 'в прошлом' : 'в будущем'})`;
}

function decodeJwt(token) {
  const parts = token.trim().split('.');
  if (parts.length < 2) throw new Error('это не JWT: нужно минимум две части через точку');
  const header = JSON.parse(fromUtf8.decode(b64ToBytes(parts[0])));
  const payload = JSON.parse(fromUtf8.decode(b64ToBytes(parts[1])));
  const notes = [];
  for (const claim of ['iat', 'nbf', 'exp']) {
    if (typeof payload[claim] === 'number') notes.push(`${claim}: ${formatClaimTime(payload[claim])}`);
  }
  if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) notes.push('⚠ токен просрочен');
  if (String(header.alg).toLowerCase() === 'none') notes.push('⚠ alg: none — токен без подписи');
  return `// Header\n${JSON.stringify(header, null, 2)}\n\n// Payload\n${JSON.stringify(payload, null, 2)}` + (notes.length ? `\n\n// Время и проверки\n${notes.join('\n')}` : '');
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
      if (!/^([0-9a-f]{2})*$/i.test(hex)) throw new Error('строка не похожа на hex');
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
      out.textContent = 'Ошибка: ' + err.message;
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
    renderMessage(out, 'Браузер не поддерживает Web Crypto на этой странице.', 'bad');
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
    renderMessage(out, `Считаю хэши файла ${file.name}…`);
    const rows = await digestAll(await file.arrayBuffer());
    renderRows(out, [['Файл', `${file.name} · ${file.size.toLocaleString('ru-RU')} байт`], ...rows]);
  });
  fromText();
}

/* ---------- chmod ---------- */

function initChmod() {
  const boxes = document.querySelectorAll('#tool-chmod [data-bit]');
  const octal = $('chmod-octal');
  const notes = {
    '644': 'обычные файлы: владелец пишет, остальные читают',
    '600': 'приватные файлы: ключи SSH, конфиги с паролями',
    '640': 'конфиги, которые читает группа сервиса',
    '700': 'приватный каталог или скрипт владельца',
    '750': 'каталоги и скрипты для владельца и группы',
    '755': 'каталоги и исполняемые файлы',
    '777': 'полный доступ всем — почти всегда ошибка и риск',
    '666': 'запись всем — опасно для веб-каталогов',
  };
  const render = (mode, special) => {
    const sym = 'rwxrwxrwx'.split('').map((ch, i) => (mode & (256 >> i) ? ch : '-'));
    if (special & 4) sym[2] = sym[2] === 'x' ? 's' : 'S';
    if (special & 2) sym[5] = sym[5] === 'x' ? 's' : 'S';
    if (special & 1) sym[8] = sym[8] === 'x' ? 't' : 'T';
    const code = (special ? String(special) : '') + mode.toString(8).padStart(3, '0');
    $('chmod-sym').textContent = `-${sym.join('')}   chmod ${code} file`;
    const note = notes[mode.toString(8).padStart(3, '0')];
    const extra = special & 4 ? ' · SUID: файл исполняется с правами владельца — проверяйте такие файлы при аудите' : '';
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
  const units = [['год', 31536000], ['дн.', 86400], ['ч', 3600], ['мин', 60], ['с', 1]];
  for (const [name, sec] of units) {
    if (abs >= sec || sec === 1) {
      const n = Math.floor(abs / sec);
      return diff < 0 ? `${n} ${name} назад` : `через ${n} ${name}`;
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
      renderMessage(out, 'Введите Unix-время (секунды или миллисекунды) или дату, например 2026-11-03 14:30.', 'bad');
      return;
    }
    const d = new Date(ms);
    renderRows(out, [
      ['Локальное время', d.toLocaleString('ru-RU', { dateStyle: 'long', timeStyle: 'medium' })],
      ['UTC', d.toUTCString()],
      ['ISO 8601', d.toISOString()],
      ['Unix, секунды', Math.floor(ms / 1000)],
      ['Unix, миллисекунды', Math.floor(ms)],
      ['Относительно сейчас', relative(ms)],
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
