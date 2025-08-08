"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as Tooltip from "@radix-ui/react-tooltip";
import { useCallback, useEffect, useState } from "react";
import { HelpCircle } from "lucide-react";
import BannedTermsConfig from "./BannedTermsConfig";
import { saveMaterials, getMaterials } from '@/lib/storage';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (settings: {
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
  }) => void;
};

export default function PromptDrawer({ open, onOpenChange, onApply }: Props) {
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

  const handleApply = useCallback(() => {
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
    onApply(promptSettings);
    onOpenChange(false);
  }, [override, knobs, toggles, onApply, onOpenChange]);

  const handleReset = useCallback(() => {
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
    onApply(defaultSettings);
    onOpenChange(false);
  }, [onApply, onOpenChange]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
        <Dialog.Content className="fixed top-0 right-0 h-full w-full max-w-md bg-panel border-l border-default focus:outline-none flex flex-col z-50">
          <div className="flex-shrink-0 px-6 pt-8 pb-6 border-b border-default">
            <Dialog.Title className="text-lg font-semibold mb-3">Prompt Drawer</Dialog.Title>
            <Dialog.Description className="text-sm text-muted leading-relaxed">
              Fine-tune the system prompt used for translation editing.
              <br />
              <span className="mt-2 block">Changes apply to future runs only.</span>
            </Dialog.Description>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
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
                
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-sm font-medium">Americanization (Level {knobs.americanization}/10)</label>
                      <Tooltip.Provider>
                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                            <HelpCircle className="w-4 h-4 text-muted hover:text-foreground cursor-help" />
                          </Tooltip.Trigger>
                          <Tooltip.Portal>
                            <Tooltip.Content className="bg-panel border border-default rounded p-3 text-sm max-w-xs shadow-lg z-50">
                              <div className="space-y-1">
                                <div className="font-medium">Americanization Level</div>
                                <div>1-3: Preserve original phrasing and cultural references</div>
                                <div>4-7: Moderate adaptation for American readers</div>
                                <div>8-10: Strong American idioms, measurements, and cultural adaptation</div>
                              </div>
                              <Tooltip.Arrow className="fill-panel" />
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        </Tooltip.Root>
                      </Tooltip.Provider>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={knobs.americanization}
                      onChange={e => setKnobs(prev => ({ ...prev, americanization: Number(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-sm font-medium">Structure Strictness (Level {knobs.structureStrictness}/10)</label>
                      <Tooltip.Provider>
                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                            <HelpCircle className="w-4 h-4 text-muted hover:text-foreground cursor-help" />
                          </Tooltip.Trigger>
                          <Tooltip.Portal>
                            <Tooltip.Content className="bg-panel border border-default rounded p-3 text-sm max-w-xs shadow-lg z-50">
                              <div className="space-y-1">
                                <div className="font-medium">Structure Adherence</div>
                                <div>1-3: Allow flexible sentence restructuring for clarity</div>
                                <div>4-7: Maintain general paragraph and sentence flow</div>
                                <div>8-10: Preserve exact sentence order and structure</div>
                              </div>
                              <Tooltip.Arrow className="fill-panel" />
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        </Tooltip.Root>
                      </Tooltip.Provider>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={knobs.structureStrictness}
                      onChange={e => setKnobs(prev => ({ ...prev, structureStrictness: Number(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-sm font-medium">Tone Strictness (Level {knobs.toneStrictness}/10)</label>
                      <Tooltip.Provider>
                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                            <HelpCircle className="w-4 h-4 text-muted hover:text-foreground cursor-help" />
                          </Tooltip.Trigger>
                          <Tooltip.Portal>
                            <Tooltip.Content className="bg-panel border border-default rounded p-3 text-sm max-w-xs shadow-lg z-50">
                              <div className="space-y-1">
                                <div className="font-medium">Tone Matching</div>
                                <div>1-3: Natural English tone, adapt for readability</div>
                                <div>4-7: Balance original tone with target language conventions</div>
                                <div>8-10: Preserve exact original tone and authorial voice</div>
                              </div>
                              <Tooltip.Arrow className="fill-panel" />
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        </Tooltip.Root>
                      </Tooltip.Provider>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={knobs.toneStrictness}
                      onChange={e => setKnobs(prev => ({ ...prev, toneStrictness: Number(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-sm font-medium">Jargon Tolerance (Level {knobs.jargonTolerance}/10)</label>
                      <Tooltip.Provider>
                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                            <HelpCircle className="w-4 h-4 text-muted hover:text-foreground cursor-help" />
                          </Tooltip.Trigger>
                          <Tooltip.Portal>
                            <Tooltip.Content className="bg-panel border border-default rounded p-3 text-sm max-w-xs shadow-lg z-50">
                              <div className="space-y-1">
                                <div className="font-medium">Technical Language Handling</div>
                                <div>1-3: Simplify technical terms, explain jargon</div>
                                <div>4-7: Keep moderate technical language, clarify when needed</div>
                                <div>8-10: Preserve all original technical terminology and jargon</div>
                              </div>
                              <Tooltip.Arrow className="fill-panel" />
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        </Tooltip.Root>
                      </Tooltip.Provider>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={knobs.jargonTolerance}
                      onChange={e => setKnobs(prev => ({ ...prev, jargonTolerance: Number(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                <div className="text-sm font-medium">Additional Options</div>
                
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={toggles.preserveParagraphs}
                    onChange={e => setToggles(prev => ({ ...prev, preserveParagraphs: e.target.checked }))}
                    className="rounded border-neutral-600"
                  />
                  Preserve paragraph breaks
                </label>
                
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={toggles.shorterSentences}
                    onChange={e => setToggles(prev => ({ ...prev, shorterSentences: e.target.checked }))}
                    className="rounded border-neutral-600"
                  />
                  Prefer shorter sentences
                </label>
                
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={toggles.plainVerbs}
                    onChange={e => setToggles(prev => ({ ...prev, plainVerbs: e.target.checked }))}
                    className="rounded border-neutral-600"
                  />
                  Prefer plain verbs
                </label>
              </div>

              {savedOverride && (
                <div className="text-sm text-yellow-500">
                  ⚠️ A prompt override is currently active
                </div>
              )}

              <div className="space-y-2">
                <div className="text-sm font-medium">Tips</div>
                <ul className="text-sm text-muted space-y-1 list-disc pl-4">
                  <li>Be specific about tone, style, and terminology preferences</li>
                  <li>Add examples of good/bad translations if helpful</li>
                  <li>Override will be combined with the base prompt</li>
                </ul>
              </div>

              <BannedTermsConfig onChange={setBannedTerms} />
          </div>

          <div className="flex-shrink-0 px-6 py-4 border-t border-default bg-panel">
            <div className="flex justify-between gap-3">
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded bg-red-500/20 hover:bg-red-500/30 text-sm"
              >
                Reset to Default
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => onOpenChange(false)}
                  className="px-4 py-2 rounded bg-panel border border-default hover:bg-accent/10 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  className="px-4 py-2 rounded bg-accent/20 hover:bg-accent/30 text-sm"
                >
                  Apply Changes
                </button>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
