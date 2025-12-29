'use client';

import { useState, useEffect } from 'react';
import { ClaimHistory } from '@/lib/types';

interface HistoryModalProps {
  claimId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function HistoryModal({ claimId, isOpen, onClose }: HistoryModalProps) {
  const [history, setHistory] = useState<ClaimHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && claimId) {
      fetchHistory();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, claimId]);

  const fetchHistory = async () => {
    if (!claimId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/claims/${claimId}/history`);
      const data = await res.json();
      setHistory(data.history || []);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getActionLabel = (action: ClaimHistory['action']) => {
    const labels = {
      create: '✨ Created',
      edit: '✏️ Edited',
      recategorize: '📁 Recategorized',
      merge: '🔗 Merged',
      split: '✂️ Split',
      status_change: '🏷️ Status Changed',
    };
    return labels[action] || action;
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-8 z-[100] animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-[var(--bg-main)] rounded-lg shadow-2xl p-8 animate-expand-in max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-[var(--text-on-dark)] mb-6 tracking-tight">
          claim history<span className="text-[var(--highlight-red)]">_</span>
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <span className="text-[var(--text-meta)] animate-pulse">loading...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-meta)]">
            No history available
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border)]"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[var(--text-on-dark)]">
                    {getActionLabel(entry.action)}
                  </span>
                  <span className="text-xs text-[var(--text-meta)]">
                    {new Date(entry.created_at).toLocaleString()}
                  </span>
                </div>

                {entry.before && (
                  <div className="mb-2">
                    <div className="text-xs text-[var(--text-meta)] mb-1">Before:</div>
                    <pre className="text-xs text-[var(--text-on-dark)] bg-[var(--bg-main)] p-2 rounded overflow-x-auto">
                      {JSON.stringify(entry.before, null, 2)}
                    </pre>
                  </div>
                )}

                {entry.after && (
                  <div>
                    <div className="text-xs text-[var(--text-meta)] mb-1">After:</div>
                    <pre className="text-xs text-[var(--text-on-dark)] bg-[var(--bg-main)] p-2 rounded overflow-x-auto">
                      {JSON.stringify(entry.after, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm text-[var(--text-on-dark)] hover:text-[var(--highlight-red)] hover:bg-[rgba(206,96,135,0.12)] rounded-lg transition-all font-mono"
          >
            close
          </button>
        </div>
      </div>
    </div>
  );
}

