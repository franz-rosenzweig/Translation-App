"use client";

import { useState } from "react";
import ModelSelector from "./ModelSelector";
import ThemeSelector, { type Theme } from "./ThemeSelector";

type Props = {
  model: string;
  setModel: (m: string) => void;
  onOpenTranslationSettings?: () => void;
  onOpenSessionManager?: () => void;
  onOpenGuidelinesUploader?: () => void;
  onOpenReferenceMaterial?: () => void;
  onOpenApiKeySettings?: () => void;
  theme?: Theme;
  onThemeChange?: (theme: Theme) => void;
  hasApiKey?: boolean;
};

export default function Sidebar({ 
  model, 
  setModel, 
  onOpenTranslationSettings, 
  onOpenSessionManager, 
  onOpenGuidelinesUploader, 
  onOpenReferenceMaterial, 
  onOpenApiKeySettings,
  theme = 'dark', 
  onThemeChange, 
  hasApiKey 
}: Props) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  return (
    <div className={`bg-panel border-r border-default flex flex-col transition-all duration-300 ${
      isCollapsed ? 'w-12' : 'w-64'
    }`}>
      {/* Sidebar Header - with top padding for macOS window controls */}
      <div className="px-3 pt-7 pb-3 sm:pt-9 border-b border-default flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                עברית
              </div>
              <div className="absolute -right-1 -top-1 text-xs">↔</div>
              <div className="text-xs font-medium text-muted mt-0.5">English</div>
            </div>
            <div className="ml-2">
              <h1 className="font-bold text-sm">TranslNathan</h1>
              <div className="text-xs text-muted">AI Translation Editor</div>
            </div>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded hover:bg-accent/10 transition-colors flex items-center justify-center"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <div className="w-4 h-4 flex flex-col justify-center items-center gap-0.5">
            <div className="w-3 h-0.5 bg-current"></div>
            <div className="w-3 h-0.5 bg-current"></div>
            <div className="w-3 h-0.5 bg-current"></div>
          </div>
        </button>
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-y-auto">
        {!isCollapsed ? (
          <div className="p-3 space-y-3">
            {/* Model Selection */}
            <div>
              <label className="text-xs font-medium text-muted mb-2 block">Model</label>
              <ModelSelector value={model} onChange={setModel} />
            </div>

            {/* Theme Selection */}
            <div>
              <label className="text-xs font-medium text-muted mb-2 block">Theme</label>
              <ThemeSelector theme={theme} onThemeChange={onThemeChange || (() => {})} />
            </div>

            {/* API Key Settings */}
            <button
              className={`w-full text-left px-3 py-2 rounded border text-sm flex items-center gap-2 transition-colors ${
                hasApiKey 
                  ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-900/30' 
                  : 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-300 dark:hover:bg-orange-900/30'
              }`}
              onClick={onOpenApiKeySettings}
            >
              <div className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-green-500' : 'bg-orange-500'}`} />
              API Key Settings
            </button>

            {/* Navigation Buttons */}
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-muted uppercase tracking-wide">Tools</h3>
              
              <button
                className="w-full text-left px-3 py-2 rounded border border-default hover:bg-accent/10 text-sm transition-colors flex items-center gap-2"
                onClick={onOpenSessionManager}
              >
                <span>📁</span>
                Sessions
              </button>
              
              <button
                className="w-full text-left px-3 py-2 rounded border border-default hover:bg-accent/10 text-sm transition-colors flex items-center gap-2"
                onClick={onOpenGuidelinesUploader}
              >
                <span>📋</span>
                Translation Guidelines
              </button>
              
              <button
                className="w-full text-left px-3 py-2 rounded border border-default hover:bg-accent/10 text-sm transition-colors flex items-center gap-2"
                onClick={onOpenReferenceMaterial}
              >
                <span>📚</span>
                Reference Material
              </button>
              
              <button
                className="w-full text-left px-3 py-2 rounded border border-default hover:bg-accent/10 text-sm transition-colors flex items-center gap-2"
                onClick={onOpenTranslationSettings}
              >
                <span>⚙️</span>
                Translation Settings
              </button>
            </div>
          </div>
        ) : (
          // Collapsed state - just icons with top padding for macOS window controls
          <div className="px-2 pt-7 pb-2 sm:pt-9 space-y-2">
            <button
              className={`w-8 h-8 rounded flex items-center justify-center text-sm transition-colors ${
                hasApiKey ? 'text-green-500' : 'text-orange-500'
              }`}
              onClick={onOpenApiKeySettings}
              title="API Key Settings"
            >
              🔑
            </button>
            
            <button
              className="w-8 h-8 rounded hover:bg-accent/10 flex items-center justify-center text-sm transition-colors"
              onClick={onOpenSessionManager}
              title="Sessions"
            >
              📁
            </button>
            
            <button
              className="w-8 h-8 rounded hover:bg-accent/10 flex items-center justify-center text-sm transition-colors"
              onClick={onOpenGuidelinesUploader}
              title="Translation Guidelines"
            >
              📋
            </button>
            
            <button
              className="w-8 h-8 rounded hover:bg-accent/10 flex items-center justify-center text-sm transition-colors"
              onClick={onOpenReferenceMaterial}
              title="Reference Material"
            >
              📚
            </button>
            
            <button
              className="w-8 h-8 rounded hover:bg-accent/10 flex items-center justify-center text-sm transition-colors"
              onClick={onOpenTranslationSettings}
              title="Translation Settings"
            >
              ⚙️
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
