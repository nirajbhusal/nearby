"use client";

import { Peek } from "@/components/peek/Peek";

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty-state">
      <Peek size={64} state="empty" />
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}
