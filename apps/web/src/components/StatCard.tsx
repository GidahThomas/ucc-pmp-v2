type StatCardProps = {
  label: string;
  value: string | number;
};

export function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="surface stat-card">
      <div className="stat-value">{value}</div>
      <div style={{ color: 'var(--text-secondary)' }}>{label}</div>
    </div>
  );
}
