import type { ComponentUsage, DesignDebt, ObservabilitySystem } from "../lib/api";

type Props = { systems: ObservabilitySystem[]; components: ComponentUsage[]; debt: DesignDebt[] };

export function ReportsView({ systems, components, debt }: Props) {
  const pages = systems.reduce((sum, system) => sum + (system.activePages || 0), 0);
  const dsComponents = components.reduce((sum, component) => sum + component.count, 0);

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
        <p>{systems.length} projetos conectados, {pages} páginas mapeadas, {dsComponents} usos de componentes DS e {debt.length} sinais de dívida de instrumentação.</p>
        <pre>{JSON.stringify({
          connectedProjects: systems.length,
          mappedPages: pages,
          componentUsages: dsComponents,
          designDebtSignals: debt.length,
          generatedAt: new Date().toISOString()
        }, null, 2)}</pre>
      </article>
    </section>
  );
}
