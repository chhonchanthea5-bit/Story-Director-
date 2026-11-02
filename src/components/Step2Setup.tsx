import React, { useState, useEffect } from 'react';
import { WorkflowConfig, VideoIdea } from '../types/workflow';
import { calculateSceneDetails, parseQuickReply, formatCharacterPrompt } from '../services/api';
import { CheckSquare, Square, ArrowRight, Zap, Calculator, Film, Globe, Clock, Check, Camera, User, Copy, Layers, Plus, Minus, Image as ImageIcon } from 'lucide-react';

interface Step2SetupProps {
  ideas: VideoIdea[];
  config: WorkflowConfig;
  onChangeConfig: (newConfig: WorkflowConfig) => void;
  onSubmit: () => void;
  onOpenCharacterEditor?: () => void;
  isGenerating: boolean;
}

export const Step2Setup: React.FC<Step2SetupProps> = ({
  ideas,
  config,
  onChangeConfig,
  onSubmit,
  onOpenCharacterEditor,
  isGenerating,
}) => {
  const [quickLine, setQuickLine] = useState('');
  const [customIdeaNumber, setCustomIdeaNumber] = useState('');
  const [customDurationInput, setCustomDurationInput] = useState('');
  const [customSceneCountInput, setCustomSceneCountInput] = useState('');
  const [customLanguageInput, setCustomLanguageInput] = useState('');
  const [countMode, setCountMode] = useState<'scenes' | 'duration'>('scenes');
  const [copiedCharPrompt, setCopiedCharPrompt] = useState(false);

  // Calculate live timing with support for customScenes
  const { totalSeconds, numScenes } = calculateSceneDetails(config.duration, config.customSeconds, config.customScenes);

  const ratioClean = config.aspectRatio.includes('16:9') || config.aspectRatio.includes('Horizontal')
    ? '16:9 horizontal'
    : '9:16 vertical';

  // Helper to update scene count directly
  const handleSetSceneCount = (count: number) => {
    const safeCount = Math.max(1, Math.min(150, count));
    const sec = safeCount * 4;
    let durLabel = `${sec} seconds (${safeCount} scenes)`;
    if (safeCount === 15) durLabel = '1 minute (15 scenes — Default)';
    else if (safeCount === 5) durLabel = '20 seconds (5 scenes)';
    else if (safeCount === 8) durLabel = '30 seconds (8 scenes)';
    else if (safeCount === 45) durLabel = '3 minutes (45 scenes)';
    else if (safeCount === 75) durLabel = '5 minutes (75 scenes)';

    setCustomSceneCountInput(String(safeCount));
    onChangeConfig({
      ...config,
      duration: durLabel,
      customSeconds: sec,
      customScenes: safeCount,
    });
  };

  const handleCopyCharacterPrompt = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const prompt = formatCharacterPrompt(config.characterConfig, ratioClean);
    navigator.clipboard.writeText(prompt);
    setCopiedCharPrompt(true);
    setTimeout(() => setCopiedCharPrompt(false), 2500);
  };

  // Construct the exact confirmation line required
  const confirmationLine = `${config.duration.split('(')[0].trim()} = ${numScenes} scenes × 4 seconds, ${ratioClean}, voiceover in ${config.voiceoverLanguage.split('(')[0].trim()}, script ${config.scriptFormat}.`;

  const handleApplyQuickLine = (inputStr?: string) => {
    const target = inputStr || quickLine;
    if (!target.trim()) return;
    const parsed = parseQuickReply(target, ideas);
    onChangeConfig(parsed);
  };

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 text-red-400 font-bold flex items-center justify-center text-sm">
            2
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100 flex items-center space-x-2">
              <span>STEP 2 — Setup Menu (Exact Tick-Box Format)</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
                Strict 4s Scenes
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Answer everything in one go via checkboxes or typing one short line below.
            </p>
          </div>
        </div>

        {/* Live Calculation Pill */}
        <div className="flex items-center space-x-2 bg-black/60 border border-zinc-800 px-3 py-1.5 rounded-xl">
          <Calculator className="w-4 h-4 text-red-400" />
          <span className="text-xs font-mono text-zinc-300">
            {numScenes} scenes × 4s = <strong className="text-red-400">{totalSeconds}s</strong>
          </span>
        </div>
      </div>

      {/* Quick Line Input Bar */}
      <div className="mt-5 p-4 bg-zinc-950/80 border border-zinc-800/90 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-zinc-300 flex items-center space-x-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Quick One-Line Answer (Optional Shortcut)</span>
          </label>
          <span className="text-[11px] text-zinc-500">
            Example: &ldquo;3, 1 minute, 9:16, Khmer, B&rdquo;
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={quickLine}
            onChange={(e) => setQuickLine(e.target.value)}
            placeholder="Type: e.g. 3, 1 minute, 9:16, Khmer, B"
            className="flex-1 bg-zinc-900 border border-zinc-700/80 rounded-lg px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500 font-mono"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleApplyQuickLine();
              }
            }}
          />
          <button
            onClick={() => handleApplyQuickLine()}
            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg border border-zinc-700 transition"
          >
            Apply Line
          </button>
        </div>

        {/* Quick presets */}
        <div className="flex flex-wrap items-center gap-2 mt-2.5 text-[11px]">
          <span className="text-zinc-500">Presets:</span>
          <button
            onClick={() => {
              const str = '1, 1 minute, 9:16, English, B';
              setQuickLine(str);
              handleApplyQuickLine(str);
            }}
            className="text-zinc-400 hover:text-zinc-200 underline decoration-zinc-700"
          >
            Default (1, 1m, 9:16, English, B)
          </button>
          <span className="text-zinc-700">•</span>
          <button
            onClick={() => {
              const str = '3, 1 minute, 9:16, Khmer, B';
              setQuickLine(str);
              handleApplyQuickLine(str);
            }}
            className="text-zinc-400 hover:text-zinc-200 underline decoration-zinc-700"
          >
            Example Prompt (3, 1m, 9:16, Khmer, B)
          </button>
          <span className="text-zinc-700">•</span>
          <button
            onClick={() => {
              const str = '2, 30 seconds, 16:9, Thai, A';
              setQuickLine(str);
              handleApplyQuickLine(str);
            }}
            className="text-zinc-400 hover:text-zinc-200 underline decoration-zinc-700"
          >
            Cinematic (2, 30s, 16:9, Thai, A)
          </button>
          <span className="text-zinc-700">•</span>
          <button
            onClick={() => {
              const str = '1, 10 scenes, 9:16, English, B';
              setQuickLine(str);
              handleApplyQuickLine(str);
            }}
            className="text-red-400 hover:text-red-300 underline decoration-red-900 font-medium"
          >
            10 Scenes (1, 10 scenes, 9:16, English, B)
          </button>
          <span className="text-zinc-700">•</span>
          <button
            onClick={() => {
              const str = '1, 8 images, 16:9, English, B';
              setQuickLine(str);
              handleApplyQuickLine(str);
            }}
            className="text-red-400 hover:text-red-300 underline decoration-red-900 font-medium"
          >
            8 Images (1, 8 images, 16:9, English, B)
          </button>
        </div>
      </div>

      {/* Active Character Profile & Edit/Upload Trigger */}
      <div className="mt-5 p-3.5 bg-zinc-950/80 border border-zinc-800/90 rounded-xl flex items-center justify-between text-xs">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-red-950/80 border border-red-800/80 text-red-400 flex items-center justify-center font-bold text-xs">
            {config.characterConfig?.name?.[0] || 'B'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-zinc-100">
                Character: {config.characterConfig?.name || 'Master Barnaby'}
              </span>
              {config.characterConfig?.extractedFromPhoto && (
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/80 px-1.5 py-0.2 rounded">
                  {config.characterConfig?.styleMode === 'storybook_cartoon' ? 'Storybook' : 'Photo 1:1 Match'}
                </span>
              )}
              {config.characterConfig?.artMedium && (
                <span className="text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700 px-1.5 py-0.2 rounded hidden sm:inline truncate max-w-xs">
                  {config.characterConfig.artMedium.split(',')[0]}
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 line-clamp-1 max-w-lg mt-0.5">
              {config.characterConfig?.fullDescription || 'Master Barnaby, Victorian artisan in plum velvet waistcoat'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            type="button"
            onClick={handleCopyCharacterPrompt}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 hover:text-white text-xs font-semibold transition cursor-pointer"
            title="Copy reference character prompt for Google Flow"
          >
            {copiedCharPrompt ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Copied Prompt!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-red-400" />
                <span>Copy Character Prompt</span>
              </>
            )}
          </button>

          {onOpenCharacterEditor && (
            <button
              type="button"
              onClick={onOpenCharacterEditor}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-red-400" />
              <span>Edit / Upload Photo</span>
            </button>
          )}
        </div>
      </div>

      {/* The EXACT Tick-Box Format as specified in the workflow */}
      <div className="mt-6 space-y-6">
        {/* Question 0 */}
        <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800/80">
          <h3 className="text-sm font-semibold text-zinc-200 mb-3">
            0. Which idea (1–10) do you want to make?
          </h3>
          <div className="space-y-2 text-xs">
            {/* 1 to 10 with write number */}
            <div
              onClick={() => {
                const num = parseInt(customIdeaNumber, 10) || 1;
                onChangeConfig({ ...config, selectedIdeaId: num });
              }}
              className={`flex items-center space-x-2.5 p-2 rounded-lg cursor-pointer transition ${
                typeof config.selectedIdeaId === 'number'
                  ? 'bg-zinc-800/60 text-zinc-100'
                  : 'text-zinc-400 hover:bg-zinc-900'
              }`}
            >
              {typeof config.selectedIdeaId === 'number' ? (
                <CheckSquare className="w-4 h-4 text-red-500 flex-shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-zinc-600 flex-shrink-0" />
              )}
              <div className="flex items-center space-x-2">
                <span>1 to 10 (Write number:</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={typeof config.selectedIdeaId === 'number' ? config.selectedIdeaId : customIdeaNumber}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setCustomIdeaNumber(e.target.value);
                    if (!isNaN(val) && val >= 1 && val <= 10) {
                      onChangeConfig({ ...config, selectedIdeaId: val });
                    }
                  }}
                  className="w-14 px-2 py-0.5 bg-zinc-900 border border-zinc-700 rounded text-center text-zinc-100 focus:outline-none focus:border-red-500 font-mono"
                  placeholder="1-10"
                />
                <span>)</span>
                {typeof config.selectedIdeaId === 'number' && (
                  <span className="text-zinc-500 text-[11px] truncate max-w-xs">
                    — &ldquo;{ideas.find((i) => i.id === config.selectedIdeaId)?.title || `Idea ${config.selectedIdeaId}`}&rdquo;
                  </span>
                )}
              </div>
            </div>

            {/* Custom Topic */}
            <div
              onClick={() => onChangeConfig({ ...config, selectedIdeaId: 'custom' })}
              className={`flex items-center space-x-2.5 p-2 rounded-lg cursor-pointer transition ${
                config.selectedIdeaId === 'custom'
                  ? 'bg-zinc-800/60 text-zinc-100'
                  : 'text-zinc-400 hover:bg-zinc-900'
              }`}
            >
              {config.selectedIdeaId === 'custom' ? (
                <CheckSquare className="w-4 h-4 text-red-500 flex-shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-zinc-600 flex-shrink-0" />
              )}
              <div className="flex items-center space-x-2 flex-1">
                <span>Custom Topic:</span>
                <input
                  type="text"
                  value={config.customTopic}
                  onChange={(e) => onChangeConfig({ ...config, selectedIdeaId: 'custom', customTopic: e.target.value })}
                  placeholder="Enter topic..."
                  className="flex-1 max-w-md px-2 py-0.5 bg-zinc-900 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            {/* Default: Idea 1 */}
            <div
              onClick={() => onChangeConfig({ ...config, selectedIdeaId: 1 })}
              className={`flex items-center space-x-2.5 p-2 rounded-lg cursor-pointer transition ${
                config.selectedIdeaId === 1
                  ? 'bg-zinc-800/60 text-zinc-100'
                  : 'text-zinc-400 hover:bg-zinc-900'
              }`}
            >
              {config.selectedIdeaId === 1 ? (
                <CheckSquare className="w-4 h-4 text-red-500 flex-shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-zinc-600 flex-shrink-0" />
              )}
              <span>Default: Idea 1 (The Royal Clockmaker&apos;s Unwind)</span>
            </div>
          </div>
        </div>

        {/* Question 1: How many images & scenes to generate? */}
        <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-semibold text-zinc-200">
                  1. How many images &amp; scenes to generate?
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-800/60 font-semibold">
                  {numScenes} Scenes ({numScenes} Images = {totalSeconds}s)
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Google Flow rule: 1 scene = 1 image prompt = 1 four-second animation clip.
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-xs self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setCountMode('scenes')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-medium transition ${
                  countMode === 'scenes'
                    ? 'bg-red-600 text-white shadow-sm shadow-red-950/60'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>By Scene / Image Count</span>
              </button>
              <button
                type="button"
                onClick={() => setCountMode('duration')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-medium transition ${
                  countMode === 'duration'
                    ? 'bg-red-600 text-white shadow-sm shadow-red-950/60'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>By Duration</span>
              </button>
            </div>
          </div>

          {countMode === 'scenes' ? (
            <div className="space-y-3">
              {/* Common Scene Count Presets */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-xs">
                {[
                  { count: 3, label: '3 Scenes', sub: '3 Images • 12s test' },
                  { count: 5, label: '5 Scenes', sub: '5 Images • 20s Short' },
                  { count: 8, label: '8 Scenes', sub: '8 Images • 32s Story' },
                  { count: 10, label: '10 Scenes', sub: '10 Images • 40s Promo' },
                  { count: 12, label: '12 Scenes', sub: '12 Images • 48s Story' },
                  { count: 15, label: '15 Scenes', sub: '15 Images • 60s (Default)', isDefault: true },
                  { count: 20, label: '20 Scenes', sub: '20 Images • 80s Video' },
                  { count: 30, label: '30 Scenes', sub: '30 Images • 2 mins' },
                  { count: 45, label: '45 Scenes', sub: '45 Images • 3 mins' },
                  { count: 60, label: '60 Scenes', sub: '60 Images • 4 mins' },
                ].map((item) => {
                  const isSelected = numScenes === item.count;
                  return (
                    <div
                      key={item.count}
                      onClick={() => handleSetSceneCount(item.count)}
                      className={`flex flex-col p-2.5 rounded-lg cursor-pointer border transition text-left ${
                        isSelected
                          ? 'bg-red-950/50 border-red-500/70 text-zinc-100 ring-1 ring-red-500/40 shadow-sm'
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center space-x-1.5">
                        {isSelected ? (
                          <CheckSquare className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
                        )}
                        <span className="font-semibold text-zinc-200">{item.label}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 pl-5 mt-0.5">
                        {item.sub}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Exact Custom Scene / Image Count Input & Stepper */}
              <div className="p-3 bg-zinc-900/70 border border-zinc-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
                    <ImageIcon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-zinc-200 block">
                      Custom Number of Scenes / Images to Generate:
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Type any exact number of scenes (1 to 150):
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Stepper Decrement */}
                  <button
                    type="button"
                    onClick={() => handleSetSceneCount(numScenes - 1)}
                    disabled={numScenes <= 1}
                    className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 flex items-center justify-center text-zinc-200 disabled:opacity-40 transition"
                    title="Decrease 1 scene"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  {/* Direct Number Input */}
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="150"
                      value={customSceneCountInput || numScenes}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setCustomSceneCountInput(e.target.value);
                        if (!isNaN(val) && val >= 1) {
                          handleSetSceneCount(val);
                        }
                      }}
                      className="w-20 px-2 py-1.5 bg-zinc-950 border border-zinc-700 rounded-lg text-center text-zinc-100 font-mono font-bold text-sm focus:outline-none focus:border-red-500"
                    />
                  </div>

                  {/* Stepper Increment */}
                  <button
                    type="button"
                    onClick={() => handleSetSceneCount(numScenes + 1)}
                    disabled={numScenes >= 150}
                    className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 flex items-center justify-center text-zinc-200 disabled:opacity-40 transition"
                    title="Increase 1 scene"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>

                  {/* Quick Increment Pills */}
                  <div className="flex items-center space-x-1 pl-2 border-l border-zinc-800">
                    <button
                      type="button"
                      onClick={() => handleSetSceneCount(numScenes + 1)}
                      className="px-2 py-1 rounded bg-zinc-800/80 hover:bg-zinc-700 text-[11px] text-zinc-300 border border-zinc-700/80 transition"
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetSceneCount(numScenes + 5)}
                      className="px-2 py-1 rounded bg-zinc-800/80 hover:bg-zinc-700 text-[11px] text-zinc-300 border border-zinc-700/80 transition"
                    >
                      +5
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetSceneCount(numScenes + 10)}
                      className="px-2 py-1 rounded bg-zinc-800/80 hover:bg-zinc-700 text-[11px] text-zinc-300 border border-zinc-700/80 transition"
                    >
                      +10
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic Generation Cascade Confirmation */}
              <div className="px-3.5 py-2.5 bg-black/60 border border-zinc-800/80 rounded-xl flex items-center justify-between text-xs font-mono">
                <div className="flex items-center space-x-2 text-zinc-300">
                  <span className="text-red-400 font-bold">{numScenes}</span>
                  <span className="text-zinc-500">images</span>
                  <ArrowRight className="w-3 h-3 text-zinc-600" />
                  <span className="text-red-400 font-bold">{numScenes}</span>
                  <span className="text-zinc-500">4s video clips</span>
                  <ArrowRight className="w-3 h-3 text-zinc-600" />
                  <span className="text-red-400 font-bold">{numScenes}</span>
                  <span className="text-zinc-500">voiceover lines</span>
                </div>
                <div className="text-amber-400 font-semibold">
                  Total Video: {totalSeconds}s ({Math.floor(totalSeconds / 60) > 0 ? `${Math.floor(totalSeconds / 60)}m ` : ''}{totalSeconds % 60}s)
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
              {[
                { label: '20 seconds (5 scenes)', scenes: 5, sec: 20 },
                { label: '30 seconds (8 scenes)', scenes: 8, sec: 30 },
                { label: '1 minute (15 scenes — Default)', scenes: 15, sec: 60, isDefault: true },
                { label: '3 minutes (45 scenes)', scenes: 45, sec: 180 },
                { label: '5 minutes (75 scenes)', scenes: 75, sec: 300 },
              ].map((dur) => {
                const isSelected = numScenes === dur.scenes;
                return (
                  <div
                    key={dur.label}
                    onClick={() => {
                      handleSetSceneCount(dur.scenes);
                    }}
                    className={`flex items-center space-x-2 p-2.5 rounded-lg cursor-pointer border transition ${
                      isSelected
                        ? 'bg-red-950/40 border-red-500/70 text-zinc-100 ring-1 ring-red-500/40'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-red-500 flex-shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                    )}
                    <span className="font-medium">{dur.label}</span>
                  </div>
                );
              })}

              {/* Other duration in seconds */}
              <div
                className={`flex items-center space-x-2 p-2.5 rounded-lg border transition sm:col-span-2 lg:col-span-1 ${
                  Boolean(config.customSeconds) && ![20, 30, 60, 180, 300].includes(config.customSeconds || 0)
                    ? 'bg-red-950/40 border-red-500/70 text-zinc-100 ring-1 ring-red-500/40'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                {Boolean(config.customSeconds) && ![20, 30, 60, 180, 300].includes(config.customSeconds || 0) ? (
                  <CheckSquare className="w-4 h-4 text-red-500 flex-shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                )}
                <div className="flex items-center space-x-1.5 flex-1">
                  <span className="whitespace-nowrap">Other (from 4s to 30m):</span>
                  <input
                    type="number"
                    min="4"
                    max="1800"
                    step="4"
                    value={config.customSeconds || customDurationInput}
                    onChange={(e) => {
                      const sec = parseInt(e.target.value, 10);
                      setCustomDurationInput(e.target.value);
                      if (!isNaN(sec) && sec >= 4) {
                        const sc = Math.max(1, Math.ceil(sec / 4));
                        onChangeConfig({
                          ...config,
                          duration: `Custom (${sec}s)`,
                          customSeconds: sec,
                          customScenes: sc,
                        });
                      }
                    }}
                    placeholder="sec"
                    className="w-16 px-1.5 py-0.5 bg-zinc-950 border border-zinc-700 rounded text-center text-zinc-100 focus:outline-none focus:border-red-500 font-mono text-xs"
                  />
                  <span className="text-zinc-500 text-[10px]">sec</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Question 2: What aspect ratio? */}
        <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800/80">
          <h3 className="text-sm font-semibold text-zinc-200 mb-3">
            2. What aspect ratio?
          </h3>
          <div className="flex flex-col sm:flex-row gap-3 text-xs">
            {[
              { label: '9:16 (Vertical — Default)', desc: 'TikTok, Reels, Shorts (1080x1920)' },
              { label: '16:9 (Horizontal)', desc: 'YouTube, Landscape Video (1920x1080)' },
            ].map((ar) => {
              const isSelected = config.aspectRatio.includes(ar.label.split(' ')[0]);
              return (
                <div
                  key={ar.label}
                  onClick={() => onChangeConfig({ ...config, aspectRatio: ar.label })}
                  className={`flex items-center space-x-2.5 p-3 rounded-lg cursor-pointer border flex-1 transition ${
                    isSelected
                      ? 'bg-red-950/40 border-red-500/70 text-zinc-100 ring-1 ring-red-500/40'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-red-500 flex-shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                  )}
                  <div>
                    <span className="font-semibold">{ar.label}</span>
                    <p className="text-[10px] text-zinc-500">{ar.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Question 3: What voiceover language? */}
        <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800/80">
          <h3 className="text-sm font-semibold text-zinc-200 mb-3">
            3. What voiceover language?
          </h3>
          <p className="text-[11px] text-zinc-500 mb-2">
            * Note: Prompts remain 100% in English for Google Flow. Only the voiceover script uses this language.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
            {[
              { id: 'English (Default)', label: 'English (Default)' },
              { id: 'Khmer (ភាសាខ្មែរ)', label: 'Khmer (ភាសាខ្មែរ)' },
              { id: 'Thai', label: 'Thai' },
              { id: 'Vietnamese', label: 'Vietnamese' },
              { id: 'Chinese', label: 'Chinese' },
              { id: 'Spanish', label: 'Spanish' },
            ].map((lang) => {
              const isSelected = config.voiceoverLanguage.includes(lang.id.split(' ')[0]);
              return (
                <div
                  key={lang.id}
                  onClick={() => onChangeConfig({ ...config, voiceoverLanguage: lang.id })}
                  className={`flex items-center space-x-2 p-2.5 rounded-lg cursor-pointer border transition ${
                    isSelected
                      ? 'bg-red-950/40 border-red-500/70 text-zinc-100 ring-1 ring-red-500/40'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-red-500 flex-shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                  )}
                  <span className="font-medium">{lang.label}</span>
                </div>
              );
            })}

            {/* Other language */}
            <div
              className={`flex items-center space-x-2 p-2.5 rounded-lg border transition col-span-2 sm:col-span-1 ${
                !['English', 'Khmer', 'Thai', 'Vietnamese', 'Chinese', 'Spanish'].some((l) =>
                  config.voiceoverLanguage.includes(l)
                )
                  ? 'bg-red-950/40 border-red-500/70 text-zinc-100 ring-1 ring-red-500/40'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
              }`}
            >
              <input
                type="text"
                value={customLanguageInput}
                onChange={(e) => {
                  setCustomLanguageInput(e.target.value);
                  if (e.target.value.trim()) {
                    onChangeConfig({ ...config, voiceoverLanguage: e.target.value.trim() });
                  }
                }}
                placeholder="Other language..."
                className="w-full bg-transparent text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Question 4: Which script format? */}
        <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800/80">
          <h3 className="text-sm font-semibold text-zinc-200 mb-3">
            4. Which script format?
          </h3>
          <div className="space-y-2 text-xs">
            <div
              onClick={() => onChangeConfig({ ...config, scriptFormat: 'A' })}
              className={`flex items-start space-x-3 p-3 rounded-xl cursor-pointer border transition ${
                config.scriptFormat === 'A'
                  ? 'bg-red-950/40 border-red-500/70 text-zinc-100 ring-1 ring-red-500/40'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              {config.scriptFormat === 'A' ? (
                <CheckSquare className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-zinc-600 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <span className="font-semibold block text-zinc-100">
                  Format A: Scene by scene
                </span>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Labeled lines with speaker names (e.g. &ldquo;Scene 1: Narrator: ...&rdquo;), to sync per 4-second clip.
                </p>
              </div>
            </div>

            <div
              onClick={() => onChangeConfig({ ...config, scriptFormat: 'B' })}
              className={`flex items-start space-x-3 p-3 rounded-xl cursor-pointer border transition ${
                config.scriptFormat === 'B'
                  ? 'bg-red-950/40 border-red-500/70 text-zinc-100 ring-1 ring-red-500/40'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              {config.scriptFormat === 'B' ? (
                <CheckSquare className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-zinc-600 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-zinc-100">
                    Format B: Full voiceover
                  </span>
                  <span className="text-[10px] bg-red-950 text-red-400 px-1.5 py-0.2 rounded border border-red-800/80">
                    Default
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  One continuous text block per scene for TTS tools (no scene labels, no speaker names, no stage directions).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation & Direct Execution Line */}
      <div className="mt-6 pt-5 border-t border-zinc-800">
        <div className="bg-black/80 rounded-xl p-3.5 border border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="text-xs font-mono text-zinc-300">
            <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider mb-0.5">
              Exact Confirmation Statement:
            </span>
            &ldquo;{confirmationLine}&rdquo;
          </div>

          <button
            onClick={onSubmit}
            disabled={isGenerating}
            className="w-full md:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-semibold text-sm shadow-lg shadow-red-950/60 flex items-center justify-center space-x-2 transition disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Generating {numScenes} Scenes...</span>
              </>
            ) : (
              <>
                <span>Go Straight into Step 3</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
