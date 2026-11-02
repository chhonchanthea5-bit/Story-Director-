import React, { useState } from 'react';
import { Film, Sparkles, Camera, Clock, Layers, Volume2, ArrowRight, ChevronUp, ChevronDown, CheckCircle2 } from 'lucide-react';

interface WebsiteHeroProps {
  onStartWorkflow: () => void;
  onOpenCharacterEditor: () => void;
  onOpenStoryboard: () => void;
  sceneCount: number;
}

export const WebsiteHero: React.FC<WebsiteHeroProps> = ({
  onStartWorkflow,
  onOpenCharacterEditor,
  onOpenStoryboard,
  sceneCount,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-red-950/40 border border-zinc-800 shadow-2xl">
      {/* Background ambient decorative glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 right-0 w-80 h-80 bg-rose-600/10 rounded-full blur-2xl pointer-events-none" />

      <div className="p-5 sm:p-6 relative z-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-white shadow-lg shadow-red-950/60 border border-red-500/40 flex-shrink-0">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase tracking-wider font-bold text-red-400">
                  Google Flow Video Studio
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-950/90 text-red-300 border border-red-800/80 font-mono">
                  v2.0 Web Platform
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-zinc-100 tracking-tight">
                Automated 4-Second Video Production Engine
              </h1>
            </div>
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800/80 transition flex items-center space-x-1 text-xs"
            title={collapsed ? 'Expand intro' : 'Collapse intro'}
          >
            <span className="hidden sm:inline">{collapsed ? 'Show Overview' : 'Hide'}</span>
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {!collapsed && (
          <div className="mt-4 space-y-4 pt-3 border-t border-zinc-800/80">
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-4xl">
              Turn story concepts into production-ready prompts engineered specifically for{' '}
              <strong className="text-zinc-100">Google Flow</strong>. Maintain 100% character facial &amp; costume likeness across every scene, animate using exact 4-second Frames-to-Video clips, and preview multilingual voiceover narration in real time.
            </p>

            {/* Core Pillars Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-start space-x-2.5">
                <div className="p-1.5 rounded-lg bg-red-600/20 text-red-400 mt-0.5 flex-shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-xs text-zinc-200 block">Strict 4s Timing</span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    1 scene = 1 image = 4s clip. Set exact scene counts from 1 to 150+.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-start space-x-2.5">
                <div className="p-1.5 rounded-lg bg-red-600/20 text-red-400 mt-0.5 flex-shrink-0">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-xs text-zinc-200 block">Character Likeness</span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Upload reference photos or customize Victorian personas across all prompts.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-start space-x-2.5">
                <div className="p-1.5 rounded-lg bg-red-600/20 text-red-400 mt-0.5 flex-shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-xs text-zinc-200 block">Google Flow Formats</span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Single-line image &amp; animation prompts with 1-click clipboard transfer.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-start space-x-2.5">
                <div className="p-1.5 rounded-lg bg-red-600/20 text-red-400 mt-0.5 flex-shrink-0">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-xs text-zinc-200 block">Audio TTS Preview</span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Hear voiceovers live in Khmer, Thai, Vietnamese, English, Chinese, or Spanish.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick action bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center space-x-2 text-xs font-mono text-zinc-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ready: {sceneCount} scenes configured ({sceneCount * 4}s video duration)</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={onOpenCharacterEditor}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition flex items-center space-x-1.5"
                >
                  <Camera className="w-3.5 h-3.5 text-red-400" />
                  <span>Customize Character</span>
                </button>
                <button
                  onClick={onOpenStoryboard}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition flex items-center space-x-1.5"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>View Timeline</span>
                </button>
                <button
                  onClick={onStartWorkflow}
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-semibold shadow-md shadow-red-950/50 transition flex items-center space-x-1.5"
                >
                  <span>Configure Video</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
