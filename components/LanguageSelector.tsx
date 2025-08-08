import { Globe } from 'lucide-react';

export type Language = 'hebrew' | 'english';

interface LanguageSelectorProps {
  value: Language;
  onChange: (language: Language) => void;
  className?: string;
}

export default function LanguageSelector({ value, onChange, className = '' }: LanguageSelectorProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Globe className="w-4 h-4 text-muted-foreground" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Language)}
        className="text-sm border rounded px-2 py-1 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        <option value="hebrew">עברית (Hebrew)</option>
        <option value="english">English</option>
      </select>
    </div>
  );
}
