type Props = {
  className?: string;
  title?: string;
};

/** Location pin with a lightning cutout. Stays readable at 16px. */
export function LogoMark({ className, title }: Props) {
  return (
    <svg className={className} viewBox="0 0 32 32" role={title ? "img" : "presentation"} aria-hidden={title ? undefined : true} aria-label={title}>
      {title ? <title>{title}</title> : null}
      <path
        fill="currentColor"
        d="M16 1.6c-6.5 0-11.4 4.9-11.4 11.1 0 7.8 9.4 16.8 10.6 17.9.4.4 1.2.4 1.6 0 1.2-1.1 10.6-10.1 10.6-17.9C27.4 6.5 22.5 1.6 16 1.6Z"
      />
      <path fill="var(--logo-ink, #000)" d="M17.4 8.2 11.8 16.4h3.4l-1 7.4 6.1-8.6h-3.5l.6-7Z" />
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
