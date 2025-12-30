import { Claim } from './types';
import { ClaimStructured } from './types';

const statusRank = { accepted: 3, unreviewed: 2, disputed: 1, outdated: 0 } as const;
const confidenceRank = { high: 3, medium: 2, low: 1 } as const;

export function pickPrimary(claims: Claim[]): Claim | null {
  if (claims.length === 0) return null;
  
  return [...claims].sort((a, b) => {
    const s = statusRank[b.status] - statusRank[a.status];
    if (s) return s;
    const c = confidenceRank[b.confidence] - confidenceRank[a.confidence];
    if (c) return c;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  })[0];
}

export function summarizeClaim(claim: Claim): string {
  const structured = claim.structured as ClaimStructured | undefined;
  const req = structured?.requirement;
  
  if (req?.quantity && req?.unit) {
    const outOf = req.out_of ? ` / ${req.out_of}` : '';
    const unit = req.unit;
    const cadence = req.cadence && req.cadence !== 'unknown' 
      ? ` / ${req.cadence.replace(/_/g, ' ')}` 
      : '';
    return `${req.quantity}${outOf} ${unit}${cadence}`.trim();
  }
  
  if (claim.canonical_text.length > 42) {
    return claim.canonical_text.slice(0, 42) + '…';
  }
  
  return claim.canonical_text;
}

export type CellKey = `${string}:${string}`;

export function buildMatrixMap(claims: Claim[]): Record<CellKey, Claim[]> {
  const grouped: Record<CellKey, Claim[]> = {};
  
  for (const claim of claims) {
    const categoryKey = (claim as any).category_key || '';
    const key = `${categoryKey}:${claim.club_id}` as CellKey;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(claim);
  }
  
  return grouped;
}
