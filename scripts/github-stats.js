// Собирает публичную статистику GitHub в data/github.json для блока на главной.
// Запускается в GitHub Actions перед сборкой (раз в сутки) и вручную: node scripts/github-stats.js
// Если GitHub недоступен, оставляет прошлый файл — сборка не падает.

const https = require('https');
const fs = require('fs');
const path = require('path');

const USER = 'solo10010';
const OUT = path.join(__dirname, '..', 'data', 'github.json');
// Служебные репозитории, которые не показываем в карточках.
const HIDDEN = ['solo10010', 'trash', 'upptime', 'solo10010.github.io'];
const LANG_COLORS = {
  Python: '#3572A5', Shell: '#89e051', PHP: '#4F5D95', JavaScript: '#f1e05a', TypeScript: '#3178c6',
  Go: '#00ADD8', HTML: '#e34c26', CSS: '#563d7c', Jinja: '#a52a22', JSON: '#292929', Dockerfile: '#384d54',
};

function get(url, accept) {
  const headers = { 'User-Agent': USER + '-site-stats', Accept: accept || 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN && url.startsWith('https://api.github.com')) {
    headers.Authorization = 'Bearer ' + process.env.GITHUB_TOKEN;
  }
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => (res.statusCode === 200 ? resolve(body) : reject(new Error(url + ' -> ' + res.statusCode))));
    }).on('error', reject);
  });
}

// Убираем :shortcode: и эмодзи из описаний — в карточках они выглядят шумно.
function cleanDescription(text) {
  return (text || '')
    .replace(/:[a-z0-9_+-]+:/g, '')
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchRepos() {
  const repos = [];
  for (let page = 1; page <= 5; page++) {
    const batch = JSON.parse(await get(`https://api.github.com/users/${USER}/repos?per_page=100&page=${page}`));
    repos.push(...batch);
    if (batch.length < 100) break;
  }
  return repos;
}

// Календарь вкладов берём из публичной страницы профиля: API для него требует токен владельца.
async function fetchContributions() {
  const html = await get(`https://github.com/users/${USER}/contributions`, 'text/html');
  const tooltips = {};
  for (const m of html.matchAll(/for="(contribution-day-component-[\d-]+)"[^>]*>([^<]*)/g)) {
    const n = m[2].match(/^(\d+)/);
    tooltips[m[1]] = n ? Number(n[1]) : 0;
  }
  const days = [];
  for (const m of html.matchAll(/data-date="(\d{4}-\d{2}-\d{2})" id="(contribution-day-component-[\d-]+)" data-level="(\d)"/g)) {
    days.push({ date: m[1], count: tooltips[m[2]] || 0, level: Number(m[3]) });
  }
  if (days.length < 300) throw new Error('contributions: unexpected page format');
  days.sort((a, b) => a.date.localeCompare(b.date));

  // Недели начинаются с воскресенья, как на GitHub.
  const weeks = [];
  let week = [];
  const firstDow = new Date(days[0].date + 'T00:00:00Z').getUTCDay();
  for (let i = 0; i < firstDow; i++) week.push(null);
  for (const d of days) {
    week.push(d);
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length) weeks.push(week);

  // Подписи месяцев над колонками: ставим там, где начинается новый месяц.
  const MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const months = [];
  let lastMonth = -1;
  weeks.forEach((w, i) => {
    const first = w.find(Boolean);
    const month = Number(first.date.slice(5, 7)) - 1;
    if (month !== lastMonth) {
      if (i < weeks.length - 2) months.push({ week: i, label: MONTHS[month] });
      lastMonth = month;
    }
  });
  // Неполный первый месяц не должен наезжать на подпись следующего.
  if (months.length > 1 && months[1].week - months[0].week < 3) months.shift();

  let longest = 0, run = 0, best = days[0];
  for (const d of days) {
    run = d.count > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
    if (d.count > best.count) best = d;
  }
  // Текущая серия: сегодняшний день ещё может быть пустым — его не считаем разрывом.
  let current = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) current++;
    else if (i !== days.length - 1) break;
  }

  return {
    total: days.reduce((s, d) => s + d.count, 0),
    activeDays: days.filter((d) => d.count > 0).length,
    longestStreak: longest,
    currentStreak: current,
    bestDay: { date: best.date, count: best.count },
    from: days[0].date,
    to: days[days.length - 1].date,
    months,
    weeks,
  };
}

async function main() {
  let previous = {};
  try { previous = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch (e) { /* первого файла ещё нет */ }

  const result = { ...previous };
  try {
    const user = JSON.parse(await get(`https://api.github.com/users/${USER}`));
    const own = (await fetchRepos()).filter((r) => !r.fork);

    const langCount = {};
    for (const r of own) if (r.language && r.language !== 'JSON') langCount[r.language] = (langCount[r.language] || 0) + 1;
    const langTotal = Object.values(langCount).reduce((s, n) => s + n, 0);

    Object.assign(result, {
      login: user.login,
      url: user.html_url,
      since: user.created_at.slice(0, 4),
      followers: user.followers,
      repos: own.length,
      stars: own.reduce((s, r) => s + r.stargazers_count, 0),
      forks: own.reduce((s, r) => s + r.forks_count, 0),
      languages: Object.entries(langCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name, count]) => ({ name, count, pct: Math.round((count / langTotal) * 1000) / 10, color: LANG_COLORS[name] || '#8b949e' })),
      top: own
        .filter((r) => !HIDDEN.includes(r.name))
        .sort((a, b) => b.stargazers_count - a.stargazers_count || b.pushed_at.localeCompare(a.pushed_at))
        .slice(0, 6)
        .map((r) => ({
          name: r.name,
          description: cleanDescription(r.description),
          url: r.html_url,
          stars: r.stargazers_count,
          forks: r.forks_count,
          language: r.language,
          color: LANG_COLORS[r.language] || '#8b949e',
        })),
    });
  } catch (e) {
    console.warn('github-stats: профиль не обновлён:', e.message);
  }

  try {
    result.contributions = await fetchContributions();
  } catch (e) {
    console.warn('github-stats: календарь не обновлён:', e.message);
  }

  result.updated = new Date().toISOString().slice(0, 10);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(result, null, 1) + '\n');
  console.log(`github-stats: ${result.repos} репозиториев, ${result.stars} звёзд, ${result.contributions ? result.contributions.total : '?'} вкладов за год`);
}

main();
