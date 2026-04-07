import dotenv from 'dotenv';
dotenv.config();

// Assuming the scraper is on the same Docker Swarm network.
const SCRAPER_API_URL = process.env.SCRAPER_API_URL || 'http://zonaprop-scraper:3000/api/search';
const SCRAPER_PUBLIC_URL = process.env.SCRAPER_PUBLIC_URL || 'https://catalogo.korvance.com';

export async function searchZonaPropScraper(filters: { tipo?: string, operacion?: string, barrio?: string }) {
  try {
    const res = await fetch(SCRAPER_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filters }),
    });

    if (!res.ok) {
      throw new Error(`Scraper Error: ${res.statusText}`);
    }

    const json = await res.json();
    return json.success ? json.data : [];
  } catch (err) {
    console.error('Failed to run fallback scraper:', err);
    return [];
  }
}

export function buildCatalogUrl(filters: { tipo?: string, operacion?: string, barrio?: string }): string {
  const params = new URLSearchParams();
  if (filters.tipo) params.set('tipo', filters.tipo.toLowerCase());
  if (filters.operacion) params.set('operacion', filters.operacion.toLowerCase());
  if (filters.barrio) params.set('barrio', filters.barrio.toLowerCase().replace(/\s+/g, '-'));
  return `${SCRAPER_PUBLIC_URL}/busqueda?${params.toString()}`;
}
