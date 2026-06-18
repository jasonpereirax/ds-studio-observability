import type { ObservabilityPage } from "../lib/api";

function readinessLabel(value?: string) {
  if (value === "high") return "High";
  if (value === "medium") return "Medium";
  return "Low";
}

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
            <strong>{page.display_title || page.page_title || page.h1 || page.title || page.path}</strong>
            <span>{page.path}</span>
            {page.document_title && <small className="page-doc-title">document.title: {page.document_title}</small>}
          </div>

          <div className="page-meta">
            <span>{page.journey || "General"}</span>
            <small>{readinessLabel(page.ds_readiness)} readiness · {new Date(page.created_at).toLocaleString("pt-BR")}</small>
          </div>
        </div>
      ))}
    </div>
  );
}
