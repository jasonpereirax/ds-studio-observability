export function SnippetCard({ domain = window.location.origin }: { domain?: string }) {
  const snippet = `<script src="${domain}/ds-connect.js"></script>
<script>
  DSStudioConnect.init({
    systemId: "hustlin-goods-store",
    systemName: "Hustlin Goods Store",
    publicKey: "PUBLIC_KEY",
    endpoint: "${domain}/api/collect"
  });
</script>`;

  async function copy() {
    await navigator.clipboard.writeText(snippet);
    alert('Snippet copied.');
  }

  return (
    <article className="panel">
      <div className="panel-header">
        <div>
          <span className="caption">Setup</span>
          <h2>Install snippet</h2>
          <p>Adicione este código no header ou footer do site, app ou sistema.</p>
        </div>
        <button className="button secondary" onClick={copy}>Copy</button>
      </div>
      <pre><code>{snippet}</code></pre>
    </article>
  );
}
