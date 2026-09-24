/** Tiny empty / no-match sketch — lonely pin on soft horizon */
export function EmptySketch({
  className = "mx-auto h-20 w-28",
  stroke = "currentColor",
}: {
  className?: string;
  stroke?: string;
}) {
  return (
    <svg
      viewBox="0 0 112 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M8 62c18-1 36 1.5 52-.5 16-2 28 1 44 0"
        stroke={stroke}
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.4"
      />
      {/* Small distant buildings */}
      <path
        d="M18 62V48h8v14M30 62V42h10v20M72 62V50h7v12M84 62V44h9v18"
        stroke={stroke}
        strokeWidth="1.15"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.35"
      />
      {/* Lonely pin */}
      <path
        d="M56 18c-4.4.1-7.8 3.7-7.6 8.1.1 2.6 1.4 4.6 3 6.7 1.1 1.5 2.4 3.1 3.4 5.1.2.4.5.8 1 .8s.7-.4.9-.8c.9-1.9 2.1-3.5 3.2-5 1.7-2.1 3-4.2 2.9-6.8C62.6 21.5 59.4 18 56 18z"
        stroke={stroke}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
      <circle
        cx="56"
        cy="25.2"
        r="2.4"
        stroke={stroke}
        strokeWidth="1.2"
        opacity="0.65"
      />
      {/* Soft dashed question drift */}
      <path
        d="M68 22c1.2-2.2 3.6-2.4 4.6-.6.7 1.3-.1 2.4-1.2 3.1"
        stroke={stroke}
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.4"
      />
      <circle cx="71.2" cy="28.8" r="0.7" fill={stroke} opacity="0.4" />
    </svg>
  );
}
