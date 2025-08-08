import { ipcRenderer } from 'electron';

// Wrapper for OpenAI API calls in Electron environment
export async function processTranslation(payload: any) {
  try {
    // Send request to main process via IPC
    const result = await ipcRenderer.invoke('process-translation', payload);
    return result;
  } catch (error) {
    console.error('Translation processing error:', error);
    throw error;
  }
}

// Export for use in React components
export const electronAPI = {
  processTranslation,
};
