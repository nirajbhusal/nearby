export function PlugIcon({
  className = "h-4 w-4",
  stroke = "currentColor",
}: {
  className?: string;
  stroke?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M8.2 3.4v5.2M15.8 3.4v5.2"
        stroke={stroke}
        strokeWidth="1.35"
        strokeLinecap="round"
      />
      <path
        d="M6.4 8.6h11.2c.6 0 1.1.5 1.1 1.1v2.2c0 3.2-2.4 5.6-5.6 5.9v2.6"
        stroke={stroke}
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
