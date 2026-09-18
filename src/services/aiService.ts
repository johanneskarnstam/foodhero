import { GoogleGenerativeAI } from '@google/generative-ai';
import { Meal, AIModelOption, DEFAULT_GEMINI_MODEL, DEFAULT_GEMINI_MODELS } from '../types';

// Initierar API:et med nyckeln från miljövariabler
// Använder VITE_GEMINI_KEY med fallback till VITE_GEMINI_API_KEY
const apiKey = import.meta.env.VITE_GEMINI_KEY || import.meta.env.VITE_GEMINI_API_KEY || '';

const genAI = new GoogleGenerativeAI(apiKey);

export interface GeneratedRecipe {
    name: string;
    description: string;
    servings: number;
    tags: string[];
    ingredients: { text: string; amount: string }[];
    instructions: string[];
}

const SYSTEM_INSTRUCTION =
    'Du är en erfaren kock och receptskribent. Ta hänsyn till alla detaljer i användarens prompt. ' +
    'Svara ALLTID med ett strikt JSON-objekt med exakt dessa fält: ' +
    '{ "name": string, "description": string, "servings": number, "tags": string[], ' +
    '"ingredients": { "text": string, "amount": string }[], "instructions": string[] }. ' +
    'Ge inga förklaringar, kommentarer eller annan text utanför JSON-objektet.';

/**
 * Extraherar JSON-sträng från ett API-svar som eventuellt är inlindat i
 * ett markdown-kodblock (```json ... ```).
 */
function extractJson(responseText: string): string {
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    return jsonMatch ? jsonMatch[1].trim() : responseText.trim();
}

/**
 * Validerar att ett parsad objekt uppfyller GeneratedRecipe-strukturen.
 */
function validateRecipe(data: unknown): data is GeneratedRecipe {
    if (!data || typeof data !== 'object') return false;
    const d = data as Record<string, unknown>;
    return (
        typeof d.name === 'string' &&
        typeof d.description === 'string' &&
        typeof d.servings === 'number' &&
        Array.isArray(d.tags) &&
        Array.isArray(d.ingredients) &&
        Array.isArray(d.instructions)
    );
}

/**
 * Omvandlar ett API-fel till ett användarvänligt felmeddelande på svenska.
 */
/**
 * Avgör om ett fel är av typen som kan lösas genom att byta till en fallback-modell
 * (t.ex. 503 Service Unavailable, high demand, kapacitetsproblem).
 */
export function isRetryableError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    const raw = error.message.toLowerCase();
    return (
        raw.includes('503') ||
        raw.includes('high demand') ||
        raw.includes('capacity') ||
        raw.includes('unavailable') ||
        raw.includes('overloaded') ||
        raw.includes('service_unavailable')
    );
}

function toUserFriendlyError(error: unknown): string {
    let message = 'Kunde inte generera recept. Kontrollera din prompt eller försök igen senare.';

    if (!(error instanceof Error)) return message;

    const raw = error.message.toLowerCase();

    if (raw.includes('api key not valid') || raw.includes('api_key_invalid')) {
        message = 'Ogiltig API-nyckel för AI-tjänsten. Vänligen kontrollera dina inställningar.';
    } else if (raw.includes('fetch failed') || raw.includes('network error') || raw.includes('failed to fetch')) {
        message = 'Nätverksfel: Kunde inte ansluta till AI-tjänsten. Kontrollera din internetanslutning.';
    } else if (raw.includes('503') || raw.includes('high demand') || raw.includes('unavailable') || raw.includes('overloaded') || raw.includes('capacity')) {
        message = 'AI-modellen är tillfälligt överbelastad. Vänligen vänta en stund och försök igen.';
    } else if (raw.includes('429') || raw.includes('quota') || raw.includes('too many requests')) {
        message = 'Servern är överbelastad just nu. Vänligen vänta en liten stund och försök igen.';
    } else if (raw.includes('safety') || raw.includes('blocked')) {
        message = 'Din förfrågan blockerades av säkerhetsskäl. Försök att formulera om texten.';
    } else if (raw.includes('invalid response format') || raw.includes('json')) {
        message = 'AI:n returnerade ett format vi inte kunde förstå. Vänligen försök med en annan beskrivning.';
    } else if (error.message.length < 100) {
        message = error.message.replace(/\[GoogleGenerativeAI Error\]:\s*/i, '');
    }

    return message;
}

export const AI_MODEL_STORAGE_KEY = 'foodhero_ai_model';
export const AI_MODELS_CACHE_KEY = 'foodhero_gemini_models_cache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 timmar

export const FALLBACK_MODEL = 'gemini-2.5-flash';

