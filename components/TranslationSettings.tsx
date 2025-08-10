"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as Tooltip from "@radix-ui/react-tooltip";
import { useCallback, useEffect, useState } from "react";
import { HelpCircle } from "lucide-react";
import BannedTermsConfig from "./BannedTermsConfig";
import { saveMaterials, getMaterials } from '@/lib/storage';

type AudienceConfig = {
  prompt: string;
  audience: string;
  notes: string;
};

type PromptSettings = {
  override: string;
  knobs: {
    americanization: number;
    structureStrictness: number;
    toneStrictness: number;
    jargonTolerance: number;
  };
  toggles: {
    preserveParagraphs: boolean;
    shorterSentences: boolean;
    plainVerbs: boolean;
  };
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyPrompt: (settings: PromptSettings) => void;
  audienceConfig: AudienceConfig;
  onAudienceConfigChange: (config: AudienceConfig) => void;
};

export default function TranslationSettings({ 
  open, 
  onOpenChange, 
  onApplyPrompt,
  audienceConfig,
  onAudienceConfigChange
}: Props) {
  const [activeTab, setActiveTab] = useState<'prompt' | 'audience'>('prompt');
  
  // Prompt settings state
  const [override, setOverride] = useState("");
  const [savedOverride, setSavedOverride] = useState("");
  const [knobs, setKnobs] = useState({
    americanization: 5,
    structureStrictness: 5,
    toneStrictness: 5,
    jargonTolerance: 5
  });
  const [bannedTerms, setBannedTerms] = useState<string[]>([]);
  const [toggles, setToggles] = useState({
    preserveParagraphs: true,
    shorterSentences: false,
    plainVerbs: true
  });

  // Audience settings state
  const [localAudienceConfig, setLocalAudienceConfig] = useState<AudienceConfig>(audienceConfig);

  useEffect(() => {
    // Load stored prompt settings
    const storedMaterials = getMaterials();
    if (storedMaterials.promptSettings) {
      const settings = storedMaterials.promptSettings;
      if (settings.override) {
        setOverride(settings.override);
        setSavedOverride(settings.override);
      }
      if (settings.knobs) {
        setKnobs(settings.knobs);
      }
      if (settings.toggles) {
        setToggles(settings.toggles);
      }
    }
    
    // Legacy support for saved override
    const saved = localStorage.getItem("promptOverride");
    if (saved && !storedMaterials.promptSettings?.override) {
      setOverride(saved);
      setSavedOverride(saved);
    }
  }, []);

  useEffect(() => {
    setLocalAudienceConfig(audienceConfig);
  }, [audienceConfig]);

  const handleApplyPrompt = useCallback(() => {
    const promptSettings = {
      override,
      knobs,
      toggles
    };
    
    // Save to new persistent storage
    saveMaterials({ promptSettings });
    
    // Legacy localStorage for backwards compatibility
    localStorage.setItem("promptOverride", override);
    localStorage.setItem("knobs", JSON.stringify(knobs));
    localStorage.setItem("toggles", JSON.stringify(toggles));
    
    setSavedOverride(override);
    onApplyPrompt(promptSettings);
  }, [override, knobs, toggles, onApplyPrompt]);

  const handleResetPrompt = useCallback(() => {
    const defaultSettings = {
      override: "",
      knobs: {
        americanization: 5,
        structureStrictness: 5,
        toneStrictness: 5,
        jargonTolerance: 5
      },
      toggles: {
        preserveParagraphs: true,
        shorterSentences: false,
        plainVerbs: true
      }
    };
    
    setOverride("");
    setKnobs(defaultSettings.knobs);
    setToggles(defaultSettings.toggles);
    
    // Clear from persistent storage
    saveMaterials({ promptSettings: defaultSettings });
    
    // Clear legacy localStorage
    localStorage.removeItem("promptOverride");
    localStorage.removeItem("knobs");
    localStorage.removeItem("toggles");
    
    setSavedOverride("");
    onApplyPrompt(defaultSettings);
  }, [onApplyPrompt]);

  const handleSaveAudience = () => {
    onAudienceConfigChange(localAudienceConfig);
  };

  const handleCancel = () => {
    setLocalAudienceConfig(audienceConfig); // Reset audience to original
    onOpenChange(false);
  };

  const handleSaveAndClose = () => {
    handleApplyPrompt();
    handleSaveAudience();
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
        <Dialog.Content className="fixed top-0 right-0 h-full w-full max-w-md bg-panel border-l border-default focus:outline-none flex flex-col z-50">
          <div className="flex-shrink-0 px-6 pt-8 pb-6 border-b border-default">
            <Dialog.Title className="text-lg font-semibold mb-3">Translation Settings</Dialog.Title>
            <Dialog.Description className="text-sm text-muted leading-relaxed">
              Configure prompt settings and audience version parameters.
            </Dialog.Description>
            
            {/* Tab Navigation */}
            <div className="flex mt-4 border border-default rounded overflow-hidden">
              <button
                className={`flex-1 px-3 py-2 text-sm transition-colors ${
                  activeTab === 'prompt' 
                    ? 'bg-accent/20 text-accent border-r border-default' 
                    : 'hover:bg-accent/10 border-r border-default'
                }`}
                onClick={() => setActiveTab('prompt')}
              >
                ⚙️ Prompt Settings
              </button>
              <button
                className={`flex-1 px-3 py-2 text-sm transition-colors ${
                  activeTab === 'audience' 
                    ? 'bg-accent/20 text-accent' 
                    : 'hover:bg-accent/10'
                }`}
                onClick={() => setActiveTab('audience')}
              >
                👥 Audience Version
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            {activeTab === 'prompt' ? (
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="block text-sm font-medium">Override Text</label>
                  <textarea
                    className="w-full h-48 bg-panel border border-default rounded p-4 text-sm font-mono leading-relaxed"
                    value={override}
                    onChange={(e) => setOverride(e.target.value)}
                    placeholder="Enter additional instructions or modifications to the base prompt..."
                  />
                </div>

                {/* Knobs */}
                <div className="space-y-6">
                  <div className="text-sm font-medium">Translation Settings</div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="text-sm">Americanization</label>
                        <Tooltip.Provider>
                          <Tooltip.Root>
                            <Tooltip.Trigger asChild>
                              <HelpCircle className="w-3 h-3 text-muted cursor-help" />
                            </Tooltip.Trigger>
                            <Tooltip.Portal>
                              <Tooltip.Content className="bg-popover border border-default rounded px-2 py-1 text-xs max-w-xs z-50">
                                How much to convert British to American English (spelling, vocabulary)
                                <Tooltip.Arrow className="fill-popover" />
                              </Tooltip.Content>
                            </Tooltip.Portal>
                          </Tooltip.Root>
                        </Tooltip.Provider>
                        <span className="text-xs text-muted ml-auto">{knobs.americanization}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={knobs.americanization}
                        onChange={(e) => setKnobs({ ...knobs, americanization: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="text-sm">Structure Strictness</label>
                        <Tooltip.Provider>
                          <Tooltip.Root>
                            <Tooltip.Trigger asChild>
                              <HelpCircle className="w-3 h-3 text-muted cursor-help" />
                            </Tooltip.Trigger>
                            <Tooltip.Portal>
                              <Tooltip.Content className="bg-popover border border-default rounded px-2 py-1 text-xs max-w-xs z-50">
                                How closely to follow the original sentence structure vs. rewriting for clarity
                                <Tooltip.Arrow className="fill-popover" />
                              </Tooltip.Content>
                            </Tooltip.Portal>
                          </Tooltip.Root>
                        </Tooltip.Provider>
                        <span className="text-xs text-muted ml-auto">{knobs.structureStrictness}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={knobs.structureStrictness}
                        onChange={(e) => setKnobs({ ...knobs, structureStrictness: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="text-sm">Tone Strictness</label>
                        <Tooltip.Provider>
                          <Tooltip.Root>
                            <Tooltip.Trigger asChild>
                              <HelpCircle className="w-3 h-3 text-muted cursor-help" />
                            </Tooltip.Trigger>
                            <Tooltip.Portal>
                              <Tooltip.Content className="bg-popover border border-default rounded px-2 py-1 text-xs max-w-xs z-50">
                                How closely to preserve the original tone vs. adapting for English audience
                                <Tooltip.Arrow className="fill-popover" />
                              </Tooltip.Content>
                            </Tooltip.Portal>
                          </Tooltip.Root>
                        </Tooltip.Provider>
                        <span className="text-xs text-muted ml-auto">{knobs.toneStrictness}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={knobs.toneStrictness}
                        onChange={(e) => setKnobs({ ...knobs, toneStrictness: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="text-sm">Jargon Tolerance</label>
                        <Tooltip.Provider>
                          <Tooltip.Root>
                            <Tooltip.Trigger asChild>
                              <HelpCircle className="w-3 h-3 text-muted cursor-help" />
                            </Tooltip.Trigger>
                            <Tooltip.Portal>
                              <Tooltip.Content className="bg-popover border border-default rounded px-2 py-1 text-xs max-w-xs z-50">
                                How much specialized terminology to keep vs. simplifying for general audience
                                <Tooltip.Arrow className="fill-popover" />
                              </Tooltip.Content>
                            </Tooltip.Portal>
                          </Tooltip.Root>
                        </Tooltip.Provider>
                        <span className="text-xs text-muted ml-auto">{knobs.jargonTolerance}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={knobs.jargonTolerance}
                        onChange={(e) => setKnobs({ ...knobs, jargonTolerance: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-4">
                  <div className="text-sm font-medium">Text Processing Options</div>
                  
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={toggles.preserveParagraphs}
                        onChange={(e) => setToggles({ ...toggles, preserveParagraphs: e.target.checked })}
                        className="rounded"
                      />
                      <div>
                        <div className="text-sm">Preserve Paragraph Breaks</div>
                        <div className="text-xs text-muted">Keep original paragraph structure</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={toggles.shorterSentences}
                        onChange={(e) => setToggles({ ...toggles, shorterSentences: e.target.checked })}
                        className="rounded"
                      />
                      <div>
                        <div className="text-sm">Shorter Sentences</div>
                        <div className="text-xs text-muted">Break up long sentences for clarity</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={toggles.plainVerbs}
                        onChange={(e) => setToggles({ ...toggles, plainVerbs: e.target.checked })}
                        className="rounded"
                      />
                      <div>
                        <div className="text-sm">Plain Verbs</div>
                        <div className="text-xs text-muted">Use simple, direct verb forms</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Banned Terms */}
                <BannedTermsConfig onChange={setBannedTerms} />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Audience Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Audience</label>
                  <input
                    type="text"
                    value={localAudienceConfig.audience}
                    onChange={(e) => setLocalAudienceConfig({ ...localAudienceConfig, audience: e.target.value })}
                    placeholder="e.g., General public, Academic audience, Children, etc."
                    className="w-full px-3 py-2 bg-background border border-default rounded text-sm"
                  />
                  <p className="text-xs text-muted">
                    Specify who this version is intended for
                  </p>
                </div>

                {/* Custom Prompt Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Custom Prompt (Optional)</label>
                  <textarea
                    value={localAudienceConfig.prompt}
                    onChange={(e) => setLocalAudienceConfig({ ...localAudienceConfig, prompt: e.target.value })}
                    placeholder="Additional instructions for generating the audience version..."
                    className="w-full px-3 py-2 bg-background border border-default rounded text-sm h-24 resize-none"
                  />
                  <p className="text-xs text-muted">
                    Add specific instructions for tailoring the content
                  </p>
                </div>

                {/* Additional Notes Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Additional Notes</label>
                  <textarea
                    value={localAudienceConfig.notes}
                    onChange={(e) => setLocalAudienceConfig({ ...localAudienceConfig, notes: e.target.value })}
                    placeholder="Any additional context or requirements..."
                    className="w-full px-3 py-2 bg-background border border-default rounded text-sm h-20 resize-none"
                  />
                  <p className="text-xs text-muted">
                    Include any other relevant information
                  </p>
                </div>

                {/* Preset Examples */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quick Presets</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setLocalAudienceConfig({
                        audience: "General public",
                        prompt: "Make the language more accessible and less technical",
                        notes: "Use simpler vocabulary and shorter sentences"
                      })}
                      className="px-3 py-2 text-xs border border-default rounded hover:bg-accent/10 transition-colors text-left"
                    >
                      📰 General Public
                    </button>
                    <button
                      onClick={() => setLocalAudienceConfig({
                        audience: "Academic audience",
                        prompt: "Maintain scholarly tone while improving clarity",
                        notes: "Keep technical terms but enhance readability"
                      })}
                      className="px-3 py-2 text-xs border border-default rounded hover:bg-accent/10 transition-colors text-left"
                    >
                      🎓 Academic
                    </button>
                    <button
                      onClick={() => setLocalAudienceConfig({
                        audience: "Children (ages 8-12)",
                        prompt: "Simplify language for young readers",
                        notes: "Use age-appropriate vocabulary and concepts"
                      })}
                      className="px-3 py-2 text-xs border border-default rounded hover:bg-accent/10 transition-colors text-left"
                    >
                      👶 Children
                    </button>
                    <button
                      onClick={() => setLocalAudienceConfig({
                        audience: "Business professionals",
                        prompt: "Adapt for business context with professional tone",
                        notes: "Focus on clarity and actionable insights"
                      })}
                      className="px-3 py-2 text-xs border border-default rounded hover:bg-accent/10 transition-colors text-left"
                    >
                      💼 Business
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-6 py-4 border-t border-default flex justify-between">
            <div className="flex gap-2">
              {activeTab === 'prompt' && (
                <button
                  onClick={handleResetPrompt}
                  className="px-3 py-2 text-sm border border-default rounded hover:bg-accent/10 transition-colors text-muted"
                >
                  Reset to Defaults
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm border border-default rounded hover:bg-accent/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAndClose}
                className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export type { AudienceConfig, PromptSettings };
