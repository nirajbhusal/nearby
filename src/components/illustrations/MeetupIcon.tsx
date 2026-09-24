/** Simple line icon — AI meetups / gathering */
export function MeetupIcon({
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
      {/* Three soft people marks + a spark */}
      <circle
        cx="8.2"
        cy="8.4"
        r="2.3"
        stroke={stroke}
        strokeWidth="1.3"
      />
      <path
        d="M4.4 16.8c.4-2.4 1.9-3.6 3.8-3.6s3.4 1.2 3.8 3.6"
        stroke={stroke}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <circle
        cx="16.2"
        cy="8.6"
        r="2.1"
        stroke={stroke}
        strokeWidth="1.3"
      />
      <path
        d="M12.8 16.8c.3-2.1 1.6-3.2 3.4-3.2 1.8 0 3.1 1.1 3.4 3.2"
        stroke={stroke}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      {/* Tiny spark / AI mark */}
      <path
        d="M19.6 3.4l.3 1.1 1.1.3-1.1.3-.3 1.1-.3-1.1-1.1-.3 1.1-.3z"
        fill={stroke}
        opacity="0.7"
      />
    </svg>
  );
}
