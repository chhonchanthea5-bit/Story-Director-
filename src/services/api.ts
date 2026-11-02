import { VideoIdea, WorkflowConfig, WorkflowData, CharacterConfig } from '../types/workflow';

export const DEFAULT_IDEAS: VideoIdea[] = [
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

// Scene Timing rule: every scene is exactly 4s, total video length in seconds / 4, rounded up
export function calculateSceneDetails(durationStr: string, customSec?: number, customScenes?: number) {
  if (customScenes && customScenes > 0) {
    const numScenes = Math.max(1, Math.floor(customScenes));
    const totalSeconds = numScenes * 4;
    return { totalSeconds, numScenes };
  }

  let seconds = 60;
  const s = (durationStr || '').toLowerCase();

  // Check if string contains explicit scene/image count (e.g., "12 scenes", "8 images", "10 sence")
  const sceneMatch = s.match(/(\d+)\s*(scenes?|images?|pics?|shots?|sence|sences?)/);
  if (sceneMatch && !customSec) {
    const numScenes = Math.max(1, parseInt(sceneMatch[1], 10));
    return { totalSeconds: numScenes * 4, numScenes };
  }

  if (customSec && customSec > 0) {
    seconds = customSec;
  } else if (s.includes('20') && s.includes('sec')) {
    seconds = 20;
  } else if (s.includes('30') && s.includes('sec')) {
    seconds = 30;
  } else if (s.includes('1') && (s.includes('min') || s.includes('minute'))) {
    seconds = 60;
  } else if (s.includes('3') && (s.includes('min') || s.includes('minute'))) {
    seconds = 180;
  } else if (s.includes('5') && (s.includes('min') || s.includes('minute'))) {
    seconds = 300;
  } else {
    const match = s.match(/(\d+)\s*(s|sec|m|min)?/);
    if (match) {
      const val = parseInt(match[1], 10);
      const unit = match[2];
      if (unit && unit.startsWith('m')) {
        seconds = val * 60;
      } else {
        seconds = val;
      }
    }
  }

  const numScenes = Math.max(1, Math.ceil(seconds / 4));
  return { totalSeconds: seconds, numScenes };
}

// Parse quick reply line e.g. "3, 1 minute, 9:16, Khmer, B", "1, 10 scenes, 16:9, English, A", or "1, 20s, 16:9, English, A"
export function parseQuickReply(input: string, currentIdeas: VideoIdea[]): WorkflowConfig {
  const parts = input.split(',').map((p) => p.trim());
  
  // Defaults
  let ideaId: number | 'custom' = 1;
  let customTopic = '';
  let duration = '1 minute (15 scenes — Default)';
  let customSeconds: number | undefined = undefined;
  let customScenes: number | undefined = undefined;
  let aspectRatio = '9:16 (Vertical — Default)';
  let voiceoverLanguage = 'English (Default)';
  let scriptFormat: 'A' | 'B' = 'B';

  if (parts.length > 0 && parts[0]) {
    const part0 = parts[0];
    const num = parseInt(part0, 10);
    if (!isNaN(num) && num >= 1 && num <= 10) {
      ideaId = num;
    } else if (part0.toLowerCase() !== 'default') {
      ideaId = 'custom';
      customTopic = part0;
    }
  }

  if (parts.length > 1 && parts[1]) {
    const part1 = parts[1].toLowerCase();
    const sceneMatch = part1.match(/(\d+)\s*(scenes?|images?|pics?|shots?|sence|sences?)/);
    if (sceneMatch) {
      const count = parseInt(sceneMatch[1], 10);
      if (!isNaN(count) && count > 0) {
        customScenes = count;
        customSeconds = count * 4;
        duration = `${count * 4} seconds (${count} scenes)`;
      }
    } else if (part1.includes('20')) {
      duration = '20 seconds (5 scenes)';
      customScenes = 5;
    } else if (part1.includes('30')) {
      duration = '30 seconds (8 scenes)';
      customScenes = 8;
    } else if (part1.includes('1') && (part1.includes('min') || part1.includes('m'))) {
      duration = '1 minute (15 scenes — Default)';
      customScenes = 15;
    } else if (part1.includes('3') && (part1.includes('min') || part1.includes('m'))) {
      duration = '3 minutes (45 scenes)';
      customScenes = 45;
    } else if (part1.includes('5') && (part1.includes('min') || part1.includes('m'))) {
      duration = '5 minutes (75 scenes)';
      customScenes = 75;
    } else {
      const match = part1.match(/(\d+)/);
      if (match) {
        customSeconds = parseInt(match[1], 10);
        customScenes = Math.max(1, Math.ceil(customSeconds / 4));
        duration = `Other (${customSeconds}s)`;
      }
    }
  }

  if (parts.length > 2 && parts[2]) {
    const part2 = parts[2].toLowerCase();
    if (part2.includes('16:9') || part2.includes('horizontal')) {
      aspectRatio = '16:9 (Horizontal)';
    } else {
      aspectRatio = '9:16 (Vertical — Default)';
    }
  }

  if (parts.length > 3 && parts[3]) {
    const part3 = parts[3].toLowerCase();
    if (part3.includes('khmer') || part3.includes('ភាសា')) voiceoverLanguage = 'Khmer (ភាសាខ្មែរ)';
    else if (part3.includes('thai')) voiceoverLanguage = 'Thai';
    else if (part3.includes('viet')) voiceoverLanguage = 'Vietnamese';
    else if (part3.includes('chinese')) voiceoverLanguage = 'Chinese';
    else if (part3.includes('spanish')) voiceoverLanguage = 'Spanish';
    else if (part3.includes('english')) voiceoverLanguage = 'English (Default)';
    else voiceoverLanguage = parts[3];
  }

  if (parts.length > 4 && parts[4]) {
    const part4 = parts[4].trim().toUpperCase();
    if (part4 === 'A' || part4.includes('FORMAT A')) scriptFormat = 'A';
    else scriptFormat = 'B';
  }

  return {
    selectedIdeaId: ideaId,
    customTopic,
    duration,
    customSeconds,
    customScenes,
    aspectRatio,
    voiceoverLanguage,
    scriptFormat,
  };
}

// Fetch fresh ideas from server
export async function fetchIdeas(theme?: string): Promise<VideoIdea[]> {
  try {
    const res = await fetch('/api/generate-ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme }),
    });
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    return data.ideas || DEFAULT_IDEAS;
  } catch (err) {
    console.warn('Using default ideas fallback:', err);
    return DEFAULT_IDEAS;
  }
}

