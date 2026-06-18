import type { ObservabilitySystem } from "../lib/api";

export function TechnicalContextCard({ system }: { system: ObservabilitySystem | null }) {
  const items = [
    ["Device", system?.deviceType || "—"],
    ["Viewport", system?.viewport || "—"],
    ["Load time", system?.loadTimeMs ? `${system.loadTimeMs}ms` : "—"],
    ["Environment", system?.environment || "production"]
  ];

  return (
    <article className="panel technical-panel">
      <div className="panel-header">
        <div>
          <span className="label accent">Technical context</span>
          <h2>Contexto técnico</h2>
          <p>Dados leves do browser para entender o contexto da última visita.</p>
        </div>
      </div>

      <div className="technical-grid">
        {items.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </article>
  );
}
