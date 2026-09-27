"use client";

export function DetailSheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="detail-layer">
      <button type="button" className="more-scrim" aria-label="Close details" onClick={onClose} />
      <div className="detail-sheet" role="dialog" aria-modal="true" aria-label={title}>
        {children}
      </div>
    </div>
  );
}
