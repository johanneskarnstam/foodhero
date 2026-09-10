import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGenerateContent = vi.fn();

vi.mock('@google/generative-ai', () => {
    return {
        GoogleGenerativeAI: class {
            getGenerativeModel() {
                return {
                    generateContent: mockGenerateContent,
                };
            }
        },
    };
});

// Hjälpfunktion för att bygga ett giltigt GeneratedRecipe-svar
function makeRecipePayload(overrides: Record<string, unknown> = {}) {
    return {
        name: 'Laxpasta',
        description: 'En krämig och god laxpasta.',
        servings: 4,
        tags: ['Snabbt', 'Fisk'],
        ingredients: [
            { text: 'Lax', amount: '400g' },
            { text: 'Pasta', amount: '300g' },
        ],
        instructions: ['Koka pasta.', 'Stek lax.', 'Blanda ihop.'],
        ...overrides,
    };
}

describe('aiService - generateRecipe', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
    });

    it('kastar ett användarvänligt fel när ingen API-nyckel finns', async () => {
        vi.stubEnv('VITE_GEMINI_KEY', '');
        vi.stubEnv('VITE_GEMINI_API_KEY', '');

        const { generateRecipe } = await import('./aiService');
        await expect(generateRecipe('laxpasta')).rejects.toThrow(/API-nyckel/);
    });

    it('returnerar GeneratedRecipe vid lyckat API-svar', async () => {
        vi.stubEnv('VITE_GEMINI_KEY', 'test-api-key');

        const payload = makeRecipePayload();
        mockGenerateContent.mockResolvedValueOnce({
            response: { text: () => JSON.stringify(payload) },
        });

        const { generateRecipe } = await import('./aiService');
        const result = await generateRecipe('laxpasta för 4 personer');

        expect(result.name).toBe('Laxpasta');
        expect(result.servings).toBe(4);
        expect(result.ingredients).toHaveLength(2);
        expect(result.instructions).toHaveLength(3);
    });

    it('parsar JSON inlindad i markdown-kodblock', async () => {
        vi.stubEnv('VITE_GEMINI_KEY', 'test-api-key');

        const payload = makeRecipePayload();
        const markdownWrapped = '```json\n' + JSON.stringify(payload) + '\n```';
        mockGenerateContent.mockResolvedValueOnce({
            response: { text: () => markdownWrapped },
        });

        const { generateRecipe } = await import('./aiService');
        const result = await generateRecipe('laxpasta');

        expect(result.name).toBe('Laxpasta');
        expect(result.tags).toEqual(['Snabbt', 'Fisk']);
    });

    it('kastar användarvänligt fel vid nätverksfel (fetch failed)', async () => {
        vi.stubEnv('VITE_GEMINI_KEY', 'test-api-key');

        mockGenerateContent.mockRejectedValueOnce(new Error('fetch failed'));

        const { generateRecipe } = await import('./aiService');
        await expect(generateRecipe('test')).rejects.toThrow(/Nätverksfel/);
    });

    it('kastar användarvänligt fel vid rate-limit / quota exceeded', async () => {
        vi.stubEnv('VITE_GEMINI_KEY', 'test-api-key');

        mockGenerateContent.mockRejectedValueOnce(new Error('429 quota exceeded'));

        const { generateRecipe } = await import('./aiService');
        await expect(generateRecipe('test')).rejects.toThrow(/överbelastad/);
    });

    it('kastar användarvänligt fel vid ogiltig API-nyckel', async () => {
        vi.stubEnv('VITE_GEMINI_KEY', 'bad-key');

        mockGenerateContent.mockRejectedValueOnce(new Error('api key not valid'));

        const { generateRecipe } = await import('./aiService');
        await expect(generateRecipe('test')).rejects.toThrow(/Ogiltig API-nyckel/);
    });

    it('kastar användarvänligt fel när innehållet blockeras av säkerhetsskäl', async () => {
        vi.stubEnv('VITE_GEMINI_KEY', 'test-key');

        mockGenerateContent.mockRejectedValueOnce(new Error('content blocked by safety filters'));

        const { generateRecipe } = await import('./aiService');
        await expect(generateRecipe('test')).rejects.toThrow(/blockades/);
    });

    it('kastar användarvänligt fel när JSON-svaret saknar obligatoriska fält', async () => {
        vi.stubEnv('VITE_GEMINI_KEY', 'test-api-key');

        // Saknar ingredients och instructions
        mockGenerateContent.mockResolvedValueOnce({
            response: { text: () => JSON.stringify({ name: 'Oops', description: 'Saknar fält', servings: 2 }) },
        });

        const { generateRecipe } = await import('./aiService');
        await expect(generateRecipe('test')).rejects.toThrow(/format/i);
    });

    it('kastar användarvänligt fel vid ogiltigt JSON', async () => {
        vi.stubEnv('VITE_GEMINI_KEY', 'test-api-key');

        mockGenerateContent.mockResolvedValueOnce({
            response: { text: () => 'detta är inte json' },
        });

        const { generateRecipe } = await import('./aiService');
        await expect(generateRecipe('test')).rejects.toThrow();
    });
});

