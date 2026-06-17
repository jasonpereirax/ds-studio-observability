export function StatusBadge({ connected }: { connected?: boolean }) {
  return (
    <span className={connected ? "status-pill success" : "status-pill error"}>
      <span className="status-dot" />
      {connected ? "Connected" : "Not connected"}
    </span>
  );
}
