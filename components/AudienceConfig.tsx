"use client";

import { useState } from "react";

type AudienceConfig = {
  prompt: string;
  audience: string;
  notes: string;
};

type Props = {
  config: AudienceConfig;
  onConfigChange: (config: AudienceConfig) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function AudienceConfig({ config, onConfigChange, open, onOpenChange }: Props) {
  const [localConfig, setLocalConfig] = useState<AudienceConfig>(config);

  const handleSave = () => {
    onConfigChange(localConfig);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setLocalConfig(config); // Reset to original
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-panel border border-default rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-default">
          <h2 className="text-lg font-semibold">Audience Version Configuration</h2>
          <p className="text-sm text-muted mt-1">
            Configure how the audience version should be generated
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
          {/* Audience Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Target Audience</label>
            <input
              type="text"
              value={localConfig.audience}
              onChange={(e) => setLocalConfig({ ...localConfig, audience: e.target.value })}
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
              value={localConfig.prompt}
              onChange={(e) => setLocalConfig({ ...localConfig, prompt: e.target.value })}
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
              value={localConfig.notes}
              onChange={(e) => setLocalConfig({ ...localConfig, notes: e.target.value })}
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
                onClick={() => setLocalConfig({
                  audience: "General public",
                  prompt: "Make the language more accessible and less technical",
                  notes: "Use simpler vocabulary and shorter sentences"
                })}
                className="px-3 py-2 text-xs border border-default rounded hover:bg-accent/10 transition-colors text-left"
              >
                📰 General Public
              </button>
              <button
                onClick={() => setLocalConfig({
                  audience: "Academic audience",
                  prompt: "Maintain scholarly tone while improving clarity",
                  notes: "Keep technical terms but enhance readability"
                })}
                className="px-3 py-2 text-xs border border-default rounded hover:bg-accent/10 transition-colors text-left"
              >
                🎓 Academic
              </button>
              <button
                onClick={() => setLocalConfig({
                  audience: "Children (ages 8-12)",
                  prompt: "Simplify language for young readers",
                  notes: "Use age-appropriate vocabulary and concepts"
                })}
                className="px-3 py-2 text-xs border border-default rounded hover:bg-accent/10 transition-colors text-left"
              >
                👶 Children
              </button>
              <button
                onClick={() => setLocalConfig({
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

        {/* Footer */}
        <div className="px-6 py-4 border-t border-default flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm border border-default rounded hover:bg-accent/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded transition-colors"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}

export type { AudienceConfig };
