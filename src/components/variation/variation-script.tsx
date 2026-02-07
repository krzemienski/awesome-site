const VARIATION_SCRIPT = `
(function() {
  try {
    var params = new URLSearchParams(window.location.search);
    var variation = params.get('variation');
    if (variation !== 'a' && variation !== 'b' && variation !== 'c') {
      variation = 'b';
    }
    document.documentElement.dataset.variation = variation;
  } catch (e) {}
})();
`

export function VariationScript() {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: VARIATION_SCRIPT }}
    />
  )
}
