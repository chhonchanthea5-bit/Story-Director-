export interface VideoIdea {
  id: number;
  title: string;
  description: string;
}

export interface CharacterConfig {
  name: string;
  headAndFace: string;
  costume: string;
  fullDescription: string;
  imageUrl?: string;
  imageMimeType?: string;
  extractedFromPhoto?: boolean;
  // Enhanced visual similarity and style fidelity fields
  artMedium?: string;             // e.g., "3D stylized Pixar-style CGI render", "Photorealistic 85mm portrait photo", "2D anime cel illustration"
  lightingStyle?: string;         // e.g., "Cinematic dramatic rim lighting with warm amber key and soft ambient fill"
  colorPalette?: string;          // e.g., "Deep charcoal, crimson red accents, burnished antique gold"
  cameraComposition?: string;     // e.g., "Medium close-up portrait, sharp eye focus, shallow depth of field"
  styleMode?: 'match_photo' | 'storybook_cartoon'; // 1:1 photo replica vs Victorian cartoon stylization
  highFidelityPrompt?: string;    // Master prompt engineered for 1:1 image generator fidelity
  negativePrompt?: string;        // Negative prompt parameters e.g., "no distortion, no text, no blur"
}

export interface SceneItem {
  sceneNumber: number;
  shortSceneName: string;
  imagePrompt: string;
  animationPrompt: string;
  voiceoverScriptFormatA: string;
  voiceoverScriptFormatB: string;
}

export interface WorkflowConfig {
  selectedIdeaId: number | 'custom';
  customTopic: string;
  duration: string;
  customSeconds?: number;
  customScenes?: number;
  aspectRatio: string;
  voiceoverLanguage: string;
  scriptFormat: 'A' | 'B';
  characterConfig?: CharacterConfig;
}

export interface WorkflowData {
  summaryLine: string;
  scenes: SceneItem[];
  ideaTitle: string;
  ideaDescription: string;
  config: WorkflowConfig;
  characterConfig?: CharacterConfig;
  createdAt: number;
}
