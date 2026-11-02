import React, { useState, useRef, useEffect } from 'react';
import { CharacterConfig } from '../types/workflow';
import {
  analyzeCharacterImageAPI,
  formatCharacterPrompt,
  CharacterAnalysisResult,
} from '../services/api';
import {
  Upload,
  Sparkles,
  User,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Palette,
  AlertCircle,
  X,
  Camera,
  Copy,
  Wand2,
  Sliders,
  CheckCheck,
  Info,
  SunMedium,
  Layers,
  ChevronDown,
} from 'lucide-react';

interface CharacterEditorProps {
  characterConfig: CharacterConfig;
  onSaveCharacter: (newChar: CharacterConfig, applyToExistingScenes?: boolean) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const DEFAULT_CHARACTER: CharacterConfig = {
  name: "Master Barnaby",
  headAndFace: "oversized perfectly round pale cream head, heavy droopy black eyes, and arched thick eyebrows",
  costume: "embroidered plum-colored velvet waistcoat with gold filigree buttons",
  fullDescription: "Master Barnaby, an aristocratic artisan with an oversized perfectly round pale cream head, heavy droopy black eyes, and arched thick eyebrows, wearing an embroidered plum-colored velvet waistcoat with gold filigree buttons",
  artMedium: "2D cartoon with thick clean dark outlines and soft cel shading, dark cinematic palette with deep red accent lighting",
  lightingStyle: "Dramatic deep red rim accent lighting with dark shadows",
  colorPalette: "Plum purple, antique gold, midnight black, crimson red",
  cameraComposition: "Medium close-up portrait, centered framing, high contrast ink contours",
  styleMode: "storybook_cartoon",
};

export const PRESET_CHARACTERS: CharacterConfig[] = [
  {
    name: "Master Barnaby",
    headAndFace: "oversized perfectly round pale cream head, heavy droopy black eyes, and arched thick eyebrows",
    costume: "embroidered plum-colored velvet waistcoat with gold filigree buttons",
    fullDescription: "Master Barnaby, an aristocratic artisan with an oversized perfectly round pale cream head, heavy droopy black eyes, and arched thick eyebrows, wearing an embroidered plum-colored velvet waistcoat with gold filigree buttons",
    artMedium: "2D cartoon with thick clean dark outlines and soft cel shading",
    lightingStyle: "Deep red rim accent lighting with dark shadows",
    colorPalette: "Plum purple, gold, black, crimson",
    cameraComposition: "Medium close-up portrait",
    styleMode: "storybook_cartoon",
  },
  {
    name: "Madame Vivienne",
    headAndFace: "oversized perfectly round pale cream head, dramatic arched eyebrows, heavy hooded dark eyes with subtle beauty mark",
    costume: "gothic midnight-emerald velvet gown with high lace collar, obsidian brooches, and tailored corset bodice",
    fullDescription: "Madame Vivienne, an enigmatic court alchemist with an oversized perfectly round pale cream head, dramatic arched eyebrows, and heavy hooded dark eyes, wearing a midnight-emerald velvet gown with high ruffled lace collar and obsidian brooches",
    artMedium: "2D cartoon with thick clean dark outlines and soft cel shading",
    lightingStyle: "Eerie emerald green and crimson dual rim lighting",
    colorPalette: "Midnight emerald, obsidian black, ivory lace",
    cameraComposition: "Three-quarter bust portrait",
    styleMode: "storybook_cartoon",
  },
  {
    name: "Captain Silas",
    headAndFace: "oversized perfectly round pale cream head, droopy lids, bushy grey eyebrows, and curled brass-waxed mustache",
    costume: "weathered navy wool captain coat with tarnished gold epaulets, brass compass pendant, and ruffled ascot",
    fullDescription: "Captain Silas, an imperial cartographer with an oversized perfectly round pale cream head, bushy grey eyebrows, and curled brass-waxed mustache, wearing a weathered navy wool coat with gold epaulets and brass compass pendant",
    artMedium: "2D cartoon with thick clean dark outlines and soft cel shading",
    lightingStyle: "Warm lantern key light with cool deep-sea ambient shadow",
    colorPalette: "Navy blue, weathered gold, sea brass",
    cameraComposition: "Centered bust portrait",
    styleMode: "storybook_cartoon",
  },
];

export const CharacterEditor: React.FC<CharacterEditorProps> = ({
  characterConfig,
  onSaveCharacter,
  onClose,
  isModal = false,
}) => {
  const [name, setName] = useState(characterConfig?.name || DEFAULT_CHARACTER.name);
  const [headAndFace, setHeadAndFace] = useState(characterConfig?.headAndFace || DEFAULT_CHARACTER.headAndFace);
  const [costume, setCostume] = useState(characterConfig?.costume || DEFAULT_CHARACTER.costume);
  const [fullDescription, setFullDescription] = useState(characterConfig?.fullDescription || DEFAULT_CHARACTER.fullDescription);
  
  // Style fidelity and image similarity attributes
  const [artMedium, setArtMedium] = useState(characterConfig?.artMedium || '');
  const [lightingStyle, setLightingStyle] = useState(characterConfig?.lightingStyle || '');
  const [colorPalette, setColorPalette] = useState(characterConfig?.colorPalette || '');
  const [cameraComposition, setCameraComposition] = useState(characterConfig?.cameraComposition || '');
  const [styleMode, setStyleMode] = useState<'match_photo' | 'storybook_cartoon'>(
    characterConfig?.styleMode || (characterConfig?.extractedFromPhoto ? 'match_photo' : 'storybook_cartoon')
  );
  const [highFidelityPrompt, setHighFidelityPrompt] = useState(characterConfig?.highFidelityPrompt || '');

  const [imagePreview, setImagePreview] = useState<string | null>(characterConfig?.imageUrl || null);
  const [imageMime, setImageMime] = useState<string>('image/jpeg');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [copiedAction, setCopiedAction] = useState<'flow' | 'midjourney' | 'snippet' | null>(null);
  const [showAdvancedAttributes, setShowAdvancedAttributes] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Re-generate highFidelityPrompt when fields change
  const currentConfig: CharacterConfig = {
    name: name.trim() || DEFAULT_CHARACTER.name,
    headAndFace: headAndFace.trim() || DEFAULT_CHARACTER.headAndFace,
    costume: costume.trim() || DEFAULT_CHARACTER.costume,
    fullDescription: fullDescription.trim() || DEFAULT_CHARACTER.fullDescription,
    artMedium: artMedium.trim() || undefined,
    lightingStyle: lightingStyle.trim() || undefined,
    colorPalette: colorPalette.trim() || undefined,
    cameraComposition: cameraComposition.trim() || undefined,
    styleMode,
    highFidelityPrompt: highFidelityPrompt.trim() || undefined,
    imageUrl: imagePreview || undefined,
    imageMimeType: imageMime,
    extractedFromPhoto: Boolean(imagePreview),
  };

  const flowReadyPrompt = formatCharacterPrompt(currentConfig, '9:16 vertical', 'flow');
  const midjourneyPrompt = formatCharacterPrompt(currentConfig, '9:16 vertical', 'midjourney');

  const handleCopyFlowPrompt = () => {
    navigator.clipboard.writeText(flowReadyPrompt);
    setCopiedAction('flow');
    setSuccessToast('✓ Copied 1:1 High-Fidelity Prompt (Google Flow / Imagen)!');
    setTimeout(() => {
      setCopiedAction(null);
      setSuccessToast(null);
    }, 3000);
  };

  const handleCopyMidjourneyPrompt = () => {
    navigator.clipboard.writeText(midjourneyPrompt);
    setCopiedAction('midjourney');
    setSuccessToast('✓ Copied Midjourney Format (--ar 9:16 --v 6.1 --style raw)!');
    setTimeout(() => {
      setCopiedAction(null);
      setSuccessToast(null);
    }, 3000);
  };

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(fullDescription.trim());
    setCopiedAction('snippet');
    setSuccessToast('✓ Copied character description snippet!');
    setTimeout(() => {
      setCopiedAction(null);
      setSuccessToast(null);
    }, 2500);
  };

