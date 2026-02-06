const THEME_SCRIPT = `
(function() {
  try {
    var theme = localStorage.getItem('theme') || 'cyberpunk';
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
})();
`

export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }}
    />
  )
}
