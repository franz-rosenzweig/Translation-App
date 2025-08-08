"use client";
import { ChevronDown, Palette } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export type Theme = 
  | 'dark' 
  | 'github-light' 
  | 'github-dark' 
  | 'solarized-light' 
  | 'solarized-dark' 
  | 'monokai' 
  | 'one-light';

type Props = {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
};

const themes: { value: Theme; label: string; category: 'light' | 'dark' }[] = [
  { value: 'github-light', label: 'GitHub Light', category: 'light' },
  { value: 'one-light', label: 'One Light', category: 'light' },
  { value: 'solarized-light', label: 'Solarized Light', category: 'light' },
  { value: 'dark', label: 'Dark', category: 'dark' },
  { value: 'github-dark', label: 'GitHub Dark', category: 'dark' },
  { value: 'solarized-dark', label: 'Solarized Dark', category: 'dark' },
  { value: 'monokai', label: 'Monokai', category: 'dark' },
];

export default function ThemeSelector({ theme, onThemeChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentTheme = themes.find(t => t.value === theme) || themes[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="px-3 py-1.5 rounded bg-panel border border-default hover:bg-accent/10 text-sm flex items-center gap-2 min-w-[140px]"
        onClick={() => setIsOpen(!isOpen)}
        title="Change theme"
      >
        <Palette className="w-4 h-4" />
        <span className="flex-1 text-left">{currentTheme.label}</span>
        <ChevronDown className="w-4 h-4" />
      </button>
      
      {isOpen && (
        <div className="absolute top-full mt-1 right-0 bg-panel border border-default rounded-md shadow-lg py-1 z-50 min-w-[160px]">
          <div className="px-3 py-1 text-xs font-medium text-muted border-b border-default">
            Light Themes
          </div>
          {themes.filter(t => t.category === 'light').map((themeOption) => (
            <button
              key={themeOption.value}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-accent/10 ${
                theme === themeOption.value ? 'bg-accent/20' : ''
              }`}
              onClick={() => {
                onThemeChange(themeOption.value);
                setIsOpen(false);
              }}
            >
              {themeOption.label}
            </button>
          ))}
          
          <div className="px-3 py-1 text-xs font-medium text-muted border-b border-t border-default mt-1">
            Dark Themes
          </div>
          {themes.filter(t => t.category === 'dark').map((themeOption) => (
            <button
              key={themeOption.value}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-accent/10 ${
                theme === themeOption.value ? 'bg-accent/20' : ''
              }`}
              onClick={() => {
                onThemeChange(themeOption.value);
                setIsOpen(false);
              }}
            >
              {themeOption.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
