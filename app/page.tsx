"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import OutputTabs from "@/components/OutputTabs";
import Sidebar from "@/components/Sidebar";
import SimpleHeader from "@/components/SimpleHeader";
import RunButton from "@/components/RunButton";
import ReadabilityPane from "@/components/ReadabilityPane";
import TranslationSettings from "@/components/TranslationSettings";
import DiffView from "@/components/DiffView";
import GlossaryUpload from "@/components/GlossaryUpload";
import Toasts, { useToasts } from "@/components/Toasts";
import HighlightedText from "@/components/HighlightedText";
import SessionManager, { type TranslationSession } from "@/components/SessionManager";
import GuidelinesUploader from "@/components/GuidelinesUploader";
import ReferenceMaterialUploader from "@/components/ReferenceMaterialUploader";
import LanguageSelector, { type Language } from "@/components/LanguageSelector";
import ApiKeySettings from "@/components/ApiKeySettings";
import { checkGuardrails, validateEditedText, buildReEnforcementPrompt } from "@/lib/guardrails";
import { processTranslationAPI } from "@/lib/api-client";
import type { HighlightType } from "@/lib/hemingway";
import type { Theme } from "@/components/ThemeSelector";

export default function Page() {
  const { toasts, addToast } = useToasts();
  const [hebrew, setHebrew] = useState("");
  const [roughEnglish, setRoughEnglish] = useState("");
  const [model, setModel] = useState("gpt-5-mini");
  const [pending, setPending] = useState(false);

  // Outputs
  const [editedText, setEditedText] = useState<string>("");
  const [audienceDraft, setAudienceDraft] = useState<{ text: string; rationale?: string } | null>(null);
  const [showAudienceDiff, setShowAudienceDiff] = useState(false);
  const [notes, setNotes] = useState<string>("");
  const [showTranslationSettings, setShowTranslationSettings] = useState(false);
  const [showSessionManager, setShowSessionManager] = useState(false);
  const [showGuidelinesUploader, setShowGuidelinesUploader] = useState(false);
  const [showReferenceMaterial, setShowReferenceMaterial] = useState(false);
  const [referenceMaterial, setReferenceMaterial] = useState("");
  const [theme, setTheme] = useState<Theme>('dark');
  const [showApiKeySettings, setShowApiKeySettings] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [audienceConfig, setAudienceConfig] = useState({
    prompt: "",
    audience: "General public",
    notes: ""
  });
  const [promptSettings, setPromptSettings] = useState({
    override: "",
    knobs: {
      localization: 5,
      structureStrictness: 5,
      toneStrictness: 5,
      jargonTolerance: 5
    },
    toggles: {
      preserveParagraphs: true,
      shorterSentences: false,
      plainVerbs: true
    }
  });
  const [glossary, setGlossary] = useState<Array<{ hebrew: string; chosen_english: string; note?: string }>>([]);
  const [bannedTermsViolations, setBannedTermsViolations] = useState<string[]>([]);
  const [audienceBannedTermsViolations, setAudienceBannedTermsViolations] = useState<string[]>([]);
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
    audienceVersion?: string;
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

    // Auto-save work and uploaded materials to localStorage
  useEffect(() => {
    const autoSave = {
      timestamp: Date.now(),
      hebrew,
      roughEnglish,
      editedText,
      model,
      guidelines,
      referenceMaterial,
      promptSettings,
      sourceLanguage,
      targetLanguage,
      useRoughEnglish,
      conversationHistory,
      theme
    };
    localStorage.setItem('translation-autosave', JSON.stringify(autoSave));
  }, [hebrew, roughEnglish, editedText, model, guidelines, referenceMaterial, promptSettings, sourceLanguage, targetLanguage, useRoughEnglish, conversationHistory, theme]);

  // Theme management with proper DOM updates
  useEffect(() => {
    // Load theme preference from localStorage
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme && ['dark', 'github-light', 'github-dark', 'solarized-light', 'solarized-dark', 'monokai', 'one-light'].includes(savedTheme)) {
      setTheme(savedTheme as Theme);
    }
  }, []);

  useEffect(() => {
    // Apply theme to document and save preference
    document.documentElement.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Check for API key on mount
  useEffect(() => {
    const checkApiKey = async () => {
      if (window.electronAPI) {
        try {
          const apiKey = await window.electronAPI.getApiKey();
          setHasApiKey(!!apiKey);
        } catch (error) {
          console.error('Failed to check API key:', error);
          setHasApiKey(false);
        }
      }
    };
    checkApiKey();
  }, []);

  // Load auto-saved work and materials on mount
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
          setGuidelines(parsed.guidelines || "");
          setReferenceMaterial(parsed.referenceMaterial || "");
          if (parsed.promptSettings) {
            setPromptSettings(parsed.promptSettings);
          }
          if (parsed.theme && ['dark', 'github-light', 'github-dark', 'solarized-light', 'solarized-dark', 'monokai', 'one-light'].includes(parsed.theme)) {
            setTheme(parsed.theme);
          }
          setSourceLanguage(parsed.sourceLanguage || "hebrew");
          setTargetLanguage(parsed.targetLanguage || "english");
          setUseRoughEnglish(parsed.useRoughEnglish || false);
          setConversationHistory(parsed.conversationHistory || []);
          if (parsed.hebrew || parsed.roughEnglish || parsed.editedText || parsed.guidelines || parsed.referenceMaterial) {
            addToast({ description: "Restored previous work and materials", type: "info" });
          }
        }
      } catch (error) {
        console.error('Failed to load auto-save:', error);
      }
    }
  }, []);

  const onRun = useCallback(async (isRetry = false) => {
    // Check if API key is configured (only in Electron)
    if (window.electronAPI && !hasApiKey) {
      addToast({
        type: "error",
        title: "API Key Required",
        description: "Please configure your OpenAI API key in settings before translating."
      });
      setShowApiKeySettings(true);
      return;
    }

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
      // Prepare the source text based on language selection
      const sourceText = sourceLanguage === 'hebrew' ? hebrew : (sourceLanguage === 'english' ? roughEnglish : hebrew);
      const roughText = useRoughEnglish ? roughEnglish : undefined;
      
      const json = await processTranslationAPI({ 
        hebrew: sourceLanguage === 'hebrew' ? sourceText : '', 
        roughEnglish: useRoughEnglish ? roughText : (sourceLanguage === 'english' ? sourceText : ''), 
        model, 
        ...promptSettings,
        glossary,
        isRetry,
        bannedTerms,
        guidelines,
        referenceMaterial,
        sourceLanguage,
        targetLanguage,
        conversationHistory: conversationHistory.slice(-5) // Send last 5 conversations for context
      }, ac.signal);

      const newEditedText = json.edited_text || "";
      setEditedText(newEditedText);
      
      // Don't override audience draft when doing faithful translation
      
      // Add to conversation history
      const historyEntry = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        sourceText,
        roughText,
        result: newEditedText,
        sourceLanguage,
        targetLanguage
      };
      setConversationHistory(prev => [historyEntry, ...prev.slice(0, 19)]); // Keep last 20 entries
      
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
  }, [hebrew, roughEnglish, model, promptSettings, glossary, addToast, hasApiKey]);

    const onGenerateAudience = useCallback(async () => {
    if (!hebrew.trim() && !roughEnglish.trim()) return;
    
    // Get banned terms from localStorage (same as onRun)
    const bannedTermsText = localStorage.getItem("bannedTerms") || "";
    const bannedTerms = bannedTermsText.split("\n").map(t => t.trim()).filter(Boolean);
    
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    
    setPending(true);
    setAudienceBannedTermsViolations([]);
    
    try {
      const sourceText = sourceLanguage === 'hebrew' ? hebrew : (sourceLanguage === 'english' ? roughEnglish : hebrew);
      const roughText = useRoughEnglish ? roughEnglish : undefined;
      
      const json = await processTranslationAPI({ 
        hebrew: sourceLanguage === 'hebrew' ? sourceText : '', 
        roughEnglish: useRoughEnglish ? roughText : (sourceLanguage === 'english' ? sourceText : ''), 
        model, 
        ...promptSettings,
        glossary,
        isRetry: false,
        bannedTerms,
        guidelines,
        referenceMaterial,
        sourceLanguage,
        targetLanguage,
        conversationHistory: conversationHistory.slice(-5),
        mode: "audience-only" // Only generate audience version, don't override faithful
      }, ac.signal);

      // Only set audience version, don't touch editedText
      if (json.audience_version) {
        setAudienceDraft({
          text: json.audience_version.text,
          rationale: json.audience_version.rationale
        });
        
        // Check banned terms only for audience version
        if (bannedTerms.length > 0) {
          const audienceCheck = validateEditedText(json.audience_version.text, { bannedTerms });
          if (!audienceCheck.isValid) {
            const audienceViolatedTerms = audienceCheck.violations
              .filter(v => v.type === 'bannedTerm')
              .map(v => v.term!)
              .filter(Boolean);
            setAudienceBannedTermsViolations(audienceViolatedTerms);
          } else {
            setAudienceBannedTermsViolations([]);
          }
        }
      } else {
        // Fallback: use edited_text as audience version if no specific audience_version returned
        setAudienceDraft({
          text: json.edited_text || "",
          rationale: "Generated as audience-optimized version"
        });
      }
      
    } catch (e: any) {
      console.error('Audience generation error:', e);
      if (e.name === 'AbortError' || e.message?.includes('aborted')) {
        return;
      }
      addToast({
        type: "error",
        title: "Audience Generation Error",
        description: e?.message || "Failed to generate audience version"
      });
    } finally {
      setPending(false);
    }
  }, [hebrew, roughEnglish, model, promptSettings, glossary, guidelines, referenceMaterial, sourceLanguage, targetLanguage, conversationHistory, useRoughEnglish, addToast]);

  const onClear = () => {
    abortRef.current?.abort();
    setHebrew("");
    setRoughEnglish("");
    setEditedText("");
    setAudienceDraft(null);
    setNotes("");
    setBannedTermsViolations([]);
    setAudienceBannedTermsViolations([]);
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
      // Toggle Translation Settings: Cmd/Ctrl + /
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setShowTranslationSettings(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRun]);

  return (
    <div className="h-screen flex">
      {/* Draggable title bar area for Electron - larger area for macOS window controls */}
      <div className="drag-region h-12 w-full absolute top-0 left-0 z-50 pointer-events-none" />
      
      {/* Sidebar */}
      <Sidebar 
        model={model} 
        setModel={setModel} 
        onOpenTranslationSettings={() => setShowTranslationSettings(true)}
        onOpenSessionManager={() => setShowSessionManager(true)}
        onOpenGuidelinesUploader={() => setShowGuidelinesUploader(true)}
        onOpenReferenceMaterial={() => setShowReferenceMaterial(true)}
        onOpenApiKeySettings={() => setShowApiKeySettings(true)}
        theme={theme}
        onThemeChange={setTheme}
        hasApiKey={hasApiKey}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Simple Header */}
        <SimpleHeader />
        
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <Toasts toasts={toasts} />
          
          <TranslationSettings
            open={showTranslationSettings}
            onOpenChange={setShowTranslationSettings}
            onApplyPrompt={setPromptSettings}
            audienceConfig={audienceConfig}
            onAudienceConfigChange={setAudienceConfig}
          />

          {/* Banned Terms Violation Banner */}
          {bannedTermsViolations.length > 0 && (
            <div className="bg-red-500/20 border border-red-500 rounded mx-4 mt-2 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-red-400">Banned terms detected in faithful translation:</div>
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

          {/* Audience Banned Terms Violation Banner */}
          {audienceBannedTermsViolations.length > 0 && (
            <div className="bg-orange-500/20 border border-orange-500 rounded mx-4 mt-2 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-orange-400">Banned terms detected in audience version:</div>
                  <div className="text-sm text-orange-300 mt-1">
                    {audienceBannedTermsViolations.map(term => `"${term}"`).join(", ")}
                  </div>
                </div>
                <button
                  onClick={onGenerateAudience}
                  disabled={pending}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded text-sm font-medium"
                >
                  Regenerate Audience Version
                </button>
              </div>
            </div>
          )}

          <main className="grid grid-cols-1 xl:grid-cols-2 gap-4 p-4 flex-shrink-0 min-h-screen">
        {/* Left: Inputs */}
        <section className="space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="input-label">Source Text</div>
              <LanguageSelector 
                value={sourceLanguage}
                onChange={setSourceLanguage}
              />
            </div>
            <textarea
              dir={sourceLanguage === 'hebrew' ? 'rtl' : 'ltr'}
              className="w-full h-64 bg-panel border border-neutral-800 rounded p-2"
              value={hebrew}
              onChange={(e) => setHebrew(e.target.value)}
              placeholder={sourceLanguage === 'hebrew' ? "הדבק כאן טקסט בעברית…" : "Paste English text here..."}
              maxLength={15000}
            ></textarea>
            <div className="flex items-center justify-between text-xs text-muted mt-1">
              <span>{hebrew.length}/15,000 characters, {hebrew.trim().split(/\s+/).length} words</span>
              <div className={`px-2 py-1 rounded text-xs ${hebrew.length > 12000 ? 'bg-red-100 text-red-600' : hebrew.length > 8000 ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                {((hebrew.length / 15000) * 100).toFixed(0)}% used
              </div>
            </div>
          </div>
          
          {/* Optional Rough Translation */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="use-rough"
                  checked={useRoughEnglish}
                  onChange={(e) => setUseRoughEnglish(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="use-rough" className="input-label cursor-pointer">
                  Rough Translation (Optional)
                </label>
              </div>
              {useRoughEnglish && (
                <LanguageSelector 
                  value={targetLanguage}
                  onChange={setTargetLanguage}
                />
              )}
            </div>
            {useRoughEnglish && (
              <>
                <textarea
                  dir={targetLanguage === 'hebrew' ? 'rtl' : 'ltr'}
                  className="w-full h-48 bg-panel border border-neutral-800 rounded p-2"
                  value={roughEnglish}
                  onChange={(e) => setRoughEnglish(e.target.value)}
                  placeholder={targetLanguage === 'hebrew' ? "טיוטה בעברית..." : "Rough translation here..."}
                  maxLength={15000}
                />
                <div className="flex items-center justify-between text-xs text-muted mt-1">
                  <span>{roughEnglish.length}/15,000 characters, {roughEnglish.trim().split(/\s+/).length} words</span>
                  <div className={`px-2 py-1 rounded text-xs ${roughEnglish.length > 12000 ? 'bg-red-100 text-red-600' : roughEnglish.length > 8000 ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                    {((roughEnglish.length / 15000) * 100).toFixed(0)}% used
                  </div>
                </div>
              </>
            )}
          </div>
          <GlossaryUpload onGlossaryChange={setGlossary} />
          
          {/* Run Button at bottom of source text area */}
          <RunButton 
            onRun={() => onRun()} 
            onClear={() => {
              onClear();
              setPromptSettings({
                override: "",
                knobs: {
                  localization: 1,
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
          />
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
                          className="px-2 py-1 rounded bg-accent/20 hover:bg-accent/30 border border-default text-xs transition-colors"
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
                        <div className="whitespace-pre-wrap font-serif text-base leading-relaxed">{editedText}</div>
                      )}
                      
                      {/* Generate Audience Version Button */}
                      {editedText && !pending && (
                        <div className="mt-4 pt-4 border-t border-neutral-700">
                          <button
                            onClick={onGenerateAudience}
                            className="w-full px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 rounded text-sm font-medium flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                            </svg>
                            Generate Audience Version
                          </button>
                        </div>
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
                        className="absolute top-2 right-2 px-2 py-1 rounded bg-accent/20 hover:bg-accent/30 border border-default text-xs transition-colors"
                      >
                        Copy
                      </button>
                    )}
                  </div>
                )
              },
              { value: "readability", label: "Readability", content: <ReadabilityPane text={editedText} onHighlightToggle={setEnabledHighlights} onTextChange={setEditedText} /> },
              ...(audienceDraft ? [{
                value: "audience-readability",
                label: "Audience Readability",
                content: <ReadabilityPane 
                  text={audienceDraft.text} 
                  onHighlightToggle={() => {}} // Read-only for now
                  onTextChange={(newText) => {
                    setAudienceDraft(prev => prev ? { ...prev, text: newText } : null);
                  }} 
                />
              }] : []),
              { 
                value: "history", 
                label: `History (${conversationHistory.length})`, 
                content: (
                  <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                    {conversationHistory.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        No conversation history yet
                      </div>
                    ) : (
                      conversationHistory.map((entry, index) => (
                        <div key={entry.id} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>#{conversationHistory.length - index}</span>
                            <span>{new Date(entry.timestamp).toLocaleString()}</span>
                            <span>{entry.sourceLanguage} → {entry.targetLanguage}</span>
                          </div>
                          
                          <div className="space-y-2">
                            <div>
                              <div className="text-xs font-medium mb-1">Source:</div>
                              <div className="text-sm bg-gray-100 dark:bg-gray-800 rounded p-2" dir={entry.sourceLanguage === 'hebrew' ? 'rtl' : 'ltr'}>
                                {entry.sourceText.substring(0, 200)}{entry.sourceText.length > 200 ? '...' : ''}
                              </div>
                            </div>
                            
                            {entry.roughText && (
                              <div>
                                <div className="text-xs font-medium mb-1">Rough:</div>
                                <div className="text-sm bg-gray-100 dark:bg-gray-800 rounded p-2" dir={entry.targetLanguage === 'hebrew' ? 'rtl' : 'ltr'}>
                                  {entry.roughText.substring(0, 200)}{entry.roughText.length > 200 ? '...' : ''}
                                </div>
                              </div>
                            )}
                            
                            <div>
                              <div className="text-xs font-medium mb-1">Result:</div>
                              <div className="text-sm bg-green-50 dark:bg-green-900/20 rounded p-2" dir={entry.targetLanguage === 'hebrew' ? 'rtl' : 'ltr'}>
                                {entry.result.substring(0, 200)}{entry.result.length > 200 ? '...' : ''}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setHebrew(entry.sourceLanguage === 'hebrew' ? entry.sourceText : '');
                                if (entry.roughText) {
                                  setRoughEnglish(entry.roughText);
                                  setUseRoughEnglish(true);
                                }
                                setSourceLanguage(entry.sourceLanguage);
                                setTargetLanguage(entry.targetLanguage);
                              }}
                              className="px-2 py-1 text-xs border rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                              Load Input
                            </button>
                            <button
                              onClick={() => {
                                setEditedText(entry.result);
                                if (entry.audienceVersion) {
                                  setAudienceDraft({
                                    text: entry.audienceVersion,
                                    rationale: undefined
                                  });
                                }
                              }}
                              className="px-2 py-1 text-xs border rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                              Load Result{entry.audienceVersion ? ' + Audience' : ''}
                            </button>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(entry.result);
                                addToast({ description: "Copied to clipboard!", type: "success" });
                              }}
                              className="px-2 py-1 text-xs border border-default rounded hover:bg-accent/10 transition-colors"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )
              },

              { value: "diff", label: "Diff", content: <DiffView original={roughEnglish} edited={editedText} /> }
            ]}
          />
        </section>

        {/* Audience Version Output (separate section) */}
        {audienceDraft && (
          <section className="mt-6 col-span-full">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-violet-400">Audience Version</h2>
              <button
                onClick={onGenerateAudience}
                disabled={pending}
                className="px-3 py-1 rounded bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-sm"
              >
                Regenerate
              </button>
            </div>
            <div className="min-h-[400px] bg-panel border border-neutral-800 rounded">
              <OutputTabs
                defaultValue="audience-text"
                tabs={[
                  {
                    value: "audience-text",
                    label: "Text",
                    content: (
                      <div className="relative">
                        <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
                          {audienceDraft.text && (
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(audienceDraft.text);
                                addToast({
                                  type: "success",
                                  description: "Copied to clipboard!"
                                });
                              }}
                              className="px-2 py-1 rounded bg-accent/20 hover:bg-accent/30 border border-default text-xs transition-colors"
                            >
                              Copy
                            </button>
                          )}
                        </div>
                        <div className="p-4 pt-12">
                          <div className="whitespace-pre-wrap font-serif text-base leading-relaxed">
                            {audienceDraft.text}
                          </div>
                          {audienceDraft.rationale && (
                            <div className="mt-4 pt-4 border-t border-neutral-700">
                              <div className="text-xs font-medium text-violet-400 mb-2">Rationale:</div>
                              <div className="text-sm text-neutral-300 italic">
                                {audienceDraft.rationale}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  },
                  {
                    value: "audience-readability",
                    label: "Readability",
                    content: <ReadabilityPane text={audienceDraft.text} />
                  },
                  {
                    value: "audience-diff-faithful",
                    label: "vs Faithful",
                    content: editedText ? <DiffView original={editedText} edited={audienceDraft.text} /> : <div className="p-4 text-neutral-500">No faithful version to compare</div>
                  },
                  {
                    value: "audience-diff-source",
                    label: "vs Source",
                    content: <DiffView original={roughEnglish} edited={audienceDraft.text} />
                  }
                ]}
              />
            </div>
          </section>
        )}

        {/* Spacer to ensure scrollable area at bottom */}
        <div className="h-screen"></div>
      </main>

      {/* Modal components */}
      <SessionManager 
        currentSession={getCurrentSession()}
        onLoadSession={handleLoadSession}
        onSaveSession={handleSaveSession}
        onNewSession={handleNewSession}
        open={showSessionManager}
        onOpenChange={setShowSessionManager}
      />
      
      <GuidelinesUploader 
        onGuidelinesChange={setGuidelines}
        currentGuidelines={guidelines}
        open={showGuidelinesUploader}
        onOpenChange={setShowGuidelinesUploader}
      />
      
      <ReferenceMaterialUploader 
        onReferenceMaterialChange={setReferenceMaterial}
        currentReferenceMaterial={referenceMaterial}
        open={showReferenceMaterial}
        onOpenChange={setShowReferenceMaterial}
      />

      <ApiKeySettings 
        isOpen={showApiKeySettings}
        onClose={() => setShowApiKeySettings(false)}
        onApiKeyChange={setHasApiKey}
      />
          
          {/* Spacer to ensure scrollable area at bottom */}
          <div className="h-screen"></div>
        </div>
      </div>
    </div>
  );
}
