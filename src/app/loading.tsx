export default function Loading() {
  return (
    <main className="page-wrap" aria-busy="true" aria-label="Loading">
      <div className="skeleton-block" />
      <div className="skeleton-line" />
      <div className="skeleton-line short" />
      <div className="skeleton-grid">
        <div className="skeleton-block" />
        <div className="skeleton-block" />
      </div>
    </main>
  );
}
