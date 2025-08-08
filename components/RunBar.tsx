"use client";
import ModelSelector from "./ModelSelector";
import ThemeSelector, { type Theme } from "./ThemeSelector";

type Props = {
  model: string;
  setModel: (m: string) => void;
  onRun: () => void;
  onClear: () => void;
  onOpenPromptDrawer?: () => void;
  onOpenSessionManager?: () => void;
  onOpenGuidelinesUploader?: () => void;
  onOpenReferenceMaterial?: () => void;
  onOpenApiKeySettings?: () => void;
  pending?: boolean;
  theme?: Theme;
  onThemeChange?: (theme: Theme) => void;
  hasApiKey?: boolean;
};

export default function RunBar({ model, setModel, onRun, onClear, onOpenPromptDrawer, onOpenSessionManager, onOpenGuidelinesUploader, onOpenReferenceMaterial, onOpenApiKeySettings, pending, theme = 'dark', onThemeChange, hasApiKey }: Props) {
  return (
    <div className="flex items-center justify-between gap-4 p-3 border-b border-default bg-panel sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <div className="relative">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            עברית
          </div>
          <div className="absolute -right-1 -top-1 text-xs">↔</div>
          <div className="text-xs font-medium text-muted mt-0.5">English</div>
        </div>
        <div className="ml-2">
          <h1 className="font-bold text-lg">TranslNathan</h1>
          <div className="text-xs text-muted hidden sm:block">AI Translation Editor</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <ModelSelector value={model} onChange={setModel} />
        
        {/* Theme Selector */}
        <ThemeSelector theme={theme} onThemeChange={onThemeChange || (() => {})} />
        
        {/* API Key Settings */}
        <button
          className={`px-3 py-1.5 rounded border text-sm flex items-center gap-2 ${
            hasApiKey 
              ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-900/30' 
              : 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-300 dark:hover:bg-orange-900/30'
          }`}
          onClick={onOpenApiKeySettings}
        >
          <div className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-green-500' : 'bg-orange-500'}`} />
          API Key
        </button>
        
        <button
          className="px-3 py-1.5 rounded bg-panel border border-default hover:bg-accent/10 text-sm"
          onClick={onOpenSessionManager}
        >
          Sessions
        </button>
        <button
          className="px-3 py-1.5 rounded bg-panel border border-default hover:bg-accent/10 text-sm"
          onClick={onOpenGuidelinesUploader}
        >
          Translation Guidelines
        </button>
        <button
          className="px-3 py-1.5 rounded bg-panel border border-default hover:bg-accent/10 text-sm"
          onClick={onOpenReferenceMaterial}
        >
          Reference Material
        </button>
        <button
          className="px-3 py-1.5 rounded bg-panel border border-default hover:bg-accent/10 text-sm"
          onClick={onOpenPromptDrawer}
        >
          Prompt Drawer
        </button>
        <button
          className="px-3 py-1.5 rounded bg-accent/20 hover:bg-accent/30 text-sm"
          onClick={onRun}
          disabled={!!pending}
        >
          {pending ? "Running…" : "Run"}
        </button>
        <button className="px-3 py-1.5 rounded bg-panel border border-default hover:bg-accent/10 text-sm" onClick={onClear}>
          Clear
        </button>
      </div>
    </div>
  );
}
