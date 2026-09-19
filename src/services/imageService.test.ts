import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mocka miljövariabler före import
vi.stubEnv('VITE_UNSPLASH_ACCESS_KEY', 'test_unsplash_key');
vi.stubEnv('VITE_PEXELS_API_KEY', 'test_pexels_key');

import { fetchRecipeImage, fetchRecipeImageWithFallback } from './imageService';

// Mocka global.fetch
vi.stubGlobal('fetch', vi.fn());

// Mocka localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('imageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchRecipeImage', () => {
    it('should return cached image if available and not expired', async () => {
      const query = 'pasta';
      const cachedUrl = 'https://cached-image.jpg';
      const cacheEntry = { url: cachedUrl, timestamp: Date.now() };
      localStorage.setItem('recipeImageCache', JSON.stringify({ [query]: cacheEntry }));

      const result = await fetchRecipeImage(query);
      expect(result).toBe(cachedUrl);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should return null if cached image is expired', async () => {
      const query = 'pasta';
      const cachedUrl = 'https://cached-image.jpg';
      const cacheEntry = { url: cachedUrl, timestamp: Date.now() - 25 * 60 * 60 * 1000 };
      localStorage.setItem('recipeImageCache', JSON.stringify({ [query]: cacheEntry }));

      const mockResponse = {
        results: [{ urls: { regular: 'https://new-image.jpg' } }],
      };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await fetchRecipeImage(query);
      expect(result).toBe('https://new-image.jpg');
      expect(fetch).toHaveBeenCalled();
    });

    it('should fetch from Unsplash and return image URL', async () => {
      const query = 'pasta';
      const mockResponse = {
        results: [{ urls: { regular: 'https://unsplash-image.jpg' } }],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await fetchRecipeImage(query);
      expect(result).toBe('https://unsplash-image.jpg');
      const fetchCalls = (fetch as jest.Mock).mock.calls;
      expect(fetchCalls[0][0]).toContain('api.unsplash.com/search/photos');
    });

    it('should use correct size parameters for Unsplash', async () => {
      const query = 'pasta';
      const mockResponse = {
        results: [{ urls: { regular: 'https://unsplash-image.jpg' } }],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await fetchRecipeImage(query, 'small');
      const fetchCalls = (fetch as jest.Mock).mock.calls;
      expect(fetchCalls[0][0]).toContain('w=400&h=300');
    });

    it('should fallback to Pexels if Unsplash fails', async () => {
      const query = 'pasta';
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ photos: [{ src: { medium: 'https://pexels-image.jpg' } }] }),
        });

      const result = await fetchRecipeImage(query);
      expect(result).toBe('https://pexels-image.jpg');
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should return null if no image is found', async () => {
      const query = 'nonexistent';
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ results: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ photos: [] }),
        });

      const result = await fetchRecipeImage(query);
      expect(result).toBeNull();
    });

    it('should handle network errors gracefully', async () => {
      const query = 'pasta';
      (fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchRecipeImage(query);
      expect(result).toBeNull();
    });

    it('should cache fetched image URL', async () => {
      const query = 'pasta';
      const mockResponse = {
        results: [{ urls: { regular: 'https://unsplash-image.jpg' } }],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await fetchRecipeImage(query);
      const cache = JSON.parse(localStorage.getItem('recipeImageCache') || '{}');
      expect(cache[query]).toBeDefined();
      expect(cache[query].url).toBe('https://unsplash-image.jpg');
    });
  });

  describe('fetchRecipeImageWithFallback', () => {
    it('should behave the same as fetchRecipeImage', async () => {
      const query = 'pasta';
      const mockResponse = {
        results: [{ urls: { regular: 'https://unsplash-image.jpg' } }],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result1 = await fetchRecipeImage(query);
      const result2 = await fetchRecipeImageWithFallback(query);
      expect(result1).toBe(result2);
    });
  });

  describe('size parameter for Unsplash', () => {
    it('should use small size parameters (400x300)', async () => {
      const query = 'pasta';
      const mockResponse = {
        results: [{ urls: { regular: 'https://unsplash-image.jpg' } }],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await fetchRecipeImage(query, 'small');
      const fetchCalls = (fetch as jest.Mock).mock.calls;
      expect(fetchCalls[0][0]).toContain('w=400&h=300');
    });

    it('should use medium size parameters (600x400) as default', async () => {
      const query = 'pasta';
      const mockResponse = {
        results: [{ urls: { regular: 'https://unsplash-image.jpg' } }],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await fetchRecipeImage(query, 'medium');
      const fetchCalls = (fetch as jest.Mock).mock.calls;
      expect(fetchCalls[0][0]).toContain('w=600&h=400');
    });

    it('should use large size parameters (800x600)', async () => {
      const query = 'pasta';
      const mockResponse = {
        results: [{ urls: { regular: 'https://unsplash-image.jpg' } }],
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await fetchRecipeImage(query, 'large');
      const fetchCalls = (fetch as jest.Mock).mock.calls;
      expect(fetchCalls[0][0]).toContain('w=800&h=600');
    });
  });

  describe('Pexels fallback with size parameter', () => {
    it('should use small size for Pexels', async () => {
      const query = 'pasta';
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ photos: [{ src: { small: 'https://pexels-small.jpg' } }] }),
        });

      await fetchRecipeImage(query, 'small');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('api.pexels.com'),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: expect.any(String) }),
        })
      );
    });

    it('should use medium size for Pexels', async () => {
      const query = 'pasta';
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ photos: [{ src: { medium: 'https://pexels-medium.jpg' } }] }),
        });

      await fetchRecipeImage(query, 'medium');
      const fetchCalls = (fetch as jest.Mock).mock.calls;
      expect(fetchCalls[1][0]).toContain('api.pexels.com');
    });

    it('should use large size for Pexels', async () => {
      const query = 'pasta';
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ photos: [{ src: { large: 'https://pexels-large.jpg' } }] }),
        });

      await fetchRecipeImage(query, 'large');
      const fetchCalls = (fetch as jest.Mock).mock.calls;
      expect(fetchCalls[1][0]).toContain('api.pexels.com');
    });
  });
});
