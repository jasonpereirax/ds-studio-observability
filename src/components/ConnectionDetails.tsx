import type { ObservabilitySystem } from "../lib/api";

export function ConnectionDetails({ system }: { system: ObservabilitySystem | null }) {
  if (!system) {
    return (
      <div className="empty-state compact">
        <strong>Nenhuma origem conectada</strong>
        <p>Quando o primeiro heartbeat chegar, origem, URL e página aparecerão aqui.</p>
      </div>
    );
  }

  const items = [
    ["Origem conectada", system.sourceHost || "—"],
    ["URL base", system.sourceOrigin || "—"],
    ["Última página", system.lastPage || "—"],
    ["Último fluxo", system.lastJourney || "—"]
  ];

  return (
    <div className="connection-details">
      {items.map(([label, value]) => (
        <div key={label}>
          <span>{label}</span>
          <strong title={value}>{value}</strong>
        </div>
      ))}
    </div>
  );
}
