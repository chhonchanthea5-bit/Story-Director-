import React, { useState } from 'react';
import { WorkflowData } from '../types/workflow';
import { AudioPreview } from './AudioPreview';
import { VoiceoverAudioPlayer } from './VoiceoverAudioPlayer';
import { Copy, Check, Download, ShieldCheck, CheckSquare, Square, FileText, Sliders } from 'lucide-react';

interface Step5VoiceoverScriptProps {
  workflowData: WorkflowData;
  onChangeFormat: (format: 'A' | 'B') => void;
  onChangeLanguage: (lang: string) => void;
}

export const Step5VoiceoverScript: React.FC<Step5VoiceoverScriptProps> = ({
  workflowData,
  onChangeFormat,
  onChangeLanguage,
}) => {
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  const { scenes, config } = workflowData;
  const numScenes = scenes.length;
  const currentFormat = config.scriptFormat || 'B';

  // Construct the formatted code block
  let scriptContent = '';
  if (currentFormat === 'A') {
    scriptContent = scenes
      .map(
        (s) =>
          `Scene ${s.sceneNumber}:\nNarrator: ${
            s.voiceoverScriptFormatB ||
            s.voiceoverScriptFormatA.replace(/Scene \d+:\s*(Narrator:\s*)?/, '')
          }`
      )
      .join('\n\n');
  } else {
    // Format B: full voiceover paragraphs without scene labels or speaker names
    scriptContent = scenes
      .map((s) =>
        (
          s.voiceoverScriptFormatB ||
          s.voiceoverScriptFormatA.replace(/Scene \d+:\s*(Narrator:\s*)?/, '')
        ).trim()
      )
      .join('\n\n');
  }

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptContent);
    setCopied(true);
    showToast(`Copied complete Voiceover Script (${config.voiceoverLanguage} — Format ${currentFormat}) to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([scriptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `voiceover_script_${workflowData.ideaTitle
      .replace(/\s+/g, '_')
      .toLowerCase()}_format_${currentFormat}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded script as text file.');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-red-600 text-white px-4 py-2.5 rounded-xl shadow-2xl shadow-red-950/80 border border-red-400/40 text-xs font-semibold flex items-center space-x-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <Check className="w-4 h-4 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Audio Preview Component (Web Speech API with individual scene play/pause controls) */}
      <AudioPreview
        scenes={scenes}
        selectedLanguage={config.voiceoverLanguage}
        scriptFormat={currentFormat}
        onFinalize={handleCopy}
      />

      {/* Advanced Narration Persona & Tone Tuner (Toggleable) */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
          className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-900 transition"
        >
          <Sliders className="w-3.5 h-3.5 text-red-400" />
          <span>{showAdvancedSettings ? 'Hide Voice Persona Settings' : 'Voice Persona & Tone Settings'}</span>
        </button>
      </div>

      {showAdvancedSettings && (
        <VoiceoverAudioPlayer
          scenes={scenes}
          config={config}
          onCommitOutput={handleCopy}
          onChangeFormat={onChangeFormat}
          onChangeLanguage={onChangeLanguage}
        />
      )}

      {/* Voiceover Output Code Block Card */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 text-red-400 font-bold flex items-center justify-center text-sm">
              5
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center space-x-2">
                <span>Committed Voiceover Script Output</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800/80 font-mono">
                  {config.voiceoverLanguage}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Put the whole script inside ONE single code block, nothing before or after it.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-950/50 transition cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied Script!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Script</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              title="Download script as .txt"
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Script Format Tick-Box Selection */}
        <div className="p-3.5 bg-zinc-950/70 rounded-xl border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <span className="text-zinc-400 font-medium">Select Output Script Format:</span>
          <div className="flex flex-wrap items-center gap-3">
            <div
              onClick={() => onChangeFormat('B')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg cursor-pointer border transition ${
                currentFormat === 'B'
                  ? 'bg-red-950/50 border-red-500/80 text-white font-semibold'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {currentFormat === 'B' ? (
                <CheckSquare className="w-4 h-4 text-red-500 flex-shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-zinc-600 flex-shrink-0" />
              )}
              <span>Format B: Full voiceover (TTS tools — Default)</span>
            </div>

            <div
              onClick={() => onChangeFormat('A')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg cursor-pointer border transition ${
                currentFormat === 'A'
                  ? 'bg-red-950/50 border-red-500/80 text-white font-semibold'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {currentFormat === 'A' ? (
                <CheckSquare className="w-4 h-4 text-red-500 flex-shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-zinc-600 flex-shrink-0" />
              )}
              <span>Format A: Scene by scene (per clip sync)</span>
            </div>
          </div>
        </div>

        {/* The Exact Code Block */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span>
              {currentFormat === 'A'
                ? `Format A: Scenes 1–${numScenes} labeled lines`
                : `Format B: Continuous text block for TTS`}
            </span>
            <span className="text-[11px] text-zinc-500">
              ~8–10 words per scene • ~4s pacing
            </span>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-black/90 p-4 font-mono text-xs text-zinc-200 leading-relaxed max-h-[460px] overflow-y-auto scrollbar-thin shadow-inner">
            <pre className="whitespace-pre-wrap">{scriptContent}</pre>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
          <span>
            Strict Rule: Exactly {numScenes} scenes × 4 seconds = {numScenes * 4}s video duration.
          </span>
          <span className="font-mono text-zinc-400">
            Voice: Deep, calm documentary narrator
          </span>
        </div>
      </div>
    </div>
  );
};
