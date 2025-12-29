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

  const getStatusBadge = (status: Claim['status']) => {
    const badges = {
      unreviewed: { label: '⏳ unreviewed', class: 'badge-unreviewed' },
      accepted: { label: '✅ accepted', class: 'badge-accepted' },
      disputed: { label: '⚠ disputed', class: 'badge-disputed' },
      outdated: { label: '💤 outdated', class: 'badge-outdated' },
    };
    const badge = badges[status];
    return <span className={`badge ${badge.class}`}>{badge.label}</span>;
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
        className="w-full p-4 text-left"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="card-title text-base font-semibold mb-1 line-clamp-2">
              {claim.canonical_text}
            </h3>
            <div className="flex items-center gap-2 text-xs text-[var(--text-meta)]">
              <span>{category.label}</span>
              <span>•</span>
              <span>{evidenceChunks.length} source{evidenceChunks.length !== 1 ? 's' : ''}</span>
              <span>•</span>
              <span>{claim.confidence} confidence</span>
              <span>•</span>
              <span>{new Date(claim.updated_at).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(claim.status)}
            <span className="text-[var(--text-meta)] text-sm">
              {isExpanded ? '▾' : '▸'}
            </span>
          </div>
        </div>
      </button>

      {/* Expanded view */}
      {isExpanded && (
        <div className="border-t border-[var(--card-border)] p-4 space-y-4 animate-slide-in">
          {/* Evidence */}
          {evidenceChunks.length > 0 && (
            <div>
              <h4 className="text-xs uppercase tracking-wider text-[var(--text-meta)] mb-2">
                Evidence
              </h4>
              <div className="space-y-2">
                {evidenceChunks.map((chunk) => (
                  <div
                    key={chunk.id}
                    className="p-3 bg-[var(--bg-main)] rounded border border-[var(--border)]"
                  >
                    <div className="text-xs text-[var(--text-meta)] mb-1">
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
            </div>
          )}

          {/* Structured data */}
          {claim.structured && Object.keys(claim.structured).length > 0 && (
            <div>
              <h4 className="text-xs uppercase tracking-wider text-[var(--text-meta)] mb-2">
                Structured Data
              </h4>
              <pre className="p-3 bg-[var(--bg-main)] rounded border border-[var(--border)] text-xs text-[var(--text-on-dark)] overflow-x-auto">
                {JSON.stringify(claim.structured, null, 2)}
              </pre>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={() => onEdit(claim.id)}
              className="px-3 py-1.5 text-xs button"
            >
              Edit
            </button>
            <button
              onClick={() => onViewHistory(claim.id)}
              className="px-3 py-1.5 text-xs button"
            >
              History
            </button>
            {claim.status !== 'accepted' && (
              <button
                onClick={() => onStatusChange(claim.id, 'accepted')}
                className="px-3 py-1.5 text-xs text-[var(--highlight-blue)] hover:bg-[rgba(59,124,150,0.16)] rounded transition-colors"
              >
                Accept
              </button>
            )}
            {claim.status !== 'disputed' && (
              <button
                onClick={() => onStatusChange(claim.id, 'disputed')}
                className="px-3 py-1.5 text-xs text-[var(--highlight-red)] hover:bg-[rgba(206,96,135,0.16)] rounded transition-colors"
              >
                Dispute
              </button>
            )}
            {claim.status !== 'outdated' && (
              <button
                onClick={() => onStatusChange(claim.id, 'outdated')}
                className="px-3 py-1.5 text-xs text-[var(--text-meta)] hover:bg-[var(--bg-hover)] rounded transition-colors"
              >
                Mark Outdated
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

