'use client';

import { useState, useEffect } from 'react';
import { Claim, EvidenceChunk } from '@/lib/types';

interface ClaimDrawerProps {
  claim: Claim | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (claimId: string) => void;
  onStatusChange: (claimId: string, status: Claim['status']) => void;
  onViewHistory: (claimId: string) => void;
}

export default function ClaimDrawer({
  claim,
  isOpen,
  onClose,
  onEdit,
  onStatusChange,
  onViewHistory,
}: ClaimDrawerProps) {
  const [evidenceChunks, setEvidenceChunks] = useState<EvidenceChunk[]>([]);
  const [showEvidence, setShowEvidence] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingEvidence, setLoadingEvidence] = useState(false);

  useEffect(() => {
    if (isOpen && claim) {
      fetchEvidence();
    } else {
      setEvidenceChunks([]);
      setShowEvidence(false);
      setShowHistory(false);
    }
  }, [isOpen, claim]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const fetchEvidence = async () => {
    if (!claim) return;
    
    setLoadingEvidence(true);
    try {
      const res = await fetch(`/api/claims/${claim.id}/evidence`);
      const data = await res.json();
      setEvidenceChunks(data.evidence || []);
    } catch (error) {
      console.error('Failed to fetch evidence:', error);
    } finally {
      setLoadingEvidence(false);
    }
  };

  if (!isOpen || !claim) return null;

  const getStatusDot = (status: Claim['status']) => {
    const dots = {
      unreviewed: { color: '#7e858c', label: 'unreviewed' },
      accepted: { color: '#3b7c96', label: 'accepted' },
      disputed: { color: '#ce6087', label: 'disputed' },
      outdated: { color: '#7e858c', label: 'outdated' },
    };
    const dot = dots[status];
    return (
      <span className="flex items-center gap-1.5" style={{ opacity: 0.7 }}>
        <span 
          style={{ 
            width: '6px', 
            height: '6px', 
            borderRadius: '50%', 
            backgroundColor: dot.color,
            display: 'inline-block'
          }} 
        />
        <span className="text-xs" style={{ color: dot.color }}>{dot.label}</span>
      </span>
    );
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9998,
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '480px',
          maxWidth: '90vw',
          backgroundColor: 'var(--bg-main)',
          borderLeft: '1px solid var(--border-subtle)',
          zIndex: 9999,
          overflowY: 'auto',
          boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <h2 className="text-xl font-medium text-[var(--text-on-dark)]">Claim Details</h2>
            <button
              onClick={onClose}
              className="text-[var(--text-meta)] hover:text-[var(--text-on-dark)]"
              style={{ opacity: 0.6 }}
            >
              ✕
            </button>
          </div>

          {/* Status */}
          <div>{getStatusDot(claim.status)}</div>

          {/* Canonical Text */}
          <div>
            <h3 className="text-sm text-[var(--text-meta)] mb-2" style={{ opacity: 0.6 }}>
              Claim
            </h3>
            <p className="text-base text-[var(--text-on-dark)] leading-relaxed">
              {claim.canonical_text}
            </p>
          </div>

          {/* Evidence - collapsed by default */}
          <div>
            <button
              onClick={() => setShowEvidence(!showEvidence)}
              className="w-full text-left"
            >
              <div className="flex items-center justify-between py-1">
                <div className="text-xs" style={{ opacity: 0.6 }}>
                  <span>{evidenceChunks.length} source{evidenceChunks.length !== 1 ? 's' : ''}</span>
                  <span className="mx-1.5">·</span>
                  <span>{claim.confidence} confidence</span>
                  {evidenceChunks.length > 0 && (
                    <>
                      <span className="mx-1.5">·</span>
                      <span>{evidenceChunks[0]?.kind.replace('_', ' ')}</span>
                    </>
                  )}
                </div>
                <span className="text-xs" style={{ opacity: 0.4 }}>
                  {showEvidence ? '▾' : '▸'}
                </span>
              </div>
            </button>
            
            {loadingEvidence && (
              <div className="text-xs text-[var(--text-meta)] py-2" style={{ opacity: 0.5 }}>
                loading evidence...
              </div>
            )}
            
            {showEvidence && evidenceChunks.length > 0 && (
              <div className="mt-3 space-y-2 animate-slide-in">
                {evidenceChunks.map((chunk) => (
                  <div
                    key={chunk.id}
                    className="p-3 bg-[var(--bg-secondary)] rounded border border-[var(--border)]"
                    style={{ opacity: 0.8 }}
                  >
                    <div className="text-xs text-[var(--text-meta)] mb-1.5" style={{ opacity: 0.7 }}>
                      {chunk.kind.replace('_', ' ')}
                    </div>
                    {chunk.text && (
                      <p className="text-sm text-[var(--text-on-dark)] leading-relaxed">
                        {chunk.text}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* History - collapsed by default */}
          <div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-xs hover:underline"
              style={{ opacity: 0.5 }}
            >
              {showHistory ? 'hide history' : 'show history'}
            </button>
            
            {showHistory && (
              <div className="mt-2 p-3 bg-[var(--bg-secondary)] rounded border border-[var(--border)] animate-slide-in" style={{ opacity: 0.7 }}>
                <div className="text-xs text-[var(--text-meta)]">
                  <div>Created: {new Date(claim.created_at).toLocaleString()}</div>
                  <div className="mt-1">Updated: {new Date(claim.updated_at).toLocaleString()}</div>
                  {claim.structured && Object.keys(claim.structured).length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer hover:underline">structured data</summary>
                      <pre className="mt-2 text-xs overflow-x-auto">
                        {JSON.stringify(claim.structured, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-[var(--border-subtle)]" style={{ opacity: 0.9 }}>
            <button
              onClick={() => {
                onEdit(claim.id);
                onClose();
              }}
              className="text-xs hover:underline"
              style={{ opacity: 0.7 }}
            >
              edit
            </button>
            
            <button
              onClick={() => {
                onViewHistory(claim.id);
              }}
              className="text-xs hover:underline"
              style={{ opacity: 0.7 }}
            >
              history
            </button>
            
            {claim.status !== 'accepted' && (
              <button
                onClick={() => onStatusChange(claim.id, 'accepted')}
                className="text-xs hover:underline"
                style={{ color: 'var(--highlight-blue)', opacity: 0.8 }}
              >
                accept
              </button>
            )}
            
            {claim.status !== 'disputed' && (
              <button
                onClick={() => onStatusChange(claim.id, 'disputed')}
                className="text-xs hover:underline"
                style={{ color: 'var(--highlight-red)', opacity: 0.8 }}
              >
                dispute
              </button>
            )}
            
            {claim.status !== 'outdated' && (
              <button
                onClick={() => onStatusChange(claim.id, 'outdated')}
                className="text-xs hover:underline"
                style={{ opacity: 0.5 }}
              >
                mark outdated
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

