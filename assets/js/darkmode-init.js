// Выполняется в <head> до отрисовки, чтобы не было вспышки светлой темы.
// По умолчанию тема тёмная; светлая — только если посетитель сам её выбрал.
// Ключ site-theme: старый ключ theme прежний скрипт заполнял сам по теме системы, его не учитываем.
let savedTheme = null;

try {
  savedTheme = localStorage.getItem('site-theme');
} catch (e) {
  // localStorage недоступен (приватный режим, запрет cookies) — остаёмся на тёмной.
}

if (savedTheme !== 'light') {
  document.documentElement.setAttribute('data-dark-mode', '');
}
