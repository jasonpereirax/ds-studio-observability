import type { ComponentRegistryItem, ComponentUsage } from "../lib/api";

type Props = { registry: ComponentRegistryItem[]; components: ComponentUsage[] };

export function RegistryView({ registry, components }: Props) {
  const usageMap = new Map(components.map((component) => [component.name, component]));

  return (
    <section className="feature-grid">
      <article className="panel feature-hero">
        <div>
          <span className="label accent">Component registry</span>
          <h2>Componentes oficiais vs uso real</h2>
          <p>Compare o catálogo do Design System com os componentes detectados em produção.</p>
        </div>
        <strong>{registry.length}</strong>
      </article>

      <article className="panel feature-main">
        <div className="registry-table">
          {registry.map((item) => {
            const usage = usageMap.get(item.name);
            return (
              <div className="registry-row" key={item.id || item.name}>
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.category || "Uncategorized"} · {item.status || "active"} · v{item.version || "—"}</span>
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
    </section>
  );
}
