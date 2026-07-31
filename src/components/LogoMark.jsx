export default function LogoMark({ size = 28, color = "#F97316", showLines = true, className = "" }) {
  const w = size;
  const h = Math.round(size * (80 / 140));
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 140 80"
      aria-hidden="true"
      className={className}
    >
      <circle cx="70" cy="14" r="6" fill={color} />
      <circle cx="55" cy="40" r="6" fill={color} />
      <circle cx="85" cy="40" r="6" fill={color} />
      <circle cx="42" cy="66" r="6" fill={color} />
      <circle cx="70" cy="66" r="6" fill={color} />
      <circle cx="98" cy="66" r="6" fill={color} />
      {showLines && (
        <g stroke={color} strokeWidth="1.5" opacity="0.6">
          <line x1="70" y1="14" x2="55" y2="40" />
          <line x1="70" y1="14" x2="85" y2="40" />
          <line x1="55" y1="40" x2="42" y2="66" />
          <line x1="55" y1="40" x2="70" y2="66" />
          <line x1="85" y1="40" x2="70" y2="66" />
          <line x1="85" y1="40" x2="98" y2="66" />
        </g>
      )}
    </svg>
  );
}
