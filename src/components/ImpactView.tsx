import type { ComponentUsage, ObservabilitySystem } from "../lib/api";

type Props = { components: ComponentUsage[]; systems: ObservabilitySystem[] };

export function ImpactView({ components }: Props) {
  return (
    <section className="feature-grid">
      <article className="panel feature-hero">
        <div>
          <span className="label accent">Impact analysis</span>
          <h2>Impacto por componente</h2>
          <p>Veja quais páginas e sistemas seriam impactados por uma mudança em um componente.</p>
        </div>
      </article>

      <article className="panel feature-main">
        <div className="impact-list">
          {components.length ? components.map((component) => (
            <div className="impact-row" key={component.name}>
              <div>
                <strong>{component.name}</strong>
                <span>{component.count} ocorrências · {component.pages.length} páginas · {component.systems.length} sistemas</span>
              </div>
              <div className={component.pages.length >= 5 ? "risk-pill high" : component.pages.length >= 2 ? "risk-pill medium" : "risk-pill low"}>
                {component.pages.length >= 5 ? "High impact" : component.pages.length >= 2 ? "Medium impact" : "Low impact"}
              </div>
            </div>
          )) : <div className="empty-state"><strong>Nenhum componente detectado</strong><p>Adicione data-ds-component nas páginas conectadas para iniciar análise de impacto.</p></div>}
        </div>
      </article>
    </section>
  );
}
