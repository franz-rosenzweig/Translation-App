// Helper to detect if we're running in Electron
export const isElectron = () => {
  return typeof window !== 'undefined' && !!window.electronAPI;
};

// API function that works in both web and Electron environments
export async function processTranslationAPI(payload: any, signal?: AbortSignal) {
  if (isElectron() && window.electronAPI) {
    // Use Electron IPC
    return await window.electronAPI.processTranslation(payload);
  } else {
    // Use regular fetch for web version
    const res = await fetch("/api/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal
    });
    
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
    
    return json;
  }
}
