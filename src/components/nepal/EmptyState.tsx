import type { LucideIcon } from "lucide-react";
import { SceneArt } from "@/components/illustrations/Scenes";

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
      <SceneArt scene="empty" />
      <Icon size={20} strokeWidth={1.5} aria-hidden />
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}
