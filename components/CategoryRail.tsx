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
      <div className="p-4 space-y-1">
        {/* All Claims */}
        <button
          onClick={() => onSelectCategory(null)}
          className={`w-full px-4 py-3 rounded-lg text-left transition-all ${
            selectedCategoryId === null
              ? 'bg-[var(--bg-active)] text-[var(--text-on-dark)]'
              : 'text-[var(--text-sidebar)] hover:bg-[var(--bg-hover)]'
          }`}
          style={selectedCategoryId === null ? { 
            borderLeft: '2px solid var(--highlight-blue)',
            paddingLeft: '14px'
          } : {}}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">All Claims</span>
            <span className="text-xs" style={{ opacity: 0.4 }}>
              {Object.values(claimCounts).reduce((sum, c) => sum + c.total, 0)}
            </span>
          </div>
        </button>

        {/* Divider */}
        <div className="h-px bg-[var(--border-subtle)] my-3" />

        {/* Categories */}
        {categories.map((category) => {
          const counts = claimCounts[category.id] || { total: 0, disputed: 0 };
          const isActive = selectedCategoryId === category.id;
          return (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={`w-full px-4 py-3 rounded-lg text-left transition-all ${
                isActive
                  ? 'bg-[var(--bg-active)] text-[var(--text-on-dark)]'
                  : 'text-[var(--text-sidebar)] hover:bg-[var(--bg-hover)]'
              }`}
              style={isActive ? { 
                borderLeft: '2px solid var(--highlight-blue)',
                paddingLeft: '14px'
              } : {}}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{category.label}</span>
                <div className="flex items-center gap-2">
                  {counts.disputed > 0 && (
                    <span 
                      style={{ 
                        width: '4px', 
                        height: '4px', 
                        borderRadius: '50%', 
                        backgroundColor: 'var(--highlight-red)',
                        display: 'inline-block'
                      }} 
                    />
                  )}
                  <span className="text-xs" style={{ opacity: 0.4 }}>
                    {counts.total}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

