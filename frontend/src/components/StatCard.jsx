export default function StatCard({ label, value, icon: IconComponent, color = 'green', trend }) {
  const colorMap = {
    green: 'var(--green)',
    blue:  'var(--blue)',
    amber: 'var(--amber)',
    red:   'var(--red)',
    violet:'var(--blue)',
    cyan:  'var(--blue)',
    orange:'var(--amber)',
  };

  const bgMap = {
    green: 'var(--green-bg)',
    blue:  'var(--blue-bg)',
    amber: 'var(--amber-bg)',
    red:   'var(--red-bg)',
    violet:'var(--blue-bg)',
    cyan:  'var(--blue-bg)',
    orange:'var(--amber-bg)',
  };

  const accentColor = colorMap[color] || 'var(--green)';
  const bgColor     = bgMap[color]   || 'var(--green-bg)';

  return (
    <div className="stat-card" style={{ borderTop: `3px solid ${accentColor}` }}>
      <div className="stat-card-icon" style={{ background: bgColor, color: accentColor }}>
        {IconComponent && <IconComponent />}
      </div>
      <div className="stat-card-value">{value ?? 0}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
}
