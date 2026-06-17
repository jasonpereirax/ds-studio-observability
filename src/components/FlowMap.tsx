import type { ObservabilityPage } from "../lib/api";

export function FlowMap({ pages }: { pages: ObservabilityPage[] }) {
  const groups = pages.reduce<Record<string, ObservabilityPage[]>>((acc, page) => {
    const journey = page.journey || "General";
    acc[journey] ||= [];
    acc[journey].push(page);
    return acc;
  }, {});

  const entries = Object.entries(groups);

  if (!entries.length) {
    return (
      <div className="empty-state">
        <strong>Nenhum fluxo detectado</strong>
        <p>O fluxo será agrupado automaticamente quando páginas forem visitadas.</p>
      </div>
    );
  }

  return (
    <div className="flow-map">
      {entries.map(([journey, items]) => (
        <div className="flow-group" key={journey}>
          <div className="flow-header">
            <strong>{journey}</strong>
            <span>{items.length} {items.length === 1 ? "página" : "páginas"}</span>
          </div>
          <div className="flow-line">
            {items.map((page, index) => (
              <span className="flow-piece" key={`${journey}-${page.path}`}>
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
