import { Activity, ArrowUpRight, GitBranch, Layers, Target } from "lucide-react";
import type { ObservabilitySystem } from "../lib/api";
import { ReadinessPill } from "./ReadinessPill";

type Props = { systems: ObservabilitySystem[]; activeSystems: ObservabilitySystem[]; onSelectProject: (systemId: string) => void };

function readinessScore(value?: string | null) {
  if (value === "high") return 100;
  if (value === "medium") return 60;
  return 20;
}

function formatDate(value?: string) {
  if (!value) return "sem data";
  return new Date(value).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function GlobalOverview({ systems, activeSystems, onSelectProject }: Props) {
  const currentSystems = activeSystems.length ? activeSystems : systems.filter((system) => system.isCurrentlyConnected);
  const activePages = currentSystems.reduce((sum, system) => sum + (system.activePages || 0), 0);
  const journeys = currentSystems.reduce((sum, system) => sum + (system.journeys || 0), 0);
  const dsComponents = currentSystems.reduce((sum, system) => sum + (system.totalDsComponents || 0), 0);
  const score = currentSystems.length ? Math.round(currentSystems.reduce((sum, system) => sum + (system.adoptionScore ?? readinessScore(system.dsReadiness)), 0) / currentSystems.length) : 0;
  const lowReadiness = currentSystems.filter((system) => (system.dsReadiness || "low") === "low");
  const debtSignals = currentSystems.reduce((sum, system) => sum + (system.designDebt?.length || 0), 0);
  const confidence = currentSystems.length ? Math.round(currentSystems.reduce((sum, system) => sum + (system.confidenceScore || 0), 0) / currentSystems.length) : 0;
  const historicalAliases = systems.flatMap((system) => (system.aliases || []).map((alias) => ({ ...alias, projectName: system.name, projectId: system.id, aliasCount: system.aliasCount || 1 })));

  return (
    <section className="overview-shell">
      <section className="overview-hero panel">
        <div>
          <span className="label accent">DS adoption signal</span>
          <h2>{score >= 75 ? "Alta adoção" : score >= 45 ? "Adoção parcial" : "Baixa instrumentação"}</h2>
          <p>{currentSystems.length ? `${currentSystems.length} projeto(s) conectado(s) agora, ${activePages} página(s) mapeada(s) e ${dsComponents} componente(s) DS detectado(s).` : "Nenhum projeto com snippet ativo neste momento. O histórico continua disponível abaixo."}</p>
        </div>
        <div className="adoption-score"><span>Adoption Score</span><strong>{score}%</strong></div>
      </section>

      <section className="overview-stats">
        <article className="stat-card panel"><Layers size={18} /><span className="label">Connected now</span><strong>{currentSystems.length}</strong><p>projetos com heartbeat recente</p></article>
        <article className="stat-card panel"><Activity size={18} /><span className="label">Mapped pages</span><strong>{activePages}</strong><p>páginas descobertas pelo script</p></article>
        <article className="stat-card panel"><GitBranch size={18} /><span className="label">Detected flows</span><strong>{journeys}</strong><p>jornadas agrupadas automaticamente</p></article>
        <article className="stat-card panel"><Target size={18} /><span className="label">DS components</span><strong>{dsComponents}</strong><p>componentes com data-ds-component</p></article>
      </section>
      <section className="overview-stats compact-stats">
        <article className="stat-card panel"><span className="label">Confidence</span><strong>{confidence}%</strong><p>qualidade dos sinais coletados</p></article>
        <article className="stat-card panel"><span className="label">Debt signals</span><strong>{debtSignals}</strong><p>findings ativos de instrumentação</p></article>
        <article className="stat-card panel"><span className="label">Average readiness</span><strong>{currentSystems.length ? Math.round(currentSystems.reduce((sum, system) => sum + (system.readinessScore || readinessScore(system.dsReadiness)), 0) / currentSystems.length) : 0}%</strong><p>cobertura atual do DS</p></article>
        <article className="stat-card panel"><span className="label">Debt health</span><strong>{currentSystems.length ? Math.round(currentSystems.reduce((sum, system) => sum + (system.debtScore || 0), 0) / currentSystems.length) : 0}%</strong><p>quanto menor a dívida, maior o score</p></article>
      </section>

      <section className="overview-grid">
        <article className="panel">
          <div className="panel-header"><div><span className="label accent">Projects</span><h2>Projetos usando o DS agora</h2><p>Somente origens com heartbeat recente entram nesta lista. Testes antigos ficam no histórico.</p></div></div>
          <div className="project-table">
            {currentSystems.length ? currentSystems.map((system) => (
              <button key={system.id} className="project-row" onClick={() => onSelectProject(system.id)}>
                <div><strong>{system.name}</strong><span>{system.sourceHost || system.id} · visto às {formatDate(system.last_seen_at)}</span></div>
                <div className="project-row-meta"><span>{system.adoptionScore || 0}% adoption</span><span>{system.activePages || 0} pages</span><span>{system.totalDsComponents || 0} DS components</span><ReadinessPill value={system.dsReadiness || "low"} /><ArrowUpRight size={16} /></div>
              </button>
            )) : <div className="empty-state"><strong>Nenhum projeto ativo agora</strong><p>Quando uma página com o snippet estiver aberta e enviando heartbeat recente, ela aparecerá aqui.</p></div>}
          </div>
        </article>

        <article className="panel insight-panel">
          <div className="panel-header"><div><span className="label accent">Priority</span><h2>Onde agir primeiro</h2><p>Projetos com baixa prontidão para observabilidade de componentes.</p></div></div>
          <div className="insight-list">
            {lowReadiness.length ? lowReadiness.slice(0, 5).map((system) => (
              <button key={system.id} className="insight-item" onClick={() => onSelectProject(system.id)}>
                <div><strong>{system.name}</strong><span>{system.scoreReasons?.[0] || `${system.activePages || 0} página(s) mapeada(s), mas poucos marcadores DS.`}</span></div><ReadinessPill value="low" />
              </button>
            )) : <div className="empty-state"><strong>Nenhuma prioridade crítica</strong><p>Quando um projeto tiver baixa instrumentação, ele aparecerá aqui.</p></div>}
          </div>
        </article>
      </section>

      <section className="panel history-panel">
        <div className="panel-header"><div><span className="label accent">History</span><h2>Histórico de snippets identificados</h2><p>Mostra aliases e testes já vistos, sem contar cada alias como um projeto ativo separado.</p></div></div>
        <div className="history-list">
          {historicalAliases.length ? historicalAliases.map((alias) => (
            <button key={`${alias.projectId}-${alias.id}`} className="history-row" onClick={() => onSelectProject(alias.projectId)}>
              <div><strong>{alias.name}</strong><span>{alias.projectName} · de {formatDate(alias.firstSeenAt)} até {formatDate(alias.lastSeenAt)}</span></div>
              <div className={alias.active ? "status-pill success" : "status-pill"}><span className="status-dot" />{alias.active ? "ativo agora" : "histórico"}</div>
            </button>
          )) : <div className="empty-state"><strong>Nenhum histórico ainda</strong><p>Os snippets identificados aparecerão aqui após as primeiras coletas.</p></div>}
        </div>
      </section>
    </section>
  );
}
