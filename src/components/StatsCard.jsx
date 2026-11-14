import React, { useState } from 'react';
import { BarChart3, TrendingUp, Calendar, GitFork, Award, ExternalLink, Zap } from 'lucide-react';
import { openUrl } from '@tauri-apps/plugin-opener';

export function StatsCard({ stats, loading }) {
  const [activeWindow, setActiveWindow] = useState('30'); // '30' or '90'

  if (!stats) return null;

  const handleOpenRepo = async (url) => {
    if (!url) return;
    try {
      await openUrl(url);
    } catch {
      window.open(url, '_blank');
    }
  };

  const commitsCount = activeWindow === '30' ? stats.commits30Days : stats.commits90Days;
  const dailyAverage = activeWindow === '30' ? stats.dailyAverage : stats.dailyAverage90;

  return (
    <div className="p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-white dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/[0.08] shadow-sm shadow-zinc-950/5 dark:shadow-none flex flex-col space-y-4 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm md:text-base font-medium text-zinc-800 dark:text-zinc-200 tracking-tight">
          <BarChart3 size={14} className="sm:w-4 sm:h-4 text-zinc-500 dark:text-zinc-400" />
          <span>Commit Insights</span>
        </div>

        {/* 30d vs 90d Toggle */}
        <div className="flex items-center space-x-0.5 sm:space-x-1 bg-zinc-200/70 dark:bg-white/[0.04] p-1 rounded-lg sm:rounded-xl border border-zinc-200/60 dark:border-white/[0.06]">
          {[
            { id: '30', label: 'Last 30d' },
            { id: '90', label: 'Last 90d' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveWindow(t.id)}
              className={`px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-md sm:rounded-lg text-[11px] sm:text-xs tracking-tight transition-all font-medium ${
                activeWindow === t.id
                  ? 'bg-white text-zinc-900 shadow-xs dark:bg-white/10 dark:text-white dark:shadow-none'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {/* Total in Period */}
        <div className="p-3 sm:p-3.5 rounded-lg sm:rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200/70 dark:border-white/[0.04]">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-[11px] sm:text-xs mb-1 font-medium">
            <span>Total Commits</span>
            <TrendingUp size={12} className="text-emerald-500" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {commitsCount}
            </span>
            <span className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400">
              in {activeWindow}d
            </span>
          </div>
        </div>

        {/* Daily Average */}
        <div className="p-3 sm:p-3.5 rounded-lg sm:rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200/70 dark:border-white/[0.04]">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-[11px] sm:text-xs mb-1 font-medium">
            <span>Daily Average</span>
            <Zap size={12} className="text-amber-500" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {dailyAverage}
            </span>
            <span className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400">
              commits/day
            </span>
          </div>
        </div>
      </div>

      {/* Peak Day of the Week Card */}
      {stats.mostActiveDay && (
        <div className="p-3 sm:p-3.5 rounded-lg sm:rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200/70 dark:border-white/[0.04] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Award size={16} />
            </div>
            <div>
              <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-medium">Most Active Day</p>
              <p className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                {stats.mostActiveDay.name}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {stats.mostActiveDay.count} commits
            </span>
            {stats.mostActiveDay.percentage > 0 && (
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                {stats.mostActiveDay.percentage}% of weekly output
              </p>
            )}
          </div>
        </div>
      )}

      {/* Weekly Activity Distribution Bar Chart */}
      {stats.dayDistribution && stats.dayDistribution.length > 0 && (
        <div className="pt-2 border-t border-zinc-200/60 dark:border-white/[0.06]">
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mb-2 font-medium">
            <span className="flex items-center space-x-1.5">
              <Calendar size={12} />
              <span>Weekly Rhythm</span>
            </span>
            <span>Mon — Sun</span>
          </div>

          <div className="flex items-end justify-between gap-1.5 sm:gap-2 h-14 sm:h-16 pt-2 px-1">
            {stats.dayDistribution.map((d) => (
              <div key={d.name} className="flex-1 flex flex-col items-center h-full justify-end group">
                <div
                  title={`${d.fullName}: ${d.count} commits`}
                  className={`w-full rounded-t-sm sm:rounded-t transition-all group-hover:opacity-90 ${
                    d.isMax
                      ? 'bg-emerald-500 dark:bg-emerald-400'
                      : d.count > 0
                      ? 'bg-zinc-300 dark:bg-white/20'
                      : 'bg-zinc-200/70 dark:bg-white/[0.05]'
                  }`}
                  style={{
                    height: `${Math.max(12, d.percentOfMax)}%`,
                  }}
                />
                <span className="text-[9px] sm:text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                  {d.name.slice(0, 2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Most Active Repository */}
      {stats.mostActiveRepo && (
        <div className="pt-2 border-t border-zinc-200/60 dark:border-white/[0.06]">
          <div className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mb-2 font-medium flex items-center space-x-1.5">
            <GitFork size={12} />
            <span>Top Active Repo (Events)</span>
          </div>

          <div
            onClick={() => handleOpenRepo(stats.mostActiveRepo.url)}
            className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200/70 dark:border-white/[0.04] hover:border-zinc-300 dark:hover:border-white/[0.1] hover:bg-zinc-100/50 dark:hover:bg-white/[0.04] transition-all cursor-pointer flex items-center justify-between group"
            title={`Open ${stats.mostActiveRepo.name} on GitHub`}
          >
            <div className="flex items-center space-x-2 truncate max-w-[220px] sm:max-w-xs">
              <span className="text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-200 group-hover:text-black dark:group-hover:text-white truncate">
                {stats.mostActiveRepo.name}
              </span>
              <ExternalLink size={11} className="text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 shrink-0" />
            </div>

            <span className="text-[11px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
              {stats.mostActiveRepo.commits} commits ({stats.mostActiveRepo.pushes} pushes)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
