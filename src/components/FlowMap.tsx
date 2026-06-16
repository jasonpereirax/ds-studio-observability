import type { ObservabilityPage } from '../lib/api';

export function FlowMap({ pages }: { pages: ObservabilityPage[] }) {
  const groups = pages.reduce<Record<string, ObservabilityPage[]>>((acc, page) => {
    const journey = page.journey || 'General';
    acc[journey] ||= [];
    acc[journey].push(page);
    return acc;
  }, {});

  const entries = Object.entries(groups);
  if (!entries.length) return <div className="empty">Nenhum fluxo detectado ainda.</div>;

  return (
    <div className="flow-map">
      {entries.map(([journey, items]) => (
        <div className="flow-group" key={journey}>
          <strong>{journey}</strong>
          <div className="flow-line">
            {items.map((page, index) => (
              <span className="flow-piece" key={page.path}>
                {index > 0 && <span className="flow-arrow">→</span>}
                <span className="flow-node">{page.path}</span>
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