describe('aiService - enrichMeal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
    });

    it('kastar ett användarvänligt fel när ingen API-nyckel finns', async () => {
        vi.stubEnv('VITE_GEMINI_KEY', '');
        vi.stubEnv('VITE_GEMINI_API_KEY', '');

        const { enrichMeal } = await import('./aiService');
        await expect(enrichMeal({ name: 'Köttbullar' })).rejects.toThrow(/API-nyckel/);
    });

    it('returnerar GeneratedRecipe vid lyckat API-svar med kontextdata', async () => {
        vi.stubEnv('VITE_GEMINI_KEY', 'test-api-key');

        const payload = makeRecipePayload({
            name: 'Köttbullar med potatismos',
            description: 'Klassisk svensk husmanskost.',
            servings: 4,
            tags: ['Husman', 'Kött'],
        });
        mockGenerateContent.mockResolvedValueOnce({
            response: { text: () => JSON.stringify(payload) },
        });

        const { enrichMeal } = await import('./aiService');
        const result = await enrichMeal({
            name: 'Köttbullar med potatismos',
            description: 'Klassisk husmanskost',
            servings: 4,
            tags: ['Husman'],
        });

        expect(result.name).toBe('Köttbullar med potatismos');
        expect(result.ingredients).toHaveLength(2);
        expect(result.instructions).toHaveLength(3);
    });

    it('fungerar med ett måltidsobjekt som bara har ett namn', async () => {
        vi.stubEnv('VITE_GEMINI_KEY', 'test-api-key');

        const payload = makeRecipePayload({ name: 'Pannkakor' });
        mockGenerateContent.mockResolvedValueOnce({
            response: { text: () => JSON.stringify(payload) },
        });

        const { enrichMeal } = await import('./aiService');
        const result = await enrichMeal({ name: 'Pannkakor' });

        expect(result.name).toBe('Pannkakor');
    });

    it('inkluderar befintliga ingredienser i promptkontexten', async () => {
        vi.stubEnv('VITE_GEMINI_KEY', 'test-api-key');

        const payload = makeRecipePayload();
        mockGenerateContent.mockResolvedValueOnce({
            response: { text: () => JSON.stringify(payload) },
        });

        const { enrichMeal } = await import('./aiService');
        await enrichMeal({
            name: 'Laxpasta',
            ingredients: [{ text: 'Lax', amount: '400g', checkIfExistAtHome: false }],
        });

        // Kontrollerar att mockGenerateContent anropades (med ingrediensinfo i prompten)
        expect(mockGenerateContent).toHaveBeenCalledOnce();
        const calledPrompt = mockGenerateContent.mock.calls[0][0] as string;
        expect(calledPrompt).toContain('Lax');
    });

    it('kastar användarvänligt fel vid nätverksfel', async () => {
        vi.stubEnv('VITE_GEMINI_KEY', 'test-api-key');

        mockGenerateContent.mockRejectedValueOnce(new Error('network error'));

        const { enrichMeal } = await import('./aiService');
        await expect(enrichMeal({ name: 'Test' })).rejects.toThrow(/Nätverksfel/);
    });
});
