'use client';

import { Category } from '@/lib/types';

interface CategoryRailProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  claimCounts: Record<string, { total: number; disputed: number }>;
}

export default function CategoryRail({
  categories,
  selectedCategoryId,
  onSelectCategory,
  claimCounts,
}: CategoryRailProps) {
  return (
    <div className="fixed left-0 top-16 bottom-0 w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-subtle)] overflow-y-auto z-40">
      <div className="p-4 space-y-2">
        {/* All Claims */}
        <button
          onClick={() => onSelectCategory(null)}
          className={`w-full px-4 py-3 rounded-lg text-left transition-all ${
            selectedCategoryId === null
              ? 'bg-[var(--bg-active)] text-[var(--text-on-dark)] border border-[var(--border-active)]'
              : 'text-[var(--text-sidebar)] hover:bg-[var(--bg-hover)]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">All Claims</span>
            <span className="text-xs text-[var(--text-meta)]">
              {Object.values(claimCounts).reduce((sum, c) => sum + c.total, 0)}
            </span>
          </div>
        </button>

        {/* Divider */}
        <div className="h-px bg-[var(--border-subtle)] my-4" />

        {/* Categories */}
        {categories.map((category) => {
          const counts = claimCounts[category.id] || { total: 0, disputed: 0 };
          return (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={`w-full px-4 py-3 rounded-lg text-left transition-all ${
                selectedCategoryId === category.id
                  ? 'bg-[var(--bg-active)] text-[var(--text-on-dark)] border border-[var(--border-active)]'
                  : 'text-[var(--text-sidebar)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{category.label}</span>
                <span className="text-xs text-[var(--text-meta)]">{counts.total}</span>
              </div>
              {counts.disputed > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-[var(--highlight-red)]">⚠</span>
                  <span className="text-xs text-[var(--highlight-red)]">
                    {counts.disputed} disputed
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

