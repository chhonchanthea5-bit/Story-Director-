import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini client with aistudio-build user agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Curated 10 ideas baseline matching the exact aesthetic
export const DEFAULT_IDEAS = [
  {
    id: 1,
    title: "The Royal Clockmaker's Unwind",
    description: "A meticulous royal clockmaker with a velvet waistcoat discovers an antique clock that rewinds time by exactly four seconds every tick.",
  },
  {
    id: 2,
    title: "The Chancellor's Crimson Ledger",
    description: "An anxious tax collector in an oversized powdered wig discovers his financial ledger writes down the king's darkest secrets in glowing crimson ink.",
  },
  {
    id: 3,
    title: "The Apothecary's Laughing Tonic",
    description: "A weary apothecary in a leather aproned doublet tests an elixir to cure sorrow, only to find the palace guards unable to stop laughing at a looming royal catastrophe.",
  },
  {
    id: 4,
    title: "The Cartographer's Moving Island",
    description: "An imperial mapmaker in a ruffled collar notices an inked archipelago on his nautical parchment shifts whenever the admiral turns his back.",
  },
  {
    id: 5,
    title: "The Court Astrologer's Mimic Star",
    description: "An eccentric astronomer with gold-rimmed spectacles observes a distant red star that rhythmically blinks in exact synchronization with his own heartbeat.",
  },
  {
    id: 6,
    title: "The Baker's Whispering Loaf",
    description: "A flour-dusted master baker in Victorian garb bakes a loaf of sourdough that softly murmurs the true fortune of whoever holds the bread knife.",
  },
  {
    id: 7,
    title: "The Grand Librarian's Floating Tome",
    description: "A stoic bibliophile in heavy tweed reaches for an uncatalogued leather tome that causes gravity inside the candlelit hall to slowly invert.",
  },
  {
    id: 8,
    title: "The Museum Curator's Wax Guest",
    description: "An elderly night watchman in a brass-buttoned coat notices the wax figure of a ruthless ancient monarch stepping down to pour itself a cup of cold tea.",
  },
  {
    id: 9,
    title: "The Undertaker's Rhythmic Coffin",
    description: "A somber mortician with sunken eyes and a high silk cravat receives a delivery of a polished mahogany coffin that knocks back whenever he taps his knuckles.",
  },
  {
    id: 10,
    title: "The Puppeteer's Inverted Strings",
    description: "A street marionettist in a patchwork tailcoat realizes the wooden jester on his strings has quietly tied the silk cords around the puppeteer's own wrists.",
  },
];

// Helper to calculate scene count based on strict 4-second rule
export function calculateScenes(
  durationStr: string,
  customSeconds?: number,
  customScenes?: number
): { totalSeconds: number; numScenes: number } {
  if (customScenes && customScenes > 0) {
    const num = Math.max(1, Math.floor(customScenes));
    return { totalSeconds: num * 4, numScenes: num };
  }

  let seconds = 60; // default 1 min
  const lower = (durationStr || '').toLowerCase();

  if (customSeconds && customSeconds > 0) {
    seconds = customSeconds;
  } else {
    // Check if durationStr specifies scenes e.g. "10 scenes", "8 images", "12 sence"
    const sceneMatch = lower.match(/(\d+)\s*(scenes?|images?|pics?|shots?|sence|sences?)/);
    if (sceneMatch) {
      const num = Math.max(1, parseInt(sceneMatch[1], 10));
      return { totalSeconds: num * 4, numScenes: num };
    }

    if (lower.includes('20') && lower.includes('sec')) {
      seconds = 20;
    } else if (lower.includes('30') && lower.includes('sec')) {
      seconds = 30;
    } else if (lower.includes('1') && (lower.includes('min') || lower.includes('minute'))) {
      seconds = 60;
    } else if (lower.includes('3') && (lower.includes('min') || lower.includes('minute'))) {
      seconds = 180;
    } else if (lower.includes('5') && (lower.includes('min') || lower.includes('minute'))) {
      seconds = 300;
    } else {
      // try to parse number
      const match = lower.match(/(\d+)\s*(s|sec|m|min)?/);
      if (match) {
        const val = parseInt(match[1], 10);
        const unit = match[2];
        if (unit && (unit.startsWith('m'))) {
          seconds = val * 60;
        } else {
          seconds = val;
        }
      }
    }
  }

  // Strict rule: every scene is exactly 4s, total video length in seconds / 4, rounded up
  const numScenes = Math.max(1, Math.ceil(seconds / 4));
  return { totalSeconds: seconds, numScenes };
}