/**
 * Returnerar det aktiva modell-ID:t baserat på följande prioritetsordning:
 * 1. Vald modell i localStorage (användarens manuella val)
 * 2. Miljövariabel VITE_GEMINI_MODEL
 * 3. Standardmodell (DEFAULT_GEMINI_MODEL = gemini-2.5-flash)
 */
export function getActiveModelId(): string {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            const stored = window.localStorage.getItem(AI_MODEL_STORAGE_KEY);
            if (stored && stored.trim()) {
                return stored.trim();
            }
        }
    } catch {
        // Ignorera fel om localStorage inte är tillgängligt
    }
    return import.meta.env.VITE_GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
}

interface GeminiApiModel {
    name: string;
    displayName?: string;
    description?: string;
    supportedGenerationMethods?: string[];
}

interface GeminiListModelsResponse {
    models?: GeminiApiModel[];
}

interface CachedModels {
    timestamp: number;
    models: AIModelOption[];
}

/**
 * Nyckelord för modeller som ska exkluderas från listan (t.ex. bild-, ljud-,
 * robotik-, embeddings- och icke-receptmodeller som Nano Banana).
 */
export const EXCLUDED_MODEL_KEYWORDS = [
    'embedding',
    'aqa',
    'image',
    'banana',
    'imagen',
    'tts',
    'audio',
    'transcribe',
    'robotics',
    'computer-use',
    'customtools',
    'vision',
];

/**
 * Beräknar en poäng för en Gemini-modell för att rangordna dem med den bästa/mest lämpliga
 * längst upp i fallande skala.
 */
export function calculateModelScore(id: string): number {
    const cleanId = id.toLowerCase();
    let score = 0;

    // 1. Extrahera version: t.ex. 3.8 -> 3800, 2.5 -> 2500
    const vMatch = cleanId.match(/(\d+)(?:\.(\d+))?/);
    if (vMatch) {
        const major = parseInt(vMatch[1], 10);
        const minor = vMatch[2] ? parseInt(vMatch[2], 10) : 0;
        score += major * 1000 + minor * 100;
    } else if (cleanId.includes('latest')) {
        score += 3650;
    }

    // 2. Tier-poäng: Flash är optimal för snabb receptgenerering och JSON-struktur, Pro för resonemang
    if (cleanId.includes('flash') && !cleanId.includes('lite')) {
        score += 90;
    } else if (cleanId.includes('pro')) {
        score += 85;
    } else if (cleanId.includes('lite')) {
        score += 25;
    }

    // 3. Avdrag för tidiga preview-versioner gentemot stabila releaser
    if (cleanId.includes('preview')) {
        score -= 15;
    }

    return score;
}

export interface ModelDescriptionInfo {
    name: string;
    description: string;
    badge?: string;
}

/**
 * Returnerar en koncis sammanfattning av vad en modell är särskilt bra på,
 * inklusive en passande badge/etikett.
 */
export function getModelMetadata(cleanId: string, displayName?: string): ModelDescriptionInfo {
    const lower = cleanId.toLowerCase();
    const formattedName = displayName || cleanId;

    if (lower.includes('3.8-flash')) {
        return {
            name: formattedName,
            badge: 'Toppval',
            description: 'Googles senaste flaggskepp. Blixtsnabb med överlägsen förmåga för kreativa recept och precisa mått.',
        };
    }
    if (lower.includes('3.7-flash')) {
        return {
            name: formattedName,
            badge: 'Snabb & modern',
            description: 'Mycket snabb och modern modell med hög precision för vardagsmat och anpassade instruktioner.',
        };
    }
    if (lower.includes('3.6-flash')) {
        return {
            name: formattedName,
            badge: 'Snabb & modern',
            description: 'Modern och högpresterande modell optimerad för snabbhet och strukturerad data.',
        };
    }
    if (lower === 'gemini-flash-latest') {
        return {
            name: formattedName,
            badge: 'Auto-uppdaterad',
            description: 'Pekar alltid automatiskt på Googles senaste stabila Flash-modell för snabb receptgenerering.',
        };
    }
    if (lower === 'gemini-pro-latest') {
        return {
            name: formattedName,
            badge: 'Resonemang',
            description: 'Pekar alltid på Googles senaste stabila Pro-modell för djupgående analys och receptstöd.',
        };
    }
    if (lower.includes('3.1-pro') || lower.includes('3-pro')) {
        return {
            name: formattedName,
            badge: 'Resonemang',
            description: 'Avancerat resonemang och hög detaljrikedom för komplexa menyer och precisa näringsberäkningar.',
        };
    }
    if (lower.includes('2.5-pro') || lower.includes('pro')) {
        return {
            name: formattedName,
            badge: 'Resonemang',
            description: 'Hög resonemangsförmåga för detaljerade recept, ingredienssubstitution och svåra tekniker.',
        };
    }
    if (lower.includes('3.5-flash')) {
        return {
            name: formattedName,
            badge: 'Snabb',
            description: 'Stabil och snabb modell med bra balans mellan svarstid och receptkvalitet.',
        };
    }
    if (lower.includes('2.5-flash') && !lower.includes('lite')) {
        return {
            name: formattedName,
            badge: 'Stabil',
            description: 'Beprövad standardmodell med jämn och pålitlig leverans av vardagsrecept.',
        };
    }
    if (lower.includes('lite')) {
        return {
            name: formattedName,
            badge: 'Lättvikt',
            description: 'Ultrasnabb och resurssnål modell optimerad för korta svar och snabba idéer.',
        };
    }
    if (lower.includes('omni')) {
        return {
            name: formattedName,
            badge: 'Multimodal',
            description: 'Mångsidig och snabb modell med bred förståelse för mångfacetterade uppgifter.',
        };
    }
    if (lower.includes('preview')) {
        return {
            name: formattedName,
            badge: 'Förhandsvisning',
            description: 'Tidig förhandsversion av kommande modellgeneration från Google.',
        };
    }

    return {
        name: formattedName,
        badge: lower.includes('flash') ? 'Snabb' : undefined,
        description: 'Google Gemini-modell för text- och receptgenerering.',
    };
}

