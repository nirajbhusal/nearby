type Props = {
  className?: string;
  title?: string;
};

/** Monochrome location mark. Colour comes from currentColor. */
export function LogoMark({ className, title }: Props) {
  return (
    <svg className={className} viewBox="0 0 32 32" role={title ? "img" : "presentation"} aria-hidden={title ? undefined : true} aria-label={title}>
      {title ? <title>{title}</title> : null}
      <path
        fill="currentColor"
        d="M16 2.2c-6.2 0-10.8 4.6-10.8 10.6 0 7.4 8.8 16 10.1 17.2.4.4 1 .4 1.4 0 1.3-1.2 10.1-9.8 10.1-17.2C26.8 6.8 22.2 2.2 16 2.2Z"
      />
      <circle cx="16" cy="12.6" r="3.2" fill="var(--bg)" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={className ?? "wordmark"}>
      <LogoMark className="logo-mark" />
      Nearby
    </span>
  );
}
