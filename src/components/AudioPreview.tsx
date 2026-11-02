import React, { useState, useEffect, useRef } from 'react';
import { SceneItem } from '../types/workflow';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Clock,
  Sparkles,
  Check,
  CheckSquare,
  Square,
  Copy,
  Radio,
  Sliders,
  CheckCheck,
} from 'lucide-react';

interface AudioPreviewProps {
  scenes: SceneItem[];
  selectedLanguage: string;
  scriptFormat?: 'A' | 'B';
  onFinalize?: () => void;
}

export const AudioPreview: React.FC<AudioPreviewProps> = ({
  scenes,
  selectedLanguage,
  scriptFormat = 'B',
  onFinalize,
}) => {
  const [playingSceneIdx, setPlayingSceneIdx] = useState<number | null>(null);
  const [sceneProgress, setSceneProgress] = useState(0); // 0 to 4s
  const [autoPlayNext, setAutoPlayNext] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [copiedScene, setCopiedScene] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Audio tone options
  const [speechRate, setSpeechRate] = useState(0.92); // Deep calm cadence
  const [speechPitch, setSpeechPitch] = useState(0.82); // Ominous tone

  const timerRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Load SpeechSynthesis voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
      const loadVoices = () => {
        setAvailableVoices(window.speechSynthesis.getVoices());
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // 4-Second Scene Timer loop for the active scene
  useEffect(() => {
    if (playingSceneIdx !== null) {
      timerRef.current = setInterval(() => {
        setSceneProgress((prev) => {
          if (prev >= 4.0) {
            if (autoPlayNext && playingSceneIdx + 1 < scenes.length) {
              const nextIdx = playingSceneIdx + 1;
              playScene(nextIdx);
              return 0;
            } else {
              setPlayingSceneIdx(null);
              synthRef.current?.cancel();
              return 0;
            }
          }
          return Math.min(4.0, prev + 0.1);
        });
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setSceneProgress(0);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playingSceneIdx, autoPlayNext, scenes.length]);

  // Extract clean dialogue/narration without labels
  const getCleanText = (scene: SceneItem): string => {
    const raw = scene.voiceoverScriptFormatB || scene.voiceoverScriptFormatA;
    return raw
      .replace(/Scene \d+:\s*(Narrator:\s*)?/gi, '')
      .replace(/\(silence\)/gi, '')
      .trim();
  };

  // Get matching IANA tag
  const getLanguageTag = (langName: string): string => {
    const l = (langName || '').toLowerCase();
    if (l.includes('khmer') || l.includes('ភាសា')) return 'km-KH';
    if (l.includes('thai')) return 'th-TH';
    if (l.includes('viet')) return 'vi-VN';
    if (l.includes('chinese')) return 'zh-CN';
    if (l.includes('spanish')) return 'es-ES';
    return 'en-US';
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const playScene = (idx: number) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();

    const targetScene = scenes[idx];
    if (!targetScene) return;

    const textToSpeak = getCleanText(targetScene);
    if (!textToSpeak) {
      setPlayingSceneIdx(null);
      return;
    }

    const langTag = getLanguageTag(selectedLanguage);
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = langTag;
    utterance.rate = speechRate;
    utterance.pitch = speechPitch;

    // Match best voice
    const localePrefix = langTag.split('-')[0];
    const match = availableVoices.find(
      (v) => v.lang.toLowerCase().startsWith(localePrefix) || v.lang.toLowerCase().includes(localePrefix)
    );
    if (match) {
      utterance.voice = match;
    }

    utterance.onend = () => {
      // Natural speech finished
    };

    utterance.onerror = () => {
      setPlayingSceneIdx(null);
    };

    synthRef.current.speak(utterance);
    setPlayingSceneIdx(idx);
    setSceneProgress(0);
  };

  const stopAudio = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setPlayingSceneIdx(null);
    setSceneProgress(0);
  };

  const handleToggleScene = (idx: number) => {
    if (playingSceneIdx === idx) {
      stopAudio();
    } else {
      playScene(idx);
    }
  };

  const handleCopySceneText = (text: string, sceneNum: number) => {
    navigator.clipboard.writeText(text);
    setCopiedScene(sceneNum);
    showToast(`Copied Scene ${sceneNum} text to clipboard!`);
    setTimeout(() => setCopiedScene(null), 2000);
  };

  const currentLangTag = getLanguageTag(selectedLanguage);

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 shadow-2xl backdrop-blur-sm space-y-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-red-600 text-white px-4 py-2.5 rounded-xl shadow-2xl shadow-red-950/80 border border-red-400/40 text-xs font-semibold flex items-center space-x-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCheck className="w-4 h-4 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Audio Preview Component Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 text-red-400 font-bold flex items-center justify-center text-sm shadow-inner">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100 flex items-center space-x-2">
              <span>Audio Preview</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800/80 font-mono">
                {selectedLanguage} ({currentLangTag})
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Read the text of each scene individually using Web Speech API (<span className="font-mono text-zinc-300">window.speechSynthesis</span>) before finalizing.
            </p>
          </div>
        </div>

        {/* Global Controls & Finalize Action */}
        <div className="flex flex-wrap items-center gap-2">
          {playingSceneIdx !== null && (
            <button
              onClick={stopAudio}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Stop All Audio</span>
            </button>
          )}

          {onFinalize && (
            <button
              onClick={onFinalize}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-950/50 transition cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Finalize &amp; Copy Script</span>
            </button>
          )}
        </div>
      </div>

      {/* Options Bar with Tick-Boxes */}
      <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Tick-Box: Continuous Playback */}
        <div
          onClick={() => setAutoPlayNext(!autoPlayNext)}
          className="flex items-center space-x-2 text-zinc-300 cursor-pointer hover:text-white transition"
        >
          {autoPlayNext ? (
            <CheckSquare className="w-4 h-4 text-red-500 flex-shrink-0" />
          ) : (
            <Square className="w-4 h-4 text-zinc-600 flex-shrink-0" />
          )}
          <span>Auto-advance &amp; preview next scene automatically (4s cadence)</span>
        </div>

        {/* Cadence badge */}
        <div className="flex items-center space-x-2 font-mono text-[11px] text-zinc-400">
          <Clock className="w-3.5 h-3.5 text-red-400" />
          <span>Strict Timing: 4.0s per clip</span>
        </div>
      </div>

      {/* SCENE-BY-SCENE SCRIPT OUTPUT LIST WITH PLAY/PAUSE BUTTON NEXT TO EACH SCENE */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold px-1">
          <span>Scene-by-Scene Voiceover Script ({scenes.length} Scenes):</span>
          <span className="text-[11px] font-mono text-zinc-500">
            Click the play button next to any scene to hear preview
          </span>
        </div>

        <div className="space-y-2.5 max-h-[540px] overflow-y-auto scrollbar-thin pr-1">
          {scenes.map((scene, idx) => {
            const isPlayingThis = playingSceneIdx === idx;
            const cleanText = getCleanText(scene);
            const isCopied = copiedScene === scene.sceneNumber;

            return (
              <div
                key={scene.sceneNumber}
                className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 relative ${
                  isPlayingThis
                    ? 'bg-red-950/40 border-red-500/80 ring-1 ring-red-500/50 shadow-lg shadow-red-950/40'
                    : 'bg-zinc-950/60 border-zinc-800/90 hover:border-zinc-700/80 hover:bg-zinc-900/50'
                }`}
              >
                {/* SMALL PLAY / PAUSE BUTTON NEXT TO EACH SCENE'S SCRIPT OUTPUT */}
                <button
                  onClick={() => handleToggleScene(idx)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0 cursor-pointer shadow-md ${
                    isPlayingThis
                      ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                      : 'bg-zinc-800 hover:bg-red-600 text-zinc-300 hover:text-white border border-zinc-700/80'
                  }`}
                  title={isPlayingThis ? `Pause Scene ${scene.sceneNumber}` : `Play Scene ${scene.sceneNumber} preview`}
                >
                  {isPlayingThis ? (
                    <Pause className="w-3.5 h-3.5 fill-white" />
                  ) : (
                    <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
                  )}
                </button>

                {/* Scene Content Body */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-red-400">
                        Scene {scene.sceneNumber}
                      </span>
                      <span className="text-zinc-500 text-xs font-mono">•</span>
                      <span className="text-xs font-semibold text-zinc-200 truncate max-w-xs">
                        {scene.shortSceneName}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Active equalizing bars indicator */}
                      {isPlayingThis && (
                        <div className="flex items-center space-x-1 h-3.5">
                          {[0.4, 0.9, 0.5, 1.0, 0.6].map((m, i) => (
                            <span
                              key={i}
                              className="w-1 bg-red-500 rounded-full animate-bounce"
                              style={{
                                height: `${Math.max(4, 14 * m)}px`,
                                animationDelay: `${i * 120}ms`,
                              }}
                            />
                          ))}
                        </div>
                      )}

                      <span className="text-[10px] font-mono text-zinc-500 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                        {idx * 4}s – {idx * 4 + 4}s
                      </span>

                      <button
                        onClick={() => handleCopySceneText(cleanText, scene.sceneNumber)}
                        className="text-[11px] text-zinc-400 hover:text-zinc-100 p-1 rounded hover:bg-zinc-800 transition"
                        title="Copy this scene's text"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Scene Voiceover Script Output Line */}
                  <div className="text-xs leading-relaxed font-mono">
                    {scriptFormat === 'A' ? (
                      <div className="text-zinc-300">
                        <span className="text-zinc-500 font-semibold select-none">Narrator: </span>
                        <span className={isPlayingThis ? 'text-white font-semibold' : 'text-zinc-200'}>
                          {cleanText || '(silence)'}
                        </span>
                      </div>
                    ) : (
                      <p className={`italic ${isPlayingThis ? 'text-red-300 font-semibold' : 'text-zinc-300'}`}>
                        &ldquo;{cleanText || '(silence)'}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* 4-Second Progress Bar (Only visible while this scene is playing) */}
                  {isPlayingThis && (
                    <div className="pt-1 space-y-1 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between text-[10px] font-mono text-red-400">
                        <span>Auditioning: {sceneProgress.toFixed(1)}s / 4.0s</span>
                        <span>{selectedLanguage} Voice</span>
                      </div>
                      <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                        <div
                          className="h-full bg-gradient-to-r from-red-500 to-rose-400 transition-all duration-100 rounded-full"
                          style={{ width: `${Math.min(100, (sceneProgress / 4.0) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
