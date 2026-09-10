import { GoogleGenerativeAI } from '@google/generative-ai';
import { Meal } from '../types';

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
function toUserFriendlyError(error: unknown): string {
    let message = 'Kunde inte generera recept. Kontrollera din prompt eller försök igen senare.';

    if (!(error instanceof Error)) return message;

    const raw = error.message.toLowerCase();

    if (raw.includes('api key not valid') || raw.includes('api_key_invalid')) {
        message = 'Ogiltig API-nyckel för AI-tjänsten. Vänligen kontrollera dina inställningar.';
    } else if (raw.includes('fetch failed') || raw.includes('network error') || raw.includes('failed to fetch')) {
        message = 'Nätverksfel: Kunde inte ansluta till AI-tjänsten. Kontrollera din internetanslutning.';
    } else if (raw.includes('429') || raw.includes('quota') || raw.includes('too many requests')) {
        message = 'Servern är överbelastad just nu. Vänligen vänta en liten stund och försök igen.';
    } else if (raw.includes('safety') || raw.includes('blocked')) {
        message = 'Din förfrågan blockades av säkerhetsskäl. Försök att formulera om texten.';
    } else if (raw.includes('invalid response format') || raw.includes('json')) {
        message = 'AI:n returnerade ett format vi inte kunde förstå. Vänligen försök med en annan beskrivning.';
    } else if (error.message.length < 100) {
        message = error.message.replace(/\[GoogleGenerativeAI Error\]:\s*/i, '');
    }

    return message;
}

/**
 * Hämtar och returnerar en konfigurerad Gemini-modell.
 */
function getModel() {
    const modelName = import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.6-flash';
    return genAI.getGenerativeModel({ model: modelName, systemInstruction: SYSTEM_INSTRUCTION });
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
        const model = getModel();
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const jsonString = extractJson(responseText);
        const data: unknown = JSON.parse(jsonString);

        if (!validateRecipe(data)) {
            throw new Error('Invalid response format from AI.');
        }

        return data;
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
        const model = getModel();
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const jsonString = extractJson(responseText);
        const data: unknown = JSON.parse(jsonString);

        if (!validateRecipe(data)) {
            throw new Error('Invalid response format from AI.');
        }

        return data;
    } catch (error) {
        console.error('Error enriching meal with AI:', error);
        throw new Error(toUserFriendlyError(error));
    }
};