// API: Get ideas
app.get('/api/ideas', (req, res) => {
  res.json({ ideas: DEFAULT_IDEAS });
});

// API: Generate fresh ideas using Gemini
app.post('/api/generate-ideas', async (req, res) => {
  const { theme, count = 10 } = req.body;
  if (!process.env.GEMINI_API_KEY) {
    return res.json({ ideas: DEFAULT_IDEAS });
  }

  try {
    const prompt = `Generate exactly ${count} unique, suspenseful, dark-comedy or mysterious 4-second-scene video ideas.
Context & Art style:
- Characters have oversized perfectly round pale cream heads, small black eyes with heavy droopy lids, thick expressive eyebrows, small body in highly detailed period costume (Victorian/Gothic/Baroque/steampunk), 2D cartoon with thick clean dark outlines and soft cel shading, dark cinematic palette with deep red accent lighting.
- Theme/Tone: ${theme || 'Ironic, eerie, slightly ominous mystery with a twist'}.
Return a JSON array of objects with "title" (2-5 words) and "description" (one punchy sentence summarizing the bizarre situation).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
            },
            required: ['title', 'description'],
          },
        },
      },
    });

    const parsed = JSON.parse(response.text || '[]');
    if (Array.isArray(parsed) && parsed.length > 0) {
      const ideasWithId = parsed.map((item: any, idx: number) => ({
        id: idx + 1,
        title: item.title,
        description: item.description,
      }));
      return res.json({ ideas: ideasWithId });
    }
    return res.json({ ideas: DEFAULT_IDEAS });
  } catch (err: any) {
    console.error('Error in /api/generate-ideas:', err?.message || err);
    return res.json({ ideas: DEFAULT_IDEAS, fallback: true, error: err?.message });
  }
});

// API: Convert character picture to text via Gemini Vision with high visual similarity
app.post('/api/analyze-character-image', async (req, res) => {
  const { imageBase64, mimeType = 'image/jpeg', styleMode = 'match_photo' } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: 'No image data provided' });
  }

  // Strip prefix if user passed full data URI e.g. "data:image/jpeg;base64,..."
  const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');

  if (!process.env.GEMINI_API_KEY) {
    // Graceful offline fallback with rich realistic styling
    return res.json({
      characterName: "The Protagonist",
      artMedium: "Photorealistic portrait photograph shot with an 85mm prime lens",
      headAndFace: "oval face structure, natural fair skin tone with realistic skin texture, expressive dark hazel eyes with defined eyelids, natural eyebrows, and shoulder-length dark brown hair with soft natural waves",
      costume: "tailored charcoal wool overcoat over an ivory knit high-neck sweater with clean minimalist stitching",
      lightingStyle: "cinematic directional soft key light with warm golden rim accent and subtle diffused ambient shadows",
      colorPalette: "Charcoal black, ivory cream, warm amber gold, deep slate",
      cameraComposition: "Medium close-up portrait, three-quarter angle, centered subject, shallow depth of field with creamy background bokeh, sharp eye focus",
      fullDescription: "The Protagonist, an observant individual with an oval face, natural warm complexion, dark hazel eyes, and shoulder-length dark brown wavy hair, wearing a tailored charcoal wool coat and ivory high-neck sweater",
      highFidelityPrompt: "Photorealistic portrait photograph shot with an 85mm prime lens of The Protagonist, oval face structure, natural skin texture, expressive dark hazel eyes, shoulder-length dark brown wavy hair, wearing a tailored charcoal wool overcoat and ivory high-neck sweater. Cinematic directional soft key light with warm golden rim accent, medium close-up, shallow depth of field, sharp focus on eyes, master quality, ultra-detailed, match reference photo style, 9:16 vertical, no text, no watermark.",
      storybookDescription: "Master Barnaby, an aristocratic artisan with an oversized perfectly round pale cream head, heavy droopy black eyes, and arched thick eyebrows, wearing an embroidered plum-colored velvet waistcoat with gold filigree buttons",
      artStyleNotes: "Natural photographic lighting with optical depth of field, realistic human facial proportions, and elegant tailored wardrobe.",
      extractedFromPhoto: true,
      styleMode: 'match_photo',
    });
  }

  try {
    const imagePart = {
      inlineData: {
        mimeType: mimeType || 'image/jpeg',
        data: cleanBase64,
      },
    };

    const textPart = {
      text: `You are a world-class art director and prompt engineer specializing in high-fidelity character replication for AI image generators (Google Flow, Midjourney, Imagen 3, FLUX, Whisk).

CRITICAL MISSION:
Analyze this uploaded character image with extreme visual precision. When the user copies your generated text prompt to an AI image model, it MUST generate an image that faithfully matches this uploaded image's exact style, artistic medium, and character appearance.

DO NOT force any predetermined cartoon or caricature style unless the uploaded image actually is one!
Look at the actual image:
1. "artMedium": Identify the EXACT visual medium and rendering technique (e.g., "Photorealistic 85mm DSLR portrait photograph", "3D stylized CGI animation with subsurface scattering like Pixar/Dreamworks", "Detailed 2D anime cel illustration with clean ink linework", "Tactile stop-motion claymation miniature figurine with clay textures", "Textured vintage oil painting with impasto brushstrokes", "Vector illustration with flat colors", or "Gothic dark fantasy caricature").
2. "characterName": A distinct name or title that naturally suits this character.
3. "headAndFace": Describe the exact facial morphology: head/jaw shape, skin tone and texture, eye shape & color, eyebrows, nose structure, mouth/lips, facial hair (if any), hair color/style/cut/length, distinctive marks, glasses/accessories.
4. "costume": Precise clothing breakdown: garments, tailoring, fabric types (e.g. wool, velvet, leather, knit, silk, denim), exact color tones, patterns, collars, buttons, jewelry, and accessories.
5. "lightingStyle": The exact lighting setup: key light direction, color temperature (warm golden, cool cyan, neutral daylight), rim lighting, ambient shadows, contrast level.
6. "colorPalette": 3-5 specific dominant colors and accent hues.
7. "cameraComposition": Framing and camera physics (e.g. "Medium close-up portrait, three-quarter angle, shallow depth of field, sharp focus on eyes, soft background bokeh").
8. "fullDescription": A concise 35-50 word anchor string specifying the character's core look.
9. "highFidelityPrompt": A MASTER, complete prompt meticulously engineered to recreate an image with maximum visual likeness and identical art style to this upload. Structure:
"[artMedium] of [characterName], [headAndFace], wearing [costume]. [lightingStyle], [cameraComposition], [colorPalette], masterpiece quality, ultra-detailed, consistent character design, match uploaded reference photo style, 9:16 vertical, no text, no watermark."
10. "storybookDescription": An alternative stylized version translating this character into a dark Victorian cartoon caricature (oversized pale head, droopy eyes, period frock coat) if the user wants storybook stylization.
11. "artStyleNotes": 1-2 sentences summarizing key visual hallmarks observed in the uploaded image.

Return valid JSON adhering strictly to the schema.`,
    };

    const generateCall = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            characterName: { type: Type.STRING },
            artMedium: { type: Type.STRING },
            headAndFace: { type: Type.STRING },
            costume: { type: Type.STRING },
            lightingStyle: { type: Type.STRING },
            colorPalette: { type: Type.STRING },
            cameraComposition: { type: Type.STRING },
            fullDescription: { type: Type.STRING },
            highFidelityPrompt: { type: Type.STRING },
            storybookDescription: { type: Type.STRING },
            artStyleNotes: { type: Type.STRING },
          },
          required: [
            'characterName',
            'artMedium',
            'headAndFace',
            'costume',
            'lightingStyle',
            'fullDescription',
            'highFidelityPrompt',
          ],
        },
      },
    });

    const timeoutGuard = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Image analysis timed out')), 18000)
    );

    const response = await Promise.race([generateCall, timeoutGuard]);
    const parsed = JSON.parse(response.text || '{}');
    if (parsed.fullDescription || parsed.highFidelityPrompt) {
      return res.json({
        ...parsed,
        extractedFromPhoto: true,
        styleMode: styleMode || 'match_photo',
      });
    }

    throw new Error('Empty response from model');
  } catch (err: any) {
    console.error('Error in /api/analyze-character-image:', err?.message || err);
    return res.json({
      characterName: "The Protagonist",
      artMedium: "Photorealistic portrait photograph shot with an 85mm prime lens",
      headAndFace: "oval face structure, natural fair skin tone with realistic skin texture, expressive dark hazel eyes with defined eyelids, natural eyebrows, and shoulder-length dark brown hair with soft natural waves",
      costume: "tailored charcoal wool overcoat over an ivory knit high-neck sweater with clean minimalist stitching",
      lightingStyle: "cinematic directional soft key light with warm golden rim accent and subtle diffused ambient shadows",
      colorPalette: "Charcoal black, ivory cream, warm amber gold, deep slate",
      cameraComposition: "Medium close-up portrait, three-quarter angle, centered subject, shallow depth of field with creamy background bokeh, sharp eye focus",
      fullDescription: "The Protagonist, an observant individual with an oval face, natural warm complexion, dark hazel eyes, and shoulder-length dark brown wavy hair, wearing a tailored charcoal wool coat and ivory high-neck sweater",
      highFidelityPrompt: "Photorealistic portrait photograph shot with an 85mm prime lens of The Protagonist, oval face structure, natural skin texture, expressive dark hazel eyes, shoulder-length dark brown wavy hair, wearing a tailored charcoal wool overcoat and ivory high-neck sweater. Cinematic directional soft key light with warm golden rim accent, medium close-up, shallow depth of field, sharp focus on eyes, master quality, ultra-detailed, match reference photo style, 9:16 vertical, no text, no watermark.",
      storybookDescription: "Master Barnaby, an aristocratic artisan with an oversized perfectly round pale cream head, heavy droopy black eyes, and arched thick eyebrows, wearing an embroidered plum-colored velvet waistcoat with gold filigree buttons",
      artStyleNotes: "High visual fidelity photographic portrait with natural skin textures and warm cinematic lighting.",
      extractedFromPhoto: true,
      styleMode: 'match_photo',
      error: err?.message,
    });
  }
});

// API: Generate full workflow (Steps 3, 4, 5)
app.post('/api/generate-workflow', async (req, res) => {
  const {
    ideaTitle = DEFAULT_IDEAS[0].title,
    ideaDescription = DEFAULT_IDEAS[0].description,
    duration = '1 minute',
    customSeconds,
    customScenes,
    aspectRatio = '9:16 (Vertical — Default)',
    voiceoverLanguage = 'English',
    scriptFormat = 'B',
    characterConfig,
  } = req.body;

  const defaultCharDesc = "Master Barnaby, an aristocratic artisan with an oversized perfectly round pale cream head, heavy droopy black eyes, and arched thick eyebrows, wearing an embroidered plum-colored velvet waistcoat with gold filigree buttons";
  const finalCharDesc = characterConfig?.fullDescription?.trim() || defaultCharDesc;
  const finalCharName = characterConfig?.name?.trim() || "Barnaby";
  const artMedium = characterConfig?.artMedium?.trim();
  const lightingStyle = characterConfig?.lightingStyle?.trim();
  const styleMode = characterConfig?.styleMode || (characterConfig?.extractedFromPhoto ? 'match_photo' : 'storybook_cartoon');

  const { totalSeconds, numScenes } = calculateScenes(duration, customSeconds, customScenes);
  const ratioLabel = aspectRatio.toLowerCase().includes('16:9') || aspectRatio.toLowerCase().includes('horizontal')
    ? '16:9 horizontal'
    : '9:16 vertical';

  const formatChosen = (scriptFormat || 'B').toUpperCase() === 'A' ? 'A' : 'B';

  // Dynamic Art Style Opening:
  // If user uploaded a photo and is preserving photo style, use the detected artMedium & lighting!
  // Otherwise, use the classic Victorian Edwardian dark-fantasy cartoon aesthetic.
  const artStyleOpening = (styleMode === 'match_photo' && artMedium)
    ? `Match the exact art style of the uploaded reference image: ${artMedium}, ${lightingStyle || 'cinematic atmospheric lighting'}, consistent character design and color palette.`
    : `Match the exact art style of the uploaded reference image: oversized perfectly round pale cream head, small black eyes with heavy droopy lids, thick expressive eyebrows, small body in highly detailed period costume, 2D cartoon with thick clean dark outlines and soft cel shading, dark cinematic palette with deep red accent lighting.`;

  const animStyleOpening = (styleMode === 'match_photo' && artMedium)
    ? `Animate this exact image as the first frame. Keep 100% consistency with the source image: same character likeness, face, costume, ${artMedium}, lighting and palette. No style drift, no change in proportions. No voiceover, dialogue, talking, lip-sync, captions, on-screen text, music or sound effects. No new characters, no new objects, no outfit changes, no scene changes, no character morphing, no distorted limbs.`
    : `Animate this exact image as the first frame. Keep 100% consistency with the source image: same round head, face, costume, outlines, cel shading, dark palette and red lighting. No style drift, no realistic rendering, no change in proportions. No voiceover, dialogue, talking, lip-sync, captions, on-screen text, music or sound effects. No new characters, no new objects, no outfit changes, no scene changes, no character morphing, no distorted limbs, no 3D or anime look.`;

  const systemInstruction = `You are the master director for Google Flow AI Video workflows.
You write production-grade prompts and scripts that adhere strictly to every constraint:
1. Strict timing: ${numScenes} scenes total. Every scene is exactly 4 seconds. Total ${totalSeconds} seconds.
2. Story arc: Plan a story with exactly ${numScenes} scenes: clear beginning (exposition/setup), middle (escalation/bizarre twist), and ending (ironic punchline/climax). No filler scenes!
3. Art Style Opening for EVERY Image Prompt:
"${artStyleOpening}"
4. Consistent Character Description (written identically in EVERY prompt where the character appears):
"${finalCharDesc}"
5. Every Step 3 image prompt MUST be ONE single line (no internal line breaks, no bullets), 100-140 words, start with "Image [N] – [Short Scene Name]: ", include the art style opening, the exact character description, expression, pose/action, shot type, background, lighting, and end with: "${ratioLabel}, no text, consistent character design, match uploaded reference image."
6. Every Step 4 animation prompt MUST be ONE single line (no internal line breaks, no bullets), 150-200 words, start with "Clip [N] – starting frame: Image [N] – [Short Scene Name]: ", and have:
- Opening: "${animStyleOpening}"
- Scene: [same description as Image prompt with ${finalCharName}]
- Motion: [ONE small main action and one small reaction, 0-2s action, 2-4s reaction, gentle and simple]
- Camera: static (or very slow slight push-in)
- Ends on: [final pose]
- Duration: 4 seconds.
7. Step 5 Voiceover:
- Language: ${voiceoverLanguage}
- Voice: one deep, calm documentary narrator, slightly ominous, building suspense with short punchy sentences and ironic twists.
- Timing: ~4 seconds per scene (~8-10 words in English, natural rhythm in ${voiceoverLanguage}).
- If Format A: labeled as "Scene 1:", with "Narrator: ..." or character lines.
- If Format B: continuous paragraph per scene, separated by blank line, no labels/brackets/speaker names.`;

  const userPrompt = `Create the full 5-step workflow data for:
Title: "${ideaTitle}"
Concept: "${ideaDescription}"
Character: "${finalCharDesc}"
Number of scenes: ${numScenes}
Duration: ${duration} (${totalSeconds}s)
Aspect ratio: ${ratioLabel}
Language: ${voiceoverLanguage}
Format: ${formatChosen}

Return JSON with:
{
  "summaryLine": "${duration} = ${numScenes} scenes × 4 seconds, ${ratioLabel}, voiceover in ${voiceoverLanguage}, script ${formatChosen}.",
  "scenes": [
    {
      "sceneNumber": 1,
      "shortSceneName": "2 to 4 words name",
      "imagePrompt": "Full single-line Image prompt starting with 'Match the exact art style...' and ending with '${ratioLabel}, no text, consistent character design, match uploaded reference image.' (100-140 words)",
      "animationPrompt": "Full single-line Clip prompt starting with 'Clip 1 – starting frame: Image 1 – [Short Scene Name]: Animate this exact image as the first frame...' (150-200 words)",
      "voiceoverScriptFormatA": "Scene 1:\\\\nNarrator: ...",
      "voiceoverScriptFormatB": "One single clean paragraph for TTS (8-10 words)"
    }
  ]
}`;

  if (!process.env.GEMINI_API_KEY) {
    // Generate programmatic high-quality fallback immediately
    const fallbackData = generateFallbackWorkflow(
      ideaTitle,
      ideaDescription,
      numScenes,
      ratioLabel,
      voiceoverLanguage,
      formatChosen,
      finalCharDesc,
      finalCharName,
      artStyleOpening,
      animStyleOpening
    );
    return res.json(fallbackData);
  }

  try {
    const workflowCall = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summaryLine: { type: Type.STRING },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sceneNumber: { type: Type.INTEGER },
                  shortSceneName: { type: Type.STRING },
                  imagePrompt: { type: Type.STRING },
                  animationPrompt: { type: Type.STRING },
                  voiceoverScriptFormatA: { type: Type.STRING },
                  voiceoverScriptFormatB: { type: Type.STRING },
                },
                required: ['sceneNumber', 'shortSceneName', 'imagePrompt', 'animationPrompt', 'voiceoverScriptFormatA', 'voiceoverScriptFormatB'],
              },
            },
          },
          required: ['summaryLine', 'scenes'],
        },
      },
    });

    const timeoutGuard = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Workflow generation timed out')), 40000)
    );

    const response = await Promise.race([workflowCall, timeoutGuard]);
    const parsed = JSON.parse(response.text || '{}');
    if (parsed.scenes && Array.isArray(parsed.scenes) && parsed.scenes.length > 0) {
      return res.json(parsed);
    }
    // Fallback if empty
    return res.json(generateFallbackWorkflow(ideaTitle, ideaDescription, numScenes, ratioLabel, voiceoverLanguage, formatChosen, finalCharDesc, finalCharName, artStyleOpening, animStyleOpening));
  } catch (err: any) {
    console.error('Error generating workflow with Gemini:', err?.message || err);
    return res.json(generateFallbackWorkflow(ideaTitle, ideaDescription, numScenes, ratioLabel, voiceoverLanguage, formatChosen, finalCharDesc, finalCharName, artStyleOpening, animStyleOpening));
  }
});

// Procedural fallback generator when Gemini is unreachable or offline
function generateFallbackWorkflow(
  title: string,
  desc: string,
  numScenes: number,
  ratioLabel: string,
  language: string,
  format: 'A' | 'B',
  customCharDesc?: string,
  customCharName?: string,
  customArtStyleOpening?: string,
  customAnimStyleOpening?: string
) {
  const scenes = [];
  const characterDesc = customCharDesc || "Master Barnaby, an aristocratic artisan with an oversized perfectly round pale cream head, heavy droopy black eyes, and arched thick eyebrows, wearing an embroidered plum-colored velvet waistcoat with gold filigree buttons";
  const characterName = customCharName || "Barnaby";
  const styleOpening = customArtStyleOpening || "Match the exact art style of the uploaded reference image: oversized perfectly round pale cream head, small black eyes with heavy droopy lids, thick expressive eyebrows, small body in highly detailed period costume, 2D cartoon with thick clean dark outlines and soft cel shading, dark cinematic palette with deep red accent lighting.";
  const animOpening = customAnimStyleOpening || "Animate this exact image as the first frame. Keep 100% consistency with the source image: same round head, face, costume, outlines, cel shading, dark palette and red lighting. No style drift, no realistic rendering, no change in proportions. No voiceover, dialogue, talking, lip-sync, captions, on-screen text, music or sound effects. No new characters, no new objects, no outfit changes, no scene changes, no character morphing, no distorted limbs, no 3D or anime look.";

  const storyTemplates = [
    { name: "The Quiet Discovery", action: "slowly lifts an ornate brass looking-glass toward a dormant grandfather clock", motion: "Barnaby slowly raises his brass eyeglass; his eyelids narrow in silent disbelief", scriptEn: "In the silent depths of the tower, time paused.", scriptKhmer: "នៅចំកណ្តាលប៉មដ៏ស្ងាត់ជ្រងំ ពេលវេលាបានផ្អាកដំណើរការ។", scriptThai: "ในความเงียบงันของหอคอย เวลาได้หยุดเดิน", scriptViet: "Trong bóng tối tĩnh lặng của tháp, thời gian ngừng lại.", scriptChinese: "在静谧的钟塔深处，时间停滞了。", scriptSpanish: "En el silencio de la torre, el tiempo se detuvo." },
    { name: "The Ticking Anomaly", action: "leans closer to inspect the polished clockwork gears rotating backwards in crimson light", motion: "His left eyebrow twitches upward; the copper pendulum shudders backward", scriptEn: "Every rhythmic second was ticking in reverse.", scriptKhmer: "រាល់វិនាទីនៃនាឡិកា កំពុងដើរថយក្រោយយ៉ាងចម្លែក។", scriptThai: "ทุกวินาทีเริ่มเดินถอยหลังอย่างน่าประหลาด", scriptViet: "Từng giây đồng hồ đang quay ngược lại.", scriptChinese: "每一秒针都在诡异地逆向旋转。", scriptSpanish: "Cada segundo rítmico avanzaba hacia atrás." },
    { name: "The Spilled Varnish", action: "watches a spilled puddle of black ink slowly withdraw back into the overturned glass vial", motion: "Barnaby's fingers freeze in midair; the dark ink droplet creeps uphill", scriptEn: "Spilled secrets were refusing to touch the floor.", scriptKhmer: "ទឹកថ្នាំដែលកំពប់ ស្រាប់តែស្រូបចូលដបវិញដោយស្ងាត់ៗ។", scriptThai: "หมึกที่หกเริ่มไหลย้อนกลับเข้าไปในขวดแก้ว", scriptViet: "Vết mực đổ từ từ thu lại vào bình.", scriptChinese: "泼溅的墨汁竟悄然倒流回玻璃瓶中。", scriptSpanish: "La tinta derramada regresaba lentamente a su frasco." },
    { name: "The Vanishing Shadow", action: "notices his elongated silhouette on the wallpaper turn away and cross its own arms", motion: "His jaw subtly tightens; the dark silhouette tilts its head independently", scriptEn: "Even his own shadow refused to obey.", scriptKhmer: "សូម្បីតែស្រមោលរបស់គាត់ ក៏លែងស្តាប់បង្គាប់ទៀតដែរ។", scriptThai: "แม้แต่เงาของเขาเอง ก็ไม่ยอมทำตามคำสั่ง", scriptViet: "Ngay cả chiếc bóng cũng không chịu nghe lời.", scriptChinese: "甚至连他自己的影子也拒绝顺从。", scriptSpanish: "Incluso su propia sombra desobedecía sus movimientos." },
    { name: "The Crimson Gear", action: "grips a slender brass wrench above a glowing crimson escapement spring that hums faintly", motion: "The tool wavers slightly in his grip; deep red sparks glow in the casing", scriptEn: "One adjustment could undo forty years of work.", scriptKhmer: "ការបង្វិលតែមួយ អាចរំលាយអតីតកាល៤០ឆ្នាំចោល។", scriptThai: "การหมุนเพียงครั้งเดียว อาจลบล้างอดีตสี่สิบปี", scriptViet: "Một cú vặn có thể xóa sạch bốn mươi năm.", scriptChinese: "只需一次扳动，四十年的光阴便荡然无存。", scriptSpanish: "Un solo ajuste podría borrar cuarenta años de vida." },
    { name: "The Echo Chamber", action: "stares out the arched stone lancet window at rain droplets suspended motionless mid-air", motion: "Raindrops hang frozen in ruby fog; his pupils dilate slowly", scriptEn: "Outside the tower, the storm stood entirely still.", scriptKhmer: "នៅខាងក្រៅ ដំណក់ទឹកភ្លៀងបានកកនៅកណ្តាលអាកាស។", scriptThai: "พายุภายนอกหอคอย หยุดนิ่งสนิทกลางเวหา", scriptViet: "Bên ngoài ngọn tháp, cơn mưa đứng yên bất động.", scriptChinese: "窗外狂暴的风雨竟在半空中彻底凝固。", scriptSpanish: "Fuera de la torre, la tormenta quedó congelada." },
    { name: "The Iron Key", action: "unlocks a concealed velvet-lined drawer beneath the mahogany worktable with an ivory key", motion: "The drawer slides open with a whisper; a crimson glow illuminates his cheek", scriptEn: "The creator had left one final fail-safe.", scriptKhmer: "អ្នកបង្កើតមុន បានបន្សល់ទុកសោរសម្ងាត់ចុងក្រោយ។", scriptThai: "ผู้สร้างคนก่อน ได้ทิ้งกุญแจดอกสุดท้ายเอาไว้", scriptViet: "Người sáng chế đã để lại một lối thoát cuối cùng.", scriptChinese: "最初的制造者留下了一枚最终保险。", scriptSpanish: "El viejo creador dejó una última llave maestra." },
    { name: "The Twin Reflections", action: "catches sight of two separate reflections in the glass pendulum chamber watching him", motion: "Both reflections blink out of sync; Barnaby draws a measured breath", scriptEn: "He was no longer alone in his workshop.", scriptKhmer: "គាត់លែងនៅម្នាក់ឯងក្នុងបន្ទប់ធ្វើការទៀតហើយ។", scriptThai: "เขาไม่ได้อยู่ในห้องทำงานนี้เพียงลำพังอีกต่อไป", scriptViet: "Ông không còn cô độc trong căn phòng nữa.", scriptChinese: "他在这间工坊里已不再是孤身一人。", scriptSpanish: "Ya no estaba solo en su taller subterráneo." },
    { name: "The Final Rewind", action: "places both gloved hands upon the dual pendulum weights to force the gear arrest", motion: "The pendulum shudders violently; crimson light surges through the room", scriptEn: "Force met friction in four catastrophic seconds.", scriptKhmer: "កម្លាំងនិងពេលវេលា បានប៉ះទង្គិចគ្នាយ៉ាងខ្លាំងក្លា។", scriptThai: "แรงต้านและกาลเวลา ปะทะกันในสี่วินาทีวิกฤต", scriptViet: "Lực cản và thời gian va chạm dữ dội.", scriptChinese: "力量与时间在短短四秒内剧烈碰撞。", scriptSpanish: "Fuerza y tiempo chocaron en cuatro segundos críticos." },
    { name: "The Quiet Inversion", action: "sits calmly in a high-backed leather armchair sipping cold tea as the clock strikes dawn", motion: "Barnaby's lips form a subtle, ironic smirk; steam rises from the teacup", scriptEn: "The clock was repaired. The day was yesterday.", scriptKhmer: "នាឡិកាត្រូវបានជួសជុល។ ប៉ុន្តែថ្ងៃនេះ គឺម្សិលមិញ។", scriptThai: "นาฬิกาถูกซ่อมแล้ว ทว่าวันนี้... กลับกลายเป็นเมื่อวาน", scriptViet: "Đồng hồ đã sửa xong. Nhưng hôm nay lại là hôm qua.", scriptChinese: "钟表修好了。只是今天，又变成了昨日。", scriptSpanish: "El reloj fue reparado. Pero hoy... era ayer." },
  ];

  for (let i = 0; i < numScenes; i++) {
    const tmpl = storyTemplates[i % storyTemplates.length];
    const sceneNum = i + 1;
    const shortName = `${tmpl.name} Part ${Math.floor(i / storyTemplates.length) + 1}`.replace(' Part 1', '');

    const imagePrompt = `${styleOpening} ${characterDesc}, standing in an atmospheric cinematic setting. ${characterName} ${tmpl.action}, wearing a focused and expressive look. Medium shot framing, detailed environment, deep ambient rim light. ${ratioLabel}, no text, consistent character design, match uploaded reference image.`;

    const animationPrompt = `Clip ${sceneNum} – starting frame: Image ${sceneNum} – ${shortName}: ${animOpening} Scene: ${characterDesc}, ${tmpl.action}, medium shot in cinematic atmospheric rim lighting. Motion: ${tmpl.motion} from 0-2 seconds, followed by subtle breathing and settling from 2-4 seconds. Camera: static. Ends on: ${characterName} holding steady with intense contemplative gaze. Duration: 4 seconds.`;

    let voText = tmpl.scriptEn;
    const lowerLang = language.toLowerCase();
    if (lowerLang.includes('khmer') || lowerLang.includes('ភាសា')) {
      voText = tmpl.scriptKhmer;
    } else if (lowerLang.includes('thai')) {
      voText = tmpl.scriptThai;
    } else if (lowerLang.includes('viet')) {
      voText = tmpl.scriptViet;
    } else if (lowerLang.includes('chinese')) {
      voText = tmpl.scriptChinese;
    } else if (lowerLang.includes('spanish')) {
      voText = tmpl.scriptSpanish;
    }

    const scriptA = `Scene ${sceneNum}:\nNarrator: ${voText}`;
    const scriptB = voText;

    scenes.push({
      sceneNumber: sceneNum,
      shortSceneName: shortName,
      imagePrompt,
      animationPrompt,
      voiceoverScriptFormatA: scriptA,
      voiceoverScriptFormatB: scriptB,
    });
  }

  return {
    summaryLine: `${numScenes * 4} seconds = ${numScenes} scenes × 4 seconds, ${ratioLabel}, voiceover in ${language}, script ${format}.`,
    scenes,
  };
}

// Start Server
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started on http://0.0.0.0:${PORT}`);
  });
}

startServer();
