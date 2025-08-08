// Utility functions for managing persistent storage

export interface StoredMaterials {
  guidelines: string;
  referenceMaterial: string;
  promptSettings: any;
  timestamp: number;
}

export interface AutoSaveData {
  timestamp: number;
  hebrew: string;
  roughEnglish: string;
  editedText: string;
  model: string;
  guidelines: string;
  referenceMaterial: string;
  promptSettings: any;
  sourceLanguage: string;
  targetLanguage: string;
  useRoughEnglish: boolean;
  conversationHistory: any[];
  theme: string;
}

// Save materials to localStorage
export function saveMaterials(materials: Partial<StoredMaterials>): void {
  try {
    const existing = getMaterials();
    const updated = {
      ...existing,
      ...materials,
      timestamp: Date.now()
    };
    localStorage.setItem('translation-materials', JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save materials:', error);
  }
}

// Load materials from localStorage
export function getMaterials(): StoredMaterials {
  try {
    const stored = localStorage.getItem('translation-materials');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Check if data is less than 30 days old
      const timeDiff = Date.now() - (parsed.timestamp || 0);
      if (timeDiff < 30 * 24 * 60 * 60 * 1000) { // 30 days
        return {
          guidelines: parsed.guidelines || '',
          referenceMaterial: parsed.referenceMaterial || '',
          promptSettings: parsed.promptSettings || null,
          timestamp: parsed.timestamp || Date.now()
        };
      }
    }
  } catch (error) {
    console.error('Failed to load materials:', error);
  }
  
  return {
    guidelines: '',
    referenceMaterial: '',
    promptSettings: null,
    timestamp: Date.now()
  };
}

// Clear stored materials
export function clearMaterials(): void {
  try {
    localStorage.removeItem('translation-materials');
  } catch (error) {
    console.error('Failed to clear materials:', error);
  }
}

// Save auto-save data
export function saveAutoSave(data: AutoSaveData): void {
  try {
    localStorage.setItem('translation-autosave', JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save auto-save data:', error);
  }
}

// Load auto-save data
export function getAutoSave(): AutoSaveData | null {
  try {
    const stored = localStorage.getItem('translation-autosave');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Check if data is less than 24 hours old
      const timeDiff = Date.now() - (parsed.timestamp || 0);
      if (timeDiff < 24 * 60 * 60 * 1000) { // 24 hours
        return parsed;
      }
    }
  } catch (error) {
    console.error('Failed to load auto-save data:', error);
  }
  
  return null;
}
