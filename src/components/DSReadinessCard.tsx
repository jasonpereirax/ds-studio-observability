import type { ObservabilitySystem } from "../lib/api";

function label(value?: string | null) {
  if (value === "high") return "Alto";
  if (value === "medium") return "Médio";
  return "Baixo";
}

function description(value?: string | null) {
  if (value === "high") return "A página já possui boa instrumentação para rastrear componentes do DS.";
  if (value === "medium") return "Existem alguns marcadores rastreáveis. Próximo passo: padronizar data-ds-component.";
  return "A página está conectada, mas ainda não está preparada para observabilidade de componentes.";
}

export function DSReadinessCard({ system }: { system: ObservabilitySystem | null }) {
  const readiness = system?.dsReadiness || "low";

  return (
    <article className="panel readiness-panel">
      <div className="panel-header">
        <div>
          <span className="label accent">DS readiness</span>
          <h2>Prontidão para DS</h2>
          <p>{description(readiness)}</p>
        </div>
      </div>

      <div className={`readiness-score ${readiness}`}>
        <span>{label(readiness)}</span>
        <strong>{system?.totalDsComponents || 0}</strong>
        <p>componentes com data-ds-component detectados</p>
      </div>

      <div className="readiness-list">
        <div>
          <span>Elementos rastreáveis</span>
          <strong>{system?.totalTrackedComponents || 0}</strong>
        </div>
        <div>
          <span>Script</span>
          <strong>{system?.scriptVersion || "—"}</strong>
        </div>
        <div>
          <span>Ambiente</span>
          <strong>{system?.environment || "production"}</strong>
        </div>
      </div>
    </article>
  );
}
