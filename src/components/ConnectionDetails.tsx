import type { ObservabilitySystem } from "../lib/api";

export function ConnectionDetails({ system }: { system: ObservabilitySystem | null }) {
  if (!system) return <div className="empty">Nenhuma origem conectada ainda.</div>;

  return (
    <div className="connection-details">
      <div><span>Origem conectada</span><strong>{system.sourceHost || "—"}</strong></div>
      <div><span>URL base</span><strong>{system.sourceOrigin || "—"}</strong></div>
      <div><span>Última página</span><strong>{system.lastPage || "—"}</strong></div>
      <div><span>Último fluxo</span><strong>{system.lastJourney || "—"}</strong></div>
    </div>
  );
}
