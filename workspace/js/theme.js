const themeSelect = document.querySelector("[data-theme-select]");
const themeLink = document.querySelector("[data-theme-link]");
const defaultTheme = "theme-warm-mincho.css";
const themeStorageKey = "karekano-theme";

if (themeSelect && themeLink) {
  const themeFiles = [...themeSelect.options].map((option) => option.value);

  function getSavedTheme() {
    try {
      return localStorage.getItem(themeStorageKey);
    } catch {
      return null;
    }
  }

  function applyTheme(themeFile) {
    const nextTheme = themeFiles.includes(themeFile) ? themeFile : defaultTheme;
    themeLink.href = `./css/${nextTheme}`;
    themeSelect.value = nextTheme;
    try {
      localStorage.setItem(themeStorageKey, nextTheme);
    } catch {
      // Theme switching remains available even when persistence is blocked.
    }
  }

  applyTheme(getSavedTheme());
  themeSelect.addEventListener("change", (event) => applyTheme(event.target.value));
}