export interface CharacterAnalysisResult {
  characterName: string;
  artMedium?: string;
  headAndFace: string;
  costume: string;
  lightingStyle?: string;
  colorPalette?: string;
  cameraComposition?: string;
  fullDescription: string;
  highFidelityPrompt?: string;
  storybookDescription?: string;
  artStyleNotes?: string;
  extractedFromPhoto?: boolean;
  styleMode?: 'match_photo' | 'storybook_cartoon';
}

// API: Analyze Character Photo and convert picture to text using Gemini Vision
export async function analyzeCharacterImageAPI(
  imageBase64: string,
  mimeType: string,
  styleMode: 'match_photo' | 'storybook_cartoon' = 'match_photo'
): Promise<CharacterAnalysisResult> {
  const res = await fetch('/api/analyze-character-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mimeType, styleMode }),
  });

  if (!res.ok) {
    throw new Error('Failed to analyze character image');
  }

  return await res.json();
}

// Fetch full workflow data from server
export async function generateWorkflowAPI(config: WorkflowConfig, ideas: VideoIdea[]): Promise<WorkflowData> {
  let title = "The Royal Clockmaker's Unwind";
  let description = "A meticulous royal clockmaker with a velvet waistcoat discovers an antique clock that rewinds time by exactly four seconds every tick.";

  if (config.selectedIdeaId === 'custom' && config.customTopic) {
    title = config.customTopic;
    description = `A suspenseful short story centered around ${config.customTopic}`;
  } else if (typeof config.selectedIdeaId === 'number') {
    const found = ideas.find((i) => i.id === config.selectedIdeaId);
    if (found) {
      title = found.title;
      description = found.description;
    }
  }

  const payload = {
    ideaTitle: title,
    ideaDescription: description,
    duration: config.duration,
    customSeconds: config.customSeconds,
    customScenes: config.customScenes,
    aspectRatio: config.aspectRatio,
    voiceoverLanguage: config.voiceoverLanguage,
    scriptFormat: config.scriptFormat,
    characterConfig: config.characterConfig,
  };

  const res = await fetch('/api/generate-workflow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error('Failed to generate workflow');
  }

  const data = await res.json();
  return {
    ...data,
    ideaTitle: title,
    ideaDescription: description,
    config,
    characterConfig: config.characterConfig,
    createdAt: Date.now(),
  };
}

/**
 * Generates the complete, standalone reference prompt engineered for AI image generators
 * (Google Flow, Midjourney, Imagen 3, FLUX, Whisk) to achieve high similarity to the source photo or archetype.
 */
