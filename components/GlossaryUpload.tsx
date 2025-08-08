"use client";

import { useCallback, useState } from "react";
import Papa from "papaparse";

type GlossaryEntry = {
  hebrew: string;
  chosen_english: string;
  note?: string;
};

type Props = {
  onGlossaryChange: (entries: GlossaryEntry[]) => void;
};

export default function GlossaryUpload({ onGlossaryChange }: Props) {
  const [error, setError] = useState<string>();
  
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(undefined);
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }
    
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const entries = results.data as GlossaryEntry[];
        
        // Validate required fields
        const valid = entries.every(entry => 
          typeof entry.hebrew === 'string' && 
          typeof entry.chosen_english === 'string'
        );
        
        if (!valid) {
          setError('CSV must have "hebrew" and "chosen_english" columns');
          return;
        }
        
        onGlossaryChange(entries);
      },
      error: (error) => {
        setError(error.message);
      }
    });
  }, [onGlossaryChange]);
  
  return (
    <div className="space-y-2">
      <label className="block">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Glossary</span>
          <span className="text-xs text-muted">(CSV with hebrew, chosen_english columns)</span>
        </div>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="mt-1 block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-neutral-700 file:hover:bg-neutral-600 file:text-sm"
        />
      </label>
      {error && (
        <div className="text-sm text-red-500">{error}</div>
      )}
    </div>
  );
}
