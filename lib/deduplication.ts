/**
 * Deduplication utilities for claims
 */

/**
 * Generate a signature for a claim for deduplication
 * Lowercase, strip punctuation, normalize numbers
 */
export function generateSignature(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s\d]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Calculate Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity ratio between two strings (0-1)
 */
export function similarityRatio(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  
  const distance = levenshteinDistance(a, b);
  return 1 - distance / maxLen;
}

/**
 * Check if two claims are similar enough to be duplicates
 */
export function areSimilarClaims(claim1: string, claim2: string, threshold = 0.85): boolean {
  const sig1 = generateSignature(claim1);
  const sig2 = generateSignature(claim2);
  
  // Exact match
  if (sig1 === sig2) return true;
  
  // Similarity check
  return similarityRatio(sig1, sig2) >= threshold;
}

