import React, { useState, useEffect, useRef } from 'react';
import { SceneItem, WorkflowConfig } from '../types/workflow';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  CheckSquare,
  Square,
  Sparkles,
  Clock,
  Radio,
  Check,
  CheckCheck,
  Send,
  Sliders,
} from 'lucide-react';

interface VoiceoverAudioPlayerProps {
  scenes: SceneItem[];
  config: WorkflowConfig;
  onCommitOutput: () => void;
  onChangeFormat: (format: 'A' | 'B') => void;
  onChangeLanguage: (lang: string) => void;
}

export const VoiceoverAudioPlayer: React.FC<VoiceoverAudioPlayerProps> = ({
  scenes,
  config,
  onCommitOutput,
  onChangeFormat,
  onChangeLanguage,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [playbackTime, setPlaybackTime] = useState(0); // 0 to 4s
  const [isMuted, setIsMuted] = useState(false);
  const [committed, setCommitted] = useState(false);

  // Tick-box selection states
  const [playbackScope, setPlaybackScope] = useState<'all' | 'single'>('all');
  const [voiceTone, setVoiceTone] = useState<'deep' | 'standard' | 'dramatic'>('deep');
  const [autoAdvance, setAutoAdvance] = useState(true);

  // SpeechSynthesis reference
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;

      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Timer loop for scene progress & auto-advance
  useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setPlaybackTime((prev) => {
          if (prev >= 4.0) {
            if (playbackScope === 'all' && autoAdvance) {
              if (currentSceneIdx + 1 < scenes.length) {
                const nextIdx = currentSceneIdx + 1;
                setCurrentSceneIdx(nextIdx);
                speakSceneText(nextIdx);
                return 0;
              } else {
                // Reached the end of the script
                setIsPlaying(false);
                synthRef.current?.cancel();
                return 0;
              }
            } else {
              // Single scene finished
              setIsPlaying(false);
              synthRef.current?.cancel();
              return 4.0;
            }
          }
          return Math.min(4.0, prev + 0.1);
        });
      }, 100);
    } else {
      if (timer) clearInterval(timer);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, currentSceneIdx, playbackScope, autoAdvance, scenes.length]);

  // Extract clean text to speak for given scene index
  const getSceneText = (idx: number): string => {
    const scene = scenes[idx];
    if (!scene) return '';
    const raw = scene.voiceoverScriptFormatB || scene.voiceoverScriptFormatA;
    return raw
      .replace(/Scene \d+:\s*(Narrator:\s*)?/gi, '')
      .replace(/\(silence\)/gi, '')
      .trim();
  };

  const speakSceneText = (idx: number) => {
    if (!synthRef.current || isMuted) return;
    synthRef.current.cancel();

    const text = getSceneText(idx);
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Apply voice tone based on tick-box selection
    if (voiceTone === 'deep') {
      utterance.rate = 0.92; // Calm, deliberate documentary pace
      utterance.pitch = 0.8; // Deep resonant tone
    } else if (voiceTone === 'dramatic') {
      utterance.rate = 0.82; // Very slow and suspenseful
      utterance.pitch = 0.72; // Low eerie pitch
    } else {
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
    }

    // Match voice to chosen language
    const lang = config.voiceoverLanguage.toLowerCase();
    const matchingVoice = availableVoices.find((v) => {
      const vLang = v.lang.toLowerCase();
      if (lang.includes('khmer') || lang.includes('ភាសា')) return vLang.includes('km');
      if (lang.includes('thai')) return vLang.includes('th');
      if (lang.includes('viet')) return vLang.includes('vi');
      if (lang.includes('chinese')) return vLang.includes('zh');
      if (lang.includes('spanish')) return vLang.includes('es');
      return vLang.includes('en');
    });

    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    synthRef.current.speak(utterance);
  };

  const handlePlay = () => {
    setIsPlaying(true);
    speakSceneText(currentSceneIdx);
  };

  const handlePause = () => {
    setIsPlaying(false);
    synthRef.current?.cancel();
  };

  const handleReset = () => {
    setIsPlaying(false);
    synthRef.current?.cancel();
    setCurrentSceneIdx(0);
    setPlaybackTime(0);
  };

  const handleSkipNext = () => {
    if (currentSceneIdx + 1 < scenes.length) {
      const next = currentSceneIdx + 1;
      setCurrentSceneIdx(next);
      setPlaybackTime(0);
      if (isPlaying) speakSceneText(next);
    }
  };

  const handleSkipPrev = () => {
    if (currentSceneIdx > 0) {
      const prev = currentSceneIdx - 1;
      setCurrentSceneIdx(prev);
      setPlaybackTime(0);
      if (isPlaying) speakSceneText(prev);
    }
  };

  const handleCommit = () => {
    onCommitOutput();
    setCommitted(true);
    setTimeout(() => setCommitted(false), 2500);
  };

  const currentScene = scenes[currentSceneIdx];
  const currentSceneText = getSceneText(currentSceneIdx);

  return (
    <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-5">
      {/* Player Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/40 text-red-400 flex items-center justify-center shadow-inner">
            <Radio className={`w-4 h-4 ${isPlaying ? 'animate-pulse text-red-500' : ''}`} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-zinc-100">
                Voiceover Script Audio Preview Player
              </h3>
              <span className="text-[10px] font-mono bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full border border-zinc-700">
                Web Speech API
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Listen to the narrator preview in {config.voiceoverLanguage} before committing to your output.
            </p>
          </div>
        </div>

        {/* Commit Output Button */}
        <button
          onClick={handleCommit}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white text-xs font-bold shadow-lg shadow-red-950/60 transition active:scale-95"
        >
          {committed ? (
            <>
              <CheckCheck className="w-4 h-4 text-white" />
              <span>Output Committed &amp; Copied!</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4 text-white" />
              <span>Commit &amp; Copy Output</span>
            </>
          )}
        </button>
      </div>

      {/* Main Player Display Panel */}
      <div className="bg-black/80 rounded-xl border border-zinc-800/90 p-4.5 space-y-4">
        {/* Active Scene & Text Visualizer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800/80 font-mono text-xs font-bold">
              Scene {currentSceneIdx + 1} of {scenes.length}
            </span>
            <span className="text-xs font-semibold text-zinc-200">
              {currentScene?.shortSceneName}
            </span>
          </div>

          {/* Animated sound wave bars when speaking */}
          <div className="flex items-center space-x-1 h-5">
            {[0.4, 0.9, 0.6, 1.0, 0.5, 0.8, 0.3].map((heightMultiplier, idx) => (
              <span
                key={idx}
                className="w-1 bg-red-500 rounded-full transition-all duration-150"
                style={{
                  height: isPlaying ? `${Math.max(4, 20 * heightMultiplier)}px` : '4px',
                  opacity: isPlaying ? 1 : 0.3,
                }}
              />
            ))}
            <span className="text-[10px] text-zinc-500 font-mono ml-2">
              {isPlaying ? 'Narrating...' : 'Ready'}
            </span>
          </div>
        </div>

        {/* Live Spoken Text Preview */}
        <div className="min-h-[52px] flex items-center justify-center p-3 rounded-lg bg-zinc-950 border border-zinc-800/80 text-center">
          <p className="text-sm font-medium text-red-300 italic leading-relaxed">
            &ldquo;{currentSceneText || '(silence)'}&rdquo;
          </p>
        </div>

        {/* Progress Bar (4s Scene Cadence) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
            <span className="flex items-center space-x-1">
              <Clock className="w-3 h-3 text-red-400" />
              <span>Current Scene: {playbackTime.toFixed(1)}s / 4.0s</span>
            </span>
            <span>
              Total: {(currentSceneIdx * 4 + playbackTime).toFixed(1)}s / {scenes.length * 4}s
            </span>
          </div>

          <div className="h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
            <div
              className="h-full bg-gradient-to-r from-red-600 to-rose-500 transition-all duration-100 rounded-full"
              style={{ width: `${Math.min(100, (playbackTime / 4.0) * 100)}%` }}
            />
          </div>
        </div>

        {/* Transport Controls */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleReset}
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition"
              title="Reset to beginning"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={handleSkipPrev}
              disabled={currentSceneIdx === 0}
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition disabled:opacity-40"
              title="Previous scene"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={isPlaying ? handlePause : handlePlay}
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-950/60 flex items-center space-x-2 transition cursor-pointer"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pause Preview</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Play Preview</span>
                </>
              )}
            </button>

            <button
              onClick={handleSkipNext}
              disabled={currentSceneIdx === scenes.length - 1}
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition disabled:opacity-40"
              title="Next scene"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Mute button */}
          <button
            onClick={() => {
              setIsMuted(!isMuted);
              if (!isMuted && isPlaying) synthRef.current?.cancel();
            }}
            className={`p-2 rounded-lg border transition ${
              isMuted
                ? 'bg-red-950/80 border-red-800 text-red-400'
                : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-400'
            }`}
            title={isMuted ? 'Unmute' : 'Mute Voiceover'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ALL SELECTION POINTS USING TICK-BOX FORMAT AS REQUESTED */}
      <div className="space-y-4 pt-2">
        <div className="text-xs font-semibold text-zinc-300 flex items-center space-x-2">
          <Sliders className="w-3.5 h-3.5 text-red-400" />
          <span>Audio &amp; Voiceover Preferences (Tick-Box Select):</span>
        </div>

        {/* 1. Script Format Selection (Tick-Box) */}
        <div className="p-3.5 bg-zinc-950/60 rounded-xl border border-zinc-800/80 space-y-2">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
            Which script format?
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <div
              onClick={() => onChangeFormat('B')}
              className={`flex items-start space-x-2.5 p-2.5 rounded-lg cursor-pointer border transition ${
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
                <span className="font-semibold block text-zinc-200">
                  Format B: Full voiceover (TTS tools — Default)
                </span>
                <p className="text-[10px] text-zinc-400">
                  One continuous text block per scene without labels or brackets.
                </p>
              </div>
            </div>

            <div
              onClick={() => onChangeFormat('A')}
              className={`flex items-start space-x-2.5 p-2.5 rounded-lg cursor-pointer border transition ${
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
                <span className="font-semibold block text-zinc-200">
                  Format A: Scene by scene
                </span>
                <p className="text-[10px] text-zinc-400">
                  Labeled lines with speaker names (e.g. &ldquo;Scene 1: Narrator: ...&rdquo;).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Playback Scope (Tick-Box) */}
        <div className="p-3.5 bg-zinc-950/60 rounded-xl border border-zinc-800/80 space-y-2">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
            Playback Scope:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div
              onClick={() => setPlaybackScope('all')}
              className={`flex items-center space-x-2.5 p-2.5 rounded-lg cursor-pointer border transition ${
                playbackScope === 'all'
                  ? 'bg-red-950/40 border-red-500/70 text-zinc-100 ring-1 ring-red-500/40'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              {playbackScope === 'all' ? (
                <CheckSquare className="w-4 h-4 text-red-500 flex-shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-zinc-600 flex-shrink-0" />
              )}
              <span>Play All {scenes.length} Scenes Sequentially (Continuous with 4s scene pacing)</span>
            </div>

            <div
              onClick={() => setPlaybackScope('single')}
              className={`flex items-center space-x-2.5 p-2.5 rounded-lg cursor-pointer border transition ${
                playbackScope === 'single'
                  ? 'bg-red-950/40 border-red-500/70 text-zinc-100 ring-1 ring-red-500/40'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              {playbackScope === 'single' ? (
                <CheckSquare className="w-4 h-4 text-red-500 flex-shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-zinc-600 flex-shrink-0" />
              )}
              <span>Preview Current Selected Scene Only</span>
            </div>
          </div>
        </div>

        {/* 3. Narrator Tone & Voice Persona (Tick-Box) */}
        <div className="p-3.5 bg-zinc-950/60 rounded-xl border border-zinc-800/80 space-y-2">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
            Narrator Voice Persona:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div
              onClick={() => setVoiceTone('deep')}
              className={`flex items-center space-x-2.5 p-2.5 rounded-lg cursor-pointer border transition ${
                voiceTone === 'deep'
                  ? 'bg-red-950/40 border-red-500/70 text-zinc-100 ring-1 ring-red-500/40'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              {voiceTone === 'deep' ? (
                <CheckSquare className="w-4 h-4 text-red-500 flex-shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-zinc-600 flex-shrink-0" />
              )}
              <div>
                <span className="font-semibold block">Deep Documentary (Default)</span>
                <span className="text-[10px] text-zinc-500">Pitch 0.8x • Calm &amp; Ominous</span>
              </div>
            </div>

            <div
              onClick={() => setVoiceTone('standard')}
              className={`flex items-center space-x-2.5 p-2.5 rounded-lg cursor-pointer border transition ${
                voiceTone === 'standard'
                  ? 'bg-red-950/40 border-red-500/70 text-zinc-100 ring-1 ring-red-500/40'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              {voiceTone === 'standard' ? (
                <CheckSquare className="w-4 h-4 text-red-500 flex-shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-zinc-600 flex-shrink-0" />
              )}
              <div>
                <span className="font-semibold block">Standard Narrator</span>
                <span className="text-[10px] text-zinc-500">Pitch 1.0x • Neutral</span>
              </div>
            </div>

            <div
              onClick={() => setVoiceTone('dramatic')}
              className={`flex items-center space-x-2.5 p-2.5 rounded-lg cursor-pointer border transition ${
                voiceTone === 'dramatic'
                  ? 'bg-red-950/40 border-red-500/70 text-zinc-100 ring-1 ring-red-500/40'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              {voiceTone === 'dramatic' ? (
                <CheckSquare className="w-4 h-4 text-red-500 flex-shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-zinc-600 flex-shrink-0" />
              )}
              <div>
                <span className="font-semibold block">Dramatic Whisper</span>
                <span className="text-[10px] text-zinc-500">Pitch 0.7x • Suspenseful</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Language Selection (Tick-Box) */}
        <div className="p-3.5 bg-zinc-950/60 rounded-xl border border-zinc-800/80 space-y-2">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
            What voiceover language?
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
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
                  onClick={() => onChangeLanguage(lang.id)}
                  className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer border transition ${
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
                  <span className="truncate">{lang.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. Auto-advance Sync Rule (Tick-Box) */}
        <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
          <div
            onClick={() => setAutoAdvance(!autoAdvance)}
            className="flex items-center space-x-2.5 cursor-pointer text-xs text-zinc-300"
          >
            {autoAdvance ? (
              <CheckSquare className="w-4 h-4 text-red-500 flex-shrink-0" />
            ) : (
              <Square className="w-4 h-4 text-zinc-600 flex-shrink-0" />
            )}
            <span>
              Auto-advance to next scene every 4 seconds in sync with the animated clip timing rule
            </span>
          </div>
        </div>

        {/* 6. Jump to Scene (Tick-Box Scene Navigation) */}
        <div className="p-3.5 bg-zinc-950/60 rounded-xl border border-zinc-800/80 space-y-2">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
            Jump to Scene to Preview:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 max-h-40 overflow-y-auto scrollbar-thin text-xs">
            {scenes.map((scene, idx) => {
              const isCurrent = currentSceneIdx === idx;
              return (
                <div
                  key={scene.sceneNumber}
                  onClick={() => {
                    setCurrentSceneIdx(idx);
                    setPlaybackTime(0);
                    if (isPlaying) speakSceneText(idx);
                  }}
                  className={`flex items-center space-x-2 p-1.5 rounded-lg cursor-pointer border transition ${
                    isCurrent
                      ? 'bg-red-950/60 border-red-500/80 text-zinc-100 font-semibold'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  {isCurrent ? (
                    <CheckSquare className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
                  )}
                  <span className="truncate">Scene {scene.sceneNumber}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
