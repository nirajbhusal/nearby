export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      address?: {
        city?: string;
        town?: string;
        village?: string;
        suburb?: string;
        state?: string;
        country?: string;
      };
    };
    const a = data.address ?? {};
    const city = a.city || a.town || a.village || a.suburb;
    if (city && a.state) return `${city}, ${a.state}`;
    if (city) return city;
    if (a.state) return a.state;
    return null;
  } catch {
    return null;
  }
}
