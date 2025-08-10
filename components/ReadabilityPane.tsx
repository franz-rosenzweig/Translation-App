import { useEffect, useState } from 'react';
import { analyzeEnhancedReadability, type EnhancedReadabilityResult, type HighlightType } from '@/lib/hemingway';
import HighlightedText from '@/components/HighlightedText';

type Props = {
  text: string;
  onHighlightToggle?: (enabledHighlights: Set<HighlightType>) => void;
  onTextChange?: (newText: string) => void;
};

export default function ReadabilityPane({ text, onHighlightToggle, onTextChange }: Props) {
  const [analysis, setAnalysis] = useState<EnhancedReadabilityResult | null>(null);
  const [enabledHighlights, setEnabledHighlights] = useState<Set<HighlightType>>(
    new Set<HighlightType>(['veryHardSentence', 'hardSentence', 'weakener', 'complex', 'passive'])
  );
  const [editableText, setEditableText] = useState(text);
  const [isEditing, setIsEditing] = useState(false);
  
  // Update editable text when prop text changes
  useEffect(() => {
    setEditableText(text);
  }, [text]);
  
  // Analyze the current text (either editable or prop text)
  useEffect(() => {
    const textToAnalyze = isEditing ? editableText : text;
    if (!textToAnalyze) {
      setAnalysis(null);
      return;
    }
    
    const result = analyzeEnhancedReadability(textToAnalyze);
    setAnalysis(result);
  }, [text, editableText, isEditing]);

  const handleTextChange = (newText: string) => {
    setEditableText(newText);
    onTextChange?.(newText);
  };

  const handleToggle = (type: HighlightType) => {
    const newEnabled = new Set(enabledHighlights);
    if (newEnabled.has(type)) {
      newEnabled.delete(type);
    } else {
      newEnabled.add(type);
    }
    setEnabledHighlights(newEnabled);
    onHighlightToggle?.(newEnabled);
  };

  const toggleAll = (enabled: boolean) => {
    const newEnabled = enabled 
      ? new Set<HighlightType>(['veryHardSentence', 'hardSentence', 'weakener', 'complex', 'passive'])
      : new Set<HighlightType>();
    setEnabledHighlights(newEnabled);
    onHighlightToggle?.(newEnabled);
  };
  
  if (!analysis) {
    return <div className="p-4 text-sm text-muted">No text to analyze.</div>;
  }
  
  const { grade, stats, counts } = analysis;
  
  return (
    <div className="p-4 space-y-6">
      {/* Editable Text Analysis */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Text Analysis</h3>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-xs px-3 py-1 rounded bg-accent/20 hover:bg-accent/30 border border-default transition-colors"
          >
            {isEditing ? 'View Highlights' : 'Edit Text'}
          </button>
        </div>
        
        <div className="bg-panel border border-default rounded-lg max-h-96 overflow-y-auto">
          {isEditing ? (
            <textarea
              value={editableText}
              onChange={(e) => handleTextChange(e.target.value)}
              className="w-full h-full p-4 bg-transparent border-none resize-none focus:outline-none min-h-[300px] text-foreground"
              placeholder="Edit your text here to see live readability analysis..."
            />
          ) : (
            <div className="p-4">
              <HighlightedText 
                text={editableText} 
                enabledHighlights={enabledHighlights}
                showTooltips={true}
              />
            </div>
          )}
        </div>
      </section>

      {/* Grade Level */}
      <section>
        <h3 className="text-sm font-medium mb-2">Grade Level</h3>
        <div className="flex items-center gap-2">
          <div className="text-2xl font-bold">{grade}</div>
          <div className="text-sm text-muted">
            {grade <= 6 ? "Easy to read" :
             grade <= 8 ? "Good" :
             grade <= 10 ? "Fairly hard" :
             grade <= 12 ? "Hard" :
             "Very hard"}
          </div>
        </div>
      </section>
      
      {/* Stats */}
      <section>
        <h3 className="text-sm font-medium mb-2">Statistics</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted">Sentences</div>
            <div>{stats.sentences}</div>
          </div>
          <div>
            <div className="text-muted">Words</div>
            <div>{stats.words}</div>
          </div>
          <div>
            <div className="text-muted">Words per sentence</div>
            <div>{stats.wordsPerSentence.toFixed(1)}</div>
          </div>
          <div>
            <div className="text-muted">Characters per word</div>
            <div>{stats.charactersPerWord.toFixed(1)}</div>
          </div>
        </div>
      </section>

      {/* Enhanced Issue Counts */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Highlights</h3>
          <div className="flex gap-2">
            <button
              onClick={() => toggleAll(true)}
              className="text-xs px-2 py-1 rounded bg-accent/20 hover:bg-accent/30 border border-default transition-colors"
            >
              Show all
            </button>
            <button
              onClick={() => toggleAll(false)}
              className="text-xs px-2 py-1 rounded bg-accent/20 hover:bg-accent/30 border border-default transition-colors"
            >
              Hide all
            </button>
          </div>
        </div>
        
        <div className="space-y-2">
          {/* Very Hard Sentences */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={enabledHighlights.has('veryHardSentence')}
                onChange={() => handleToggle('veryHardSentence')}
                className="rounded"
              />
              <div className="w-3 h-3 bg-red-400 rounded"></div>
              <span className="text-sm">Very hard sentences</span>
            </div>
            <span className="text-sm font-medium">{counts.veryHardSentences}</span>
          </div>

          {/* Hard Sentences */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={enabledHighlights.has('hardSentence')}
                onChange={() => handleToggle('hardSentence')}
                className="rounded"
              />
              <div className="w-3 h-3 bg-yellow-400 rounded"></div>
              <span className="text-sm">Hard sentences</span>
            </div>
            <span className="text-sm font-medium">{counts.hardSentences}</span>
          </div>

          {/* Weakeners */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={enabledHighlights.has('weakener')}
                onChange={() => handleToggle('weakener')}
                className="rounded"
              />
              <div className="w-3 h-3 bg-blue-400 rounded"></div>
              <span className="text-sm">Weakeners</span>
            </div>
            <span className="text-sm font-medium">{counts.weakeners}</span>
          </div>

          {/* Complex Words */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={enabledHighlights.has('complex')}
                onChange={() => handleToggle('complex')}
                className="rounded"
              />
              <div className="w-3 h-3 bg-purple-400 rounded"></div>
              <span className="text-sm">Complex words</span>
            </div>
            <span className="text-sm font-medium">{counts.complexWords}</span>
          </div>

          {/* Passive Voice */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={enabledHighlights.has('passive')}
                onChange={() => handleToggle('passive')}
                className="rounded"
              />
              <div className="w-3 h-3 bg-green-400 rounded"></div>
              <span className="text-sm">Passive voice</span>
            </div>
            <span className="text-sm font-medium">{counts.passiveVoice}</span>
          </div>
        </div>
      </section>

      {/* Tips */}
      <section>
        <h3 className="text-sm font-medium mb-2">Tips</h3>
        <div className="text-xs text-muted space-y-1">
          <div>• Aim for grade 6-8 for general audiences</div>
          <div>• Break long sentences (20+ words) into shorter ones</div>
          <div>• Remove weakening words like "very" and "really"</div>
          <div>• Use simpler alternatives for complex words</div>
          <div>• Prefer active voice over passive voice</div>
        </div>
      </section>
    </div>
  );
}
