// Global type declarations for Electron API
declare global {
  interface Window {
    electronAPI?: {
      processTranslation: (payload: any) => Promise<any>;
      openFile: () => Promise<any>;
      saveFile: (content: any) => Promise<any>;
      onMenuEvent: (callback: (event: any, data: any) => void) => void;
      getVersion: () => Promise<string>;
      getApiKey: () => Promise<string | null>;
      saveApiKey: (apiKey: string) => Promise<void>;
      testApiKey: (apiKey: string) => Promise<boolean>;
      removeApiKey: () => Promise<void>;
    };
  }
}

export {};
