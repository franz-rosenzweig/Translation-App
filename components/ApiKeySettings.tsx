"use client";

import { useState, useEffect } from "react";
import { X, Key, Save, AlertCircle, CheckCircle } from "lucide-react";

interface ApiKeySettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onApiKeyChange?: (hasKey: boolean) => void;
}

export default function ApiKeySettings({ isOpen, onClose, onApiKeyChange }: ApiKeySettingsProps) {
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadApiKey();
    }
  }, [isOpen]);

  const loadApiKey = async () => {
    console.log('Loading API key...'); // Debug log
    setIsLoading(true);
    try {
      if (window.electronAPI) {
        console.log('window.electronAPI available'); // Debug log
        const savedKey = await window.electronAPI.getApiKey();
        console.log('Saved key:', savedKey ? 'exists' : 'none'); // Debug log
        setApiKey(savedKey || "");
        onApiKeyChange?.(!!savedKey);
      } else {
        console.log('window.electronAPI not available'); // Debug log
      }
    } catch (error) {
      console.error("Failed to load API key:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveApiKey = async () => {
    console.log('Save API Key clicked'); // Debug log
    if (!apiKey.trim()) {
      setErrorMessage("Please enter an API key");
      return;
    }

    if (!apiKey.startsWith('sk-')) {
      setErrorMessage("OpenAI API keys should start with 'sk-'");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    
    try {
      if (window.electronAPI) {
        console.log('Calling window.electronAPI.saveApiKey'); // Debug log
        await window.electronAPI.saveApiKey(apiKey.trim());
        onApiKeyChange?.(true);
        setTestResult('success');
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        console.log('window.electronAPI not available'); // Debug log
      }
    } catch (error) {
      console.error("Failed to save API key:", error);
      setErrorMessage("Failed to save API key");
    } finally {
      setIsLoading(false);
    }
  };

  const testApiKey = async () => {
    console.log('Test API Key clicked'); // Debug log
    if (!apiKey.trim()) {
      setErrorMessage("Please enter an API key first");
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    setErrorMessage("");

    try {
      if (window.electronAPI) {
        console.log('Calling window.electronAPI.testApiKey'); // Debug log
        const isValid = await window.electronAPI.testApiKey(apiKey.trim());
        setTestResult(isValid ? 'success' : 'error');
        if (!isValid) {
          setErrorMessage("Invalid API key or no access to OpenAI API");
        }
      } else {
        console.log('window.electronAPI not available'); // Debug log
      }
    } catch (error) {
      console.error("Failed to test API key:", error);
      setTestResult('error');
      setErrorMessage("Failed to test API key");
    } finally {
      setIsTesting(false);
    }
  };

  const removeApiKey = async () => {
    setIsLoading(true);
    try {
      if (window.electronAPI) {
        await window.electronAPI.removeApiKey();
        setApiKey("");
        onApiKeyChange?.(false);
        setTestResult(null);
      }
    } catch (error) {
      console.error("Failed to remove API key:", error);
      setErrorMessage("Failed to remove API key");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              OpenAI API Key Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setTestResult(null);
                setErrorMessage("");
              }}
              placeholder="sk-..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="h-4 w-4" />
              {errorMessage}
            </div>
          )}

          {testResult === 'success' && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
              <CheckCircle className="h-4 w-4" />
              API key is valid!
            </div>
          )}

          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>Your API key is stored securely on your device and never shared.</p>
            <p className="mt-1">
              Get your API key from{" "}
              <a 
                href="https://platform.openai.com/api-keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                OpenAI Platform
              </a>
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 p-6 pt-0">
          <div className="flex gap-2">
            <button
              onClick={() => {
                console.log('Test button clicked!'); // Debug
                testApiKey();
              }}
              disabled={isTesting || isLoading}
              className="flex-1 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 
                         hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 
                         dark:hover:bg-blue-900/30 rounded-md disabled:opacity-50"
            >
              {isTesting ? "Testing..." : "Test Key"}
            </button>
            <button
              onClick={() => {
                console.log('Save button clicked!'); // Debug
                saveApiKey();
              }}
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 
                         hover:bg-blue-700 rounded-md disabled:opacity-50 flex items-center 
                         justify-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isLoading ? "Saving..." : "Save"}
            </button>
          </div>
          
          {apiKey && (
            <button
              onClick={removeApiKey}
              disabled={isLoading}
              className="w-full px-4 py-2 text-sm font-medium text-red-600 bg-red-50 
                         hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 
                         dark:hover:bg-red-900/30 rounded-md disabled:opacity-50"
            >
              Remove API Key
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
