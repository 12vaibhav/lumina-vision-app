
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GenerationConfig, LightingMode } from "../types";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateInteriorPreview = async (
  config: GenerationConfig,
  variationIndex?: number,
  retryCount = 0
): Promise<{ imageUrl: string; description: string }> => {
  if (!config.image) throw new Error("No image provided");

  const MAX_RETRIES = 3;
  
  // Correctly initialize GoogleGenAI using the platform-provided key
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });
  
  // Extract base64 data correctly (removing potential data URL header)
  const base64Data = config.image.split(',')[1];
  const mimeType = config.image.split(';')[0].split(':')[1];

  const lightingDesc = config.lighting === LightingMode.Day 
    ? "bright, airy, natural daylight streaming through windows" 
    : "cozy, warm evening atmosphere with artificial golden lighting and soft shadows";

  const variationHint = variationIndex !== undefined 
    ? `\n    - VARIATION HINT: This is variation #${variationIndex + 1}. Try a slightly different color palette or furniture arrangement while staying true to the ${config.style} style.`
    : "";

  const prompt = `
    ACT AS A WORLD-CLASS INTERIOR DESIGNER.
    TRANSFORM the attached photo of a room into a high-end, professionally designed ${config.style} style ${config.roomType}.
    
    CRITICAL CONSTRAINTS FOR ORIGINALITY:
    - YOU MUST RETAIN THE EXACT PERSPECTIVE, CAMERA ANGLE, AND SCALE OF THE ORIGINAL PHOTO.
    - PRESERVE all structural elements: windows, doors, walls, ceiling height, and floor boundaries.
    - KEEP the placement of fixed architectural features like fireplaces, built-in shelving, or columns.
    - The new design must feel like a RESTORATION or RENOVATION of the specific room in the photo, not a different room.
    - If furniture is present, restyle it or replace it in similar positions to maintain the room's functional flow.${variationHint}
    
    DESIGN SPECIFICATIONS:
    - STYLE: ${config.style} (${getStyleDetails(config.style)})
    - LIGHTING: Apply ${lightingDesc}.
    - MATERIALS: Use architectural-grade materials like marble, solid wood, or designer fabrics.
    - QUALITY: Output a photorealistic, high-resolution image that looks like a professional real estate photograph.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { 
            inlineData: { 
              data: base64Data, 
              mimeType 
            } 
          },
          { 
            text: prompt 
          }
        ]
      }
    });

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("No candidates returned from AI. This may be due to safety filters.");
    }

    let imageUrl = '';
    let description = '';

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      } else if (part.text) {
        description = part.text;
      }
    }

    if (!imageUrl) {
      const finishReason = response.candidates[0].finishReason;
      throw new Error(`Failed to generate image. Finish reason: ${finishReason || 'Unknown'}`);
    }

    return { imageUrl, description };
  } catch (error: any) {
    // Check for rate limit error (429)
    const isRateLimit = error?.message?.includes('429') || error?.status === 429 || error?.code === 429;
    
    if (isRateLimit && retryCount < MAX_RETRIES) {
      const waitTime = Math.pow(2, retryCount) * 2000 + Math.random() * 1000;
      console.warn(`Rate limit hit. Retrying in ${Math.round(waitTime)}ms... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await sleep(waitTime);
      return generateInteriorPreview(config, variationIndex, retryCount + 1);
    }

    console.error("Gemini Generation Error:", error);
    throw error;
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
    'Minimalist': 'Extreme simplicity, monochromatic palette, open spaces, essential furniture only, high-quality materials.',
    'Bohemian': 'Eclectic mix of patterns, colors, and textures, layered rugs, vintage finds, global-inspired decor, relaxed vibe.',
    'Art Deco': 'Bold geometric shapes, rich colors (gold, emerald), luxurious materials (velvet, chrome), glamorous and symmetrical.',
    'Scandinavian': 'Light woods, functional design, cozy textiles (hygge), neutral tones, plenty of natural light.',
    'Japandi': 'Fusion of Japanese minimalism and Scandinavian functionality, organic shapes, natural materials, calm and balanced aesthetic.'
  };
  return styles[style] || 'Professional interior design.';
};
