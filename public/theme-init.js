// Dark mode flash prevention script
// This runs before React hydrates to prevent white flash
(function () {
  try {
    var t = localStorage.getItem("kicawTheme");
    if (
      t === "dark" ||
      (!t && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      document.documentElement.classList.add("dark");
    }
  } catch (e) {}
})();
