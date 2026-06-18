import type { ObservabilitySystem } from "../lib/api";
import { ReadinessPill } from "./ReadinessPill";

type Props = {
  systems: ObservabilitySystem[];
  selectedSystemId: string | null;
  onSelectProject: (systemId: string) => void;
};

export function ProjectList({ systems, selectedSystemId, onSelectProject }: Props) {
  return (
    <article className="panel project-list-panel">
      <div className="panel-header">
        <div>
          <span className="label accent">Projects</span>
          <h2>Projetos</h2>
        </div>
      </div>

      <div className="systems-list">
        {systems.length ? systems.map((system) => (
          <button
            key={system.id}
            className={system.id === selectedSystemId ? "system-row selected" : "system-row"}
            onClick={() => onSelectProject(system.id)}
          >
            <span>
              <strong>{system.name}</strong>
              <small>{system.sourceHost || system.id}</small>
            </span>
            <ReadinessPill value={system.dsReadiness || "low"} />
          </button>
        )) : (
          <div className="empty-state">
            <strong>Nenhum projeto conectado</strong>
            <p>O primeiro projeto aparecerá aqui após o primeiro heartbeat.</p>
          </div>
        )}
      </div>
    </article>
  );
}
