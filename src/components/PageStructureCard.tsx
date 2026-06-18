import type { ObservabilitySystem } from "../lib/api";

export function PageStructureCard({ system }: { system: ObservabilitySystem | null }) {
  const page = system?.pages?.[0];

  const metrics = [
    ["Headings", page?.heading_count ?? 0],
    ["Links", page?.link_count ?? 0],
    ["Buttons", page?.button_count ?? 0],
    ["Forms", page?.form_count ?? 0],
    ["Images", page?.image_count ?? 0],
    ["Inputs", page?.input_count ?? 0]
  ];

  return (
    <article className="panel structure-panel">
      <div className="panel-header">
        <div>
          <span className="label accent">Page structure</span>
          <h2>Estrutura da página</h2>
          <p>Complexidade básica da última página mapeada.</p>
        </div>
      </div>

      {page ? (
        <div className="structure-grid">
          {metrics.map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <strong>Nenhuma estrutura capturada</strong>
          <p>Abra uma página conectada para mapear headings, links, botões e formulários.</p>
        </div>
      )}
    </article>
  );
}
