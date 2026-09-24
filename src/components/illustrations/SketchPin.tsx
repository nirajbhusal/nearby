/** Soft sketchy map-pin mark — for nav / hero */
export function SketchPin({
  className = "h-7 w-7",
  stroke = "currentColor",
}: {
  className?: string;
  stroke?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* Slightly wobbly outer pin */}
      <path
        d="M16.2 2.4c-6.8.2-12.1 5.8-11.8 12.6.2 4.1 2.1 7.2 4.6 10.4 1.8 2.3 3.9 4.9 5.4 8.1.3.7.9 1.4 1.6 1.3.7 0 1.2-.7 1.5-1.4 1.4-3.1 3.4-5.6 5.2-7.9 2.6-3.3 4.7-6.5 4.6-10.7C27.1 8 21.9 2.6 16.2 2.4z"
        stroke={stroke}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.9"
      />
      {/* Inner circle — hand-drawnish */}
      <ellipse
        cx="16.1"
        cy="13.6"
        rx="4.2"
        ry="4.0"
        stroke={stroke}
        strokeWidth="1.3"
        fill="none"
        opacity="0.85"
      />
      {/* Tiny graphite mark inside */}
      <circle cx="16.3" cy="13.4" r="1.1" fill={stroke} opacity="0.55" />
    </svg>
  );
}
