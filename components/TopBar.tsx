'use client';

import { useState } from 'react';

interface TopBarProps {
  clubName: string;
  onAddSource: (type: 'paste' | 'sheet' | 'photo') => void;
  onSearch: (query: string) => void;
}

export default function TopBar({ clubName, onAddSource, onSearch }: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddMenu, setShowAddMenu] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-main)] border-b border-[var(--border-subtle)]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left: Brand */}
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-semibold tracking-tight">
            <span className="text-[var(--text-on-dark)]">claims</span>
            <span className="text-[var(--highlight-red)]">_</span>
          </h1>
          
          {/* Club selector */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
            <span className="text-sm text-[var(--text-meta)]">club:</span>
            <span className="text-sm text-[var(--text-on-dark)] font-medium">{clubName}</span>
          </div>
        </div>

        {/* Right: Search + Add */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="search claims..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 px-4 py-2 text-sm bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--highlight-blue)] transition-colors"
            />
          </form>

          {/* Add dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="button flex items-center gap-2"
            >
              <span>+</span>
              <span className="text-sm">Add</span>
            </button>

            {showAddMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg shadow-lg overflow-hidden animate-slide-in">
                <button
                  onClick={() => {
                    console.log('Paste Text button clicked in TopBar');
                    onAddSource('paste');
                    setShowAddMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-[var(--text-on-dark)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  📝 Paste Text
                </button>
                <button
                  onClick={() => {
                    onAddSource('sheet');
                    setShowAddMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-[var(--text-on-dark)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  📊 Connect Sheet
                </button>
                <button
                  onClick={() => {
                    console.log('Upload Photos button clicked in TopBar');
                    onAddSource('photo');
                    setShowAddMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-[var(--text-on-dark)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  📷 Upload Photos
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

