import React, { useState } from 'react';
import { Copy, Check, Sparkles, X, Palette, User, Camera, Edit3, ChevronDown } from 'lucide-react';
import { CharacterConfig } from '../types/workflow';
import { formatCharacterPrompt } from '../services/api';

interface ArtStyleBannerProps {
  isOpen?: boolean;
  onClose?: () => void;
  isModal?: boolean;
  characterConfig?: CharacterConfig;
  onOpenCharacterEditor?: () => void;
  aspectRatio?: string;
}

export const EXACT_ART_STYLE_OPENING =
  'Match the exact art style of the uploaded reference image: oversized perfectly round pale cream head, small black eyes with heavy droopy lids, thick expressive eyebrows, small body in highly detailed period costume, 2D cartoon with thick clean dark outlines and soft cel shading, dark cinematic palette with deep red accent lighting.';

export const ArtStyleBanner: React.FC<ArtStyleBannerProps> = ({
  isOpen = true,
  onClose,
  isModal = false,
  characterConfig,
  onOpenCharacterEditor,
  aspectRatio = '9:16 vertical',
}) => {
  const [copiedAction, setCopiedAction] = useState<'charPrompt' | 'charSnippet' | 'prefix' | null>(null);
  const [showOptions, setShowOptions] = useState(false);

  const charName = characterConfig?.name || 'Master Barnaby';
  const charDesc =
    characterConfig?.fullDescription ||
    'Master Barnaby, an aristocratic artisan with an oversized perfectly round pale cream head, heavy droopy black eyes, and arched thick eyebrows, wearing an embroidered plum-colored velvet waistcoat with gold filigree buttons';

  const fullCharacterPrompt = formatCharacterPrompt(characterConfig, aspectRatio);

  const handleCopyCharacterPrompt = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(fullCharacterPrompt);
    setCopiedAction('charPrompt');
    setShowOptions(false);
    setTimeout(() => setCopiedAction(null), 2500);
  };

  const handleCopyCharacterSnippet = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(charDesc);
    setCopiedAction('charSnippet');
    setShowOptions(false);
    setTimeout(() => setCopiedAction(null), 2500);
  };

  const handleCopyPrefix = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(EXACT_ART_STYLE_OPENING);
    setCopiedAction('prefix');
    setShowOptions(false);
    setTimeout(() => setCopiedAction(null), 2500);
  };

  const content = (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden backdrop-blur-xl">
      {/* Ambient Red Glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-red-950/80 border border-red-700/50 flex items-center justify-center text-red-400">
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center space-x-2">
              <span>Google Flow Art Style &amp; Character Specification</span>
              <span className="text-[10px] bg-red-950 text-red-400 border border-red-800/80 px-2 py-0.5 rounded-full font-mono">
                Editable Character
              </span>
            </h3>
            <p className="text-xs text-zinc-400">
              Active character is injected into every Step 3 Image and Step 4 Animation prompt identically.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onOpenCharacterEditor && (
            <button
              onClick={onOpenCharacterEditor}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 hover:text-red-200 border border-red-500/40 text-xs font-semibold transition cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-amber-400" />
              <span>Edit Character / Upload Photo</span>
            </button>
          )}

          {isModal && onClose && (
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-200 p-1 rounded-lg hover:bg-zinc-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-4 items-center">
        {/* Visual Graphic Representation or Uploaded Image */}
        <div className="lg:col-span-4 bg-zinc-950/90 p-4 rounded-xl border border-zinc-800/90 flex flex-col items-center justify-center relative group">
          <div className="relative w-32 h-32 flex items-center justify-center">
            {/* If user uploaded a photo, display the photo; else display SVG caricature */}
            {characterConfig?.imageUrl ? (
              <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-red-500/60 shadow-lg shadow-red-950/60 group">
                <img
                  src={characterConfig.imageUrl}
                  alt={charName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center p-1.5">
                  <span className="text-[10px] font-mono text-emerald-400 font-bold bg-black/60 px-1.5 py-0.5 rounded">
                    Photo Reference
                  </span>
                </div>
              </div>
            ) : (
              <>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-zinc-900 to-black border-2 border-red-900/60 shadow-lg shadow-red-950/50" />
                <svg
                  className="relative w-28 h-28 z-10 filter drop-shadow-[0_0_12px_rgba(220,38,38,0.4)]"
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="50" cy="46" r="34" fill="#7f1d1d" opacity="0.3" />
                  <path
                    d="M32 75 C32 64, 40 60, 50 60 C60 60, 68 64, 68 75 L72 94 L28 94 Z"
                    fill="#271c2b"
                    stroke="#18181b"
                    strokeWidth="2.5"
                  />
                  <path d="M47 62 L53 62 L55 76 L50 82 L45 76 Z" fill="#b91c1c" stroke="#18181b" strokeWidth="1.5" />
                  <circle cx="50" cy="70" r="1.5" fill="#f59e0b" />
                  <circle cx="50" cy="76" r="1.5" fill="#f59e0b" />
                  <path
                    d="M38 60 C42 57, 58 57, 62 60 C58 64, 42 64, 38 60"
                    fill="#e4e4e7"
                    stroke="#18181b"
                    strokeWidth="2"
                  />
                  <circle
                    cx="50"
                    cy="38"
                    r="26"
                    fill="#faf6e9"
                    stroke="#18181b"
                    strokeWidth="2.8"
                  />
                  <path
                    d="M26 44 C28 58, 42 64, 58 62 C46 62, 30 54, 26 44 Z"
                    fill="#e8debe"
                    opacity="0.8"
                  />
                  <path
                    d="M36 30 Q42 26 46 29"
                    stroke="#18181b"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M54 29 Q58 26 64 30"
                    stroke="#18181b"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                  />
                  <circle cx="41" cy="36" r="2.8" fill="#18181b" />
                  <path
                    d="M37 34 Q41 36 45 35"
                    stroke="#18181b"
                    strokeWidth="2"
                    fill="#faf6e9"
                  />
                  <circle cx="59" cy="36" r="2.8" fill="#18181b" />
                  <path
                    d="M55 35 Q59 36 63 34"
                    stroke="#18181b"
                    strokeWidth="2"
                    fill="#faf6e9"
                  />
                  <circle cx="50" cy="42" r="1" fill="#c4b58e" />
                  <path d="M47 48 Q50 49 53 48" stroke="#18181b" strokeWidth="1.8" strokeLinecap="round" />
                  <path
                    d="M68 22 C76 30, 78 46, 70 58"
                    stroke="#ef4444"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    opacity="0.9"
                  />
                </svg>
              </>
            )}
          </div>
          <span className="text-[11px] font-bold text-zinc-200 mt-2">
            {charName}
          </span>
          <span className="text-[10px] text-zinc-500 text-center truncate max-w-[200px]">
            {characterConfig?.costume || '2D Round Head • Period Velvet'}
          </span>
        </div>

        {/* Text Prompt Block */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-3">
          <div className="p-3 bg-black/60 rounded-xl border border-zinc-800 font-mono text-xs text-zinc-300 leading-relaxed">
            <span className="text-zinc-500 select-none block text-[10px] uppercase font-bold tracking-wider mb-0.5">
              Current Character Specification:
            </span>
            &ldquo;{charDesc}&rdquo;
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap gap-1.5 text-[11px] text-zinc-400">
              <span className="px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/50">
                Name: {charName}
              </span>
              <span className="px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/50">
                100% Consistent in all scenes
              </span>
              {characterConfig?.extractedFromPhoto && (
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                  ✓ Photo Converted
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2 relative">
              {onOpenCharacterEditor && (
                <button
                  onClick={onOpenCharacterEditor}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition"
                  title="Edit character profile or upload reference photo"
                >
                  <Edit3 className="w-3 h-3 text-red-400" />
                  <span>Edit</span>
                </button>
              )}

              {/* Primary Copy Character Prompt Button */}
              <div className="relative inline-flex items-center rounded-lg shadow-sm">
                <button
                  onClick={handleCopyCharacterPrompt}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-l-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition shadow-md shadow-red-950/60 cursor-pointer"
                  title="Copy full reference character prompt for Google Flow"
                >
                  {copiedAction === 'charPrompt' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>Copied Character Prompt!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-white" />
                      <span>Copy Character Prompt</span>
                    </>
                  )}
                </button>

                {/* Dropdown Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowOptions(!showOptions);
                  }}
                  className="px-1.5 py-1.5 rounded-r-lg bg-red-700 hover:bg-red-600 border-l border-red-500/40 text-white text-xs transition cursor-pointer"
                  title="More copy options"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {/* Options Menu */}
                {showOptions && (
                  <div className="absolute right-0 top-full mt-1.5 w-60 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-1 z-50 animate-in fade-in duration-150">
                    <button
                      onClick={handleCopyCharacterPrompt}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs text-zinc-100 hover:bg-zinc-800 flex items-center justify-between font-semibold"
                    >
                      <div className="flex items-center space-x-2">
                        <User className="w-3.5 h-3.5 text-red-400" />
                        <span>Full Character Prompt</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">Anchor</span>
                    </button>

                    <button
                      onClick={handleCopyCharacterSnippet}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-zinc-800 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <Copy className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Character Snippet Only</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">Desc</span>
                    </button>

                    <button
                      onClick={handleCopyPrefix}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-zinc-800 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <Palette className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Art Style Prefix Only</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">Style</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="max-w-2xl w-full">{content}</div>
      </div>
    );
  }

  return content;
};
