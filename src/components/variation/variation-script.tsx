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

interface VariationScriptProps {
  nonce?: string
}

export function VariationScript({ nonce }: VariationScriptProps) {
  return (
    <script
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: VARIATION_SCRIPT }}
    />
  )
}
