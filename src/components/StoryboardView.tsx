import React, { useState } from 'react';
import { WorkflowData, SceneItem, CharacterConfig } from '../types/workflow';
import {
  Film,
  Copy,
  Check,
  Clock,
  Volume2,
  Sparkles,
  Video,
  Image as ImageIcon,
  Edit3,
  Save,
  X,
  RotateCcw,
  ShieldCheck,
  User,
  Wand2,
  CheckCheck,
} from 'lucide-react';
import { realignPromptWithCharacter, formatCharacterPrompt } from '../services/api';

interface StoryboardViewProps {
  workflowData: WorkflowData;
  characterConfig?: CharacterConfig;
  onUpdateScene?: (sceneNumber: number, updatedImagePrompt: string) => void;
  onUpdateAllScenes?: (updatedScenes: SceneItem[]) => void;
}

export const StoryboardView: React.FC<StoryboardViewProps> = ({
  workflowData,
  characterConfig,
  onUpdateScene,
  onUpdateAllScenes,
}) => {
  const [copiedScene, setCopiedScene] = useState<string | null>(null);
  const [activePromptTab, setActivePromptTab] = useState<'image' | 'animation' | 'voiceover'>('image');
  
  // Per-scene inline editing state
  const [editingSceneNumber, setEditingSceneNumber] = useState<number | null>(null);
  const [editedPromptText, setEditedPromptText] = useState<string>('');
  const [realignSuccessScene, setRealignSuccessScene] = useState<number | null>(null);
  const [globalBannerMessage, setGlobalBannerMessage] = useState<string | null>(null);

  const { scenes, config } = workflowData;
  const activeChar = characterConfig || workflowData.characterConfig || config.characterConfig;
  const charName = activeChar?.name || 'Master Barnaby';

  const ratioClean = config.aspectRatio.includes('16:9') || config.aspectRatio.includes('Horizontal')
    ? '16:9 horizontal'
    : '9:16 vertical';

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScene(id);
    setTimeout(() => setCopiedScene(null), 2000);
  };

  const formatTimestamp = (index: number) => {
    const startSec = index * 4;
    const endSec = startSec + 4;
    const formatS = (s: number) => {
      const mins = Math.floor(s / 60);
      const secs = s % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
    return `${formatS(startSec)} – ${formatS(endSec)}`;
  };

  // Start editing a scene's image prompt
  const handleStartEdit = (scene: SceneItem) => {
    setEditingSceneNumber(scene.sceneNumber);
    setEditedPromptText(scene.imagePrompt);
    // Ensure active tab is 'image' so the user is looking at image prompts
    setActivePromptTab('image');
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingSceneNumber(null);
    setEditedPromptText('');
    setRealignSuccessScene(null);
  };

  // Auto-Realign an individual scene's image prompt to force exact match with global character
  const handleAutoRealignSingleScene = (sceneNumber: number) => {
    const realigned = realignPromptWithCharacter(editedPromptText, activeChar, ratioClean);
    setEditedPromptText(realigned);
    setRealignSuccessScene(sceneNumber);
    setGlobalBannerMessage(`✓ Realigned Scene ${sceneNumber} prompt with character "${charName}"!`);
    setTimeout(() => {
      setRealignSuccessScene(null);
      setGlobalBannerMessage(null);
    }, 3500);
  };

  // Save the edited prompt to workflow
  const handleSaveEdit = (sceneNumber: number) => {
    if (onUpdateScene) {
      onUpdateScene(sceneNumber, editedPromptText.trim());
    }
    setGlobalBannerMessage(`✓ Saved updated Image Prompt for Scene ${sceneNumber}!`);
    setTimeout(() => setGlobalBannerMessage(null), 3000);
    setEditingSceneNumber(null);
    setEditedPromptText('');
  };

  // Global Auto-Realign All Scenes
  const handleAutoRealignAll = () => {
    if (!onUpdateAllScenes) return;

    const realignedScenes = scenes.map((s) => ({
      ...s,
      imagePrompt: realignPromptWithCharacter(s.imagePrompt, activeChar, ratioClean),
    }));

    onUpdateAllScenes(realignedScenes);
    setGlobalBannerMessage(`✓ Successfully realigned all ${scenes.length} scene image prompts to match "${charName}"!`);
    setTimeout(() => setGlobalBannerMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Overview & Global Control Banner */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-32 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-zinc-100">
              {workflowData.ideaTitle}
            </h2>
            <span className="text-xs bg-red-950 text-red-400 border border-red-800/80 px-2 py-0.5 rounded-full font-mono">
              {scenes.length} Scenes (4s each)
            </span>
            <span className="text-xs bg-zinc-800 text-zinc-300 border border-zinc-700 px-2 py-0.5 rounded-full font-mono flex items-center space-x-1">
              <User className="w-3 h-3 text-red-400" />
              <span>Target: <strong>{charName}</strong></span>
            </span>
          </div>
          <p className="text-xs text-zinc-400 max-w-2xl">
            {workflowData.ideaDescription}
          </p>
        </div>

        {/* Action Controls: Tabs & Auto-Realign All */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Auto-Realign All Scenes Button */}
          {onUpdateAllScenes && (
            <button
              onClick={handleAutoRealignAll}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/90 hover:bg-red-950/80 border border-zinc-700 hover:border-red-600/60 text-zinc-200 hover:text-white text-xs font-semibold transition cursor-pointer shadow-sm group"
              title="Force all scene image prompts to use the current global character description"
            >
              <Wand2 className="w-3.5 h-3.5 text-red-400 group-hover:rotate-12 transition-transform" />
              <span>Auto-Realign All Scenes</span>
            </button>
          )}

          {/* Prompt View Mode Filter */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              onClick={() => setActivePromptTab('image')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
                activePromptTab === 'image'
                  ? 'bg-red-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Image Prompts</span>
            </button>

            <button
              onClick={() => setActivePromptTab('animation')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
                activePromptTab === 'animation'
                  ? 'bg-red-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Animation Prompts</span>
            </button>

            <button
              onClick={() => setActivePromptTab('voiceover')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
                activePromptTab === 'voiceover'
                  ? 'bg-red-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Voiceover Script</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Notification Banner */}
      {globalBannerMessage && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-xs font-medium flex items-center space-x-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{globalBannerMessage}</span>
        </div>
      )}

      {/* Grid of 4s Scene Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {scenes.map((scene, idx) => {
          const timestamp = formatTimestamp(idx);
          const isCopied = copiedScene === `scene-${scene.sceneNumber}-${activePromptTab}`;
          const isEditing = editingSceneNumber === scene.sceneNumber;

          let displayedContent = '';
          if (activePromptTab === 'image') displayedContent = scene.imagePrompt;
          else if (activePromptTab === 'animation') displayedContent = scene.animationPrompt;
          else displayedContent = scene.voiceoverScriptFormatB || scene.voiceoverScriptFormatA;

          // Check if current scene's image prompt already matches the target global character
          const targetDescSnippet = activeChar?.fullDescription || 'Master Barnaby';
          const isRealigned = scene.imagePrompt.includes(targetDescSnippet);

          return (
            <div
              key={scene.sceneNumber}
              className={`bg-zinc-900/70 border rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 shadow-md ${
                isEditing
                  ? 'border-red-500 ring-2 ring-red-500/20 bg-zinc-900/95'
                  : 'border-zinc-800 hover:border-zinc-700/80 hover:bg-zinc-900/85'
              }`}
            >
              <div>
                {/* Scene Header */}
                <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-lg bg-red-950 text-red-400 border border-red-800/80 flex items-center justify-center font-bold text-xs shadow-inner">
                      {scene.sceneNumber}
                    </span>
                    <h3 className="text-xs font-semibold text-zinc-100 truncate max-w-[150px]">
                      {scene.shortSceneName}
                    </h3>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {/* Character Alignment Badge */}
                    {activePromptTab === 'image' && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded border flex items-center space-x-1 ${
                          isRealigned
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                            : 'bg-amber-950/60 text-amber-400 border-amber-800/60'
                        }`}
                        title={
                          isRealigned
                            ? `Matches global character (${charName})`
                            : 'Character description differs from global configuration'
                        }
                      >
                        {isRealigned ? (
                          <>
                            <Check className="w-2.5 h-2.5" />
                            <span>Aligned</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>Custom/Legacy</span>
                          </>
                        )}
                      </span>
                    )}

                    <div className="flex items-center space-x-1 text-[11px] font-mono text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                      <Clock className="w-3 h-3 text-red-400" />
                      <span>{timestamp}</span>
                    </div>
                  </div>
                </div>

                {/* Voiceover Snip */}
                <div className="mt-2.5 p-2 bg-black/40 rounded-lg border border-zinc-800/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                    Voiceover ({config.voiceoverLanguage.split(' ')[0]}):
                  </span>
                  <p className="text-xs text-red-400/90 font-medium italic mt-0.5 line-clamp-2">
                    &ldquo;{scene.voiceoverScriptFormatB || scene.voiceoverScriptFormatA.replace(/Scene \d+:\s*(Narrator:\s*)?/, '')}&rdquo;
                  </p>
                </div>

                {/* PROMPT CONTENT OR INLINE EDITING FORM */}
                {isEditing ? (
                  <div className="mt-3 space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-zinc-200 flex items-center space-x-1.5">
                        <Edit3 className="w-3 h-3 text-red-400" />
                        <span>Edit Scene {scene.sceneNumber} Image Prompt:</span>
                      </label>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {editedPromptText.trim().split(/\s+/).length} words
                      </span>
                    </div>

                    <textarea
                      rows={5}
                      value={editedPromptText}
                      onChange={(e) => setEditedPromptText(e.target.value)}
                      className="w-full px-3 py-2 bg-black/90 border border-zinc-700 rounded-xl text-xs text-zinc-100 font-mono leading-relaxed focus:outline-none focus:border-red-500 scrollbar-thin resize-y select-text"
                      placeholder="Enter image prompt..."
                    />

                    {/* Auto-Realign Button inside Edit Mode */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleAutoRealignSingleScene(scene.sceneNumber)}
                        className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer shadow-sm ${
                          realignSuccessScene === scene.sceneNumber
                            ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
                            : 'bg-red-950/70 hover:bg-red-900/80 border-red-700/80 text-red-200'
                        }`}
                        title="Inject current global character description into this prompt"
                      >
                        {realignSuccessScene === scene.sceneNumber ? (
                          <>
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Realigned to {charName}!</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>Auto-Realign Character</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(scene.sceneNumber)}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition cursor-pointer shadow-md shadow-red-950/60"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Prompt</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Read-Only Prompt Preview */
                  <div className="mt-2.5 font-mono text-[11px] text-zinc-300 bg-zinc-950 p-2.5 rounded-lg border border-zinc-800/80 leading-relaxed max-h-36 overflow-y-auto scrollbar-thin">
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 uppercase font-bold mb-1">
                      <span>
                        {activePromptTab === 'image'
                          ? `Image ${scene.sceneNumber} Prompt`
                          : activePromptTab === 'animation'
                          ? `Clip ${scene.sceneNumber} Prompt`
                          : 'Voiceover Script'}
                      </span>
                      {activePromptTab === 'image' && (
                        <span>{scene.imagePrompt.trim().split(/\s+/).length} words</span>
                      )}
                    </div>
                    {displayedContent}
                  </div>
                )}
              </div>

              {/* Action footer */}
              {!isEditing && (
                <div className="mt-3 pt-2.5 border-t border-zinc-800/60 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Clip: 4.0s
                  </span>

                  <div className="flex items-center space-x-1.5">
                    {/* Auto-Realign Quick Button on Card */}
                    <button
                      type="button"
                      onClick={() => {
                        const realigned = realignPromptWithCharacter(scene.imagePrompt, activeChar, ratioClean);
                        if (onUpdateScene) {
                          onUpdateScene(scene.sceneNumber, realigned);
                        }
                        setGlobalBannerMessage(`✓ Scene ${scene.sceneNumber} image prompt realigned to match "${charName}"!`);
                        setTimeout(() => setGlobalBannerMessage(null), 3000);
                      }}
                      className="flex items-center space-x-1 text-[11px] text-zinc-300 hover:text-white px-2 py-1 rounded bg-zinc-800/90 hover:bg-red-950/60 border border-zinc-700/80 hover:border-red-600/50 transition cursor-pointer"
                      title={`Force character in Scene ${scene.sceneNumber} to match global "${charName}"`}
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Realign</span>
                    </button>

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => handleStartEdit(scene)}
                      className="flex items-center space-x-1 text-[11px] text-zinc-200 hover:text-white px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition cursor-pointer"
                      title="Edit this scene's image prompt description"
                    >
                      <Edit3 className="w-3 h-3 text-red-400" />
                      <span>Edit</span>
                    </button>

                    {/* Copy Button */}
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyText(displayedContent, `scene-${scene.sceneNumber}-${activePromptTab}`)
                      }
                      className="flex items-center space-x-1 text-[11px] text-zinc-300 hover:text-white px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 transition cursor-pointer"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
