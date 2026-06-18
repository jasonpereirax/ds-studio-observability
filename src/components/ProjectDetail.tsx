import { ArrowUpRight, GitBranch } from "lucide-react";
import type { ObservabilitySystem } from "../lib/api";
import { ConnectionDetails } from "./ConnectionDetails";
import { DSReadinessCard } from "./DSReadinessCard";
import { FlowMap } from "./FlowMap";
import { PageStructureCard } from "./PageStructureCard";
import { PagesTable } from "./PagesTable";
import { ReadinessPill } from "./ReadinessPill";
import { TechnicalContextCard } from "./TechnicalContextCard";

export function ProjectDetail({ system }: { system: ObservabilitySystem | null }) {
  if (!system) {
    return (
      <section className="project-detail">
        <div className="empty-state">
          <strong>Nenhum projeto selecionado</strong>
          <p>Selecione um projeto conectado para visualizar rastreio, páginas e fluxo.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="project-detail">
      <article className="panel project-summary">
        <div>
          <span className="label accent">Project trace</span>
          <h2>{system.name}</h2>
          <p>{system.sourceHost || system.id} · {system.activePages || 0} página(s) · {system.journeys || 0} fluxo(s)</p>
        </div>

        <div className="project-summary-actions">
          <ReadinessPill value={system.dsReadiness || "low"} />
          {system.sourceUrl && (
            <a className="icon-button" href={system.sourceUrl} target="_blank" rel="noreferrer">
              <ArrowUpRight size={18} />
            </a>
          )}
        </div>
      </article>

      <section className="trace-grid">
        <article className="panel source-panel">
          <div className="panel-header">
            <div>
              <span className="label accent">Connected source</span>
              <h2>Origem e página atual</h2>
            </div>
          </div>
          <ConnectionDetails system={system} />
        </article>

        <DSReadinessCard system={system} />
        <PageStructureCard system={system} />
        <TechnicalContextCard system={system} />

        <article className="panel pages-panel">
          <div className="panel-header">
            <div>
              <span className="label accent">Active pages</span>
              <h2>Páginas mapeadas</h2>
              <p>Leitura real das páginas descobertas dentro deste projeto.</p>
            </div>
          </div>
          <PagesTable pages={system.pages || []} />
        </article>

        <article className="panel flow-panel">
          <div className="panel-header">
            <div>
              <span className="label accent">Journey flow</span>
              <h2>Fluxo detectado</h2>
              <p>Agrupamento inicial das páginas por jornada inferida.</p>
            </div>
            <GitBranch size={18} />
          </div>
          <FlowMap pages={system.pages || []} />
        </article>
      </section>
    </section>
  );
}
