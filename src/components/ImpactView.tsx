import { useMemo, useState } from "react";
import type { ComponentUsage, ObservabilitySystem } from "../lib/api";

type Props = { components: ComponentUsage[]; systems: ObservabilitySystem[] };

function impactLevel(component: ComponentUsage) {
  const score = component.pages.length * 10 + component.systems.length * 15 + component.count;
  if (score >= 80) return "high";
  if (score >= 35) return "medium";
  return "low";
}

export function ImpactView({ components, systems }: Props) {
  const [level, setLevel] = useState("all");
  const filtered = useMemo(() => {
    return components.filter((component) => level === "all" || impactLevel(component) === level);
  }, [components, level]);
  const criticalJourneys = new Set(systems.flatMap((system) => system.pages || []).filter((page) => ["Checkout", "Authentication"].includes(page.journey || "")).map((page) => page.path));

  return (
    <section className="feature-grid">
      <article className="panel feature-hero">
        <div>
          <span className="label accent">Impact analysis</span>
          <h2>Impacto por componente</h2>
          <p>Veja quais páginas e sistemas seriam impactados por uma mudança em um componente.</p>
        </div>
        <div className="segmented-control">
          {["all", "high", "medium", "low"].map((item) => (
            <button key={item} className={level === item ? "active" : ""} onClick={() => setLevel(item)}>{item}</button>
          ))}
        </div>
      </article>

      <article className="panel feature-main">
        <div className="impact-list">
          {filtered.length ? filtered.map((component) => {
            const level = impactLevel(component);
            const critical = component.pages.filter((page) => criticalJourneys.has(page)).length;
            return (
            <div className="impact-row" key={component.name}>
              <div>
                <strong>{component.name}</strong>
                <span>{component.count} ocorrências · {component.pages.length} páginas · {component.systems.length} sistemas · {critical} página(s) crítica(s)</span>
              </div>
              <div className={`risk-pill ${level}`}>
                {level} impact
              </div>
            </div>
          );}) : <div className="empty-state"><strong>Nenhum componente detectado</strong><p>Adicione data-ds-component nas páginas conectadas para iniciar análise de impacto.</p></div>}
        </div>
      </article>
    </section>
  );
}
