import { Activity, ArrowUpRight, GitBranch, Layers, Target } from "lucide-react";
import type { ObservabilitySystem } from "../lib/api";
import { ReadinessPill } from "./ReadinessPill";

type Props = { systems: ObservabilitySystem[]; onSelectProject: (systemId: string) => void };

function readinessScore(value?: string | null) {
  if (value === "high") return 100;
  if (value === "medium") return 60;
  return 20;
}

export function GlobalOverview({ systems, onSelectProject }: Props) {
  const activePages = systems.reduce((sum, system) => sum + (system.activePages || 0), 0);
  const journeys = systems.reduce((sum, system) => sum + (system.journeys || 0), 0);
  const dsComponents = systems.reduce((sum, system) => sum + (system.totalDsComponents || 0), 0);
  const connected = systems.filter((system) => system.connected);
  const score = systems.length ? Math.round(systems.reduce((sum, system) => sum + readinessScore(system.dsReadiness), 0) / systems.length) : 0;
  const lowReadiness = systems.filter((system) => (system.dsReadiness || "low") === "low");

  return (
    <section className="overview-shell">
      <section className="overview-hero panel">
        <div>
          <span className="label accent">DS adoption signal</span>
          <h2>{score >= 75 ? "Alta adoção" : score >= 45 ? "Adoção parcial" : "Baixa instrumentação"}</h2>
          <p>{systems.length ? `${connected.length} projeto(s) conectado(s), ${activePages} página(s) mapeada(s) e ${dsComponents} componente(s) DS detectado(s).` : "Nenhum projeto conectado ainda. Instale o snippet para iniciar a leitura de adoção."}</p>
        </div>
        <div className="adoption-score"><span>DS Usage Score</span><strong>{score}%</strong></div>
      </section>

      <section className="overview-stats">
        <article className="stat-card panel"><Layers size={18} /><span className="label">Connected projects</span><strong>{systems.length}</strong><p>{connected.length} com heartbeat ativo</p></article>
        <article className="stat-card panel"><Activity size={18} /><span className="label">Mapped pages</span><strong>{activePages}</strong><p>páginas descobertas pelo script</p></article>
        <article className="stat-card panel"><GitBranch size={18} /><span className="label">Detected flows</span><strong>{journeys}</strong><p>jornadas agrupadas automaticamente</p></article>
        <article className="stat-card panel"><Target size={18} /><span className="label">DS components</span><strong>{dsComponents}</strong><p>componentes com data-ds-component</p></article>
      </section>

      <section className="overview-grid">
        <article className="panel">
          <div className="panel-header"><div><span className="label accent">Projects</span><h2>Projetos usando o DS</h2><p>Quais sistemas estão conectados e qual é o nível de prontidão de cada um.</p></div></div>
          <div className="project-table">
            {systems.length ? systems.map((system) => (
              <button key={system.id} className="project-row" onClick={() => onSelectProject(system.id)}>
                <div><strong>{system.name}</strong><span>{system.sourceHost || system.id}</span></div>
                <div className="project-row-meta"><span>{system.activePages || 0} pages</span><span>{system.totalDsComponents || 0} DS components</span><ReadinessPill value={system.dsReadiness || "low"} /><ArrowUpRight size={16} /></div>
              </button>
            )) : <div className="empty-state"><strong>Nenhum projeto conectado</strong><p>Instale o snippet para gerar o overview real.</p></div>}
          </div>
        </article>

        <article className="panel insight-panel">
          <div className="panel-header"><div><span className="label accent">Priority</span><h2>Onde agir primeiro</h2><p>Projetos com baixa prontidão para observabilidade de componentes.</p></div></div>
          <div className="insight-list">
            {lowReadiness.length ? lowReadiness.slice(0, 5).map((system) => (
              <button key={system.id} className="insight-item" onClick={() => onSelectProject(system.id)}>
                <div><strong>{system.name}</strong><span>{system.activePages || 0} página(s) mapeada(s), mas poucos marcadores DS.</span></div><ReadinessPill value="low" />
              </button>
            )) : <div className="empty-state"><strong>Nenhuma prioridade crítica</strong><p>Quando um projeto tiver baixa instrumentação, ele aparecerá aqui.</p></div>}
          </div>
        </article>
      </section>
    </section>
  );
}