export function formatCharacterPrompt(
  charConfig?: CharacterConfig,
  aspectRatio = '9:16 vertical',
  generatorFormat: 'flow' | 'midjourney' | 'standard' = 'flow'
): string {
  const ratio = (aspectRatio.includes('16:9') || aspectRatio.includes('Horizontal')) ? '16:9' : '9:16';
  const ratioLabel = ratio === '16:9' ? '16:9 horizontal' : '9:16 vertical';

  const isPhotoMatch = Boolean(charConfig?.extractedFromPhoto && charConfig?.styleMode !== 'storybook_cartoon');

  // If user uploaded a photo and has a highFidelityPrompt generated from Vision
  if (isPhotoMatch && charConfig?.highFidelityPrompt) {
    let prompt = charConfig.highFidelityPrompt.trim();
    if (generatorFormat === 'midjourney') {
      prompt = prompt.replace(/9:16 vertical|16:9 horizontal|9:16|16:9/gi, '').trim().replace(/,\s*,/g, ',');
      return `${prompt} --ar ${ratio} --v 6.1 --style raw`;
    }
    return prompt;
  }

  // If user has custom art medium and likeness extracted
  if (isPhotoMatch && charConfig?.artMedium) {
    const medium = charConfig.artMedium;
    const name = charConfig.name || "Character Reference Model";
    const head = charConfig.headAndFace || "natural facial features";
    const costume = charConfig.costume || "tailored attire";
    const lighting = charConfig.lightingStyle || "cinematic directional soft key light with warm rim lighting";
    const comp = charConfig.cameraComposition || "medium close-up bust portrait, sharp eye focus, shallow depth of field";
    const palette = charConfig.colorPalette ? `, color palette: ${charConfig.colorPalette}` : '';

    if (generatorFormat === 'midjourney') {
      return `${medium} of ${name}, ${head}, wearing ${costume}. ${lighting}, ${comp}${palette}, masterwork quality, ultra-detailed, match reference photo --ar ${ratio} --v 6.1 --style raw`;
    }

    return `${medium} of ${name}, ${head}, wearing ${costume}. ${lighting}, ${comp}${palette}, master quality, ultra-detailed, consistent character design, match uploaded reference photo style, ${ratioLabel}, no text, no watermark.`;
  }

  // Classic Victorian Dark Storybook Cartoon mode
  const artStyle = "Match the exact art style of the uploaded reference image: oversized perfectly round pale cream head, small black eyes with heavy droopy lids, thick expressive eyebrows, small body in highly detailed period costume, 2D cartoon with thick clean dark outlines and soft cel shading, dark cinematic palette with deep red accent lighting.";
  const char = charConfig?.fullDescription || "Master Barnaby, an aristocratic artisan with an oversized perfectly round pale cream head, heavy droopy black eyes, and arched thick eyebrows, wearing an embroidered plum-colored velvet waistcoat with gold filigree buttons";

  if (generatorFormat === 'midjourney') {
    return `2D gothic cartoon portrait of ${char}, dark Victorian workshop setting, antique brass instruments, dramatic crimson rim lighting, high contrast ink contours, soft cel shading --ar ${ratio} --v 6.1 --stylize 250`;
  }

  return `${artStyle} Reference character portrait of ${char}, standing centered in a dark Victorian atmospheric workshop with antique brass instruments, dramatic crimson rim lighting, high contrast ink contours, soft 2D cel shading, ${ratioLabel}, no text, consistent character design, master model reference.`;
}

/**
 * Returns the raw character description string
 */
export function getCharacterDescription(charConfig?: CharacterConfig): string {
  return charConfig?.fullDescription || "Master Barnaby, an aristocratic artisan with an oversized perfectly round pale cream head, heavy droopy black eyes, and arched thick eyebrows, wearing an embroidered plum-colored velvet waistcoat with gold filigree buttons";
}

/**
 * Auto-realigns an individual scene's image prompt so that the character description
 * matches the current global character configuration exactly, while preserving the scene's unique
 * setting, action, props, camera angle, and ending format.
 */