  // Auto-compose full description when fields update (unless user directly modified full description)
  const handleComposeDescription = (newName: string, newHead: string, newCostume: string) => {
    const composed = `${newName.trim()}, with ${newHead.trim()}, wearing ${newCostume.trim()}`;
    setFullDescription(composed);
  };

  // Handle image upload from disk
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    setErrorMsg(null);
    setImageMime(file.type);

    const reader = new FileReader();
    reader.onload = () => {
      const base64Url = reader.result as string;
      setImagePreview(base64Url);
      // Automatically analyze photo with 1:1 fidelity
      analyzePhoto(base64Url, file.type, 'match_photo');
    };
    reader.readAsDataURL(file);
  };

  // Convert picture to text via Gemini Vision API with high visual similarity
  const analyzePhoto = async (
    base64String: string,
    mimeType: string,
    mode: 'match_photo' | 'storybook_cartoon'
  ) => {
    setIsAnalyzing(true);
    setErrorMsg(null);
    try {
      const result: CharacterAnalysisResult = await analyzeCharacterImageAPI(base64String, mimeType, mode);
      
      if (result.characterName) setName(result.characterName);
      if (result.artMedium) setArtMedium(result.artMedium);
      if (result.headAndFace) setHeadAndFace(result.headAndFace);
      if (result.costume) setCostume(result.costume);
      if (result.lightingStyle) setLightingStyle(result.lightingStyle);
      if (result.colorPalette) setColorPalette(result.colorPalette);
      if (result.cameraComposition) setCameraComposition(result.cameraComposition);
      if (result.highFidelityPrompt) setHighFidelityPrompt(result.highFidelityPrompt);
      if (result.fullDescription) setFullDescription(result.fullDescription);

      setStyleMode(mode);
      setShowAdvancedAttributes(true);

      const styleLabel = mode === 'match_photo' ? '1:1 Visual Replica' : 'Storybook Cartoon';
      setSuccessToast(`✓ Image analyzed! Style: ${result.artMedium ? result.artMedium.slice(0, 32) + '...' : styleLabel}`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Could not analyze photo. You can still customize the description manually.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyPreset = (preset: CharacterConfig) => {
    setName(preset.name);
    setHeadAndFace(preset.headAndFace);
    setCostume(preset.costume);
    setFullDescription(preset.fullDescription);
    setArtMedium(preset.artMedium || '');
    setLightingStyle(preset.lightingStyle || '');
    setColorPalette(preset.colorPalette || '');
    setCameraComposition(preset.cameraComposition || '');
    setStyleMode('storybook_cartoon');
    setImagePreview(null);
  };

  const handleSave = (applyToScenes = true) => {
    onSaveCharacter(currentConfig, applyToScenes);
    if (onClose) onClose();
  };

  const content = (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl space-y-5 max-w-3xl">
      {/* Ambient Red Glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 text-red-400 flex items-center justify-center shadow-inner">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100 flex items-center space-x-2">
              <span>Character Editor &amp; Photo Style Matcher</span>
              <span className="text-[10px] bg-red-950 text-red-400 border border-red-800/80 px-2 py-0.5 rounded-full font-mono">
                1:1 Style Fidelity
              </span>
            </h3>
            <p className="text-xs text-zinc-400">
              Upload a character photo to convert it into a prompt that reliably recreates the same likeness and artistic medium.
            </p>
          </div>
        </div>

        {isModal && onClose && (
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Notification Toast */}
      {successToast && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-xs font-medium flex items-center space-x-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-950/80 border border-red-800/80 text-red-300 text-xs font-medium flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* PHOTO UPLOAD & 1:1 STYLE CONVERTER */}
      <div className="p-4 bg-zinc-950/90 border border-zinc-800 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-zinc-200 flex items-center space-x-1.5">
            <Camera className="w-3.5 h-3.5 text-amber-400" />
            <span>Upload Photo to Convert to Image-Prompt:</span>
          </label>
          <span className="text-[10px] text-zinc-500 font-mono">PNG, JPG, WEBP</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Upload Drop Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="md:col-span-8 border-2 border-dashed border-zinc-700 hover:border-red-500/80 bg-zinc-900/50 hover:bg-zinc-900 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition group text-center"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            {isAnalyzing ? (
              <div className="flex flex-col items-center space-y-2 py-2">
                <RefreshCw className="w-6 h-6 text-red-400 animate-spin" />
                <span className="text-xs font-semibold text-zinc-200">
                  Analyzing exact art medium, likeness &amp; lighting...
                </span>
                <span className="text-[10px] text-zinc-500">
                  Extracting rendering style, face shape, hair, costume, and color palette
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-1.5 py-1">
                <div className="w-8 h-8 rounded-full bg-zinc-800 group-hover:bg-red-600/20 text-zinc-400 group-hover:text-red-400 flex items-center justify-center transition">
                  <Upload className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-zinc-300 group-hover:text-white">
                  Click or drag photo here to auto-convert
                </span>
                <span className="text-[10px] text-zinc-500">
                  AI Vision captures the photo's exact medium (3D, photo, anime, oil) &amp; character
                </span>
              </div>
            )}
          </div>

          {/* Image Preview Thumbnail & Status */}
          <div className="md:col-span-4 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 flex flex-col items-center justify-center h-32 relative">
            {imagePreview ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center">
                <img
                  src={imagePreview}
                  alt="Reference Preview"
                  className="max-h-24 max-w-full object-contain rounded-lg border border-zinc-700/80 shadow"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setImagePreview(null);
                    setArtMedium('');
                    setHighFidelityPrompt('');
                  }}
                  className="absolute -top-1 -right-1 bg-zinc-800 hover:bg-red-600 text-zinc-300 hover:text-white p-1 rounded-full text-xs shadow-md transition"
                  title="Remove image"
                >
                  <X className="w-3 h-3" />
                </button>
                <span className="text-[10px] text-emerald-400 mt-1 font-mono font-medium flex items-center space-x-1">
                  <Check className="w-2.5 h-2.5" />
                  <span>Photo Loaded</span>
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-zinc-600 space-y-1 text-center">
                <ImageIcon className="w-6 h-6 opacity-40" />
                <span className="text-[10px]">No image uploaded</span>
                <span className="text-[9px] text-zinc-700">Using archetype preset</span>
              </div>
            )}
          </div>
        </div>

        {/* STYLE PRESERVATION MODE TOGGLE */}
        {imagePreview && (
          <div className="pt-2 border-t border-zinc-800/80 space-y-1.5">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Style Preservation Mode:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStyleMode('match_photo')}
                className={`p-3 rounded-xl border text-left transition flex items-start space-x-2.5 ${
                  styleMode === 'match_photo'
                    ? 'bg-red-950/50 border-red-500/80 text-zinc-100 ring-1 ring-red-500/50'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className={`mt-0.5 p-1 rounded-lg ${styleMode === 'match_photo' ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-zinc-200">1:1 Photo Style Replica</span>
                    <span className="text-[9px] bg-red-900/80 text-red-300 px-1.5 py-0.2 rounded font-mono">Recommended</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                    Generates prompts that preserve the photo's exact medium (Photorealism, 3D CGI, Anime, Oil), lighting, and facial likeness.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStyleMode('storybook_cartoon')}
                className={`p-3 rounded-xl border text-left transition flex items-start space-x-2.5 ${
                  styleMode === 'storybook_cartoon'
                    ? 'bg-red-950/50 border-red-500/80 text-zinc-100 ring-1 ring-red-500/50'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className={`mt-0.5 p-1 rounded-lg ${styleMode === 'storybook_cartoon' ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                  <Palette className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-zinc-200">Victorian Storybook Preset</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                    Translates the character into the classic oversized pale-round-head 2D dark fantasy cartoon aesthetic.
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* QUICK PRESET ARCHETYPES ROW */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
          Preset Archetypes (Or use your uploaded photo above):
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {PRESET_CHARACTERS.map((preset) => {
            const isCurrent = name === preset.name && !imagePreview;
            return (
              <button
                key={preset.name}
                onClick={() => handleApplyPreset(preset)}
                className={`p-2.5 rounded-xl border text-left transition text-xs flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-red-950/40 border-red-500/80 text-zinc-100 ring-1 ring-red-500/40'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">{preset.name}</span>
                  {isCurrent && <Check className="w-3 h-3 text-red-400" />}
                </div>
                <span className="text-[10px] text-zinc-500 truncate mt-1">
                  {preset.costume}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* EDITABLE CHARACTER ATTRIBUTES */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
            Character Details &amp; Visual Anchors:
          </span>
          <button
            type="button"
            onClick={() => setShowAdvancedAttributes(!showAdvancedAttributes)}
            className="text-[11px] text-red-400 hover:text-red-300 flex items-center space-x-1 cursor-pointer"
          >
            <Sliders className="w-3 h-3" />
            <span>{showAdvancedAttributes ? 'Hide Advanced Style Tags' : 'Fine-Tune Style & Lighting'}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showAdvancedAttributes ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Character Name */}
        <div>
          <label className="text-xs font-medium text-zinc-300 block mb-1">
            Character Name / Subject:
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              handleComposeDescription(e.target.value, headAndFace, costume);
            }}
            placeholder="E.g., The Protagonist, Elena Vance, Captain Silas"
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700/80 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500 font-mono"
          />
        </div>

        {/* Head & Facial Features */}
        <div>
          <label className="text-xs font-medium text-zinc-300 block mb-1">
            Facial Features, Hair, Eye Appearance &amp; Likeness:
          </label>
          <input
            type="text"
            value={headAndFace}
            onChange={(e) => {
              setHeadAndFace(e.target.value);
              handleComposeDescription(name, e.target.value, costume);
            }}
            placeholder="E.g., natural fair skin, almond hazel eyes, wavy chestnut hair parted slightly left"
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700/80 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500 font-mono"
          />
        </div>

        {/* Costume & Colors */}
        <div>
          <label className="text-xs font-medium text-zinc-300 block mb-1">
            Costume, Fabrics, Tailoring &amp; Wardrobe Colors:
          </label>
          <input
            type="text"
            value={costume}
            onChange={(e) => {
              setCostume(e.target.value);
              handleComposeDescription(name, headAndFace, e.target.value);
            }}
            placeholder="E.g., tailored charcoal wool overcoat over an ivory knit high-neck sweater"
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700/80 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500 font-mono"
          />
        </div>

        {/* ADVANCED STYLE & LIGHTING TAGS (EXPANDABLE) */}
        {showAdvancedAttributes && (
          <div className="p-3.5 bg-black/60 border border-zinc-800 rounded-xl space-y-2.5 animate-in fade-in">
            {/* Art Medium */}
            <div>
              <label className="text-[11px] font-medium text-zinc-300 flex items-center space-x-1.5 mb-1">
                <Layers className="w-3 h-3 text-red-400" />
                <span>Exact Visual Medium &amp; Rendering Style:</span>
              </label>
              <input
                type="text"
                value={artMedium}
                onChange={(e) => setArtMedium(e.target.value)}
                placeholder="E.g., Photorealistic portrait photograph shot on 85mm prime lens / 3D Pixar CGI render / 2D Anime cel"
                className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-500 font-mono"
              />
            </div>

            {/* Lighting Style */}
            <div>
              <label className="text-[11px] font-medium text-zinc-300 flex items-center space-x-1.5 mb-1">
                <SunMedium className="w-3 h-3 text-amber-400" />
                <span>Lighting Setup &amp; Atmosphere:</span>
              </label>
              <input
                type="text"
                value={lightingStyle}
                onChange={(e) => setLightingStyle(e.target.value)}
                placeholder="E.g., Cinematic directional soft key light with warm golden rim accent and diffused ambient shadows"
                className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Color Palette */}
              <div>
                <label className="text-[11px] font-medium text-zinc-300 flex items-center space-x-1.5 mb-1">
                  <Palette className="w-3 h-3 text-purple-400" />
                  <span>Color Palette Accents:</span>
                </label>
                <input
                  type="text"
                  value={colorPalette}
                  onChange={(e) => setColorPalette(e.target.value)}
                  placeholder="E.g., Charcoal black, ivory cream, warm amber gold"
                  className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-500 font-mono"
                />
              </div>

              {/* Camera Framing */}
              <div>
                <label className="text-[11px] font-medium text-zinc-300 flex items-center space-x-1.5 mb-1">
                  <Camera className="w-3 h-3 text-cyan-400" />
                  <span>Camera Framing &amp; Focus:</span>
                </label>
                <input
                  type="text"
                  value={cameraComposition}
                  onChange={(e) => setCameraComposition(e.target.value)}
                  placeholder="E.g., Medium close-up, shallow depth of field, sharp eye focus"
                  className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-500 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* MASTER HIGH-FIDELITY IMAGE PROMPT BOX & COPY HUB */}
        <div className="pt-2">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <label className="text-xs font-bold text-zinc-200">
                Generated High-Fidelity Character Prompt (Copy &amp; Create Image):
              </label>
            </div>
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={handleCopySnippet}
                className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-medium border border-zinc-700 transition flex items-center space-x-1"
                title="Copy character description snippet only"
              >
                {copiedAction === 'snippet' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-zinc-400" />
                    <span>Copy Snippet</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCopyMidjourneyPrompt}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-semibold border border-zinc-700 transition flex items-center space-x-1 cursor-pointer"
                title="Copy with Midjourney flags (--ar 9:16 --v 6.1 --style raw)"
              >
                {copiedAction === 'midjourney' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied MJ!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-amber-400" />
                    <span>Midjourney Format</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCopyFlowPrompt}
                className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold shadow-md shadow-red-950 transition flex items-center space-x-1.5 cursor-pointer"
                title="Copy complete high-fidelity prompt for Google Flow / Imagen 3"
              >
                {copiedAction === 'flow' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Copied Master Prompt!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-white" />
                    <span>Copy 1:1 Character Prompt</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="relative">
            <textarea
              rows={4}
              value={flowReadyPrompt}
              readOnly
              className="w-full px-3.5 py-2.5 bg-black/85 border border-zinc-700/80 rounded-xl text-xs text-zinc-200 font-mono leading-relaxed focus:outline-none focus:border-red-500 scrollbar-thin select-all"
            />
          </div>

          {/* SIMILARITY PRO-TIP */}
          <div className="mt-2 p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-200/90 text-[11px] flex items-start space-x-2">
            <Info className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
            <span>
              <strong>How to get identical likeness:</strong> Paste this prompt into Google Flow or Midjourney. For maximum similarity, also upload your source photo as the image reference input — the AI uses both the visual anchor and these exact descriptive tokens.
            </span>
          </div>
        </div>
      </div>

      {/* ACTION FOOTER */}
      <div className="pt-3 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleCopyFlowPrompt}
            className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
          >
            {copiedAction === 'flow' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied Prompt!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-red-400" />
                <span>Copy Master Prompt</span>
              </>
            )}
          </button>
          <span className="text-[11px] text-zinc-500 hidden sm:inline">
            Applies to all video scenes.
          </span>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {isModal && onClose && (
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition cursor-pointer"
            >
              Cancel
            </button>
          )}

          <button
            onClick={() => handleSave(true)}
            className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-950/60 transition cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Character &amp; Style to Workflow</span>
          </button>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
        <div className="max-w-3xl w-full my-8">{content}</div>
      </div>
    );
  }

  return content;
};
