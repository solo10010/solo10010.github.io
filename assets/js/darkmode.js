// Переключатель темы. Выбор посетителя запоминается в localStorage;
// тема системы не учитывается — по умолчанию сайт тёмный (см. darkmode-init.js).
const mode = document.getElementById('mode');

if (mode !== null) {

  mode.addEventListener('click', () => {

    const dark = document.documentElement.toggleAttribute('data-dark-mode');

    try {
      localStorage.setItem('theme', dark ? 'dark' : 'light');
    } catch (e) {
      // Без localStorage тема просто не запомнится.
    }

  });

}
