import type { ObservabilitySystem } from "../lib/api";

export function DSGraphView({ systems }: { systems: ObservabilitySystem[] }) {
  return (
    <section className="feature-grid">
      <article className="panel feature-hero">
        <div>
          <span className="label accent">DS Graph</span>
          <h2>Sistemas → páginas → componentes</h2>
          <p>Mapa relacional inicial baseado nos dados reais capturados em produção.</p>
        </div>
      </article>

      <article className="panel graph-panel">
        <div className="graph-map">
          {systems.map((system) => (
            <div className="graph-system" key={system.id}>
              <strong>{system.name}</strong>
              <div className="graph-children">
                {(system.pages || []).slice(0, 8).map((page) => (
                  <div className="graph-page" key={page.id || page.path}>
                    <span>{page.path}</span>
                    <div>
                      {(page.components || []).slice(0, 6).map((component) => (
                        <small key={component.name}>{component.name}</small>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
