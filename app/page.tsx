"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import OutputTabs from "@/components/OutputTabs";
import RunBar from "@/components/RunBar";
import ReadabilityPane from "@/components/ReadabilityPane";
import PromptDrawer from "@/components/PromptDrawer";
import DiffView from "@/components/DiffView";
import GlossaryUpload from "@/components/GlossaryUpload";
import Toasts, { useToasts } from "@/components/Toasts";
import HighlightedText from "@/components/HighlightedText";
import SessionManager, { type TranslationSession } from "@/components/SessionManager";
import GuidelinesUploader from "@/components/GuidelinesUploader";
import LanguageSelector, { type Language } from "@/components/LanguageSelector";
import { checkGuardrails, validateEditedText, buildReEnforcementPrompt } from "@/lib/guardrails";
import type { HighlightType } from "@/lib/hemingway";

export default function Page() {
  const { toasts, addToast } = useToasts();
  const [hebrew, setHebrew] = useState("");
  const [roughEnglish, setRoughEnglish] = useState("");
  const [model, setModel] = useState("gpt-5-mini");
  const [pending, setPending] = useState(false);

  // Outputs
  const [editedText, setEditedText] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [promptDrawerOpen, setPromptDrawerOpen] = useState(false);
  const [promptSettings, setPromptSettings] = useState({
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
  const [glossary, setGlossary] = useState<Array<{ hebrew: string; chosen_english: string; note?: string }>>([]);
  const [bannedTermsViolations, setBannedTermsViolations] = useState<string[]>([]);
  const [enabledHighlights, setEnabledHighlights] = useState<Set<HighlightType>>(
    new Set<HighlightType>(['veryHardSentence', 'hardSentence', 'weakener', 'complex', 'passive'])
  );
  const [showHighlights, setShowHighlights] = useState(false);
  
  // New features state
  const [guidelines, setGuidelines] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState<Language>("hebrew");
  const [targetLanguage, setTargetLanguage] = useState<Language>("english");
  const [useRoughEnglish, setUseRoughEnglish] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{
    id: string;
    timestamp: number;
    sourceText: string;
    roughText?: string;
    result: string;
    sourceLanguage: Language;
    targetLanguage: Language;
  }>>([]);

  const abortRef = useRef<AbortController | null>(null);

  // Session management functions
  const getCurrentSession = (): Partial<TranslationSession> => ({
    hebrew,
    roughEnglish,
    editedText,
    model
  });

  const handleLoadSession = (session: TranslationSession) => {
    setHebrew(session.hebrew);
    setRoughEnglish(session.roughEnglish);
    setEditedText(session.editedText);
    setModel(session.model);
    addToast({ description: `Loaded session: ${session.title}`, type: "success" });
  };

  const handleSaveSession = (title: string) => {
    addToast({ description: `Saved session: ${title}`, type: "success" });
  };

  const handleNewSession = () => {
    setHebrew("");
    setRoughEnglish("");
    setEditedText("");
    setNotes("");
    setBannedTermsViolations([]);
    setConversationHistory([]);
    addToast({ description: "Started new session", type: "info" });
  };

  // Auto-save current work to localStorage
  useEffect(() => {
    if (hebrew || roughEnglish || editedText) {
      const autoSave = {
        hebrew,
        roughEnglish,
        editedText,
        model,
        guidelines,
        sourceLanguage,
        targetLanguage,
        useRoughEnglish,
        conversationHistory,
        timestamp: Date.now()
      };
      localStorage.setItem('translation-autosave', JSON.stringify(autoSave));
    }
  }, [hebrew, roughEnglish, editedText, model, guidelines, sourceLanguage, targetLanguage, useRoughEnglish, conversationHistory]);

  // Load auto-saved work on mount
  useEffect(() => {
    const autoSave = localStorage.getItem('translation-autosave');
    if (autoSave) {
      try {
        const parsed = JSON.parse(autoSave);
        const timeDiff = Date.now() - parsed.timestamp;
        // Only auto-restore if less than 24 hours old
        if (timeDiff < 24 * 60 * 60 * 1000) {
          setHebrew(parsed.hebrew || "");
          setRoughEnglish(parsed.roughEnglish || "");
          setEditedText(parsed.editedText || "");
          setModel(parsed.model || "gpt-4");
          if (parsed.hebrew || parsed.roughEnglish || parsed.editedText) {
            addToast({ description: "Restored previous work", type: "info" });
          }
        }
      } catch (error) {
        console.error('Failed to load auto-save:', error);
      }
    }
  }, []);

  const onRun = useCallback(async (isRetry = false) => {
    // Get banned terms from localStorage
    const bannedTermsText = localStorage.getItem("bannedTerms") || "";
    const bannedTerms = bannedTermsText.split("\n").map(t => t.trim()).filter(Boolean);

    // Check guardrails before proceeding (only for initial runs, not retries)
    if (!isRetry) {
      const hebrewCheck = checkGuardrails(hebrew, { bannedTerms });
      const roughEnglishCheck = checkGuardrails(roughEnglish, { bannedTerms });

      if (!hebrewCheck.isValid || !roughEnglishCheck.isValid) {
        const violations = [...hebrewCheck.violations, ...roughEnglishCheck.violations];
        const message = violations.map(v => v.message).join("\n");
        addToast({
          type: "error",
          title: "Input validation failed",
          description: message
        });
        return;
      }
    }

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setPending(true);
    setBannedTermsViolations([]);
    
    try {
      const res = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          hebrew, 
          roughEnglish, 
          model, 
          ...promptSettings,
          glossary,
          isRetry,
          bannedTerms
        }),
        signal: ac.signal
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);

      const newEditedText = json.edited_text || "";
      setEditedText(newEditedText);
      
      // Check for banned terms in the output
      if (bannedTerms.length > 0) {
        const outputCheck = validateEditedText(newEditedText, { bannedTerms });
        if (!outputCheck.isValid) {
          const violatedTerms = outputCheck.violations
            .filter(v => v.type === 'bannedTerm')
            .map(v => v.term!)
            .filter(Boolean);
          setBannedTermsViolations(violatedTerms);
        }
      }

      const cl = Array.isArray(json.change_log) ? json.change_log.length : 0;
      const gh = Array.isArray(json.terms_glossary_hits) ? json.terms_glossary_hits.length : 0;
      const fl = Array.isArray(json.flags) ? json.flags.length : 0;
      setNotes(`change_log: ${cl}, glossary hits: ${gh}, flags: ${fl}`);
    } catch (e: any) {
      console.error(e);
      
      // Handle specific error types
      if (e.name === 'AbortError' || e.message?.includes('aborted')) {
        // Don't show error toast for user-initiated cancellations
        setNotes("Request was cancelled");
        return;
      }
      
      const error = e?.message || "Request failed";
      setNotes(error);
      addToast({
        type: "error",
        title: "Error",
        description: error
      });
    } finally {
      setPending(false);
    }
  }, [hebrew, roughEnglish, model, promptSettings, glossary, addToast]);

  const onClear = () => {
    abortRef.current?.abort();
    setHebrew("");
    setRoughEnglish("");
    setEditedText("");
    setNotes("");
    setBannedTermsViolations([]);
  };

  const onEnforceRetry = useCallback(() => {
    onRun(true);
  }, [onRun]);

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Run: Cmd/Ctrl + Enter
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        onRun();
      }
      // Toggle Prompt Drawer: Cmd/Ctrl + /
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setPromptDrawerOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRun]);

  return (
    <div className="flex flex-col min-h-screen">
      <RunBar 
        model={model} 
        setModel={setModel} 
        onRun={() => onRun()} 
        onClear={() => {
          onClear();
          setPromptSettings({
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
          localStorage.removeItem("promptOverride");
          localStorage.removeItem("knobs");
          localStorage.removeItem("toggles");
          addToast({
            type: "info",
            description: "Started new session"
          });
        }}
        pending={pending}
        onOpenPromptDrawer={() => setPromptDrawerOpen(true)}
      />
      <Toasts toasts={toasts} />
      
      <PromptDrawer
        open={promptDrawerOpen}
        onOpenChange={setPromptDrawerOpen}
        onApply={setPromptSettings}
      />

      {/* Banned Terms Violation Banner */}
      {bannedTermsViolations.length > 0 && (
        <div className="bg-red-500/20 border border-red-500 rounded mx-4 mt-2 p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-red-400">Banned terms detected in output:</div>
              <div className="text-sm text-red-300 mt-1">
                {bannedTermsViolations.map(term => `"${term}"`).join(", ")}
              </div>
            </div>
            <button
              onClick={onEnforceRetry}
              disabled={pending}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded text-sm font-medium"
            >
              Re-ask with enforcement
            </button>
          </div>
        </div>
      )}

      <main className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
        {/* Session Management */}
        <div className="lg:col-span-2">
          <SessionManager 
            currentSession={getCurrentSession()}
            onLoadSession={handleLoadSession}
            onSaveSession={handleSaveSession}
            onNewSession={handleNewSession}
          />
        </div>
        
        {/* Left: Inputs */}
        <section className="space-y-3">
          <div className="space-y-1">
            <div className="input-label">Hebrew (source)</div>
            <textarea
              dir="rtl"
              className="w-full h-48 bg-panel border border-neutral-800 rounded p-2"
              value={hebrew}
              onChange={(e) => setHebrew(e.target.value)}
              placeholder="הדבק כאן טקסט בעברית…"
            ></textarea>
            <div className="text-xs text-muted mt-1">
              {hebrew.length} characters, {hebrew.trim().split(/\s+/).length} words
            </div>
          </div>
          <div className="space-y-1">
            <div className="input-label">Rough English</div>
            <textarea
              className="w-full h-48 bg-panel border border-neutral-800 rounded p-2"
              value={roughEnglish}
              onChange={(e) => setRoughEnglish(e.target.value)}
              placeholder="Paste the rough English here…"
            ></textarea>
            <div className="text-xs text-muted mt-1">
              {roughEnglish.length} characters, {roughEnglish.trim().split(/\s+/).length} words
            </div>
          </div>
          <GlossaryUpload onGlossaryChange={setGlossary} />
        </section>

        {/* Right: Outputs */}
        <section className="bg-panel border border-neutral-800 rounded min-h-[24rem] h-full">
          <OutputTabs
            tabs={[
              { 
                value: "edited", 
                label: "Edited Text", 
                content: (
                  <div className="relative">
                    <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
                      <label className="flex items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          checked={showHighlights}
                          onChange={(e) => setShowHighlights(e.target.checked)}
                          className="rounded"
                        />
                        Highlights
                      </label>
                      {editedText && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(editedText);
                            addToast({
                              type: "success",
                              description: "Copied to clipboard!"
                            });
                          }}
                          className="px-2 py-1 rounded bg-neutral-700 hover:bg-neutral-600 text-xs"
                        >
                          Copy
                        </button>
                      )}
                    </div>
                    <div className="p-4 pt-12">
                      {showHighlights ? (
                        <HighlightedText 
                          text={editedText} 
                          enabledHighlights={enabledHighlights}
                          showTooltips={true}
                        />
                      ) : (
                        <pre className="whitespace-pre-wrap">{editedText}</pre>
                      )}
                    </div>
                  </div>
                )
              },
              { 
                value: "notes", 
                label: "Notes", 
                content: (
                  <div className="relative p-4">
                    <div className="text-sm whitespace-pre-wrap">{notes}</div>
                    {notes && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(notes);
                          addToast({
                            type: "success",
                            description: "Copied to clipboard!"
                          });
                        }}
                        className="absolute top-2 right-2 px-2 py-1 rounded bg-neutral-700 hover:bg-neutral-600 text-xs"
                      >
                        Copy
                      </button>
                    )}
                  </div>
                )
              },
              { value: "readability", label: "Readability", content: <ReadabilityPane text={editedText} onHighlightToggle={setEnabledHighlights} onTextChange={setEditedText} /> },
              { value: "diff", label: "Diff", content: <DiffView original={roughEnglish} edited={editedText} /> }
            ]}
          />
        </section>
      </main>
    </div>
  );
}
