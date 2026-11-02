import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ArtStyleBanner } from './components/ArtStyleBanner';
import { Step1Ideas } from './components/Step1Ideas';
import { Step2Setup } from './components/Step2Setup';
import { Step3ImagePrompts } from './components/Step3ImagePrompts';
import { Step4AnimationPrompts } from './components/Step4AnimationPrompts';
import { Step5VoiceoverScript } from './components/Step5VoiceoverScript';
import { StoryboardView } from './components/StoryboardView';
import { ConsoleChatView } from './components/ConsoleChatView';
import { CharacterEditor, DEFAULT_CHARACTER } from './components/CharacterEditor';
import { WebsiteHero } from './components/WebsiteHero';
import { WorkflowConfig, WorkflowData, VideoIdea, CharacterConfig } from './types/workflow';
import { DEFAULT_IDEAS, fetchIdeas, generateWorkflowAPI, formatCharacterPrompt } from './services/api';
import { Check, Copy, Film, Sparkles, Terminal, Video, FileText, ArrowRight, Camera, ExternalLink, Heart, ShieldCheck } from 'lucide-react';

export default function App() {
  const [ideas, setIdeas] = useState<VideoIdea[]>(DEFAULT_IDEAS);
  const [isLoadingIdeas, setIsLoadingIdeas] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'studio' | 'console' | 'storyboard'>('studio');
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4 | 5>(2);
  const [artGuideOpen, setArtGuideOpen] = useState(false);
  const [characterEditorOpen, setCharacterEditorOpen] = useState(false);
  const [characterConfig, setCharacterConfig] = useState<CharacterConfig>(DEFAULT_CHARACTER);

  // Workflow configuration
  const [config, setConfig] = useState<WorkflowConfig>({
    selectedIdeaId: 1,
    customTopic: '',
    duration: '1 minute (15 scenes — Default)',
    aspectRatio: '9:16 (Vertical — Default)',
    voiceoverLanguage: 'English (Default)',
    scriptFormat: 'B',
    characterConfig: DEFAULT_CHARACTER,
  });

  // Current generated workflow state (pre-seeded with Idea 1 so all views are immediately functional)
  const [workflowData, setWorkflowData] = useState<WorkflowData>(() => {
    // Generate initial scenes synchronously for fast first paint
    const initialScenes = [];
    const ratioClean = '9:16 vertical';
    const characterDesc = "Master Barnaby, an aristocratic artisan with an oversized perfectly round pale cream head, heavy droopy black eyes, and arched thick eyebrows, wearing an embroidered plum-colored velvet waistcoat with gold filigree buttons";

    const storyTitles = [
      "The Dormant Clock", "The Backward Gear", "The Spilled Varnish", "The Vanishing Shadow",
      "The Crimson Escapement", "The Frozen Tempest", "The Secret Drawer", "The Unfinished Portrait",
      "The Twin Reflections", "The Whispering Cogs", "The Ivory Dial", "The Reverse Pendulum",
      "The Fractured Lens", "The Final Rewind", "The Quiet Inversion"
    ];

    const storyActions = [
      "slowly lifts an ornate brass looking-glass toward a dormant grandfather clock",
      "leans closer to inspect the polished clockwork gears rotating backwards in crimson light",
      "watches a spilled puddle of black ink slowly withdraw back into the overturned glass vial",
      "notices his elongated silhouette on the wallpaper turn away and cross its own arms",
      "grips a slender brass wrench above a glowing crimson escapement spring that hums faintly",
      "stares out the arched stone lancet window at rain droplets suspended motionless mid-air",
      "unlocks a concealed velvet-lined drawer beneath the mahogany worktable with an ivory key",
      "glances at a canvas oil painting on the wall whose painted eyes slowly turn toward him",
      "catches sight of two separate reflections in the glass pendulum chamber watching him",
      "holds his breath as hundreds of tiny brass cogs begin whispering in unison",
      "touches the tarnished ivory clock face as the roman numerals shift their alignment",
      "watches the heavy brass pendulum reverse its swing with sudden mechanical resistance",
      "gazes through a cracked magnifying crystal that reveals glowing red temporal fractures",
      "places both gloved hands upon the dual pendulum weights to force the gear arrest",
      "sits calmly in a high-backed leather armchair sipping cold tea as the clock strikes dawn"
    ];

    const voiceovers = [
      "In the silent depths of the tower, time paused.",
      "Every rhythmic second was ticking in reverse.",
      "Spilled secrets were refusing to touch the floor.",
      "Even his own shadow refused to obey.",
      "One adjustment could undo forty years of work.",
      "Outside the tower, the storm stood entirely still.",
      "The creator had left one final fail-safe.",
      "Past memories were beginning to look back.",
      "He was no longer alone in his workshop.",
      "Gears carry memory just as flesh carries scars.",
      "The numerals rearranged the master's destiny.",
      "Every swing pulled the room deeper into the past.",
      "Cracks appeared not in glass, but in the seconds.",
      "Force met friction in four catastrophic seconds.",
      "The clock was repaired. The day was yesterday."
    ];

    for (let i = 0; i < 15; i++) {
      const sceneNum = i + 1;
      const shortSceneName = storyTitles[i];
      const action = storyActions[i];
      const vo = voiceovers[i];

      const imagePrompt = `Match the exact art style of the uploaded reference image: oversized perfectly round pale cream head, small black eyes with heavy droopy lids, thick expressive eyebrows, small body in highly detailed period costume, 2D cartoon with thick clean dark outlines and soft cel shading, dark cinematic palette with deep red accent lighting. ${characterDesc}, standing in an eerie cluttered Victorian workshop surrounded by brass cogs, ticking pendulums, and antique glass vitrines. Barnaby ${action}, wearing a perplexed and solemn expression with lowered brow. Medium shot framing showing detailed gothic interior, dark mahogany shelves and crimson ambient rim light glowing from the mechanical core. ${ratioClean}, no text, consistent character design, match uploaded reference image.`;

      const animationPrompt = `Clip ${sceneNum} – starting frame: Image ${sceneNum} – ${shortSceneName}: Animate this exact image as the first frame. Keep 100% consistency with the source image: same round head, face, costume, outlines, cel shading, dark palette and red lighting. No style drift, no realistic rendering, no change in proportions. No voiceover, dialogue, talking, lip-sync, captions, on-screen text, music or sound effects. No new characters, no new objects, no outfit changes, no scene changes, no character morphing, no distorted limbs, no 3D or anime look. Scene: ${characterDesc} in Victorian workshop with brass gears, ${action}, medium shot in dark cinematic crimson rim lighting. Motion: Barnaby slowly performs action from 0-2 seconds, followed by subtle breathing and settling from 2-4 seconds. Camera: static. Ends on: Barnaby holding steady with intense contemplative gaze. Duration: 4 seconds.`;

      initialScenes.push({
        sceneNumber: sceneNum,
        shortSceneName,
        imagePrompt,
        animationPrompt,
        voiceoverScriptFormatA: `Scene ${sceneNum}:\nNarrator: ${vo}`,
        voiceoverScriptFormatB: vo,
      });
    }

    return {
      summaryLine: "1 minute = 15 scenes × 4 seconds, 9:16 vertical, voiceover in English, script B.",
      scenes: initialScenes,
      ideaTitle: DEFAULT_IDEAS[0].title,
      ideaDescription: DEFAULT_IDEAS[0].description,
      config: {
        selectedIdeaId: 1,
        customTopic: '',
        duration: '1 minute (15 scenes — Default)',
        aspectRatio: '9:16 (Vertical — Default)',
        voiceoverLanguage: 'English (Default)',
        scriptFormat: 'B',
      },
      createdAt: Date.now(),
    };
  });

  // Handle regenerating 10 ideas via Gemini
  const handleRegenerateIdeas = async (theme?: string) => {
    setIsLoadingIdeas(true);
    try {
      const fresh = await fetchIdeas(theme);
      setIdeas(fresh);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingIdeas(false);
    }
  };

  // Generate full workflow
  const handleGenerateWorkflow = async (customConfig?: WorkflowConfig) => {
    const targetConfig = customConfig || config;
    setIsGenerating(true);
    try {
      const data = await generateWorkflowAPI(targetConfig, ideas);
      setWorkflowData(data);
      setConfig(targetConfig);
      setActiveStep(3); // Go straight into Step 3 as requested
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Format A / B switch
  const handleChangeFormat = (newFormat: 'A' | 'B') => {
    const updated = {
      ...workflowData,
      config: { ...workflowData.config, scriptFormat: newFormat },
    };
    setConfig((prev) => ({ ...prev, scriptFormat: newFormat }));
    setWorkflowData(updated);
  };

  // Handle Character Configuration update and optional scene propagation
  const handleSaveCharacter = (newChar: CharacterConfig, applyToScenes = true) => {
    setCharacterConfig(newChar);
    setConfig((prev) => ({ ...prev, characterConfig: newChar }));

    if (applyToScenes && workflowData.scenes.length > 0) {
      const oldCharDesc = characterConfig.fullDescription;
      const oldCharName = characterConfig.name;

      const updatedScenes = workflowData.scenes.map((scene) => {
        let newImg = scene.imagePrompt;
        if (newImg.includes(oldCharDesc)) {
          newImg = newImg.replace(oldCharDesc, newChar.fullDescription);
        } else if (newImg.includes(DEFAULT_CHARACTER.fullDescription)) {
          newImg = newImg.replace(DEFAULT_CHARACTER.fullDescription, newChar.fullDescription);
        }

        let newAnim = scene.animationPrompt;
        if (newAnim.includes(oldCharDesc)) {
          newAnim = newAnim.replace(oldCharDesc, newChar.fullDescription);
        } else if (newAnim.includes(DEFAULT_CHARACTER.fullDescription)) {
          newAnim = newAnim.replace(DEFAULT_CHARACTER.fullDescription, newChar.fullDescription);
        }

        if (newAnim.includes(oldCharName)) {
          newAnim = newAnim.replaceAll(oldCharName, newChar.name);
        }

        return {
          ...scene,
          imagePrompt: newImg,
          animationPrompt: newAnim,
        };
      });

      setWorkflowData((prev) => ({
        ...prev,
        characterConfig: newChar,
        scenes: updatedScenes,
      }));

      setGlobalToast(`✓ Character "${newChar.name}" applied across all ${updatedScenes.length} scenes!`);
      setTimeout(() => setGlobalToast(null), 3000);
    }
  };

  const [globalToast, setGlobalToast] = useState<string | null>(null);

  // Global listener for Header Copy All menu
  useEffect(() => {
    const handleTriggerCopyAll = (e: any) => {
      const target = e.detail?.target;
      const numScenes = workflowData.scenes.length;
      const ratioClean = workflowData.config.aspectRatio.includes('16:9') || workflowData.config.aspectRatio.includes('Horizontal')
        ? '16:9 horizontal'
        : '9:16 vertical';

      if (target === 'character') {
        const charPrompt = formatCharacterPrompt(characterConfig, ratioClean);
        navigator.clipboard.writeText(charPrompt);
        setGlobalToast(`✓ Copied Character Prompt (${characterConfig.name}) to clipboard for Google Flow reference!`);
      } else if (target === 'images') {
        const text = `Create ${numScenes} separate images, one for each numbered prompt below, in this exact order. Use my uploaded reference image for the art style and the characters. ${ratioClean}. Do not animate anything. Do not skip, merge or reorder prompts.\n\n` +
          workflowData.scenes.map((s) => `Image ${s.sceneNumber} – ${s.shortSceneName}: ${s.imagePrompt}`).join('\n\n');
        navigator.clipboard.writeText(text);
        setGlobalToast(`✓ Copied all ${numScenes} Image Prompts to clipboard for Google Flow!`);
      } else if (target === 'animations') {
        const text = `Animate the ${numScenes} images I just created. Make one 4-second video per image using image-to-video (Frames to Video), with each image as the starting frame: Image 1 for Clip 1, Image 2 for Clip 2, and so on, in this exact order. Do not create new images, do not use text-to-video, do not change any scene, framing, character or outfit. ${ratioClean}. No audio.\n\n` +
          workflowData.scenes.map((s) => s.animationPrompt).join('\n\n');
        navigator.clipboard.writeText(text);
        setGlobalToast(`✓ Copied all ${numScenes} Animation Prompts to clipboard for Google Flow!`);
      } else if (target === 'voiceover') {
        const text = workflowData.scenes.map((s) => s.voiceoverScriptFormatB || s.voiceoverScriptFormatA).join('\n\n');
        navigator.clipboard.writeText(text);
        setGlobalToast(`✓ Copied Voiceover Script (${workflowData.config.voiceoverLanguage}) to clipboard!`);
      } else if (target === 'all') {
        const charPrompt = formatCharacterPrompt(characterConfig, ratioClean);
        const bundle = `# ${workflowData.ideaTitle}\n${workflowData.summaryLine}\n\n` +
          `## REFERENCE CHARACTER PROMPT (Anchor Image for Google Flow)\n\`\`\`\n` +
          `${charPrompt}\n\`\`\`\n\n` +
          `## STEP 3 — IMAGE PROMPTS\n\`\`\`\n` +
          `Create ${numScenes} separate images, one for each numbered prompt below, in this exact order. Use my uploaded reference image for the art style and the characters. ${ratioClean}. Do not animate anything. Do not skip, merge or reorder prompts.\n\n` +
          workflowData.scenes.map((s) => `Image ${s.sceneNumber} – ${s.shortSceneName}: ${s.imagePrompt}`).join('\n\n') +
          `\n\`\`\`\n\n## STEP 4 — ANIMATION PROMPTS\n\`\`\`\n` +
          `Animate the ${numScenes} images I just created. Make one 4-second video per image using image-to-video (Frames to Video), with each image as the starting frame: Image 1 for Clip 1, Image 2 for Clip 2, and so on, in this exact order. Do not create new images, do not use text-to-video, do not change any scene, framing, character or outfit. ${ratioClean}. No audio.\n\n` +
          workflowData.scenes.map((s) => s.animationPrompt).join('\n\n') +
          `\n\`\`\`\n\n## STEP 5 — VOICEOVER SCRIPT (${workflowData.config.voiceoverLanguage})\n\`\`\`\n` +
          workflowData.scenes.map((s) => s.voiceoverScriptFormatB || s.voiceoverScriptFormatA).join('\n\n') +
          `\n\`\`\``;
        navigator.clipboard.writeText(bundle);
        setGlobalToast(`✓ Copied complete Google Flow production bundle (Character + Steps 3, 4, 5) to clipboard!`);
      }

      setTimeout(() => setGlobalToast(null), 3000);
    };

    window.addEventListener('trigger-copy-all', handleTriggerCopyAll);
    return () => window.removeEventListener('trigger-copy-all', handleTriggerCopyAll);
  }, [workflowData, characterConfig]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* Top Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenArtGuide={() => setArtGuideOpen(true)}
        onOpenCharacterEditor={() => setCharacterEditorOpen(true)}
        sceneCount={workflowData.scenes.length}
      />

      {/* Global Toast for Quick Copy Actions */}
      {globalToast && (
        <div className="fixed top-20 right-6 z-50 bg-red-600 text-white px-4 py-2.5 rounded-xl shadow-2xl shadow-red-950/80 border border-red-400/40 text-xs font-semibold flex items-center space-x-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <Check className="w-4 h-4 text-white" />
          <span>{globalToast}</span>
        </div>
      )}

      {/* Art Spec Modal */}
      <ArtStyleBanner
        isModal={true}
        isOpen={artGuideOpen}
        onClose={() => setArtGuideOpen(false)}
        characterConfig={characterConfig}
        aspectRatio={config.aspectRatio}
        onOpenCharacterEditor={() => {
          setArtGuideOpen(false);
          setCharacterEditorOpen(true);
        }}
      />

      {/* Character Editor Modal (Photo Upload to Text Converter) */}
      {characterEditorOpen && (
        <CharacterEditor
          isModal={true}
          characterConfig={characterConfig}
          onSaveCharacter={handleSaveCharacter}
          onClose={() => setCharacterEditorOpen(false)}
        />
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Website Overview & Feature Hero Banner */}
        <WebsiteHero
          onStartWorkflow={() => {
            setActiveTab('studio');
            setActiveStep(2);
          }}
          onOpenCharacterEditor={() => setCharacterEditorOpen(true)}
          onOpenStoryboard={() => setActiveTab('storyboard')}
          sceneCount={workflowData.scenes.length}
        />

        {/* Art style reference card always visible at top */}
        <ArtStyleBanner
          isModal={false}
          characterConfig={characterConfig}
          aspectRatio={config.aspectRatio}
          onOpenCharacterEditor={() => setCharacterEditorOpen(true)}
        />

        {/* Tab 1: Studio Wizard */}
        {activeTab === 'studio' && (
          <div className="space-y-6">
            {/* Step Navigation Bar */}
            <div className="bg-zinc-900/80 p-2 rounded-2xl border border-zinc-800 flex items-center justify-between overflow-x-auto scrollbar-none">
              {[
                { step: 1, label: '1. Video Ideas', icon: Film },
                { step: 2, label: '2. Setup (Tick-Box)', icon: Sparkles },
                { step: 3, label: '3. Image Prompts', icon: Video },
                { step: 4, label: '4. Animation Prompts', icon: Film },
                { step: 5, label: '5. Voiceover Script', icon: FileText },
              ].map((s) => {
                const isActive = activeStep === s.step;
                const isPassed = activeStep > s.step;
                return (
                  <button
                    key={s.step}
                    onClick={() => setActiveStep(s.step as any)}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-red-600 text-white shadow-md shadow-red-950/60'
                        : isPassed
                        ? 'text-zinc-200 hover:bg-zinc-800/80'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <s.icon className="w-3.5 h-3.5" />
                    <span>{s.label}</span>
                    {isPassed && <Check className="w-3 h-3 text-emerald-400" />}
                  </button>
                );
              })}
            </div>

            {/* Step Content */}
            {activeStep === 1 && (
              <div className="space-y-4">
                <Step1Ideas
                  ideas={ideas}
                  selectedIdeaId={config.selectedIdeaId}
                  customTopic={config.customTopic}
                  onSelectIdea={(id) => {
                    setConfig((prev) => ({ ...prev, selectedIdeaId: id }));
                  }}
                  onChangeCustomTopic={(topic) => {
                    setConfig((prev) => ({ ...prev, customTopic: topic }));
                  }}
                  onRegenerateIdeas={handleRegenerateIdeas}
                  isLoadingIdeas={isLoadingIdeas}
                />
                <div className="flex justify-end">
                  <button
                    onClick={() => setActiveStep(2)}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl flex items-center space-x-2 transition"
                  >
                    <span>Proceed to Step 2 Setup</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {activeStep === 2 && (
              <div className="space-y-4">
                <Step1Ideas
                  ideas={ideas}
                  selectedIdeaId={config.selectedIdeaId}
                  customTopic={config.customTopic}
                  onSelectIdea={(id) => {
                    setConfig((prev) => ({ ...prev, selectedIdeaId: id }));
                  }}
                  onChangeCustomTopic={(topic) => {
                    setConfig((prev) => ({ ...prev, customTopic: topic }));
                  }}
                  onRegenerateIdeas={handleRegenerateIdeas}
                  isLoadingIdeas={isLoadingIdeas}
                />

                <Step2Setup
                  ideas={ideas}
                  config={config}
                  onChangeConfig={(newCfg) => setConfig(newCfg)}
                  onSubmit={() => handleGenerateWorkflow()}
                  onOpenCharacterEditor={() => setCharacterEditorOpen(true)}
                  isGenerating={isGenerating}
                />
              </div>
            )}

            {activeStep === 3 && (
              <Step3ImagePrompts
                workflowData={workflowData}
                onGoToStep4={() => setActiveStep(4)}
              />
            )}

            {activeStep === 4 && (
              <Step4AnimationPrompts
                workflowData={workflowData}
                onGoToStep5={() => setActiveStep(5)}
              />
            )}

            {activeStep === 5 && (
              <Step5VoiceoverScript
                workflowData={workflowData}
                onChangeFormat={handleChangeFormat}
                onChangeLanguage={(newLang) => {
                  setConfig((prev) => ({ ...prev, voiceoverLanguage: newLang }));
                  setWorkflowData((prev) => ({
                    ...prev,
                    config: { ...prev.config, voiceoverLanguage: newLang },
                  }));
                }}
              />
            )}
          </div>
        )}

        {/* Tab 2: Storyboard Timeline */}
        {activeTab === 'storyboard' && (
          <StoryboardView
            workflowData={workflowData}
            characterConfig={characterConfig}
            onUpdateScene={(sceneNumber, updatedPrompt) => {
              const updatedScenes = workflowData.scenes.map((s) =>
                s.sceneNumber === sceneNumber ? { ...s, imagePrompt: updatedPrompt } : s
              );
              setWorkflowData((prev) => ({ ...prev, scenes: updatedScenes }));
            }}
            onUpdateAllScenes={(updatedScenes) => {
              setWorkflowData((prev) => ({ ...prev, scenes: updatedScenes }));
            }}
          />
        )}

        {/* Tab 3: Interactive Console Chat */}
        {activeTab === 'console' && (
          <ConsoleChatView
            ideas={ideas}
            workflowData={workflowData}
            onUpdateWorkflow={(newData) => setWorkflowData(newData)}
            onGenerateFromQuickLine={async (cfg) => {
              await handleGenerateWorkflow(cfg);
            }}
            isGenerating={isGenerating}
          />
        )}
      </main>

      {/* Comprehensive Website Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 text-zinc-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Column 1: Brand & Overview */}
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-white">
                  <Film className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm text-zinc-100">
                  Google Flow <span className="text-red-500">Video Studio</span>
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Production-grade automation studio for Google Flow AI video generation. Adheres to strict 4-second scene timing, character visual continuity, and multilingual TTS voiceover narration.
              </p>
              <div className="flex items-center space-x-2 text-[10px] text-emerald-400 font-mono">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Engine Active • Gemini 3.8 Flash</span>
              </div>
            </div>

            {/* Column 2: 5-Step Production Workflow */}
            <div className="space-y-2">
              <span className="font-semibold text-zinc-200 text-xs uppercase tracking-wider block">
                Production Steps
              </span>
              <ul className="space-y-1.5 text-[11px]">
                <li>
                  <button onClick={() => { setActiveTab('studio'); setActiveStep(1); }} className="hover:text-red-400 transition">
                    Step 1: 10 Curated Video Ideas
                  </button>
                </li>
                <li>
                  <button onClick={() => { setActiveTab('studio'); setActiveStep(2); }} className="hover:text-red-400 transition">
                    Step 2: Setup (Scene &amp; Image Count)
                  </button>
                </li>
                <li>
                  <button onClick={() => { setActiveTab('studio'); setActiveStep(3); }} className="hover:text-red-400 transition">
                    Step 3: Single-line Image Prompts
                  </button>
                </li>
                <li>
                  <button onClick={() => { setActiveTab('studio'); setActiveStep(4); }} className="hover:text-red-400 transition">
                    Step 4: 4s Animation Clips
                  </button>
                </li>
                <li>
                  <button onClick={() => { setActiveTab('studio'); setActiveStep(5); }} className="hover:text-red-400 transition">
                    Step 5: Multilingual Voiceover Script
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Platform Tools & Views */}
            <div className="space-y-2">
              <span className="font-semibold text-zinc-200 text-xs uppercase tracking-wider block">
                Studio Views
              </span>
              <ul className="space-y-1.5 text-[11px]">
                <li>
                  <button onClick={() => setActiveTab('studio')} className="hover:text-red-400 transition">
                    Studio Wizard View
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('storyboard')} className="hover:text-red-400 transition">
                    Timeline &amp; Storyboard Grid
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('console')} className="hover:text-red-400 transition">
                    Workflow Chat Terminal
                  </button>
                </li>
                <li>
                  <button onClick={() => setCharacterEditorOpen(true)} className="hover:text-red-400 transition">
                    Character Studio (Photo-to-Text)
                  </button>
                </li>
                <li>
                  <button onClick={() => setArtGuideOpen(true)} className="hover:text-red-400 transition">
                    Art Style &amp; Consistency Spec
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Google Flow Constraints */}
            <div className="space-y-2">
              <span className="font-semibold text-zinc-200 text-xs uppercase tracking-wider block">
                Flow Constraints
              </span>
              <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-1.5 text-[11px]">
                <div className="flex items-center space-x-1.5 text-zinc-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                  <span className="font-semibold">Strict 4-Second Cadence</span>
                </div>
                <p className="text-zinc-400 text-[10px]">
                  Total seconds ÷ 4 = exact scene count. No cuts, no filler, seamless 0-2s action &amp; 2-4s reaction motion.
                </p>
                <div className="pt-1 border-t border-zinc-800 text-[10px] text-zinc-400">
                  1-Click copy bundle formatted for immediate Google Flow chat transfer.
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-500">
            <p>
              &copy; {new Date().getFullYear()} Google Flow Video Studio. All rights reserved. Built for creators and video automation.
            </p>
            <div className="flex items-center space-x-4">
              <span className="text-zinc-600">•</span>
              <span>100% Client-Side Web Speech Audio</span>
              <span className="text-zinc-600">•</span>
              <span>Gemini Vision Character Analysis</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
