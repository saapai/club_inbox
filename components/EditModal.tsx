'use client';

import { useState, useEffect } from 'react';
import { Claim } from '@/lib/types';

interface EditModalProps {
  claim: Claim | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (claimId: string, canonicalText: string, structured: Record<string, unknown>) => Promise<void>;
}

export default function EditModal({ claim, isOpen, onClose, onSave }: EditModalProps) {
  const [canonicalText, setCanonicalText] = useState('');
  const [structuredJson, setStructuredJson] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (claim) {
      setCanonicalText(claim.canonical_text);
      setStructuredJson(JSON.stringify(claim.structured || {}, null, 2));
      setError('');
    }
  }, [claim]);

  if (!isOpen || !claim) return null;

  const handleSave = async () => {
    if (!canonicalText.trim() || isSaving) return;

    setIsSaving(true);
    setError('');

    try {
      let structured: Record<string, unknown> = {};
      if (structuredJson.trim()) {
        try {
          structured = JSON.parse(structuredJson);
        } catch {
          setError('Invalid JSON in structured data');
          setIsSaving(false);
          return;
        }
      }

      await onSave(claim.id, canonicalText, structured);
      onClose();
    } catch (error) {
      console.error('Failed to save:', error);
      setError('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-8 z-[100] animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-[var(--bg-main)] rounded-lg shadow-2xl p-8 animate-expand-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-[var(--text-on-dark)] mb-6 tracking-tight">
          edit claim<span className="text-[var(--highlight-red)]">_</span>
        </h2>

        <div className="space-y-4">
          {/* Canonical text */}
          <div>
            <label className="block text-sm text-[var(--text-meta)] mb-2">
              Canonical Text
            </label>
            <textarea
              value={canonicalText}
              onChange={(e) => setCanonicalText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={4}
              className="w-full px-4 py-3 bg-[var(--card-bg)] text-[var(--text-on-card)] rounded-lg resize-none outline-none border-2 border-[var(--card-border)] focus:border-[var(--highlight-blue)] transition-colors"
            />
          </div>

          {/* Structured data */}
          <div>
            <label className="block text-sm text-[var(--text-meta)] mb-2">
              Structured Data (JSON)
            </label>
            <textarea
              value={structuredJson}
              onChange={(e) => setStructuredJson(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={8}
              className="w-full px-4 py-3 bg-[var(--bg-secondary)] text-[var(--text-on-dark)] rounded-lg resize-none outline-none border-2 border-[var(--border)] focus:border-[var(--highlight-blue)] transition-colors font-mono text-sm"
            />
          </div>

          {error && (
            <div className="text-sm text-[var(--highlight-red)] bg-[rgba(206,96,135,0.1)] px-4 py-2 rounded">
              {error}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm text-[var(--text-on-dark)] hover:text-[var(--highlight-red)] hover:bg-[rgba(206,96,135,0.12)] rounded-lg transition-all font-mono"
          >
            cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !canonicalText.trim()}
            className="px-6 py-2.5 text-sm font-mono bg-[var(--card-bg)] text-[var(--text-on-card)] border-2 border-[var(--card-border)] hover:border-[var(--highlight-blue)] hover:bg-[var(--card-hover)] rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isSaving ? 'saving...' : 'save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

