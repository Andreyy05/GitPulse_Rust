import React, { useState, useEffect } from 'react';
import { Bookmark, Star, GitFork, ExternalLink, Pin, Search, FolderGit2 } from 'lucide-react';
import { openUrl } from '@tauri-apps/plugin-opener';

const LANGUAGE_COLORS = {
  JavaScript: 'bg-yellow-400',
  TypeScript: 'bg-blue-500',
  Rust: 'bg-orange-600',
  Python: 'bg-blue-400',
  Go: 'bg-cyan-500',
  'C++': 'bg-pink-600',
  C: 'bg-zinc-500',
  HTML: 'bg-orange-500',
  CSS: 'bg-indigo-500',
  Shell: 'bg-emerald-500',
  Ruby: 'bg-red-500',
  Java: 'bg-amber-600',
  Kotlin: 'bg-violet-500',
  Swift: 'bg-orange-400',
};

export function RepoQuicklinks({ repositories = [], loading }) {
  const [pinnedNames, setPinnedNames] = useState(() => {
    try {
      const saved = localStorage.getItem('gitpulse_pinned_repos');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [searchQuery, setSearchQuery] = useState('');

  const togglePin = (repoName, e) => {
    e.stopPropagation();
    setPinnedNames((prev) => {
      const next = prev.includes(repoName)
        ? prev.filter((n) => n !== repoName)
        : [...prev, repoName];
      try {
        localStorage.setItem('gitpulse_pinned_repos', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleOpenRepo = async (url) => {
    if (!url) return;
    try {
      await openUrl(url);
    } catch {
      window.open(url, '_blank');
    }
  };

  if (!repositories || repositories.length === 0) {
    return null;
  }

  // Sort: pinned first, then by updated date
  const sortedRepos = [...repositories].sort((a, b) => {
    const aPinned = pinnedNames.includes(a.name);
    const bPinned = pinnedNames.includes(b.name);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  const filteredRepos = sortedRepos.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-white dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/[0.08] shadow-sm shadow-zinc-950/5 dark:shadow-none flex flex-col space-y-3.5 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm md:text-base font-medium text-zinc-800 dark:text-zinc-200 tracking-tight">
          <Bookmark size={14} className="sm:w-4 sm:h-4 text-zinc-500 dark:text-zinc-400" />
          <span>Quicklinks & Repos</span>
        </div>

        <span className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-medium">
          {repositories.length} repos
        </span>
      </div>

      {/* Mini search input if more than 4 repos */}
      {repositories.length > 4 && (
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-2.5 text-zinc-400 dark:text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter repositories…"
            className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg bg-zinc-50 dark:bg-black/20 border border-zinc-200/80 dark:border-white/[0.06] text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
          />
        </div>
      )}

      {/* Repos List */}
      <div className="space-y-2 max-h-[280px] overflow-y-auto custom-scrollbar pr-0.5">
        {filteredRepos.map((repo) => {
          const isPinned = pinnedNames.includes(repo.name);
          const langColor = LANGUAGE_COLORS[repo.language] || 'bg-zinc-400';

          return (
            <div
              key={repo.id || repo.name}
              onClick={() => handleOpenRepo(repo.url)}
              className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl border transition-all cursor-pointer group flex flex-col space-y-1.5 ${
                isPinned
                  ? 'bg-amber-500/[0.04] border-amber-500/30 dark:bg-amber-500/[0.03] dark:border-amber-500/20'
                  : 'bg-zinc-50 dark:bg-white/[0.02] border-zinc-200/70 dark:border-white/[0.06] hover:bg-zinc-100/60 dark:hover:bg-white/[0.04] hover:border-zinc-300 dark:hover:border-white/[0.1]'
              }`}
            >
              {/* Repo Title Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 sm:space-x-2 truncate pr-2">
                  <FolderGit2 size={13} className="text-zinc-400 dark:text-zinc-500 shrink-0 group-hover:text-zinc-700 dark:group-hover:text-zinc-300" />
                  <span className="text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-200 group-hover:text-black dark:group-hover:text-white truncate">
                    {repo.name}
                  </span>
                  {repo.isPrivate && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded border border-zinc-300 dark:border-white/10 text-zinc-500 dark:text-zinc-400 shrink-0">
                      Private
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  {/* Pin button */}
                  <button
                    onClick={(e) => togglePin(repo.name, e)}
                    title={isPinned ? 'Unpin repository' : 'Pin to top'}
                    className={`p-1 rounded transition-colors ${
                      isPinned
                        ? 'text-amber-500 hover:text-amber-600 bg-amber-500/10'
                        : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    <Pin size={11} className={isPinned ? 'fill-amber-500' : ''} />
                  </button>

                  <ExternalLink size={11} className="text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300" />
                </div>
              </div>

              {/* Description (if any) */}
              {repo.description && (
                <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
                  {repo.description}
                </p>
              )}

              {/* Meta row: Language, Stars, Forks */}
              <div className="flex items-center space-x-3 text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 pt-0.5">
                {repo.language && (
                  <span className="flex items-center space-x-1">
                    <span className={`w-2 h-2 rounded-full ${langColor}`} />
                    <span>{repo.language}</span>
                  </span>
                )}

                {repo.stars > 0 && (
                  <span className="flex items-center space-x-0.5">
                    <Star size={10} className="text-amber-500 fill-amber-500" />
                    <span>{repo.stars}</span>
                  </span>
                )}

                {repo.forks > 0 && (
                  <span className="flex items-center space-x-0.5">
                    <GitFork size={10} />
                    <span>{repo.forks}</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
