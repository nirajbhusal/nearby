export function EventIcon({
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
        d="M5.2 6.4h13.6c.7 0 1.2.5 1.2 1.1v11c0 .6-.5 1.1-1.2 1.1H5.2c-.7 0-1.2-.5-1.2-1.1v-11c0-.6.5-1.1 1.2-1.1z"
        stroke={stroke}
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
      <path
        d="M8 4.4v3.2M16 4.4v3.2M4.2 10.2h15.6"
        stroke={stroke}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}
