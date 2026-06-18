type ReadinessPillProps = {
  value?: string | null;
};

export function ReadinessPill({ value = "low" }: ReadinessPillProps) {
  const normalized = value || "low";

  const label =
    normalized === "high"
      ? "High readiness"
      : normalized === "medium"
        ? "Medium readiness"
        : "Low readiness";

  return (
    <span className={`readiness-pill ${normalized}`}>
      {label}
    </span>
  );
}