export function realignPromptWithCharacter(
  currentPrompt: string,
  charConfig?: CharacterConfig,
  aspectRatio = '9:16 vertical'
): string {
  const targetDesc = getCharacterDescription(charConfig).trim();
  const ratioLabel = (aspectRatio.includes('16:9') || aspectRatio.includes('Horizontal'))
    ? '16:9 horizontal'
    : '9:16 vertical';

  const isPhotoMatch = Boolean(charConfig?.extractedFromPhoto && charConfig?.styleMode !== 'storybook_cartoon');
  const targetArtOpening = (isPhotoMatch && charConfig?.artMedium)
    ? `Match the exact art style of the uploaded reference image: ${charConfig.artMedium}, ${charConfig.lightingStyle || 'cinematic atmospheric lighting'}, consistent character design and color palette.`
    : `Match the exact art style of the uploaded reference image: oversized perfectly round pale cream head, small black eyes with heavy droopy lids, thick expressive eyebrows, small body in highly detailed period costume, 2D cartoon with thick clean dark outlines and soft cel shading, dark cinematic palette with deep red accent lighting.`;

  const standardSuffix = `${ratioLabel}, no text, consistent character design, match uploaded reference image.`;

  let prompt = (currentPrompt || '').trim();

  // If prompt already contains the exact target description and correct art opening, ensure suffix and return
  if (prompt.includes(targetDesc)) {
    // Replace opening if different
    prompt = prompt.replace(/^Match the exact art style of the uploaded reference image:[^.]*\./i, targetArtOpening);
    if (!prompt.includes(targetArtOpening)) {
      prompt = `${targetArtOpening} ${prompt}`;
    }
    // Clean spaces
    prompt = prompt.replace(/\s+/g, ' ').trim();
    if (!prompt.endsWith('match uploaded reference image.') && !prompt.endsWith('match uploaded reference image')) {
      prompt = `${prompt.replace(/,?\s*(?:9:16 vertical|16:9 horizontal).*$/i, '')}, ${standardSuffix}`;
    }
    return prompt.replace(/\s+/g, ' ').trim();
  }

  // Replace any known legacy/preset character description with targetDesc
  const knownCharacterDescriptions = [
    "Master Barnaby, an aristocratic artisan with an oversized perfectly round pale cream head, heavy droopy black eyes, and arched thick eyebrows, wearing an embroidered plum-colored velvet waistcoat with gold filigree buttons",
    "Madame Vivienne, an enigmatic court alchemist with an oversized perfectly round pale cream head, dramatic arched eyebrows, and heavy hooded dark eyes, wearing a midnight-emerald velvet gown with high ruffled lace collar and obsidian brooches",
    "Captain Silas, an imperial cartographer with an oversized perfectly round pale cream head, bushy grey eyebrows, and curled brass-waxed mustache, wearing a weathered navy wool coat with gold epaulets and brass compass pendant",
    "The Aristocratic Watcher, an eccentric Victorian artisan with an oversized perfectly round pale cream head, heavy droopy black eyes, and arched thick eyebrows, wearing an embroidered midnight velvet frock coat with brass filigree buttons and high ruffled cravat",
    "The Protagonist, an observant individual with an oval face, natural warm complexion, dark hazel eyes, and shoulder-length dark brown wavy hair, wearing a tailored charcoal wool coat and ivory high-neck sweater",
  ];

  let replaced = false;
  for (const known of knownCharacterDescriptions) {
    if (prompt.includes(known)) {
      prompt = prompt.replace(known, targetDesc);
      replaced = true;
      break;
    }
  }

  // If no exact known description matched, try regex matching a character clause:
  // e.g. "[Name], (an|a|with)... wearing [costume]..."
  if (!replaced) {
    const charPattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*(?:an?|with)\s+[^,]+,\s*(?:wearing|dressed in)\s+[^,]+(?=,\s*(?:standing|sitting|holding|walking|gazing|looking|turning|kneeling|reaching|watching|leaning|inspecting|[A-Z]))/i;
    if (charPattern.test(prompt)) {
      prompt = prompt.replace(charPattern, targetDesc);
      replaced = true;
    }
  }

  // Also replace or inject the art style opening
  if (/^Match the exact art style of the uploaded reference image:[^.]*\./i.test(prompt)) {
    prompt = prompt.replace(/^Match the exact art style of the uploaded reference image:[^.]*\./i, targetArtOpening);
  } else {
    // If not replaced and no opening, prepend targetArtOpening
    if (!replaced) {
      prompt = `${targetArtOpening} ${targetDesc}, ${prompt}`;
      replaced = true;
    } else {
      prompt = `${targetArtOpening} ${prompt}`;
    }
  }

  // Ensure suffix
  prompt = prompt.replace(/\s+/g, ' ').trim();
  if (!prompt.includes(standardSuffix)) {
    prompt = prompt.replace(/,?\s*(?:9:16 vertical|16:9 horizontal).*$/i, '');
    prompt = `${prompt}, ${standardSuffix}`;
  }

  return prompt.replace(/\s+/g, ' ').trim();
}


