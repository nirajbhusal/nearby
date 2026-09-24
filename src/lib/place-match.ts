/**
 * Overlap between a place string and a location/city.
 * Short tokens ("la", "sf", "us") match only as a whole string so they
 * do not hit unrelated names ("dallas", "austin", "kuala lumpur").
 */
export function phraseOverlaps(a: string, b: string): boolean {
  const left = a.trim().toLowerCase();
  const right = b.trim().toLowerCase();
  if (!left || !right) return false;
  if (left === right) return true;
  return containsPhrase(left, right) || containsPhrase(right, left);
}

function containsPhrase(haystack: string, needle: string): boolean {
  if (needle.length < 3) return false;
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`).test(
    haystack
  );
}
