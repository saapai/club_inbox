'use client';

import { useState, useEffect } from 'react';

interface GoogleFile {
  id: string;
  name: string;
  modifiedTime: string;
}

interface SheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (spreadsheetId: string, range: string, title: string) => Promise<void>;
}

export default function SheetsModal({ isOpen, onClose, onImport }: SheetsModalProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [files, setFiles] = useState<GoogleFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<GoogleFile | null>(null);
  const [range, setRange] = useState('Sheet1!A1:Z100');
  const [isImporting, setIsImporting] = useState(false);

  console.log('SheetsModal isOpen:', isOpen);

  useEffect(() => {
    if (isOpen) {
      console.log('SheetsModal opened, checking connection');
      checkConnection();
    }
  }, [isOpen]);

  const checkConnection = async () => {
    try {
      const res = await fetch('/api/sheets/list');
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
    } catch {
      setIsConnected(false);
    }
  };

  const handleConnect = () => {
    window.location.href = '/api/auth/google';
  };

  const handleImport = async () => {
    if (!selectedFile || isImporting) return;

    setIsImporting(true);
    try {
      await onImport(selectedFile.id, range, selectedFile.name);
      onClose();
    } catch (error) {
      console.error('Failed to import:', error);
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-8 z-[100] animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[var(--bg-main)] rounded-lg shadow-2xl p-8 animate-expand-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-[var(--text-on-dark)] mb-6 tracking-tight">
          connect google sheet<span className="text-[var(--highlight-red)]">_</span>
        </h2>

        {!isConnected ? (
          <div className="text-center py-8">
            <p className="text-[var(--text-meta)] mb-6">
              Connect your Google account to import spreadsheets
            </p>
            <button
              onClick={handleConnect}
              className="px-6 py-3 bg-[var(--card-bg)] text-[var(--text-on-card)] border-2 border-[var(--card-border)] hover:border-[var(--highlight-blue)] rounded-lg transition-all font-medium"
            >
              Connect Google Account
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* File selector */}
            <div>
              <label className="block text-sm text-[var(--text-meta)] mb-2">
                Select Spreadsheet
              </label>
              <div className="max-h-64 overflow-y-auto space-y-2 border border-[var(--border)] rounded-lg p-2">
                {files.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full px-4 py-3 rounded-lg text-left transition-all ${
                      selectedFile?.id === file.id
                        ? 'bg-[var(--bg-active)] border border-[var(--border-active)]'
                        : 'hover:bg-[var(--bg-hover)]'
                    }`}
                  >
                    <div className="text-sm text-[var(--text-on-dark)] font-medium">
                      {file.name}
                    </div>
                    <div className="text-xs text-[var(--text-meta)] mt-1">
                      Modified: {new Date(file.modifiedTime).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Range input */}
            {selectedFile && (
              <div>
                <label className="block text-sm text-[var(--text-meta)] mb-2">
                  Range (e.g., Sheet1!A1:Z100)
                </label>
                <input
                  type="text"
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                  className="w-full px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--highlight-blue)] transition-colors"
                />
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm text-[var(--text-on-dark)] hover:text-[var(--highlight-red)] hover:bg-[rgba(206,96,135,0.12)] rounded-lg transition-all font-mono"
          >
            cancel
          </button>
          {isConnected && (
            <button
              onClick={handleImport}
              disabled={!selectedFile || isImporting}
              className="px-6 py-2.5 text-sm font-mono bg-[var(--card-bg)] text-[var(--text-on-card)] border-2 border-[var(--card-border)] hover:border-[var(--highlight-blue)] hover:bg-[var(--card-hover)] rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isImporting ? 'importing...' : 'import sheet'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

