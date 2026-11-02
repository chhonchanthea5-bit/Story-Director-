import React, { useState } from 'react';
import { VideoIdea } from '../types/workflow';
import { Sparkles, Check, RefreshCw, Lightbulb, PenLine } from 'lucide-react';

interface Step1IdeasProps {
  ideas: VideoIdea[];
  selectedIdeaId: number | 'custom';
  customTopic: string;
  onSelectIdea: (id: number | 'custom') => void;
  onChangeCustomTopic: (topic: string) => void;
  onRegenerateIdeas: (theme?: string) => Promise<void>;
  isLoadingIdeas: boolean;
}

export const Step1Ideas: React.FC<Step1IdeasProps> = ({
  ideas,
  selectedIdeaId,
  customTopic,
  onSelectIdea,
  onChangeCustomTopic,
  onRegenerateIdeas,
  isLoadingIdeas,
}) => {
  const [themeInput, setThemeInput] = useState('');
  const [showCustomThemeInput, setShowCustomThemeInput] = useState(false);

  const handleRegenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await onRegenerateIdeas(themeInput.trim() || undefined);
  };

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 text-red-400 font-bold flex items-center justify-center text-sm">
            1
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100 flex items-center space-x-2">
              <span>STEP 1 — 10 Short Video Ideas</span>
              <span className="text-xs font-normal text-zinc-400">(Title + One sentence each)</span>
            </h2>
            <p className="text-xs text-zinc-400">
              Each idea is structured for a 4-second animated scene cadence with dark irony and visual twists.
            </p>
          </div>
        </div>

        {/* AI Regenerate Trigger */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowCustomThemeInput(!showCustomThemeInput)}
            className="text-xs text-zinc-400 hover:text-zinc-200 px-2.5 py-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800/80 transition"
          >
            {showCustomThemeInput ? 'Hide Theme Filter' : 'Custom Genre / Theme'}
          </button>

          <button
            onClick={() => handleRegenerate()}
            disabled={isLoadingIdeas}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700/80 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingIdeas ? 'animate-spin text-red-400' : 'text-zinc-400'}`} />
            <span>{isLoadingIdeas ? 'Generating...' : 'Refresh Ideas'}</span>
          </button>
        </div>
      </div>

      {/* Theme prompt row if toggled */}
      {showCustomThemeInput && (
        <form onSubmit={handleRegenerate} className="mt-4 p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <input
            type="text"
            value={themeInput}
            onChange={(e) => setThemeInput(e.target.value)}
            placeholder="E.g., Haunted Victorian clockmaker, cursed royal bakery, alchemy museum, absurd royal court..."
            className="flex-1 bg-transparent text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isLoadingIdeas}
            className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-medium transition"
          >
            Generate
          </button>
        </form>
      )}

      {/* 10 Ideas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
        {ideas.map((idea) => {
          const isSelected = selectedIdeaId === idea.id;
          return (
            <div
              key={idea.id}
              onClick={() => onSelectIdea(idea.id)}
              className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all relative ${
                isSelected
                  ? 'bg-red-950/40 border-red-500/80 shadow-md shadow-red-950/40 ring-1 ring-red-500/50'
                  : 'bg-zinc-950/50 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                      isSelected ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {idea.id}
                  </span>
                  <h4 className="text-sm font-semibold text-zinc-100">
                    {idea.title}
                  </h4>
                </div>
                {isSelected && (
                  <span className="flex items-center space-x-1 text-[11px] text-red-400 font-medium">
                    <Check className="w-3.5 h-3.5" />
                    <span>Selected</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                {idea.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Custom Topic Card */}
      <div
        onClick={() => onSelectIdea('custom')}
        className={`mt-4 p-4 rounded-xl border transition-all ${
          selectedIdeaId === 'custom'
            ? 'bg-red-950/40 border-red-500/80 ring-1 ring-red-500/50'
            : 'bg-zinc-950/40 border-zinc-800 hover:border-zinc-700'
        }`}
      >
        <div className="flex items-center space-x-2">
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
              selectedIdeaId === 'custom' ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            ✦
          </div>
          <span className="text-sm font-semibold text-zinc-200">
            Write Custom Video Topic / Idea
          </span>
        </div>
        <div className="mt-2.5">
          <input
            type="text"
            value={customTopic}
            onChange={(e) => {
              onChangeCustomTopic(e.target.value);
              if (selectedIdeaId !== 'custom') onSelectIdea('custom');
            }}
            placeholder="Type your own story concept here (e.g., A pirate captain whose compass points to bad decisions)..."
            className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-700/80 rounded-lg text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500"
          />
        </div>
      </div>
    </div>
  );
};
