export function SnippetCard({ domain = window.location.origin }: { domain?: string }) {
  const snippet = `<script src="${domain}/ds-connect.js"></script>
<script>
  DSStudioConnect.init({
    publicKey: "PUBLIC_KEY",
    endpoint: "${domain}/api/collect",
    debug: true
  });
</script>`;

  async function copy() {
    await navigator.clipboard.writeText(snippet);
    alert("Snippet copiado.");
  }

  return (
    <article className="panel snippet-panel">
      <div className="panel-header">
        <div>
          <span className="label accent">Install</span>
          <h2>Snippet de conexão</h2>
          <p>Cole no header ou footer. O domínio, a URL e a página serão detectados automaticamente.</p>
        </div>
        <button className="button secondary" onClick={copy}>Copy</button>
      </div>
      <pre><code>{snippet}</code></pre>
    </article>
  );
}
