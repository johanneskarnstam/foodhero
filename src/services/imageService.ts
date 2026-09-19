type ImageSize = 'small' | 'medium' | 'large';

interface CacheEntry {
  url: string;
  timestamp: number;
}

const CACHE_KEY = 'recipeImageCache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 timmar

const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY;

/**
 * Hämtar en cachad bild-URL för en given sökterm, om den finns och inte har löpt ut.
 */
function getCachedImage(query: string): string | null {
  try {
    const cache = localStorage.getItem(CACHE_KEY);
    if (!cache) return null;

    const parsedCache: Record<string, CacheEntry> = JSON.parse(cache);
    const entry = parsedCache[query];

    if (entry && Date.now() - entry.timestamp < CACHE_EXPIRY) {
      return entry.url;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Sparar en bild-URL i cache för en given sökterm.
 */
function setCachedImage(query: string, url: string): void {
  try {
    const cache = localStorage.getItem(CACHE_KEY);
    const parsedCache: Record<string, CacheEntry> = cache ? JSON.parse(cache) : {};
    parsedCache[query] = { url, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(parsedCache));
  } catch {
    // Ignorera fel vid cache-sparande (t.ex. om localStorage är fullt)
  }
}

/**
 * Hämtar en bild-URL från Unsplash baserat på sökord och storlek.
 * Returnerar null om ingen bild hittas eller om API-anropet misslyckas.
 */
async function fetchUnsplashImage(query: string, size: ImageSize = 'medium'): Promise<string | null> {
  if (!UNSPLASH_ACCESS_KEY) {
    console.warn('Unsplash API-nyckel saknas.');
    return null;
  }

  try {
    // Anpassa bildstorlek baserat på parameter
    const width = size === 'small' ? 400 : size === 'medium' ? 600 : 800;
    const height = size === 'small' ? 300 : size === 'medium' ? 400 : 600;

    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&client_id=${UNSPLASH_ACCESS_KEY}&per_page=1&w=${width}&h=${height}`
    );

    if (!response.ok) {
      console.warn(`Unsplash API returnerade fel: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const imageUrl = data.results?.[0]?.urls?.regular;

    if (imageUrl) {
      // Lägg till cache
      setCachedImage(query, imageUrl);
      return imageUrl;
    }

    return null;
  } catch (error) {
    console.error('Fel vid hämtning från Unsplash:', error);
    return null;
  }
}

/**
 * Hämtar en bild-URL från Pexels baserat på sökord och storlek.
 * Returnerar null om ingen bild hittas eller om API-anropet misslyckas.
 */
async function fetchPexelsImage(query: string, size: ImageSize = 'medium'): Promise<string | null> {
  if (!PEXELS_API_KEY) {
    console.warn('Pexels API-nyckel saknas.');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`,
      {
        headers: {
          Authorization: PEXELS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      console.warn(`Pexels API returnerade fel: ${response.status}`);
      return null;
    }

    const data = await response.json();
    // Anpassa storlek baserat på parameter
    const sizeKey = size === 'small' ? 'small' : size === 'medium' ? 'medium' : 'large';
    const imageUrl = data.photos?.[0]?.src?.[sizeKey];

    if (imageUrl) {
      // Lägg till cache
      setCachedImage(query, imageUrl);
      return imageUrl;
    }

    return null;
  } catch (error) {
    console.error('Fel vid hämtning från Pexels:', error);
    return null;
  }
}

/**
 * Hämtar en bild-URL baserat på sökord och storlek.
 * Försöker först Unsplash, sedan Pexels om Unsplash misslyckas.
 * Använder cache om en bild redan har hämtats för samma sökterm.
 */
export async function fetchRecipeImage(
  query: string,
  size: ImageSize = 'medium'
): Promise<string | null> {
  // Kolla cache först
  const cachedUrl = getCachedImage(query);
  if (cachedUrl) {
    return cachedUrl;
  }

  // Försök Unsplash
  const unsplashUrl = await fetchUnsplashImage(query, size);
  if (unsplashUrl) {
    return unsplashUrl;
  }

  // Försök Pexels
  const pexelsUrl = await fetchPexelsImage(query, size);
  if (pexelsUrl) {
    return pexelsUrl;
  }

  return null;
}

/**
 * Hämtar en bild-URL med fallback från Unsplash till Pexels.
 * Samma som fetchRecipeImage men med explicit fallback-logik.
 */
export async function fetchRecipeImageWithFallback(
  query: string,
  size: ImageSize = 'medium'
): Promise<string | null> {
  return fetchRecipeImage(query, size);
}
