import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

// Sökordning för källfil om ingen anges som argument
const DEFAULT_CANDIDATES = [
    'public/FoodHero-icon.png',
    'public/icon_foodhero.svg',
    'public/icon.svg',
    'public/icon.png',
];

// Definition av alla ikoner som ska genereras
const ICON_DEFINITIONS = [
    { name: 'favicon.png', size: 128, maskable: false, opaque: false },
    { name: 'apple-touch-icon.png', size: 180, maskable: false, opaque: true },
    { name: 'pwa-192x192.png', size: 192, maskable: false, opaque: false },
    { name: 'pwa-512x512.png', size: 512, maskable: false, opaque: false },
    { name: 'pwa-maskable-192x192.png', size: 192, maskable: true, opaque: true },
    { name: 'pwa-maskable-512x512.png', size: 512, maskable: true, opaque: true },
    { name: 'icon.png', size: 512, maskable: false, opaque: false },
];

async function resolveInputFile() {
    const customArg = process.argv[2];
    if (customArg) {
        const resolved = path.isAbsolute(customArg) ? customArg : path.join(rootDir, customArg);
        if (fs.existsSync(resolved)) {
            return resolved;
        }
        console.error(`❌ Angiven fil hittades inte: ${customArg}`);
        process.exit(1);
    }

    for (const candidate of DEFAULT_CANDIDATES) {
        const candidatePath = path.join(rootDir, candidate);
        if (fs.existsSync(candidatePath)) {
            return candidatePath;
        }
    }

    console.error('❌ Ingen standardfil hittades i public/ (FoodHero-icon.png, icon_foodhero.svg etc.)');
    console.error('Användning: npm run generate-icons -- <sökväg-till-bild-eller-svg>');
    process.exit(1);
}

async function getBackgroundColor(sharpInstance, metadata) {
    try {
        if (!metadata.hasAlpha) {
            // Hämta färgen från övre vänstra hörnet för sömlös bakgrund vid maskable
            const { data } = await sharpInstance.clone().raw().toBuffer({ resolveWithObject: true });
            return {
                r: data[0] ?? 255,
                g: data[1] ?? 255,
                b: data[2] ?? 255,
                alpha: 1,
            };
        }
    } catch {
        // Fallback till vit
    }
    return { r: 255, g: 255, b: 255, alpha: 1 };
}

async function generateIcons() {
    const inputPath = await resolveInputFile();
    const relativeInput = path.relative(rootDir, inputPath);
    console.log(`\n🎨 Läser källfil: ${relativeInput}`);

    const isSvg = inputPath.toLowerCase().endsWith('.svg');
    const inputBuffer = fs.readFileSync(inputPath);
    const baseSharp = isSvg ? sharp(inputBuffer, { density: 300 }) : sharp(inputBuffer);
    const metadata = await baseSharp.metadata();

    console.log(`ℹ️  Format: ${metadata.format?.toUpperCase() || 'Okänt'} (${metadata.width}x${metadata.height}px)`);

    if (!isSvg && metadata.width && metadata.width < 512) {
        console.warn(`⚠️  Varning: Bilden är under 512x512px (${metadata.width}x${metadata.height}px). Ikoner kan bli oskarpa.`);
    }

    const bgColor = await getBackgroundColor(baseSharp, metadata);
    console.log(`🎨 Bakgrundsfärg för iOS/Maskable: rgb(${bgColor.r}, ${bgColor.g}, ${bgColor.b})\n`);

    console.log('🚀 Genererar ikoner till public/:');
    console.log('---------------------------------------------------------');

    for (const icon of ICON_DEFINITIONS) {
        const outputPath = path.join(publicDir, icon.name);
        const { size, maskable, opaque } = icon;

        let pipeline;

        if (maskable) {
            // Safe Zone för Android: Skala grafiken till 80% och centrera på bakgrunden
            const innerSize = Math.round(size * 0.8);
            const innerBuffer = await (isSvg ? sharp(inputBuffer, { density: 300 }) : sharp(inputBuffer))
                .resize(innerSize, innerSize, { fit: 'contain', background: bgColor })
                .png()
                .toBuffer();

            pipeline = sharp({
                create: {
                    width: size,
                    height: size,
                    channels: 4,
                    background: bgColor,
                },
            }).composite([
                {
                    input: innerBuffer,
                    gravity: 'center',
                },
            ]);
        } else {
            pipeline = isSvg ? sharp(inputBuffer, { density: 300 }) : sharp(inputBuffer);
            pipeline = pipeline.resize(size, size, { fit: 'cover' });

            if (opaque && metadata.hasAlpha) {
                // Förhindra kolsvart bakgrund på iOS om bilden har transparens
                pipeline = pipeline.flatten({ background: bgColor });
            }
        }

        await pipeline.png({ quality: 95, compressionLevel: 9 }).toFile(outputPath);

        const stats = fs.statSync(outputPath);
        const kbSize = (stats.size / 1024).toFixed(1);
        const tag = maskable ? '[Android Maskable 80%]' : opaque ? '[iOS Solid]' : '[Standard]';
        console.log(`  ✓ ${icon.name.padEnd(26)} ${`${size}x${size}`.padEnd(10)} ${`${kbSize} kB`.padStart(8)}  ${tag}`);
    }

    console.log('---------------------------------------------------------');
    console.log('✅ Samtliga ikoner genererade med framgång!\n');
}

generateIcons().catch((err) => {
    console.error('❌ Fel vid generering av ikoner:', err);
    process.exit(1);
});
