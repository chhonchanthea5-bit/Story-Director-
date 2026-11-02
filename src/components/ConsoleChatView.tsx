import React, { useState, useRef, useEffect } from 'react';
import { WorkflowData, VideoIdea, WorkflowConfig } from '../types/workflow';
import { parseQuickReply, calculateSceneDetails, DEFAULT_IDEAS, formatCharacterPrompt } from '../services/api';
import { Terminal, Send, Copy, Check, Sparkles, RefreshCw, ArrowRight, User } from 'lucide-react';

interface ConsoleChatViewProps {
  ideas: VideoIdea[];
  workflowData: WorkflowData;
  onUpdateWorkflow: (newData: WorkflowData) => void;
  onGenerateFromQuickLine: (config: WorkflowConfig) => Promise<void>;
  isGenerating: boolean;
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text?: string;
  type?: 'step1_and_2' | 'step3' | 'step4' | 'step5' | 'text';
  payload?: any;
  timestamp: string;
}

export const ConsoleChatView: React.FC<ConsoleChatViewProps> = ({
  ideas,
  workflowData,
  onUpdateWorkflow,
  onGenerateFromQuickLine,
  isGenerating,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  // Initialize conversation matching the user prompt instructions
  useEffect(() => {
    if (messages.length === 0) {
      const initialBotMessage: ChatMessage = {
        id: 'msg-initial',
        sender: 'bot',
        type: 'step1_and_2',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([initialBotMessage]);
    }
  }, []);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = async (customText?: string) => {
    const raw = customText || inputVal;
    if (!raw.trim() || isGenerating) return;

    const trimmed = raw.trim();
    setInputVal('');

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);

    const upper = trimmed.toUpperCase();

    // Check if user typed NEXT
    if (upper === 'NEXT') {
      const botMsg: ChatMessage = {
        id: `bot-step4-${Date.now()}`,
        sender: 'bot',
        type: 'step4',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
      return;
    }

    // Check if user typed SCRIPT
    if (upper === 'SCRIPT') {
      const botMsg: ChatMessage = {
        id: `bot-step5-${Date.now()}`,
        sender: 'bot',
        type: 'step5',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
      return;
    }

    // Check if user typed A or B to switch format
    if (upper === 'A' || upper === 'B') {
      const newFormat = upper === 'A' ? 'A' : 'B';
      const updatedConfig = { ...workflowData.config, scriptFormat: newFormat as 'A' | 'B' };
      const updatedWorkflow = { ...workflowData, config: updatedConfig };
      onUpdateWorkflow(updatedWorkflow);

      const botMsg: ChatMessage = {
        id: `bot-format-switch-${Date.now()}`,
        sender: 'bot',
        type: 'step5',
        text: `Switched voiceover script to Format ${newFormat}:`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
      return;
    }

    // Otherwise, treat as Step 2 answer: parse configuration and generate Step 3!
    const parsedConfig = parseQuickReply(trimmed, ideas);
    await onGenerateFromQuickLine(parsedConfig);

    // Bot responds with Step 3
    const botStep3Msg: ChatMessage = {
      id: `bot-step3-${Date.now()}`,
      sender: 'bot',
      type: 'step3',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, botStep3Msg]);
  };

  const { scenes, config } = workflowData;
  const numScenes = scenes.length;
  const ratioClean = config.aspectRatio.includes('16:9') || config.aspectRatio.includes('Horizontal')
    ? '16:9 horizontal'
    : '9:16 vertical';

  const confirmationLine = `${config.duration.split('(')[0].trim()} = ${numScenes} scenes × 4 seconds, ${ratioClean}, voiceover in ${config.voiceoverLanguage.split('(')[0].trim()}, script ${config.scriptFormat}.`;

  // Render Step 3 code block text
  const step3Block = `Create ${numScenes} separate images, one for each numbered prompt below, in this exact order. Use my uploaded reference image for the art style and the characters. ${ratioClean}. Do not animate anything. Do not skip, merge or reorder prompts.\n\n` +
    scenes.map((s) => `Image ${s.sceneNumber} – ${s.shortSceneName}: ${s.imagePrompt}`).join('\n\n');

  // Render Step 4 code block text
  const step4Block = `Animate the ${numScenes} images I just created. Make one 4-second video per image using image-to-video (Frames to Video), with each image as the starting frame: Image 1 for Clip 1, Image 2 for Clip 2, and so on, in this exact order. Do not create new images, do not use text-to-video, do not change any scene, framing, character or outfit. ${ratioClean}. No audio.\n\n` +
    scenes.map((s) => s.animationPrompt).join('\n\n');

  // Render Step 5 code block text
  let step5Block = '';
  if (config.scriptFormat === 'A') {
    step5Block = scenes
      .map((s) => `Scene ${s.sceneNumber}:\nNarrator: ${s.voiceoverScriptFormatB || s.voiceoverScriptFormatA.replace(/Scene \d+:\s*(Narrator:\s*)?/, '')}`)
      .join('\n\n');
  } else {
    step5Block = scenes
      .map((s) => (s.voiceoverScriptFormatB || s.voiceoverScriptFormatA.replace(/Scene \d+:\s*(Narrator:\s*)?/, '')).trim())
      .join('\n\n');
  }

  return (
    <div className="flex flex-col h-[750px] bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Console Top Header */}
      <div className="px-5 py-3.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="flex space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-xs font-mono text-zinc-300 font-semibold pl-2">
            Google Flow Workflow Console
          </span>
        </div>

        {/* Quick Commands */}
        <div className="flex items-center space-x-1.5 text-[11px] font-mono">
          <button
            onClick={() => {
              const charPrompt = formatCharacterPrompt(workflowData.characterConfig || workflowData.config.characterConfig);
              navigator.clipboard.writeText(charPrompt);
              setCopiedId('chat-char');
              setTimeout(() => setCopiedId(null), 2000);
            }}
            className="px-2 py-0.5 rounded bg-red-600/20 hover:bg-red-600/30 text-red-300 hover:text-white border border-red-500/40 transition flex items-center space-x-1 cursor-pointer"
            title="Copy Character Prompt for Google Flow reference image"
          >
            {copiedId === 'chat-char' ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <User className="w-3 h-3 text-red-400" />
                <span>Copy Character</span>
              </>
            )}
          </button>
          <button
            onClick={() => handleSend('NEXT')}
            className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition"
          >
            NEXT
          </button>
          <button
            onClick={() => handleSend('SCRIPT')}
            className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition"
          >
            SCRIPT
          </button>
          <button
            onClick={() => handleSend('A')}
            className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition"
          >
            Format A
          </button>
          <button
            onClick={() => handleSend('B')}
            className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition"
          >
            Format B
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin">
        {messages.map((msg) => {
          if (msg.sender === 'user') {
            return (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-xl bg-red-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-xs font-mono shadow-md">
                  <p>{msg.text}</p>
                  <span className="text-[10px] text-red-200 block text-right mt-1">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          }

          // Bot message
          return (
            <div key={msg.id} className="flex justify-start">
              <div className="max-w-4xl w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl rounded-tl-sm p-4 text-xs text-zinc-200 font-mono shadow-lg space-y-4">
                {/* STEP 1 & 2 INITIAL MESSAGE */}
                {msg.type === 'step1_and_2' && (
                  <div className="space-y-5">
                    <div>
                      <div className="text-red-400 font-bold mb-2">
                        STEP 1 — 10 Short Video Ideas (title + one sentence each):
                      </div>
                      <ol className="list-decimal list-inside space-y-1.5 text-zinc-300 text-[11px] leading-relaxed">
                        {ideas.map((idea) => (
                          <li key={idea.id}>
                            <strong className="text-zinc-100">{idea.title}</strong>: {idea.description}
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div className="pt-3 border-t border-zinc-800/80">
                      <div className="text-red-400 font-bold mb-2">
                        STEP 2 — Setup Menu:
                      </div>
                      <pre className="text-zinc-300 text-[11px] leading-relaxed whitespace-pre-wrap font-mono">
{`"0. Which idea (1–10) do you want to make?
- [ ] 1 to 10 (Write number: ___)
- [ ] Custom Topic: ___
- [ ] Default: Idea 1

1. How many scenes / images (or video duration) to generate?
- [ ] Scene/Image Count: e.g. 5, 8, 10, 15, 20, 30, 45 scenes
- [ ] 20 seconds (5 scenes)
- [ ] 30 seconds (8 scenes)
- [ ] 1 minute (15 scenes — Default)
- [ ] 3 minutes (45 scenes)
- [ ] 5 minutes (75 scenes)
- [ ] Other (e.g. 10 scenes, 12 images, or exact seconds): ___

2. What aspect ratio?
- [ ] 9:16 (Vertical — Default)
- [ ] 16:9 (Horizontal)

3. What voiceover language?
- [ ] English (Default)
- [ ] Khmer (ភាសាខ្មែរ)
- [ ] Thai
- [ ] Vietnamese
- [ ] Chinese
- [ ] Spanish
- [ ] Other: ___

4. Which script format?
- [ ] Format A: Scene by scene (labeled lines with speaker names, to sync per 4-second clip)
- [ ] Format B: Full voiceover (one continuous text block per scene for TTS tools — Default)"`}
                      </pre>
                    </div>

                    <div className="p-2.5 bg-black/60 rounded-xl border border-zinc-800 text-[11px] text-zinc-400">
                      You may reply by typing one short line, for example:
                      <button
                        onClick={() => handleSend('3, 1 minute, 9:16, Khmer, B')}
                        className="ml-1 text-red-400 underline hover:text-red-300 font-bold"
                      >
                        &ldquo;3, 1 minute, 9:16, Khmer, B&rdquo;
                      </button>
                      {' '}or click{' '}
                      <button
                        onClick={() => handleSend('1, 1 minute, 9:16, English, B')}
                        className="text-amber-400 underline hover:text-amber-300 font-bold"
                      >
                        &ldquo;Default (1, 1 minute, 9:16, English, B)&rdquo;
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3 MESSAGE */}
                {msg.type === 'step3' && (
                  <div className="space-y-3">
                    <p className="text-zinc-300 font-semibold text-xs">
                      {confirmationLine}
                    </p>

                    <div>
                      <div className="flex items-center justify-between text-zinc-400 text-[11px] mb-1">
                        <span>Scenes 1–{numScenes}, in order</span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleCopyCode(formatCharacterPrompt(workflowData.characterConfig || config.characterConfig, ratioClean), `char-s3-${msg.id}`)}
                            className="flex items-center space-x-1 px-2 py-0.5 rounded bg-red-950/60 border border-red-800/60 hover:bg-red-900/60 text-red-300 transition"
                            title="Copy 1:1 Reference Character Prompt"
                          >
                            {copiedId === `char-s3-${msg.id}` ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Copied Character</span>
                              </>
                            ) : (
                              <>
                                <User className="w-3 h-3 text-red-400" />
                                <span>Copy Character Prompt</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleCopyCode(step3Block, `s3-${msg.id}`)}
                            className="flex items-center space-x-1 px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition"
                          >
                            {copiedId === `s3-${msg.id}` ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Block</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="bg-black/90 p-3.5 rounded-xl border border-zinc-800 text-[11px] max-h-72 overflow-y-auto scrollbar-thin">
                        <pre className="whitespace-pre-wrap">{step3Block}</pre>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-amber-400 text-xs">
                        Type NEXT for the animation prompts.
                      </span>
                      <button
                        onClick={() => handleSend('NEXT')}
                        className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1"
                      >
                        <span>Send NEXT</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 4 MESSAGE */}
                {msg.type === 'step4' && (
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-zinc-400 text-[11px] mb-1">
                        <span>Scenes 1–{numScenes}, in order</span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleCopyCode(formatCharacterPrompt(workflowData.characterConfig || config.characterConfig, ratioClean), `char-s4-${msg.id}`)}
                            className="flex items-center space-x-1 px-2 py-0.5 rounded bg-red-950/60 border border-red-800/60 hover:bg-red-900/60 text-red-300 transition"
                            title="Copy 1:1 Reference Character Prompt"
                          >
                            {copiedId === `char-s4-${msg.id}` ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Copied Character</span>
                              </>
                            ) : (
                              <>
                                <User className="w-3 h-3 text-red-400" />
                                <span>Copy Character Prompt</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleCopyCode(step4Block, `s4-${msg.id}`)}
                            className="flex items-center space-x-1 px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition"
                          >
                            {copiedId === `s4-${msg.id}` ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Block</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="bg-black/90 p-3.5 rounded-xl border border-zinc-800 text-[11px] max-h-72 overflow-y-auto scrollbar-thin">
                        <pre className="whitespace-pre-wrap">{step4Block}</pre>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-amber-400 text-xs">
                        Type SCRIPT for the voiceover script.
                      </span>
                      <button
                        onClick={() => handleSend('SCRIPT')}
                        className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1"
                      >
                        <span>Send SCRIPT</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 5 MESSAGE */}
                {msg.type === 'step5' && (
                  <div className="space-y-3">
                    {msg.text && <p className="text-zinc-400 text-xs">{msg.text}</p>}

                    <div>
                      <div className="flex items-center justify-between text-zinc-400 text-[11px] mb-1">
                        <span>Voiceover Script ({config.voiceoverLanguage} — Format {config.scriptFormat})</span>
                        <button
                          onClick={() => handleCopyCode(step5Block, `s5-${msg.id}`)}
                          className="flex items-center space-x-1 px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition"
                        >
                          {copiedId === `s5-${msg.id}` ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Script</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="bg-black/90 p-3.5 rounded-xl border border-zinc-800 text-[11px] max-h-72 overflow-y-auto scrollbar-thin">
                        <pre className="whitespace-pre-wrap">{step5Block}</pre>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 text-[11px] text-zinc-500">
                      <span>Type &ldquo;A&rdquo; or &ldquo;B&rdquo; anytime to reformat this script.</span>
                    </div>
                  </div>
                )}

                <span className="text-[10px] text-zinc-500 block text-right mt-1">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {isGenerating && (
          <div className="flex justify-start">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3 text-xs text-zinc-400 font-mono flex items-center space-x-2">
              <div className="w-3 h-3 border-2 border-red-500/40 border-t-red-500 rounded-full animate-spin" />
              <span>Crafting Google Flow prompts adhering to 4s timing rules...</span>
            </div>
          </div>
        )}

        <div ref={scrollEndRef} />
      </div>

      {/* Input bar */}
      <div className="p-3 bg-zinc-900 border-t border-zinc-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Type reply e.g. '1, 10 scenes, 9:16, English, B', '3, 1m, 9:16, Khmer, B', 'NEXT', 'SCRIPT'..."
              className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={!inputVal.trim() || isGenerating}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition disabled:opacity-50"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
