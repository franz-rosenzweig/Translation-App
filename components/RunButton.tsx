"use client";

type Props = {
  onRun: () => void;
  onClear: () => void;
  pending?: boolean;
};

export default function RunButton({ onRun, onClear, pending }: Props) {
  return (
    <div className="flex gap-3 pt-4 border-t border-default bg-panel">
      <button
        className={`flex-1 px-4 py-3 rounded-lg font-semibold text-base transition-all duration-200 shadow-md hover:shadow-lg ${
          pending 
            ? 'bg-gray-400 text-white cursor-not-allowed' 
            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
        }`}
        onClick={onRun}
        disabled={!!pending}
        title={pending ? "Running..." : "Run Translation"}
      >
        {pending ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Running...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            ▶️ Run Translation
          </span>
        )}
      </button>
      
      <button 
        className="px-4 py-3 rounded-lg bg-panel border border-default hover:bg-accent/10 text-sm transition-colors font-medium" 
        onClick={onClear}
        title="Clear All"
      >
        Clear
      </button>
    </div>
  );
}
