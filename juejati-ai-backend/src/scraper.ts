import dotenv from 'dotenv';
dotenv.config();

// Assuming the scraper is on the same Docker Swarm network.
const SCRAPER_API_URL = process.env.SCRAPER_API_URL || 'http://zonaprop-scraper:3000/api/search';
const SCRAPER_PUBLIC_URL = process.env.SCRAPER_PUBLIC_URL || 'https://catalogo.korvance.com';

function ambientesToZonapropString(n: number): string {
  if (n <= 1) return 'monoambiente';
  if (n >= 5) return 'mas-de-4-ambientes';
  return `${n}-ambientes`;
}

export async function searchZonaPropScraper(filters: { tipo?: string, operacion?: string, barrio?: string, ambientes?: number, presupuesto?: number }) {
  const scraperFilters: Record<string, string> = {};
  if (filters.tipo) scraperFilters.tipo = filters.tipo;
  if (filters.operacion) scraperFilters.operacion = filters.operacion;
  if (filters.barrio) scraperFilters.barrio = filters.barrio;
  if (filters.ambientes) scraperFilters.ambientes = ambientesToZonapropString(filters.ambientes);
  if (filters.presupuesto) {
    scraperFilters.precioMin = String(Math.round(filters.presupuesto * 0.9));
    scraperFilters.precioMax = String(Math.round(filters.presupuesto * 1.1));
    scraperFilters.moneda = 'usd';
  }

  try {
    const res = await fetch(SCRAPER_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filters: scraperFilters }),
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

export function buildCatalogUrl(filters: { tipo?: string, operacion?: string, barrio?: string, ambientes?: number, presupuesto?: number }): string {
  const params = new URLSearchParams();
  if (filters.tipo) params.set('tipo', filters.tipo.toLowerCase());
  if (filters.operacion) params.set('operacion', filters.operacion.toLowerCase());
  if (filters.barrio) params.set('barrio', filters.barrio.toLowerCase().replace(/\s+/g, '-'));
  if (filters.ambientes) params.set('ambientes', ambientesToZonapropString(filters.ambientes));
  if (filters.presupuesto) {
    params.set('precioMin', String(Math.round(filters.presupuesto * 0.9)));
    params.set('precioMax', String(Math.round(filters.presupuesto * 1.1)));
    params.set('moneda', 'usd');
  }
  return `${SCRAPER_PUBLIC_URL}/busqueda?${params.toString()}`;
}
