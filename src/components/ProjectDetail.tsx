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
    return <section className="project-detail"><div className="empty-state"><strong>Nenhum projeto selecionado</strong><p>Selecione um projeto conectado.</p></div></section>;
  }

  return (
    <section className="project-detail">
      <article className="panel project-summary">
        <div><span className="label accent">Project trace</span><h2>{system.name}</h2><p>{system.sourceHost || system.id} · {system.activePages || 0} página(s) · {system.totalDsComponents || 0} componentes DS</p></div>
        <ReadinessPill value={system.dsReadiness || "low"} />
      </article>
      <section className="trace-grid">
        <article className="panel source-panel"><div className="panel-header"><div><span className="label accent">Connected source</span><h2>Origem e página atual</h2></div></div><ConnectionDetails system={system} /></article>
        <DSReadinessCard system={system} />
        <PageStructureCard system={system} />
        <TechnicalContextCard system={system} />
        <article className="panel pages-panel"><div className="panel-header"><div><span className="label accent">Active pages</span><h2>Páginas mapeadas</h2></div></div><PagesTable pages={system.pages || []} /></article>
        <article className="panel flow-panel"><div className="panel-header"><div><span className="label accent">Journey flow</span><h2>Fluxo detectado</h2></div></div><FlowMap pages={system.pages || []} /></article>
      </section>
    </section>
  );
}
