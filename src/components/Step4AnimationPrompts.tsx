import React, { useState } from 'react';
import { WorkflowData } from '../types/workflow';
import { Copy, Check, ArrowRight, Video, ShieldCheck, Film, CheckCheck, ChevronDown, ChevronUp, User } from 'lucide-react';
import { formatCharacterPrompt } from '../services/api';

interface Step4AnimationPromptsProps {
  workflowData: WorkflowData;
  onGoToStep5: () => void;
}

export const Step4AnimationPrompts: React.FC<Step4AnimationPromptsProps> = ({
  workflowData,
  onGoToStep5,
}) => {
  const [copiedMode, setCopiedMode] = useState<'raw' | 'markdown' | number | null>(null);
  const [copiedCharacterPrompt, setCopiedCharacterPrompt] = useState(false);
  const [copyFormat, setCopyFormat] = useState<'raw' | 'markdown'>('raw');
  const [showIndividualList, setShowIndividualList] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { scenes, config } = workflowData;
  const numScenes = scenes.length;

  const ratioClean = config.aspectRatio.includes('16:9') || config.aspectRatio.includes('Horizontal')
    ? '16:9 horizontal'
    : '9:16 vertical';

  const chunkSize = 40;
  const chunks: { header: string; blockText: string; sceneRange: [number, number] }[] = [];

  for (let i = 0; i < numScenes; i += chunkSize) {
    const startScene = i + 1;
    const endScene = Math.min(i + chunkSize, numScenes);
    const chunkScenes = scenes.slice(i, endScene);

    const header = `Scenes ${startScene}–${endScene}, in order`;
    const firstLine = `Animate the ${chunkScenes.length} images I just created. Make one 4-second video per image using image-to-video (Frames to Video), with each image as the starting frame: Image ${startScene} for Clip ${startScene}, Image ${startScene + 1} for Clip ${startScene + 1}, and so on, in this exact order. Do not create new images, do not use text-to-video, do not change any scene, framing, character or outfit. ${ratioClean}. No audio.`;

    const promptsJoined = chunkScenes
      .map((s) => s.animationPrompt)
      .join('\n\n');

    const blockText = `${firstLine}\n\n${promptsJoined}`;
    chunks.push({ header, blockText, sceneRange: [startScene, endScene] });
  }

  // Raw continuous string of all active animation code blocks (ready for Google Flow agent chat)
  const allClipsJoined = scenes
    .map((s) => s.animationPrompt)
    .join('\n\n');
  const rawAggregatedString = `Animate the ${numScenes} images I just created. Make one 4-second video per image using image-to-video (Frames to Video), with each image as the starting frame: Image 1 for Clip 1, Image 2 for Clip 2, and so on, in this exact order. Do not create new images, do not use text-to-video, do not change any scene, framing, character or outfit. ${ratioClean}. No audio.\n\n${allClipsJoined}`;

  // Markdown format with code fence wrapper
  const markdownAggregatedString = chunks
    .map((c) => `${c.header}\n\`\`\`\n${c.blockText}\n\`\`\``)
    .join('\n\n') + '\n\nType SCRIPT for the voiceover script.';

  // Metrics
  const totalWords = rawAggregatedString.trim().split(/\s+/).length;
  const totalChars = rawAggregatedString.length;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const characterPrompt = formatCharacterPrompt(workflowData.characterConfig || config.characterConfig, ratioClean);

  const handleCopyCharacterPrompt = () => {
    navigator.clipboard.writeText(characterPrompt);
    setCopiedCharacterPrompt(true);
    showToast(`✓ Copied Reference Character Prompt (${workflowData.characterConfig?.name || 'Master Barnaby'}) to clipboard!`);
    setTimeout(() => setCopiedCharacterPrompt(false), 2500);
  };

  const handleCopyAll = (formatOverride?: 'raw' | 'markdown') => {
    const targetFormat = formatOverride || copyFormat;
    const textToCopy = targetFormat === 'raw' ? rawAggregatedString : markdownAggregatedString;
    navigator.clipboard.writeText(textToCopy);
    setCopiedMode(targetFormat);
    showToast(`Copied all ${numScenes} Animation Prompts (${totalWords.toLocaleString()} words) to clipboard! Ready to paste into Google Flow.`);
    setTimeout(() => setCopiedMode(null), 2500);
  };

  const handleCopyChunk = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedMode(idx);
    showToast(`Copied block (Clips ${chunks[idx].sceneRange[0]}–${chunks[idx].sceneRange[1]}) to clipboard.`);
    setTimeout(() => setCopiedMode(null), 2000);
  };

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-rose-600 text-white px-4 py-2.5 rounded-xl shadow-2xl shadow-rose-950/80 border border-rose-400/40 text-xs font-semibold flex items-center space-x-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCheck className="w-4 h-4 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Step Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-5 border-b border-zinc-800 gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 text-red-400 font-bold flex items-center justify-center text-sm">
            4
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100 flex items-center space-x-2">
              <span>STEP 4 — ANIMATION PROMPTS ONLY</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-400 border border-rose-800/80 font-mono">
                Frames to Video (4s Clips)
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Paste the aggregated code block into Google Flow to animate each generated frame into a 4-second clip.
            </p>
          </div>
        </div>

        {/* COPY FEATURE BUTTONS */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Copy Character Prompt Button */}
          <button
            onClick={handleCopyCharacterPrompt}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-semibold border border-zinc-700 transition cursor-pointer"
            title="Copy reference character prompt for Google Flow"
          >
            {copiedCharacterPrompt ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied Character!</span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5 text-red-400" />
                <span>Copy Character Prompt</span>
              </>
            )}
          </button>

          {/* Format Toggle */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              onClick={() => setCopyFormat('raw')}
              className={`px-2.5 py-1.5 rounded-lg transition font-medium ${
                copyFormat === 'raw'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Clean code block content without markdown ticks - perfect for Google Flow chat"
            >
              Direct Prompt
            </button>
            <button
              onClick={() => setCopyFormat('markdown')}
              className={`px-2.5 py-1.5 rounded-lg transition font-medium ${
                copyFormat === 'markdown'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Includes markdown code block formatting and headers"
            >
              Markdown
            </button>
          </div>

          {/* Primary High-Impact Copy All Button */}
          <button
            onClick={() => handleCopyAll()}
            className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white text-xs font-bold shadow-lg shadow-red-950/60 border border-red-500/30 transition active:scale-95 cursor-pointer"
          >
            {copiedMode === copyFormat ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Copied All {numScenes} Clips!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy All ({numScenes} Clips)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info & Stats Banner */}
      <div className="mt-4 p-3.5 bg-zinc-950/90 border border-zinc-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs text-zinc-300">
        <div className="flex items-center space-x-2">
          <Film className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>
            {numScenes} Animated Clips • Exactly 4 seconds each • Image 1..{numScenes} as Initial Frames
          </span>
        </div>
        <div className="flex items-center space-x-3 text-[11px] text-zinc-400 font-mono">
          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
            {totalWords.toLocaleString()} words
          </span>
          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
            {totalChars.toLocaleString()} chars
          </span>
          <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/80">
            Static / Slow Push-In
          </span>
        </div>
      </div>

      {/* Code Blocks */}
      <div className="mt-5 space-y-6">
        {chunks.map((chunk, idx) => (
          <div key={idx} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-zinc-300 font-mono tracking-wide">
                  {chunk.header}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  (Single code block for Google Flow)
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCopyChunk(chunk.blockText, idx)}
                  className="flex items-center space-x-1.5 text-xs text-zinc-300 hover:text-white px-2.5 py-1 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700/60 transition"
                >
                  {copiedMode === idx ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Copied Block</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Copy Block</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="relative group rounded-xl border border-zinc-800 bg-black/90 p-4 font-mono text-xs text-zinc-200 leading-relaxed overflow-x-auto max-h-[460px] scrollbar-thin shadow-inner">
              <pre className="whitespace-pre-wrap">{chunk.blockText}</pre>
            </div>
          </div>
        ))}
      </div>

      {/* Step Ending Line & Navigation */}
      <div className="mt-6 pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs font-mono text-amber-400 bg-amber-950/40 border border-amber-900/60 px-3 py-1.5 rounded-lg">
          Type SCRIPT for the voiceover script.
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={() => handleCopyAll('raw')}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs border border-zinc-700 flex items-center justify-center space-x-2 transition"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy All Again</span>
          </button>

          <button
            onClick={onGoToStep5}
            className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs shadow-md shadow-red-950/50 flex items-center justify-center space-x-2 transition"
          >
            <span>Proceed to Step 5 (SCRIPT)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scene Inspector Accordion */}
      <div className="mt-4 pt-3 border-t border-zinc-800/60">
        <button
          onClick={() => setShowIndividualList(!showIndividualList)}
          className="flex items-center space-x-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition"
        >
          {showIndividualList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{showIndividualList ? 'Hide Individual Clips' : `Inspect all ${numScenes} clips individually`}</span>
        </button>

        {showIndividualList && (
          <div className="mt-3 space-y-3">
            {scenes.map((s) => {
              const wordCount = s.animationPrompt.trim().split(/\s+/).length;
              return (
                <div key={s.sceneNumber} className="p-3.5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl text-xs">
                  <div className="flex items-center justify-between text-zinc-300 font-semibold mb-1.5">
                    <span>Clip {s.sceneNumber} — {s.shortSceneName}</span>
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${wordCount >= 150 && wordCount <= 200 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80' : 'bg-zinc-800 text-zinc-400'}`}>
                        {wordCount} words
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(s.animationPrompt);
                          showToast(`Copied Clip ${s.sceneNumber} prompt!`);
                        }}
                        className="text-[11px] text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 transition"
                      >
                        Copy Clip
                      </button>
                    </div>
                  </div>
                  <p className="text-zinc-400 leading-relaxed font-mono text-[11px]">{s.animationPrompt}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Sticky Bottom Bar for instant One-Click Transfer on Long Pages */}
      <div className="sticky bottom-4 mt-8 z-30 bg-zinc-950/95 backdrop-blur-md border border-zinc-800/90 rounded-2xl p-3 px-4 shadow-2xl flex items-center justify-between gap-3 ring-1 ring-zinc-700/50">
        <div className="flex items-center space-x-2 text-xs">
          <div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
          <span className="font-mono text-zinc-300">
            Step 4: {numScenes} Animation Clips Ready
          </span>
          <span className="text-zinc-500 hidden md:inline">• {totalWords.toLocaleString()} words</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleCopyAll('raw')}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-950/60 transition cursor-pointer"
          >
            {copiedMode === 'raw' ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied All!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy All for Google Flow</span>
              </>
            )}
          </button>

          <button
            onClick={onGoToStep5}
            className="hidden sm:flex items-center space-x-1 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition"
          >
            <span>Next (Step 5)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
