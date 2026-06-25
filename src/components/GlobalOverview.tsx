import { Activity, ArrowUpRight, GitBranch, Layers, Target } from "lucide-react";
import type { CoverageCheck, ObservabilitySystem } from "../lib/api";
import { ReadinessPill } from "./ReadinessPill";

type Props = { systems: ObservabilitySystem[]; activeSystems: ObservabilitySystem[]; coverageChecks: CoverageCheck[]; onSelectProject: (systemId: string) => void };

function readinessScore(value?: string | null) {
  if (value === "high") return 100;
  if (value === "medium") return 60;
  return 20;
}

function formatDate(value?: string) {
  if (!value) return "sem data";
  return new Date(value).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function GlobalOverview({ systems, activeSystems, coverageChecks, onSelectProject }: Props) {
  const runtimeActive = activeSystems.length;
  const detectedSystems = systems.filter((system) => (system.monitoredUrlCount || system.pages?.length || 0) > 0);
  const coverageOk = systems.reduce((sum, system) => sum + (system.coverageOk || 0), 0);
  const missingSnippet = systems.reduce((sum, system) => sum + (system.missingSnippet || 0), 0);
  const latestCoverageChecks = systems.map((system) => system.latestCoverageCheckAt).filter(Boolean).sort();
  const latestCoverageCheck = coverageChecks[0]?.checked_at || latestCoverageChecks[latestCoverageChecks.length - 1];
  const activePages = detectedSystems.reduce((sum, system) => sum + (system.activePages || 0), 0);
  const journeys = detectedSystems.reduce((sum, system) => sum + (system.journeys || 0), 0);
  const dsComponents = detectedSystems.reduce((sum, system) => sum + (system.totalDsComponents || 0), 0);
  const score = detectedSystems.length ? Math.round(detectedSystems.reduce((sum, system) => sum + (system.adoptionScore ?? readinessScore(system.dsReadiness)), 0) / detectedSystems.length) : 0;
  const lowReadiness = detectedSystems.filter((system) => (system.dsReadiness || "low") === "low");
  const debtSignals = detectedSystems.reduce((sum, system) => sum + (system.designDebt?.length || 0), 0);
  const confidence = detectedSystems.length ? Math.round(detectedSystems.reduce((sum, system) => sum + (system.confidenceScore || 0), 0) / detectedSystems.length) : 0;
  const historicalAliases = systems.flatMap((system) => (system.aliases || []).map((alias) => ({ ...alias, projectName: system.name, projectId: system.id, aliasCount: system.aliasCount || 1 })));

  return (
    <section className="overview-shell">
      <section className="overview-hero panel">
        <div>
          <span className="label accent">DS adoption signal</span>
          <h2>{score >= 75 ? "Alta adoção" : score >= 45 ? "Adoção parcial" : "Baixa instrumentação"}</h2>
          <p>{detectedSystems.length ? `${detectedSystems.length} projeto(s) com cobertura detectada, ${activePages} página(s) mapeada(s) e ${dsComponents} componente(s) DS detectado(s).` : "Nenhum projeto monitorado ainda. Cadastre URLs ou rode uma checagem de cobertura."}</p>
        </div>
        <div className="adoption-score"><span>Adoption Score</span><strong>{score}%</strong></div>
      </section>

      <section className="overview-stats">
        <article className="stat-card panel"><Layers size={18} /><span className="label">Coverage detected</span><strong>{detectedSystems.length}</strong><p>{runtimeActive} com runtime recente</p></article>
        <article className="stat-card panel"><Activity size={18} /><span className="label">Mapped pages</span><strong>{activePages}</strong><p>páginas descobertas pelo script</p></article>
        <article className="stat-card panel"><GitBranch size={18} /><span className="label">Detected flows</span><strong>{journeys}</strong><p>jornadas agrupadas automaticamente</p></article>
        <article className="stat-card panel"><Target size={18} /><span className="label">DS components</span><strong>{dsComponents}</strong><p>componentes com data-ds-component</p></article>
      </section>
      <section className="overview-stats compact-stats">
        <article className="stat-card panel"><span className="label">Confidence</span><strong>{confidence}%</strong><p>qualidade dos sinais coletados</p></article>
        <article className="stat-card panel"><span className="label">Coverage OK</span><strong>{coverageOk}</strong><p>páginas com snippet detectado</p></article>
        <article className="stat-card panel"><span className="label">Missing snippet</span><strong>{missingSnippet}</strong><p>páginas monitoradas sem snippet</p></article>
        <article className="stat-card panel"><span className="label">Last coverage check</span><strong>{latestCoverageCheck ? formatDate(latestCoverageCheck) : "—"}</strong><p>checagem feita pelo DS Studio</p></article>
      </section>

      <section className="overview-grid">
        <article className="panel">
          <div className="panel-header"><div><span className="label accent">Projects</span><h2>Projetos com cobertura DS</h2><p>Origens detectadas por runtime ou por checagem ativa do DS Studio. Acesso de usuário não é requisito para aparecer aqui.</p></div></div>
          <div className="project-table">
            {detectedSystems.length ? detectedSystems.map((system) => (
              <button key={system.id} className="project-row" onClick={() => onSelectProject(system.id)}>
                <div><strong>{system.name}</strong><span>{system.sourceHost || system.id} · última leitura {formatDate(system.latestCoverageCheckAt || system.last_seen_at)}</span></div>
                <div className="project-row-meta"><span>{system.coverageOk || 0} ok</span><span>{system.missingSnippet || 0} missing</span><span>{system.totalDsComponents || 0} DS components</span><ReadinessPill value={system.dsReadiness || "low"} /><ArrowUpRight size={16} /></div>
              </button>
            )) : <div className="empty-state"><strong>Nenhum projeto monitorado</strong><p>Rode uma checagem ativa ou instale o snippet para iniciar a leitura de cobertura.</p></div>}
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
