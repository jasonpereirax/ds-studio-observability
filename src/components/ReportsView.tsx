import type { ComponentUsage, DesignDebt, ObservabilitySystem } from "../lib/api";

type Props = { systems: ObservabilitySystem[]; components: ComponentUsage[]; debt: DesignDebt[] };

export function ReportsView({ systems, components, debt }: Props) {
  const pages = systems.reduce((sum, system) => sum + (system.activePages || 0), 0);
  const dsComponents = components.reduce((sum, component) => sum + component.count, 0);
  const adoptionScore = systems.length ? Math.round(systems.reduce((sum, system) => sum + (system.adoptionScore || 0), 0) / systems.length) : 0;
  const topPriorities = [...systems]
    .sort((a, b) => (a.adoptionScore || 0) - (b.adoptionScore || 0))
    .slice(0, 5);
  const topImpact = [...components]
    .sort((a, b) => (b.pages.length * b.systems.length * b.count) - (a.pages.length * a.systems.length * a.count))
    .slice(0, 5);

  return (
    <section className="feature-grid">
      <article className="panel feature-hero">
        <div>
          <span className="label accent">Reports</span>
          <h2>Resumo executivo</h2>
          <p>Uma visão textual e exportável da adoção do Design System nos projetos conectados.</p>
        </div>
      </article>

      <article className="panel report-card">
        <h2>DS Observability Report</h2>
        <p>{systems.length} projetos conectados, {pages} páginas mapeadas, {dsComponents} usos de componentes DS, {debt.length} sinais de dívida de instrumentação e adoption score médio de {adoptionScore}%.</p>
        <div className="report-sections">
          <section>
            <h3>Prioridades</h3>
            {topPriorities.length ? topPriorities.map((system) => (
              <div className="report-row" key={system.id}>
                <strong>{system.name}</strong>
                <span>{system.adoptionScore || 0}% adoption · {(system.scoreReasons || [])[0] || "sem prioridade crítica"}</span>
              </div>
            )) : <div className="empty-state"><strong>Sem projetos conectados</strong><p>O report será gerado quando houver dados.</p></div>}
          </section>
          <section>
            <h3>Componentes de maior impacto</h3>
            {topImpact.length ? topImpact.map((component) => (
              <div className="report-row" key={component.name}>
                <strong>{component.name}</strong>
                <span>{component.count} ocorrências · {component.pages.length} páginas · {component.systems.length} sistemas</span>
              </div>
            )) : <div className="empty-state"><strong>Sem componentes detectados</strong><p>Marque componentes com data-ds-component para gerar impacto.</p></div>}
          </section>
        </div>
        <pre>{JSON.stringify({
          connectedProjects: systems.length,
          mappedPages: pages,
          componentUsages: dsComponents,
          designDebtSignals: debt.length,
          adoptionScore,
          priorities: topPriorities.map((system) => ({ id: system.id, name: system.name, adoptionScore: system.adoptionScore, reasons: system.scoreReasons })),
          topImpactComponents: topImpact.map((component) => ({ name: component.name, count: component.count, pages: component.pages.length, systems: component.systems.length })),
          generatedAt: new Date().toISOString()
        }, null, 2)}</pre>
      </article>
    </section>
  );
}
