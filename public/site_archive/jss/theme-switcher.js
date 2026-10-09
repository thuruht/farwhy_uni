document.addEventListener('DOMContentLoaded', () => {
  const themeSwitcher = document.getElementById('theme-switcher');
  if (themeSwitcher) {
    themeSwitcher.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      const isDarkMode = document.body.classList.contains('dark-mode');
      localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
      updateThemeSwitcherIcon(isDarkMode);
    });
    const savedTheme = localStorage.getItem('theme');
    const isDarkMode = savedTheme === 'dark';
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    }
    updateThemeSwitcherIcon(isDarkMode);
  }
  function updateThemeSwitcherIcon(isDarkMode) {
    if (themeSwitcher) {
      themeSwitcher.innerHTML = isDarkMode ? '&#9790;' : '&#9728;';
    }
  }
});
