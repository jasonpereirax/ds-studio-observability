export function StatusBadge({ connected }: { connected?: boolean }) {
  return (
    <span className={connected ? 'badge success' : 'badge error'}>
      <span className="status-dot" />
      {connected ? 'Connected' : 'Not connected'}
    </span>
  );
}
