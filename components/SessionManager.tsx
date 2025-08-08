import { useState, useEffect } from 'react';
import { Trash2, Save, FolderOpen, Clock } from 'lucide-react';
import * as Dialog from "@radix-ui/react-dialog";

export interface TranslationSession {
  id: string;
  title: string;
  hebrew: string;
  roughEnglish: string;
  editedText: string;
  model: string;
  timestamp: number;
  lastModified: number;
}

interface SessionManagerProps {
  currentSession: Partial<TranslationSession>;
  onLoadSession: (session: TranslationSession) => void;
  onSaveSession: (title: string) => void;
  onNewSession: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function SessionManager({ 
  currentSession, 
  onLoadSession, 
  onSaveSession, 
  onNewSession,
  open = false,
  onOpenChange
}: SessionManagerProps) {
  const [sessions, setSessions] = useState<TranslationSession[]>([]);
  const [saveTitle, setSaveTitle] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Load sessions from localStorage on mount
  useEffect(() => {
    const savedSessions = localStorage.getItem('translation-sessions');
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        setSessions(parsed);
      } catch (error) {
        console.error('Failed to load sessions:', error);
      }
    }
  }, []);

  // Save sessions to localStorage whenever sessions change
  useEffect(() => {
    localStorage.setItem('translation-sessions', JSON.stringify(sessions));
  }, [sessions]);

  const saveCurrentSession = (title: string) => {
    const session: TranslationSession = {
      id: Date.now().toString(),
      title: title || `Session ${new Date().toLocaleDateString()}`,
      hebrew: currentSession.hebrew || '',
      roughEnglish: currentSession.roughEnglish || '',
      editedText: currentSession.editedText || '',
      model: currentSession.model || 'gpt-4',
      timestamp: Date.now(),
      lastModified: Date.now()
    };

    setSessions(prev => [session, ...prev]);
    onSaveSession(session.title);
    setShowSaveDialog(false);
    setSaveTitle('');
  };

  const deleteSession = (id: string) => {
    setSessions(prev => prev.filter(session => session.id !== id));
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (!open) {
    return null;
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[80vh] bg-panel border border-neutral-800 rounded-lg p-6 focus:outline-none overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold">Translation Sessions</Dialog.Title>
            <button
              className="px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              onClick={() => onOpenChange?.(false)}
            >
              ✕
            </button>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              className="flex items-center gap-1 px-3 py-2 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
              onClick={() => setShowSaveDialog(true)}
              disabled={!currentSession.hebrew && !currentSession.roughEnglish}
            >
              <Save className="w-4 h-4" />
              Save Current
            </button>
            <button
              className="px-3 py-2 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={onNewSession}
            >
              New Session
            </button>
          </div>

          {showSaveDialog && (
            <div className="mb-4 p-3 border rounded bg-white dark:bg-gray-800">
              <div className="flex gap-2">
                <input
                  className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Session title..."
                  value={saveTitle}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSaveTitle(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && saveCurrentSession(saveTitle)}
                />
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={() => saveCurrentSession(saveTitle)}
                >
                  Save
                </button>
                <button 
                  className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => {
                    setShowSaveDialog(false);
                    setSaveTitle('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sessions.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                No saved sessions yet
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 border rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{session.title}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(session.lastModified)}
                      <span className="text-xs">({formatDate(session.timestamp)})</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {session.hebrew ? `Hebrew: ${session.hebrew.substring(0, 50)}...` : 'No Hebrew text'}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-2">
                    <button
                      className="px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                      onClick={() => {
                        onLoadSession(session);
                        onOpenChange?.(false);
                      }}
                    >
                      Load
                    </button>
                    <button
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                      onClick={() => deleteSession(session.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
