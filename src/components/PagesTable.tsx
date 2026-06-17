import type { ObservabilityPage } from "../lib/api";

export function PagesTable({ pages }: { pages: ObservabilityPage[] }) {
  if (!pages.length) {
    return (
      <div className="empty-state">
        <strong>Nenhuma página ativa</strong>
        <p>Navegue no site conectado para mapear as primeiras URLs.</p>
      </div>
    );
  }

  return (
    <div className="page-list">
      {pages.map((page) => (
        <div className="page-item" key={page.id || page.path}>
          <div>
            <strong>{page.title || page.path}</strong>
            <span>{page.path}</span>
          </div>
          <div className="page-meta">
            <span>{page.journey || "General"}</span>
            <small>{new Date(page.created_at).toLocaleString("pt-BR")}</small>
          </div>
        </div>
      ))}
    </div>
  );
}
