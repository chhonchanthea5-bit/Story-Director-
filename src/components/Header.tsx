import React from 'react';
import { Film, Sparkles, Terminal, LayoutDashboard, Copy, Check, Clock, Camera } from 'lucide-react';

interface HeaderProps {
  activeTab: 'studio' | 'console' | 'storyboard';
  setActiveTab: (tab: 'studio' | 'console' | 'storyboard') => void;
  onOpenArtGuide: () => void;
  onOpenCharacterEditor?: () => void;
  sceneCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenArtGuide,
  onOpenCharacterEditor,
  sceneCount = 15,
}) => {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => setActiveTab('studio')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 via-rose-700 to-amber-900 flex items-center justify-center shadow-lg shadow-red-950/40 border border-red-500/30 group-hover:scale-105 transition-transform">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base sm:text-lg tracking-tight text-zinc-100 group-hover:text-red-400 transition-colors">
                Google Flow <span className="text-red-500">Video Studio</span>
              </span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-red-950/80 text-red-400 border border-red-800/60 hidden sm:inline-block">
                4s Strict
              </span>
            </div>
            <p className="text-xs text-zinc-400 hidden lg:block">
              5-Step Automated Workflow for AI Video Generation &amp; Multilingual Scripts
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setActiveTab('studio')}
            className={`flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'studio'
                ? 'bg-red-600 text-white shadow-sm shadow-red-950/50'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Studio Wizard</span>
            <span className="sm:hidden">Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('storyboard')}
            className={`flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'storyboard'
                ? 'bg-red-600 text-white shadow-sm shadow-red-950/50'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Timeline ({sceneCount} clips)</span>
            <span className="sm:hidden">Timeline</span>
          </button>

          <button
            onClick={() => setActiveTab('console')}
            className={`flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'console'
                ? 'bg-red-600 text-white shadow-sm shadow-red-950/50'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Workflow Chat</span>
            <span className="sm:hidden">Chat</span>
          </button>
        </div>

        {/* Quick Actions & Art Reference Guide */}
        <div className="flex items-center space-x-2">
          {/* Quick Copy Dropdown */}
          <div className="relative group">
            <button
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 hover:text-red-200 text-xs font-semibold transition"
              title="Copy All active prompts for Google Flow"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Copy All</span>
            </button>
            
            <div className="absolute right-0 top-full mt-1.5 w-60 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-1.5 hidden group-hover:block z-50 animate-in fade-in duration-150">
              <button
                onClick={() => {
                  const ev = new CustomEvent('trigger-copy-all', { detail: { target: 'character' } });
                  window.dispatchEvent(ev);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs text-red-300 hover:text-white hover:bg-zinc-800 flex items-center justify-between font-semibold"
              >
                <span>Copy Character Prompt</span>
                <span className="text-[10px] text-zinc-500 font-mono">Anchor</span>
              </button>
              <div className="border-t border-zinc-800/80 my-1" />
              <button
                onClick={() => {
                  const ev = new CustomEvent('trigger-copy-all', { detail: { target: 'images' } });
                  window.dispatchEvent(ev);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs text-zinc-200 hover:bg-zinc-800 flex items-center justify-between"
              >
                <span>Copy All Images (Step 3)</span>
                <span className="text-[10px] text-zinc-500 font-mono">{sceneCount} prompts</span>
              </button>
              <button
                onClick={() => {
                  const ev = new CustomEvent('trigger-copy-all', { detail: { target: 'animations' } });
                  window.dispatchEvent(ev);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs text-zinc-200 hover:bg-zinc-800 flex items-center justify-between"
              >
                <span>Copy All Clips (Step 4)</span>
                <span className="text-[10px] text-zinc-500 font-mono">{sceneCount} clips</span>
              </button>
              <button
                onClick={() => {
                  const ev = new CustomEvent('trigger-copy-all', { detail: { target: 'voiceover' } });
                  window.dispatchEvent(ev);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs text-zinc-200 hover:bg-zinc-800 flex items-center justify-between"
              >
                <span>Copy Script (Step 5)</span>
                <span className="text-[10px] text-zinc-500 font-mono">TTS ready</span>
              </button>
              <div className="border-t border-zinc-800 my-1" />
              <button
                onClick={() => {
                  const ev = new CustomEvent('trigger-copy-all', { detail: { target: 'all' } });
                  window.dispatchEvent(ev);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs text-amber-400 font-semibold hover:bg-zinc-800 flex items-center justify-between"
              >
                <span>Copy Complete Bundle</span>
                <span className="text-[10px] font-mono">Steps 3+4+5</span>
              </button>
            </div>
          </div>

          {onOpenCharacterEditor && (
            <button
              onClick={onOpenCharacterEditor}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 text-xs font-medium transition-all"
              title="Edit character or upload reference photo to convert picture to text"
            >
              <Camera className="w-3.5 h-3.5 text-red-400" />
              <span>Edit Character</span>
            </button>
          )}

          <button
            onClick={onOpenArtGuide}
            className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 text-xs font-medium transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Art Spec</span>
          </button>
        </div>
      </div>
    </header>
  );
};
