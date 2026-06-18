import type { DesignDebt, ObservabilitySystem } from "../lib/api";

type Props = { debt: DesignDebt[]; systems: ObservabilitySystem[] };

export function DesignDebtView({ debt }: Props) {
  const high = debt.filter((item) => item.severity === "high").length;
  const medium = debt.filter((item) => item.severity === "medium").length;

  return (
    <section className="feature-grid">
      <article className="panel feature-hero">
        <div>
          <span className="label accent">Design debt</span>
          <h2>Dívida de instrumentação</h2>
          <p>Páginas conectadas, mas com baixa cobertura de componentes DS ou elementos interativos sem rastreio.</p>
        </div>
        <div className="debt-summary"><strong>{high}</strong><span>high</span><strong>{medium}</strong><span>medium</span></div>
      </article>

      <article className="panel feature-main">
        <div className="debt-list">
          {debt.length ? debt.slice(0, 50).map((item) => (
            <div className="debt-row" key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <span>{item.page_path} · {item.description}</span>
              </div>
              <div className={`risk-pill ${item.severity}`}>{item.severity}</div>
            </div>
          )) : <div className="empty-state"><strong>Nenhuma dívida detectada</strong><p>Quando houver páginas sem DS components ou elementos sem rastreio, elas aparecerão aqui.</p></div>}
        </div>
      </article>
    </section>
  );
}
