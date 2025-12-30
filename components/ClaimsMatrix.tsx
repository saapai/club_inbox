'use client';

import { Claim, Club, Category } from '@/lib/types';
import { CATEGORY_ORDER } from '@/lib/categories';
import { pickPrimary, summarizeClaim, buildMatrixMap, CellKey } from '@/lib/matrix';

interface ClaimsMatrixProps {
  clubs: Club[];
  categories: Category[];
  claims: (Claim & { category_key: string; sources_count: number })[];
  selectedClaim: Claim | null;
  onCellClick: (claim: Claim | null, cellKey: CellKey) => void;
  searchQuery?: string;
}

export default function ClaimsMatrix({
  clubs,
  categories,
  claims,
  selectedClaim,
  onCellClick,
  searchQuery = '',
}: ClaimsMatrixProps) {
  const matrixMap = buildMatrixMap(claims);
  
  const getCellClaims = (categoryKey: string, clubId: string): Claim[] => {
    const key = `${categoryKey}:${clubId}` as CellKey;
    return matrixMap[key] || [];
  };

  const matchesSearch = (text: string): boolean => {
    if (!searchQuery) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  return (
    <div className="w-full overflow-auto" style={{ maxHeight: 'calc(100vh - 64px)' }}>
      <div className="inline-block min-w-full">
        <table
          style={{
            borderCollapse: 'separate',
            borderSpacing: 0,
            width: '100%',
          }}
        >
          <thead>
            <tr>
              {/* Category header column (sticky) */}
              <th
                style={{
                  position: 'sticky',
                  left: 0,
                  zIndex: 20,
                  backgroundColor: 'var(--bg-secondary)',
                  borderRight: '1px solid var(--border-subtle)',
                  borderBottom: '1px solid var(--border-subtle)',
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: 500,
                  fontSize: '13px',
                  color: 'var(--text-sidebar)',
                  minWidth: '200px',
                }}
              >
                Category
              </th>
              {/* Club headers */}
              {clubs.map((club) => (
                <th
                  key={club.id}
                  style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    backgroundColor: 'var(--bg-secondary)',
                    borderBottom: '1px solid var(--border-subtle)',
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 500,
                    fontSize: '13px',
                    color: 'var(--text-sidebar)',
                    minWidth: '240px',
                  }}
                >
                  {club.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CATEGORY_ORDER.map((categoryOrder) => {
              return (
                <tr key={categoryOrder.key}>
                  {/* Category label (sticky) */}
                  <td
                    style={{
                      position: 'sticky',
                      left: 0,
                      zIndex: 10,
                      backgroundColor: 'var(--bg-main)',
                      borderRight: '1px solid var(--border-subtle)',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      padding: '12px 16px',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: 'var(--text-sidebar)',
                    }}
                  >
                    {categoryOrder.label}
                  </td>
                  {/* Cells for each club */}
                  {clubs.map((club) => {
                    const cellClaims = getCellClaims(categoryOrder.key, club.id);
                    const primary = pickPrimary(cellClaims);
                    const additionalCount = cellClaims.length > 1 ? cellClaims.length - 1 : 0;
                    const cellKey = `${categoryOrder.key}:${club.id}` as CellKey;
                    const isHighlighted = searchQuery && primary && matchesSearch(primary.canonical_text);
                    
                    return (
                      <td
                        key={club.id}
                        onClick={() => onCellClick(primary, cellKey)}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          padding: '12px 16px',
                          cursor: primary ? 'pointer' : 'default',
                          backgroundColor: isHighlighted ? 'rgba(59, 124, 150, 0.1)' : 'transparent',
                          transition: 'background-color 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          if (primary) {
                            e.currentTarget.style.backgroundColor = isHighlighted 
                              ? 'rgba(59, 124, 150, 0.15)' 
                              : 'rgba(255, 255, 255, 0.03)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isHighlighted 
                            ? 'rgba(59, 124, 150, 0.1)' 
                            : 'transparent';
                        }}
                        title={primary ? primary.canonical_text : undefined}
                      >
                        {primary ? (
                          <div className="space-y-1.5">
                            {/* Status dot */}
                            <div className="flex items-center gap-2">
                              <span
                                style={{
                                  width: '5px',
                                  height: '5px',
                                  borderRadius: '50%',
                                  backgroundColor:
                                    primary.status === 'accepted' ? '#3b7c96' :
                                    primary.status === 'disputed' ? '#ce6087' :
                                    primary.status === 'outdated' ? '#7e858c' :
                                    '#7e858c',
                                  display: 'inline-block',
                                  opacity: primary.status === 'unreviewed' ? 0.5 : 0.8,
                                }}
                              />
                              {additionalCount > 0 && (
                                <span
                                  style={{
                                    fontSize: '11px',
                                    color: 'var(--text-meta)',
                                    opacity: 0.5,
                                  }}
                                >
                                  +{additionalCount}
                                </span>
                              )}
                            </div>
                            {/* Summary text */}
                            <div
                              style={{
                                fontSize: '13px',
                                lineHeight: '1.4',
                                color: 'var(--text-on-dark)',
                                wordBreak: 'break-word',
                              }}
                            >
                              {summarizeClaim(primary)}
                            </div>
                          </div>
                        ) : (
                          <div
                            style={{
                              fontSize: '13px',
                              color: 'var(--text-meta)',
                              opacity: 0.3,
                            }}
                          >
                            —
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

