import { useId } from "react";

type Props = {
  className?: string;
  title?: string;
};

/** Location pin with a lightning cutout, filled with the brand gradient. */
export function LogoMark({ className, title }: Props) {
  const grad = `nearby-mark-${useId().replace(/:/g, "")}`;
  return (
    <svg className={className} viewBox="0 0 32 32" role={title ? "img" : "presentation"} aria-hidden={title ? undefined : true} aria-label={title}>
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient id={grad} x1="6" y1="2" x2="26" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00E5FF" />
          <stop offset="0.48" stopColor="#00F5A0" />
          <stop offset="1" stopColor="#30D158" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${grad})`}
        d="M16 1.6c-6.5 0-11.4 4.9-11.4 11.1 0 7.8 9.4 16.8 10.6 17.9.4.4 1.2.4 1.6 0 1.2-1.1 10.6-10.1 10.6-17.9C27.4 6.5 22.5 1.6 16 1.6Z"
      />
      <path fill="#04140A" d="M17.4 8.2 11.8 16.4h3.4l-1 7.4 6.1-8.6h-3.5l.6-7Z" />
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
