const THEME_SCRIPT = `
(function() {
  try {
    var theme = localStorage.getItem('theme') || 'cyberpunk';
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
})();
`

interface ThemeScriptProps {
  nonce?: string
}

export function ThemeScript({ nonce }: ThemeScriptProps) {
  return (
    <script
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }}
    />
  )
}
