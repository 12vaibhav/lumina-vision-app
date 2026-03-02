import { GenerationConfig, LightingMode } from "../types";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Status callback type for UI updates
export type StatusCallback = (message: string) => void;

/**
 * Generate an interior design preview using Puter.js + Gemini image models.
 *
 * Puter.js provides FREE, UNLIMITED access to Gemini image generation.
 * It supports image-to-image via `input_image` — meaning the AI sees
 * your actual room and transforms it while preserving structure.
 *
 * No API key, no CORS proxy, no rate limits.
 */
export const generateInteriorPreview = async (
    config: GenerationConfig,
    variationIndex?: number,
    retryCount = 0,
    onStatusUpdate?: StatusCallback
): Promise<{ imageUrl: string; description: string }> => {
    if (!config.image) throw new Error("No image provided");

    const MAX_RETRIES = 3;

    // Extract base64 data and mime type from the data URL
    const base64Data = config.image.split(',')[1];
    const mimeType = config.image.split(';')[0].split(':')[1] || 'image/jpeg';

    // Build the transformation prompt
    const lightingDesc = config.lighting === LightingMode.Day
        ? "bright, airy, natural daylight streaming through windows"
        : "cozy, warm evening atmosphere with artificial golden lighting and soft shadows";

    const variationHint = variationIndex !== undefined
        ? `\nVARIATION: This is variation #${variationIndex + 1}. Use a slightly different color palette or furniture arrangement while staying true to the ${config.style} style.`
        : "";

    const prompt = `ACT AS A WORLD-CLASS INTERIOR DESIGNER.
TRANSFORM the attached photo of a room into a high-end, professionally designed ${config.style} style ${config.roomType}.

CRITICAL CONSTRAINTS:
- RETAIN THE EXACT PERSPECTIVE, CAMERA ANGLE, AND SCALE of the original photo.
- PRESERVE all structural elements: windows, doors, walls, ceiling height, floor boundaries.
- KEEP fixed architectural features like fireplaces, shelving, or columns.
- The result must look like a RENOVATION of THIS SPECIFIC ROOM, not a different room.
- If furniture exists, restyle or replace it in similar positions.${variationHint}

DESIGN SPECIFICATIONS:
- STYLE: ${config.style} (${getStyleDetails(config.style)})
- LIGHTING: Apply ${lightingDesc}.
- MATERIALS: Use architectural-grade materials like marble, solid wood, or designer fabrics.
- QUALITY: Photorealistic, high-resolution, professional real estate photography.

OUTPUT: Generate ONLY the redesigned image of this room. No text overlay.`;

    try {
        if (retryCount > 0) {
            onStatusUpdate?.(`🔄 Retrying... (Attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
        } else {
            onStatusUpdate?.("🎨 Sending your room to AI...");
        }

        console.log(`[Puter.js] Starting generation (attempt ${retryCount + 1})`);
        console.log(`[Puter.js] Style: ${config.style}, Room: ${config.roomType}, Lighting: ${config.lighting}`);

        onStatusUpdate?.("🎨 AI is redesigning your room (preserving structure)...");

        // Call Puter.js image-to-image generation
        // This sends your actual room photo to Gemini, which transforms it
        const imageElement = await puter.ai.txt2img(prompt, {
            model: "gemini-2.5-flash-image-preview",
            input_image: base64Data,
            input_image_mime_type: mimeType,
        });

        onStatusUpdate?.("✨ Processing AI response...");

        // Extract the image URL from the returned HTMLImageElement
        const imageUrl = imageElement.src;

        if (!imageUrl || imageUrl === 'data:' || imageUrl.length < 100) {
            throw new Error("AI returned an empty image. Please try a different photo or style.");
        }

        const description = `${config.style} style ${config.roomType} with ${config.lighting === LightingMode.Day ? 'natural daylight' : 'warm evening'} lighting. Redesigned using AI-powered interior transformation.`;

        console.log(`[Puter.js] ✅ Generation successful! Image src length: ${imageUrl.length}`);
        return { imageUrl, description };

    } catch (error: any) {
        const errorMessage = error?.message || String(error);
        console.error("[Puter.js] Generation Error:", errorMessage);

        // Auto-retry on transient errors
        if (retryCount < MAX_RETRIES) {
            const isTransient =
                errorMessage.includes('network') ||
                errorMessage.includes('timeout') ||
                errorMessage.includes('503') ||
                errorMessage.includes('429') ||
                errorMessage.includes('rate') ||
                errorMessage.includes('quota') ||
                errorMessage.includes('overloaded');

            if (isTransient) {
                const waitSec = [10, 20, 30][retryCount];
                console.warn(`[Puter.js] Transient error. Waiting ${waitSec}s before retry...`);

                for (let i = waitSec; i > 0; i--) {
                    onStatusUpdate?.(`⏳ Temporary issue — auto-retrying in ${i}s... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
                    await sleep(1000);
                }

                onStatusUpdate?.("🔄 Retrying now...");
                return generateInteriorPreview(config, variationIndex, retryCount + 1, onStatusUpdate);
            }
        }

        // User-friendly error messages
        if (errorMessage.includes('safety') || errorMessage.includes('blocked') || errorMessage.includes('SAFETY')) {
            throw new Error("Image was blocked by safety filters. Please try a different room photo.");
        }

        throw new Error(errorMessage || "Image generation failed. Please try again.");
    }
};

const getStyleDetails = (style: string): string => {
    const styles: Record<string, string> = {
        'Modern': 'Clean lines, minimalist furniture, neutral palette with bold accents, functional elegance.',
        'Summer': 'Bright colors, light fabrics (linen), rattan elements, breezy feel, indoor plants.',
        'Professional': 'Sleek, organized, ergonomic, refined dark woods, leather, sophisticated lighting.',
        'Tropical': 'Exotic wood, lush greenery, vibrant patterns, airy spaces, natural textures.',
        'Coastal': 'Navy and white tones, weathered wood, soft sand colors, seaside-inspired decor.',
        'Vintage': 'Retro furniture, warm mid-century tones, classic patterns, nostalgic charm.',
        'Industrial': 'Exposed brick, metal accents, concrete textures, rustic wood, Edison bulb lighting.',
        'Neoclassic': 'Grand architectural details, symmetry, elegant molding, luxurious textiles, marble.',
        'Tribal': 'Handcrafted patterns, earth tones, natural materials, cultural artifacts, rich textures.',
        'Smart & Hidden Tech': 'Minimalist, hidden screens, automated furniture, integrated LED strips, seamless surfaces.',
        'Minimalist': 'Extreme simplicity, monochromatic palette, open spaces, essential furniture only.',
        'Bohemian': 'Eclectic mix of patterns, layered rugs, vintage finds, global-inspired, relaxed vibe.',
        'Art Deco': 'Bold geometric shapes, rich colors (gold, emerald), luxurious materials, glamorous.',
        'Scandinavian': 'Light woods, functional design, cozy textiles, neutral tones, natural light.',
        'Japandi': 'Japanese minimalism meets Scandinavian warmth, organic shapes, natural materials, calm aesthetic.'
    };
    return styles[style] || 'Professional interior design.';
};
