import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <div className="empty-state">
      <Icon size={28} strokeWidth={1.75} aria-hidden />
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}