/**
 * Hämtar tillgängliga Gemini-modeller via Googles REST API och filtrerar
 * fram de som stöder generateContent. Faller tillbaka på standardmodeller
 * om API-nyckel saknas, nätverket är offline eller fel uppstår.
 */
export async function fetchAvailableGeminiModels(forceRefresh = false): Promise<AIModelOption[]> {
    // 1. Kontrollera cache om inte tvingad omläsning
    if (!forceRefresh) {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                const cachedStr = window.localStorage.getItem(AI_MODELS_CACHE_KEY);
                if (cachedStr) {
                    const parsed: CachedModels = JSON.parse(cachedStr);
                    if (parsed.timestamp && Array.isArray(parsed.models) && parsed.models.length > 0) {
                        const isFresh = Date.now() - parsed.timestamp < CACHE_TTL_MS;
                        if (isFresh) {
                            const cleanedCached = parsed.models
                                .filter(m => !EXCLUDED_MODEL_KEYWORDS.some(kw => m.id.toLowerCase().includes(kw)))
                                .map(m => {
                                    const meta = getModelMetadata(m.id, m.name);
                                    return {
                                        ...m,
                                        badge: m.badge || meta.badge,
                                        description: (m.description && m.description !== m.name && m.description !== m.id && !m.description.toLowerCase().includes('google gemini ai'))
                                            ? m.description
                                            : meta.description,
                                    };
                                });
                            if (cleanedCached.length > 0) {
                                return cleanedCached;
                            }
                        }
                    }
                }
            }
        } catch {
            // Fortsätt till API-anrop vid cache-läsningsfel
        }
    }

    if (!apiKey) {
        return DEFAULT_GEMINI_MODELS;
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );

        if (!response.ok) {
            console.warn(`Gemini API svarade med status ${response.status} vid hämtning av modeller.`);
            return DEFAULT_GEMINI_MODELS;
        }

        const data: GeminiListModelsResponse = await response.json();
        if (!data.models || !Array.isArray(data.models)) {
            return DEFAULT_GEMINI_MODELS;
        }

        const filteredModels: AIModelOption[] = data.models
            .filter(m => {
                const hasGenerateContent = m.supportedGenerationMethods?.includes('generateContent');
                const rawName = m.name.toLowerCase();
                const displayName = (m.displayName || '').toLowerCase();
                const isGemini = rawName.includes('gemini');
                const isExcluded = EXCLUDED_MODEL_KEYWORDS.some(
                    kw => rawName.includes(kw) || displayName.includes(kw)
                );
                return hasGenerateContent && isGemini && !isExcluded;
            })
            .map(m => {
                const cleanId = m.name.replace(/^models\//, '');
                const metadata = getModelMetadata(cleanId, m.displayName);
                return {
                    id: cleanId,
                    name: metadata.name,
                    description: metadata.description,
                    badge: metadata.badge,
                    isOnline: true,
                };
            });

        if (filteredModels.length === 0) {
            return DEFAULT_GEMINI_MODELS;
        }

        // Sortera: Bäst längst upp i fallande skala baserat på calculateModelScore
        filteredModels.sort((a, b) => {
            const scoreA = calculateModelScore(a.id);
            const scoreB = calculateModelScore(b.id);
            if (scoreA !== scoreB) {
                return scoreB - scoreA;
            }
            return a.id.localeCompare(b.id);
        });

        // Spara i cache
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                const cachePayload: CachedModels = {
                    timestamp: Date.now(),
                    models: filteredModels,
                };
                window.localStorage.setItem(AI_MODELS_CACHE_KEY, JSON.stringify(cachePayload));
            }
        } catch {
            // Ignorera lagringsfel
        }

        return filteredModels;
    } catch (error) {
        console.warn('Kunde inte hämta dynamiska modeller från Gemini API, använder förvalda modeller:', error);
        return DEFAULT_GEMINI_MODELS;
    }
}

