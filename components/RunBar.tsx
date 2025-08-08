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
  pending?: boolean;
  theme?: Theme;
  onThemeChange?: (theme: Theme) => void;
};

export default function RunBar({ model, setModel, onRun, onClear, onOpenPromptDrawer, onOpenSessionManager, onOpenGuidelinesUploader, onOpenReferenceMaterial, pending, theme = 'dark', onThemeChange }: Props) {
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
