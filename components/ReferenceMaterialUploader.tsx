import { useState, useEffect } from 'react';
import { Upload, FileText, X, File } from 'lucide-react';
import * as Dialog from "@radix-ui/react-dialog";
import { saveMaterials, getMaterials } from '@/lib/storage';

interface ReferenceMaterialProps {
  onReferenceMaterialChange: (material: string) => void;
  currentReferenceMaterial?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function ReferenceMaterialUploader({ 
  onReferenceMaterialChange, 
  currentReferenceMaterial, 
  open = false, 
  onOpenChange 
}: ReferenceMaterialProps) {
  const [referenceMaterial, setReferenceMaterial] = useState(currentReferenceMaterial || '');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  // Load stored reference material on mount
  useEffect(() => {
    const storedMaterials = getMaterials();
    if (storedMaterials.referenceMaterial && !currentReferenceMaterial) {
      setReferenceMaterial(storedMaterials.referenceMaterial);
      onReferenceMaterialChange(storedMaterials.referenceMaterial);
      // Visual feedback that reference material was restored
      console.log('📚 Restored reference material from storage');
    }
  }, [currentReferenceMaterial, onReferenceMaterialChange]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    let combinedContent = referenceMaterial;
    const newFileNames: string[] = [];

    for (const file of Array.from(files)) {
      if (file.type === 'application/pdf') {
        // For PDFs, we'll add a placeholder for now
        // Future enhancement: Use pdf-parse or similar library for actual extraction
        const content = `\n\n--- Reference Material from ${file.name} ---\n[PDF content - Please copy/paste key excerpts manually for now]\n\nTo get the best results:\n1. Open the PDF\n2. Copy representative paragraphs that show the writing style you want\n3. Paste them in this editor\n\nThis preserves formatting and ensures the AI gets the exact style examples.\n`;
        combinedContent += content;
        newFileNames.push(file.name);
      } else if (file.type === 'text/plain' || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        // Handle text files
        const content = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string || '');
          reader.readAsText(file);
        });
        combinedContent += `\n\n--- Reference Material from ${file.name} ---\n${content}\n`;
        newFileNames.push(file.name);
      }
    }

    setReferenceMaterial(combinedContent);
    setUploadedFiles(prev => [...prev, ...newFileNames]);
    onReferenceMaterialChange(combinedContent);
    // Save to persistent storage
    saveMaterials({ referenceMaterial: combinedContent });
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMaterial = e.target.value;
    setReferenceMaterial(newMaterial);
    onReferenceMaterialChange(newMaterial);
    // Save to persistent storage
    saveMaterials({ referenceMaterial: newMaterial });
  };

  const loadDefaultMaterial = () => {
    const defaultMaterial = `--- Writing Style Reference Template ---

This reference material should contain examples of the writing style you want to emulate in your translations.

EXAMPLE - Alisa Cohn Style Elements:
"I've worked with hundreds of executives, and I've seen this pattern repeatedly. The most successful leaders don't just manage tasks—they lead people. Here's what that looks like in practice."

Key characteristics to note:
- Personal authority ("I've worked with hundreds...")
- Concrete evidence ("I've seen this pattern repeatedly")
- Clear transitions ("Here's what that looks like...")
- Practical focus ("in practice")

EXAMPLE - Zinsser Style Elements:
"Clutter is the disease of American writing. We are a society strangling in unnecessary words, circular constructions, pompous frills and meaningless jargon."

Key characteristics to note:
- Strong opening statements
- Clear, declarative sentences
- Specific, vivid language
- Direct, no-nonsense tone

INSTRUCTIONS:
1. Upload PDF files from authors like Alisa Cohn, William Zinsser, or other writers whose style you want to emulate
2. Copy/paste representative paragraphs that demonstrate the tone, structure, and voice you prefer
3. Include varied examples: opening paragraphs, transitions, explanations, conclusions
4. Focus on HOW they write, not just WHAT they write about

The AI will use these examples to understand and replicate the writing style in your translations.`;

    setReferenceMaterial(defaultMaterial);
    onReferenceMaterialChange(defaultMaterial);
  };

  const clearMaterial = () => {
    setReferenceMaterial('');
    setUploadedFiles([]);
    onReferenceMaterialChange('');
  };

  if (!open) {
    return null;
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[80vh] bg-panel border border-neutral-800 rounded-lg p-6 focus:outline-none overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold">Reference Material</Dialog.Title>
            <button
              onClick={() => onOpenChange?.(false)}
              className="px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              onClick={loadDefaultMaterial}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Load Template
            </button>
            <input
              type="file"
              accept=".pdf,.txt,.md"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id="reference-upload"
            />
            <label
              htmlFor="reference-upload"
              className="flex items-center gap-1 px-3 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Upload PDFs/Text
            </label>
            <button
              onClick={clearMaterial}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-red-600"
            >
              Clear All
            </button>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="mb-4 p-3 border rounded bg-blue-50 dark:bg-blue-900/20">
              <div className="text-sm font-medium mb-2">Uploaded Files:</div>
              <div className="space-y-1">
                {uploadedFiles.map((fileName, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <File className="w-4 h-4" />
                    {fileName}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">
                  Reference Material (Writing Style Examples)
                </label>
                <div className="text-xs text-muted">
                  {referenceMaterial.length}/3000 chars (first 3000 used by AI)
                </div>
              </div>
              <textarea
                value={referenceMaterial}
                onChange={handleTextChange}
                className="w-full h-96 p-3 border border-default rounded-md bg-panel text-sm"
                placeholder="Upload PDF files or paste writing style examples here. This material will help the AI understand the writing style you want to emulate..."
              />
              {referenceMaterial.length > 3000 && (
                <div className="text-xs text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 p-2 rounded mt-2">
                  ⚠️ Content exceeds 3000 characters. Only the first 3000 characters will be used as reference material.
                </div>
              )}
              {referenceMaterial.length > 0 && (
                <div className="text-xs text-green-600 bg-green-100 dark:bg-green-900/20 p-2 rounded mt-2">
                  ✅ Reference material will be used to guide writing style in translations.
                </div>
              )}
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p><strong>What to include:</strong></p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>PDF files from authors whose style you want to emulate (Alisa Cohn, Zinsser, etc.)</li>
                <li>Example paragraphs showing desired tone and voice</li>
                <li>Sentence structure patterns you prefer</li>
                <li>Specific vocabulary and phrasing to model</li>
              </ul>
              <p className="mt-3"><strong>Note:</strong> PDF parsing is currently limited. For best results, also paste key excerpts as text.</p>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
