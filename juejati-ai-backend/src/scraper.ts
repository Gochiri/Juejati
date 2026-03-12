import dotenv from 'dotenv';
dotenv.config();

// Assuming the scraper is on the same Docker Swarm network.
const SCRAPER_API_URL = process.env.SCRAPER_API_URL || 'http://zonaprop-scraper:3000/api/search';

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