/**
 * Hämtar och returnerar en konfigurerad Gemini-modell.
 */
function getModel(modelName?: string) {
    const name = modelName || getActiveModelId();
    return genAI.getGenerativeModel({ model: name, systemInstruction: SYSTEM_INSTRUCTION });
}

/**
 * Anropar Gemini med automatisk fallback till alternativ modell vid retryable-fel.
 * Försöker först med primärmodellen, och om felet är av retryable-typ (503, high demand, etc.)
 * görs ett nytt försök med fallback-modellen.
 */
async function callWithFallback(prompt: string): Promise<GeneratedRecipe> {
    try {
        const model = getModel();
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const jsonString = extractJson(responseText);
        const data: unknown = JSON.parse(jsonString);

        if (!validateRecipe(data)) {
            throw new Error('Invalid response format from AI.');
        }

        return data;
    } catch (primaryError) {
        if (isRetryableError(primaryError)) {
            const activeModel = getActiveModelId();
            console.warn(`Primärmodell (${activeModel}) gav retryable-fel, försöker med fallback (${FALLBACK_MODEL})...`);
            const fallbackModel = getModel(FALLBACK_MODEL);
            const result = await fallbackModel.generateContent(prompt);
            const responseText = result.response.text();
            const jsonString = extractJson(responseText);
            const data: unknown = JSON.parse(jsonString);

            if (!validateRecipe(data)) {
                throw new Error('Invalid response format from AI.');
            }

            return data;
        }
        throw primaryError;
    }
}

/**
 * Genererar ett komplett recept baserat på en fri textprompt.
 * Returnerar ett GeneratedRecipe-objekt med namn, beskrivning, portioner,
 * taggar, ingredienser och instruktioner.
 *
 * @throws Error med användarvänligt felmeddelande om anropet misslyckas.
 */
export const generateRecipe = async (prompt: string): Promise<GeneratedRecipe> => {
    if (!apiKey) {
        throw new Error('Ingen API-nyckel hittades. Vänligen lägg till VITE_GEMINI_KEY i din .env-fil.');
    }

    try {
        return await callWithFallback(prompt);
    } catch (error) {
        console.error('Error generating recipe with AI:', error);
        throw new Error(toUserFriendlyError(error));
    }
};

/**
 * Berikar en befintlig måltid som saknar ingredienser eller instruktioner
 * genom att be Gemini fylla i saknad data baserat på måltidsobjektets kontext.
 * Skickar befintliga fält (namn, beskrivning, taggar, portioner) som kontext
 * till modellen.
 *
 * @throws Error med användarvänligt felmeddelande om anropet misslyckas.
 */
export const enrichMeal = async (meal: Partial<Meal>): Promise<GeneratedRecipe> => {
    if (!apiKey) {
        throw new Error('Ingen API-nyckel hittades. Vänligen lägg till VITE_GEMINI_KEY i din .env-fil.');
    }

    const contextParts: string[] = [];
    if (meal.name) contextParts.push(`Maträttens namn: "${meal.name}"`);
    if (meal.description) contextParts.push(`Beskrivning: "${meal.description}"`);
    if (meal.servings) contextParts.push(`Antal portioner: ${meal.servings}`);
    if (meal.tags?.length) contextParts.push(`Taggar: ${meal.tags.join(', ')}`);
    if (meal.ingredients?.length) {
        const ingList = meal.ingredients.map(i => `${i.amount ? i.amount + ' ' : ''}${i.text}`).join(', ');
        contextParts.push(`Befintliga ingredienser: ${ingList}`);
    }
    if (meal.instructions?.length) {
        contextParts.push(`Befintliga instruktioner: ${meal.instructions.join(' | ')}`);
    }

    const prompt =
        `Fyll i ett komplett recept baserat på följande information:\n${contextParts.join('\n')}\n\n` +
        'Ge tillbaka ett fullständigt recept med alla fält ifyllda. ' +
        'Behåll befintliga värden om de redan är korrekta, komplettera det som saknas.';

    try {
        return await callWithFallback(prompt);
    } catch (error) {
        console.error('Error enriching meal with AI:', error);
        throw new Error(toUserFriendlyError(error));
    }
};
