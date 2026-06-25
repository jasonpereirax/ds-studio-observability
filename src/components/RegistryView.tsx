import type { ComponentRegistryItem, ComponentUsage } from "../lib/api";

type Props = { registry: ComponentRegistryItem[]; components: ComponentUsage[] };

export function RegistryView({ registry, components }: Props) {
  const usageMap = new Map(components.map((component) => [component.name, component]));
  const registeredNames = new Set(registry.map((item) => item.name));
  const usedRegistry = registry.filter((item) => usageMap.has(item.name));
  const unknownComponents = components.filter((component) => !registeredNames.has(component.name));
  const coverage = registry.length ? Math.round((usedRegistry.length / registry.length) * 100) : 0;

  return (
    <section className="feature-grid">
      <article className="panel feature-hero">
        <div>
          <span className="label accent">Component registry</span>
          <h2>Componentes oficiais vs uso real</h2>
          <p>Compare o catálogo do Design System com os componentes detectados em produção.</p>
        </div>
        <div className="feature-metrics">
          <div><strong>{coverage}%</strong><span>coverage</span></div>
          <div><strong>{unknownComponents.length}</strong><span>unknown</span></div>
        </div>
      </article>

      <article className="panel feature-main">
        <div className="registry-table">
          {registry.map((item) => {
            const usage = usageMap.get(item.name);
            return (
              <div className="registry-row" key={item.id || item.name}>
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.category || "Uncategorized"} · {item.status || "active"} · {item.maturity || "stable"} · v{item.version || "—"}</span>
                </div>
                <div className="registry-usage">
                  <strong>{usage?.count || 0}</strong>
                  <span>{usage?.pages?.length || 0} pages</span>
                </div>
              </div>
            );
          })}
        </div>
      </article>

      <article className="panel feature-main">
        <div className="panel-header"><div><span className="label accent">Detected outside registry</span><h2>Componentes não catalogados</h2><p>Nomes encontrados em produção que ainda não existem no catálogo oficial.</p></div></div>
        <div className="registry-table">
          {unknownComponents.length ? unknownComponents.map((component) => (
            <div className="registry-row" key={component.name}>
              <div>
                <strong>{component.name}</strong>
                <span>{component.variants.length || 0} variants · {component.versions.length || 0} versions</span>
              </div>
              <div className="registry-usage">
                <strong>{component.count}</strong>
                <span>{component.pages.length} pages</span>
              </div>
            </div>
          )) : <div className="empty-state"><strong>Nenhum componente desconhecido</strong><p>Todos os componentes detectados estão representados no registry.</p></div>}
        </div>
      </article>
    </section>
  );
}
