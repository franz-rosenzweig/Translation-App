import { useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';

interface GuidelinesUploaderProps {
  onGuidelinesChange: (guidelines: string) => void;
  currentGuidelines?: string;
}

export default function GuidelinesUploader({ onGuidelinesChange, currentGuidelines }: GuidelinesUploaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [guidelines, setGuidelines] = useState(currentGuidelines || '');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'text/markdown' || file.name.endsWith('.md') || file.type === 'text/plain')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setGuidelines(content);
        onGuidelinesChange(content);
      };
      reader.readAsText(file);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newGuidelines = e.target.value;
    setGuidelines(newGuidelines);
    onGuidelinesChange(newGuidelines);
  };

  const loadDefaultGuidelines = () => {
    const defaultGuidelines = `# Type 3 Editing Guidelines

## Key Principles:
1. **Preserve Meaning and Intent** - Do not add ideas not in the source
2. **Follow Original Structure** - Translate sentence by sentence in original order
3. **Natural American English Tone** - Conversational but professional
4. **Preserve Cultural Context** - Adapt where needed for target audience
5. **Keep Emotional Nuance** - Match emotional weight of original
6. **Avoid Over-Explanation** - Keep translations lean

## Style Guidelines:
- Use em-dashes (—) for parenthetical emphasis
- Break into short paragraphs for readability
- Use clean, concise, natural phrasing
- Maintain sentence-by-sentence structure
- Respect emotional tone and cultural context`;

    setGuidelines(defaultGuidelines);
    onGuidelinesChange(defaultGuidelines);
  };

  if (!isOpen) {
    return (
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <FileText className="w-4 h-4" />
          Translation Guidelines {currentGuidelines ? '✓' : ''}
        </button>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 mb-4 bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Translation Guidelines</h3>
        <div className="flex gap-2">
          <button
            onClick={loadDefaultGuidelines}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Load Default
          </button>
          <input
            type="file"
            accept=".md,.txt"
            onChange={handleFileUpload}
            className="hidden"
            id="guidelines-upload"
          />
          <label
            htmlFor="guidelines-upload"
            className="flex items-center gap-1 px-3 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Upload
          </label>
          <button
            onClick={() => setIsOpen(false)}
            className="px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Guidelines (Markdown supported)
          </label>
          <textarea
            value={guidelines}
            onChange={handleTextChange}
            className="w-full h-64 p-3 border rounded-md bg-white dark:bg-gray-800 font-mono text-sm"
            placeholder="Enter your translation guidelines here, or upload a markdown file..."
          />
        </div>
        
        <div className="text-sm text-muted-foreground">
          <p>These guidelines will be included in the AI prompt to ensure consistent translation style.</p>
          <p>You can upload a .md or .txt file, or edit the text directly.</p>
        </div>
      </div>
    </div>
  );
}
