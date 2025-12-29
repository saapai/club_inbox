'use client';

import { useState } from 'react';
import { Claim, Category, EvidenceChunk } from '@/lib/types';

interface ClaimCardProps {
  claim: Claim;
  category: Category;
  evidenceChunks: EvidenceChunk[];
  onEdit: (claimId: string) => void;
  onStatusChange: (claimId: string, status: Claim['status']) => void;
  onViewHistory: (claimId: string) => void;
}

export default function ClaimCard({
  claim,
  category,
  evidenceChunks,
  onEdit,
  onStatusChange,
  onViewHistory,
}: ClaimCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

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

  const getConfidenceClass = (confidence: Claim['confidence']) => {
    return `confidence-${confidence}`;
  };

  return (
    <div
      className={`bg-[var(--card-bg)] rounded-lg border border-[var(--card-border)] card shadow-[var(--card-shadow)] overflow-hidden ${getConfidenceClass(
        claim.confidence
      )}`}
    >
      {/* Collapsed view */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-5 text-left"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="card-title text-lg font-medium mb-2 line-clamp-2 leading-relaxed">
              {claim.canonical_text}
            </h3>
            <div className="flex items-center gap-2 text-xs" style={{ opacity: 0.5 }}>
              <span>{category.label}</span>
              <span>•</span>
              <span>{evidenceChunks.length} source{evidenceChunks.length !== 1 ? 's' : ''}</span>
              <span>•</span>
              <span>{claim.confidence}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getStatusDot(claim.status)}
            <span className="text-[var(--text-meta)] text-sm" style={{ opacity: 0.4 }}>
              {isExpanded ? '▾' : '▸'}
            </span>
          </div>
        </div>
      </button>

      {/* Expanded view */}
      {isExpanded && (
        <div className="border-t border-[var(--card-border)] p-5 space-y-4 animate-slide-in">
          {/* Evidence - collapsed by default */}
          {evidenceChunks.length > 0 && (
            <div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEvidence(!showEvidence);
                }}
                className="w-full text-left"
              >
                <div className="flex items-center justify-between py-1">
                  <div className="text-xs" style={{ opacity: 0.6 }}>
                    <span>{evidenceChunks.length} source{evidenceChunks.length !== 1 ? 's' : ''}</span>
                    <span className="mx-1.5">·</span>
                    <span>{claim.confidence} confidence</span>
                    <span className="mx-1.5">·</span>
                    <span>{evidenceChunks[0]?.kind.replace('_', ' ')}</span>
                  </div>
                  <span className="text-xs" style={{ opacity: 0.4 }}>
                    {showEvidence ? '▾' : '▸'}
                  </span>
                </div>
              </button>
              
              {showEvidence && (
                <div className="mt-3 space-y-2 animate-slide-in">
                  {evidenceChunks.map((chunk) => (
                    <div
                      key={chunk.id}
                      className="p-3 bg-[var(--bg-main)] rounded border border-[var(--border)]"
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
          )}

          {/* History - collapsed by default */}
          <div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowHistory(!showHistory);
              }}
              className="text-xs hover:underline"
              style={{ opacity: 0.5 }}
            >
              {showHistory ? 'hide history' : 'show history'}
            </button>
            
            {showHistory && (
              <div className="mt-2 p-3 bg-[var(--bg-main)] rounded border border-[var(--border)] animate-slide-in" style={{ opacity: 0.7 }}>
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

          {/* Actions - cleaner layout */}
          <div className="flex items-center gap-3 pt-1 border-t border-[var(--card-border)]" style={{ opacity: 0.9 }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(claim.id);
              }}
              className="text-xs hover:underline"
              style={{ opacity: 0.7 }}
            >
              edit
            </button>
            
            {claim.status !== 'accepted' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(claim.id, 'accepted');
                }}
                className="text-xs hover:underline"
                style={{ color: 'var(--highlight-blue)', opacity: 0.8 }}
              >
                accept
              </button>
            )}
            
            {claim.status !== 'disputed' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(claim.id, 'disputed');
                }}
                className="text-xs hover:underline"
                style={{ color: 'var(--highlight-red)', opacity: 0.8 }}
              >
                dispute
              </button>
            )}
            
            {claim.status !== 'outdated' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(claim.id, 'outdated');
                }}
                className="text-xs hover:underline"
                style={{ opacity: 0.5 }}
              >
                mark outdated
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

