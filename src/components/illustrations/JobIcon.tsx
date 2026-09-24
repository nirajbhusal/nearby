/** Simple line icon — Jobs / open roles */
export function JobIcon({
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
      {/* Briefcase — slightly imperfect */}
      <path
        d="M4.2 9.2h15.5c.7 0 1.2.5 1.2 1.1v8.2c0 .7-.5 1.2-1.2 1.2H4.3c-.7 0-1.2-.5-1.2-1.2V10.3c0-.6.5-1.1 1.1-1.1z"
        stroke={stroke}
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.2 9.1V6.4c0-.8.6-1.4 1.4-1.4h4.6c.8 0 1.4.6 1.4 1.4v2.7"
        stroke={stroke}
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.2 13.2h17.4"
        stroke={stroke}
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}
