// Выполняется в <head> до отрисовки, чтобы не было вспышки светлой темы.
// По умолчанию тема тёмная; светлая — только если посетитель сам её выбрал.
let savedTheme = null;

try {
  savedTheme = localStorage.getItem('theme');
} catch (e) {
  // localStorage недоступен (приватный режим, запрет cookies) — остаёмся на тёмной.
}

if (savedTheme !== 'light') {
  document.documentElement.setAttribute('data-dark-mode', '');
}
