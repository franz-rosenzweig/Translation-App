"use client";
import ModelSelector from "./ModelSelector";

type Props = {
  model: string;
  setModel: (m: string) => void;
  onRun: () => void;
  onClear: () => void;
  onOpenPromptDrawer?: () => void;
  onOpenSessionManager?: () => void;
  onOpenGuidelinesUploader?: () => void;
  pending?: boolean;
};

export default function RunBar({ model, setModel, onRun, onClear, onOpenPromptDrawer, onOpenSessionManager, onOpenGuidelinesUploader, pending }: Props) {
  return (
    <div className="flex items-center justify-between gap-4 p-3 border-b border-neutral-800 bg-panel sticky top-0 z-10">
      <h1 className="font-semibold">Type3 Translation‑Editing</h1>
      <div className="flex items-center gap-3">
        <ModelSelector value={model} onChange={setModel} />
        <button
          className="px-3 py-1.5 rounded bg-neutral-700 hover:bg-neutral-600 text-sm"
          onClick={onOpenSessionManager}
        >
          Sessions
        </button>
        <button
          className="px-3 py-1.5 rounded bg-neutral-700 hover:bg-neutral-600 text-sm"
          onClick={onOpenGuidelinesUploader}
        >
          Translation Guidelines
        </button>
        <button
          className="px-3 py-1.5 rounded bg-neutral-700 hover:bg-neutral-600 text-sm"
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
        <button className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-sm" onClick={onClear}>
          Clear
        </button>
      </div>
    </div>
  );
}
