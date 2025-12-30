export const themeScript = `
(function() {
  var storageKey = 'agent-kit-theme';
  var theme = localStorage.getItem(storageKey);
  var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  var resolved = theme === 'dark' || (theme !== 'light' && systemDark) ? 'dark' : 'light';
  document.documentElement.classList.add(resolved);
})();
`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />;
}
