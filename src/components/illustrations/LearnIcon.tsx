export function LearnIcon({
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
        d="M3.6 8.4 12 4.6l8.4 3.8L12 12.2 3.6 8.4z"
        stroke={stroke}
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
      <path
        d="M7.2 10.4v4.2c1.6 1.4 3.2 2 4.8 2s3.2-.6 4.8-2v-4.2"
        stroke={stroke}
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.2 9.2v5.4"
        stroke={stroke}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}
