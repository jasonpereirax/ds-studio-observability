import { useMemo, useState } from "react";
import type { DesignDebt, ObservabilitySystem } from "../lib/api";

type Props = { debt: DesignDebt[]; systems: ObservabilitySystem[] };

export function DesignDebtView({ debt, systems }: Props) {
  const [severity, setSeverity] = useState("all");
  const systemMap = new Map(systems.map((system) => [system.id, system.name]));
  const filtered = useMemo(() => {
    return debt.filter((item) => severity === "all" || item.severity === severity);
  }, [debt, severity]);
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
        <div className="feature-hero-actions">
          <div className="debt-summary"><strong>{high}</strong><span>high</span><strong>{medium}</strong><span>medium</span></div>
          <div className="segmented-control">
            {["all", "high", "medium", "low"].map((item) => (
              <button key={item} className={severity === item ? "active" : ""} onClick={() => setSeverity(item)}>{item}</button>
            ))}
          </div>
        </div>
      </article>

      <article className="panel feature-main">
        <div className="debt-list">
          {filtered.length ? filtered.slice(0, 80).map((item) => (
            <div className="debt-row" key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <span>{systemMap.get(item.system_id) || item.system_id} · {item.page_path} · {item.description}</span>
              </div>
              <div className={`risk-pill ${item.severity}`}>{item.severity}</div>
            </div>
          )) : <div className="empty-state"><strong>Nenhuma dívida detectada</strong><p>Quando houver páginas sem DS components ou elementos sem rastreio, elas aparecerão aqui.</p></div>}
        </div>
      </article>
    </section>
  );
}
