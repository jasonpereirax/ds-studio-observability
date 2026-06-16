import type { ObservabilityPage } from '../lib/api';

export function PagesTable({ pages }: { pages: ObservabilityPage[] }) {
  if (!pages.length) return <div className="empty">Nenhuma página ativa mapeada ainda.</div>;
  return (
    <div className="page-list">
      {pages.map((page) => (
        <div className="page-item" key={page.id || page.path}>
          <div>
            <strong>{page.title || page.path}</strong>
            <span>{page.path} · {page.journey || 'General'}</span>
          </div>
          <small>{new Date(page.created_at).toLocaleString('pt-BR')}</small>
        </div>
      ))}
    </div>
  );
}
