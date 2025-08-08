"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useCallback, useEffect, useState } from "react";
import BannedTermsConfig from "./BannedTermsConfig";

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
    americanization: 1,
    structureStrictness: 1,
    toneStrictness: 1,
    jargonTolerance: 1
  });
  const [bannedTerms, setBannedTerms] = useState<string[]>([]);
  const [toggles, setToggles] = useState({
    preserveParagraphs: true,
    shorterSentences: false,
    plainVerbs: true
  });

  useEffect(() => {
    const saved = localStorage.getItem("promptOverride");
    if (saved) {
      setOverride(saved);
      setSavedOverride(saved);
    }
  }, []);

  const handleApply = useCallback(() => {
    localStorage.setItem("promptOverride", override);
    localStorage.setItem("knobs", JSON.stringify(knobs));
    localStorage.setItem("toggles", JSON.stringify(toggles));
    setSavedOverride(override);
    onApply({
      override,
      knobs,
      toggles
    });
    onOpenChange(false);
  }, [override, knobs, toggles, onApply, onOpenChange]);

  const handleReset = useCallback(() => {
    setOverride("");
    setKnobs({
      americanization: 1,
      structureStrictness: 1,
      toneStrictness: 1,
      jargonTolerance: 1
    });
    setToggles({
      preserveParagraphs: true,
      shorterSentences: false,
      plainVerbs: true
    });
    localStorage.removeItem("promptOverride");
    localStorage.removeItem("knobs");
    localStorage.removeItem("toggles");
    setSavedOverride("");
    onApply({
      override: "",
      knobs: {
        americanization: 1,
        structureStrictness: 1,
        toneStrictness: 1,
        jargonTolerance: 1
      },
      toggles: {
        preserveParagraphs: true,
        shorterSentences: false,
        plainVerbs: true
      }
    });
    onOpenChange(false);
  }, [onApply, onOpenChange]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-0 right-0 h-full w-full max-w-md bg-panel border-l border-neutral-800 p-6 focus:outline-none">
          <div className="flex flex-col h-full">
            <Dialog.Title className="text-lg font-semibold mb-1">Prompt Drawer</Dialog.Title>
            <Dialog.Description className="text-sm text-muted mb-4">
              Fine-tune the system prompt used for translation editing.
              Changes apply to future runs only.
            </Dialog.Description>

            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Override Text</label>
                <textarea
                  className="w-full h-64 bg-panel border border-neutral-800 rounded p-3 text-sm font-mono"
                  value={override}
                  onChange={(e) => setOverride(e.target.value)}
                  placeholder="Enter additional instructions or modifications to the base prompt..."
                />
              </div>

              {/* Knobs */}
              <div className="space-y-4">
                <div className="text-sm font-medium">Translation Settings</div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm">Americanization (Level {knobs.americanization}/3)</label>
                    <input
                      type="range"
                      min="0"
                      max="3"
                      value={knobs.americanization}
                      onChange={e => setKnobs(prev => ({ ...prev, americanization: Number(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm">Structure Strictness (Level {knobs.structureStrictness}/3)</label>
                    <input
                      type="range"
                      min="0"
                      max="3"
                      value={knobs.structureStrictness}
                      onChange={e => setKnobs(prev => ({ ...prev, structureStrictness: Number(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm">Tone Strictness (Level {knobs.toneStrictness}/3)</label>
                    <input
                      type="range"
                      min="0"
                      max="3"
                      value={knobs.toneStrictness}
                      onChange={e => setKnobs(prev => ({ ...prev, toneStrictness: Number(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm">Jargon Tolerance (Level {knobs.jargonTolerance}/3)</label>
                    <input
                      type="range"
                      min="0"
                      max="3"
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

            <div className="flex justify-between gap-3 mt-6">
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded bg-red-500/20 hover:bg-red-500/30 text-sm"
              >
                Reset to Default
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => onOpenChange(false)}
                  className="px-4 py-2 rounded bg-neutral-700 hover:bg-neutral-600 text-sm"
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
