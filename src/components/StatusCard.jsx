import React, { useState, useEffect } from 'react';
import { RefreshCw, GitCommit, Clock, AlertTriangle, ExternalLink, Calendar, User, Flame, WifiOff } from 'lucide-react';
import { openUrl } from '@tauri-apps/plugin-opener';

export function StatusCard({ data, loading, error, onRefresh }) {
  const [timeLeft, setTimeLeft] = useState(getTimeUntilMidnight());
  const [hoveredDay, setHoveredDay] = useState(null);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    setAvatarError(false);
  }, [data?.avatarUrl]);

  // Real-time countdown to midnight local time
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeUntilMidnight());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  function getTimeUntilMidnight() {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const diff = Math.max(0, midnight.getTime() - now.getTime());

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const pad = (n) => String(n).padStart(2, '0');
    const totalDaySeconds = 24 * 3600;
    const secondsPassed = 24 * 3600 - Math.floor(diff / 1000);
    const progressPercent = Math.min(100, Math.max(0, (secondsPassed / totalDaySeconds) * 100));

    return {
      formatted: `${pad(hours)}h : ${pad(minutes)}m : ${pad(seconds)}s`,
      isUrgent: hours < 4,
      isCritical: hours === 0 && minutes < 30,
      progressPercent,
    };
  }

  const handleOpenProfile = async () => {
    if (data?.username) {
      const url = `https://github.com/${data.username}`;
      try {
        await openUrl(url);
      } catch {
        window.open(url, '_blank');
      }
    }
  };

  const handleOpenRepo = async (repoUrl) => {
    try {
      await openUrl(repoUrl);
    } catch {
      window.open(repoUrl, '_blank');
    }
  };

  const hasPushed = data?.hasPushedToday;
  const commitCount = data?.totalCommitsToday || 0;

  return (
    <div className="flex flex-col space-y-3.5 sm:space-y-4">
      {/* User Info Bar */}
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center space-x-2 sm:space-x-3">
          {!avatarError && data?.avatarUrl ? (
            <img
              src={data.avatarUrl}
              alt={data?.username || 'User'}
              onError={() => setAvatarError(true)}
              className="w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full border border-zinc-200/80 dark:border-white/[0.08] object-cover shrink-0"
            />
          ) : (
            <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full bg-zinc-200 dark:bg-white/[0.06] border border-zinc-300/80 dark:border-white/[0.08] flex items-center justify-center text-zinc-600 dark:text-zinc-300 shrink-0 font-medium text-[10px] sm:text-xs">
              {data?.username ? data.username.slice(0, 2).toUpperCase() : <User size={12} className="sm:w-4 sm:h-4" />}
            </div>
          )}
          <div className="flex flex-col">
            <button
              onClick={handleOpenProfile}
              className="text-xs sm:text-sm md:text-base font-medium text-zinc-800 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white flex items-center space-x-1 sm:space-x-1.5 transition-colors text-left tracking-tight"
              title="Open GitHub Profile"
            >
              <span>@{data?.username || 'user'}</span>
              <ExternalLink size={10} className="sm:w-3 sm:h-3 text-zinc-400 dark:text-zinc-500" />
            </button>
            <span className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">
              {data?.updatedAt ? `Synced ${data.updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Not synced'}
            </span>
          </div>
        </div>

        {/* Manual Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="px-2.5 py-1 sm:px-3 sm:py-1.5 md:px-3.5 md:py-2 rounded-lg sm:rounded-xl bg-white dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/[0.08] hover:bg-zinc-50 dark:hover:bg-white/[0.06] text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white shadow-xs dark:shadow-none transition-colors disabled:opacity-50 flex items-center space-x-1.5 text-xs sm:text-sm font-medium"
          title="Refresh now"
        >
          <RefreshCw size={12} className={`sm:w-3.5 sm:h-3.5 ${loading ? 'animate-spin text-zinc-400' : 'text-zinc-500 dark:text-zinc-400'}`} />
          <span className="font-normal">Sync</span>
        </button>
      </div>

      {/* Streak Badge Row */}
      {data && (data.currentStreak > 0 || data.bestStreak > 0) && (
        <div className="flex items-center justify-between px-0.5">
          {/* Current Streak */}
          <div
            className={`inline-flex items-center space-x-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold tracking-tight border ${
              data.currentStreak >= 7
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20'
                : data.currentStreak >= 1
                ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20'
                : 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-white/[0.04] dark:text-zinc-400 dark:border-white/[0.08]'
            }`}
          >
            <Flame
              size={12}
              className={`sm:w-3.5 sm:h-3.5 ${
                data.currentStreak >= 7
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : data.currentStreak >= 1
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-zinc-400 dark:text-zinc-500'
              }`}
            />
            <span>
              {data.currentStreak === 0
                ? 'No active streak'
                : data.currentStreak === 1
                ? '1-day streak'
                : `${data.currentStreak}-day streak`}
            </span>
          </div>

          {/* Best Streak */}
          {data.bestStreak > 0 && (
            <span className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 tracking-tight">
              Best: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{data.bestStreak}d</span>
            </span>
          )}
        </div>
      )}

      {/* Offline Mode Banner */}
      {data?.isOffline && (
        <div className="px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-sky-500/[0.08] border border-sky-500/20 text-sky-800 dark:text-sky-300 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <WifiOff size={13} className="sm:w-4 sm:h-4 text-sky-600 dark:text-sky-400 shrink-0" />
            <span className="font-medium text-[11px] sm:text-xs">
              Offline mode — Showing cached sync {data.updatedAt ? `(${new Date(data.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : ''}
            </span>
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="text-[11px] font-semibold underline hover:no-underline text-sky-700 dark:text-sky-300 ml-2 shrink-0 disabled:opacity-50"
          >
            Retry
          </button>
        </div>
      )}

      {/* Rate Limit Warning Banner (if API quota throttled) */}
      {data?.rateLimitWarning && (
        <div className="px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-amber-500/[0.08] border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs sm:text-sm flex items-center space-x-2">
          <AlertTriangle size={13} className="sm:w-4 sm:h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="font-medium text-[11px] sm:text-xs">{data.rateLimitWarning}</span>
        </div>
      )}

      {/* Main Status Hero Card */}
      {error ? (
        <div className="p-4 sm:p-5 rounded-xl bg-rose-500/[0.08] border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs sm:text-sm flex items-start space-x-2.5">
          <AlertTriangle size={15} className="sm:w-4 sm:h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-rose-800 dark:text-rose-200">Unable to check activity</p>
            <p className="text-[11px] sm:text-xs text-rose-600 dark:text-rose-400/90 mt-0.5">{error}</p>
          </div>
        </div>
      ) : (
        <div className="relative p-5 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl bg-white dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/[0.08] shadow-sm shadow-zinc-950/5 dark:shadow-none transition-all">
          <div className="flex items-center justify-between mb-3.5 sm:mb-4">
            {/* Status Pill */}
            <div
              className={`inline-flex items-center space-x-1.5 sm:space-x-2 px-2.5 py-1 sm:px-3.5 sm:py-1.5 md:px-4 md:py-2 rounded-full text-xs sm:text-sm font-semibold tracking-tight ${
                hasPushed
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                  : 'bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
              }`}
            >
              <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${hasPushed ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-amber-500 dark:bg-amber-400'}`} />
              <span>{hasPushed ? 'STREAK ACTIVE' : 'PENDING PUSH / STREAK AT RISK'}</span>
            </div>

            <span
              className={`text-xs sm:text-sm font-medium tracking-tight ${
                hasPushed
                  ? 'text-zinc-600 dark:text-zinc-400'
                  : 'text-amber-700 dark:text-amber-400/90'
              }`}
            >
              {hasPushed ? 'Safe today' : 'Streak at risk'}
            </span>
          </div>

          {/* Commits Big Counter */}
          <div className="flex items-baseline space-x-3 sm:space-x-4 my-3 sm:my-5">
            <span className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {commitCount}
            </span>
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm md:text-base font-medium text-zinc-900 dark:text-zinc-200 tracking-tight">
                {commitCount === 1 ? '1 commit pushed today' : `${commitCount} commits pushed today`}
              </span>
              <span className="text-[11px] sm:text-xs md:text-sm text-zinc-600 dark:text-zinc-400">
                {hasPushed
                  ? `Last push at ${data?.lastPushTime || 'today'}`
                  : 'No commits detected on public events yet'}
              </span>
            </div>
          </div>

          {/* Countdown to Midnight */}
          <div className="mt-4 sm:mt-6 pt-3.5 sm:pt-5 border-t border-zinc-200/80 dark:border-white/[0.06]">
            <div className="flex items-center justify-between text-xs sm:text-sm md:text-base mb-2 sm:mb-2.5">
              <span className="text-zinc-700 dark:text-zinc-400 flex items-center space-x-1.5 sm:space-x-2 font-medium">
                <Clock
                  size={12}
                  className={`sm:w-4 sm:h-4 ${
                    !hasPushed && timeLeft.isCritical
                      ? 'text-rose-500 animate-pulse'
                      : timeLeft.isUrgent
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                />
                <span>Time until midnight:</span>
                {!hasPushed && timeLeft.isCritical && (
                  <span className="text-[10px] sm:text-xs font-semibold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded-full animate-pulse border border-rose-500/20">
                    &lt; 30m EMERGENCY
                  </span>
                )}
              </span>
              <span
                className={`font-mono text-xs sm:text-sm md:text-base font-medium ${
                  hasPushed
                    ? 'text-zinc-800 dark:text-zinc-200'
                    : timeLeft.isCritical
                    ? 'text-rose-500 font-bold animate-pulse'
                    : timeLeft.isUrgent
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-zinc-800 dark:text-zinc-200'
                }`}
              >
                {timeLeft.formatted}
              </span>
            </div>

            {/* Time progress bar */}
            <div className="w-full bg-zinc-200 dark:bg-white/[0.06] rounded-full h-1.5 sm:h-2 md:h-2.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${
                  hasPushed
                    ? 'bg-emerald-500'
                    : timeLeft.isCritical
                    ? 'bg-rose-500 animate-pulse'
                    : timeLeft.isUrgent
                    ? 'bg-rose-500'
                    : 'bg-zinc-800 dark:bg-zinc-300'
                }`}
                style={{ width: `${timeLeft.progressPercent}%` }}
              />
            </div>
          </div>

          {/* 14-Day Mini Contribution Heatmap */}
          <div className="mt-4 sm:mt-6 pt-3.5 sm:pt-5 border-t border-zinc-200/80 dark:border-white/[0.06]">
            <div className="flex items-center justify-between text-xs sm:text-sm mb-2.5 sm:mb-3">
              <span className="text-zinc-700 dark:text-zinc-400 flex items-center space-x-1.5 sm:space-x-2 font-medium">
                <Calendar size={12} className="sm:w-4 sm:h-4 text-zinc-500 dark:text-zinc-400" />
                <span>14-Day Activity</span>
              </span>
              <span className="text-[11px] sm:text-xs md:text-sm text-zinc-600 dark:text-zinc-400 transition-colors font-medium">
                {hoveredDay ? (
                  <span className="text-zinc-900 dark:text-zinc-200">
                    {hoveredDay.date}: {hoveredDay.count} {hoveredDay.count === 1 ? 'commit' : 'commits'}
                  </span>
                ) : (
                  <span>
                    {data?.total14DaysCommits || 0} commits total
                  </span>
                )}
              </span>
            </div>

            {/* Squares Row */}
            <div className="flex items-center justify-between gap-1.5 sm:gap-2.5 md:gap-3.5 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200/60 dark:border-white/[0.04] rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 md:p-4.5">
              {data?.history14Days ? (
                data.history14Days.map((day) => {
                  let colorClass = 'bg-zinc-200 border border-zinc-300/40 dark:bg-white/[0.05] dark:border-white/[0.04]';
                  if (day.level === 1) {
                    colorClass = 'bg-emerald-200 border border-emerald-300/80 dark:bg-emerald-950/70 dark:border-emerald-900/60';
                  } else if (day.level === 2) {
                    colorClass = 'bg-emerald-400 border border-emerald-500/80 dark:bg-emerald-700/70 dark:border-emerald-600/60';
                  } else if (day.level >= 3) {
                    colorClass = 'bg-emerald-600 border border-emerald-700 dark:bg-emerald-500 dark:border-emerald-400';
                  }

                  return (
                    <div
                      key={day.date}
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                      title={`${day.date}: ${day.count} ${day.count === 1 ? 'commit' : 'commits'}`}
                      className={`flex-1 h-4 sm:h-7 md:h-9 lg:h-11 rounded-[4px] sm:rounded-lg md:rounded-xl border transition-all cursor-pointer hover:scale-105 hover:opacity-90 ${colorClass} ${
                        day.isToday ? 'border-2 border-zinc-400 dark:border-white/50 ring-2 ring-zinc-400/40 dark:ring-white/30' : ''
                      }`}
                    />
                  );
                })
              ) : (
                // Fallback placeholder skeletons while loading
                Array.from({ length: 14 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 h-4 sm:h-7 md:h-9 lg:h-11 rounded-[4px] sm:rounded-lg md:rounded-xl bg-zinc-200/60 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.04] animate-pulse"
                  />
                ))
              )}
            </div>

            {/* Legend & Labels */}
            <div className="flex items-center justify-between text-[10px] sm:text-xs text-zinc-600 dark:text-zinc-400 mt-2 sm:mt-2.5 px-0.5">
              <span>14d ago</span>
              <div className="flex items-center space-x-1 sm:space-x-1.5">
                <span>Less</span>
                <span title="0 commits" className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-[2px] sm:rounded-[3px] bg-zinc-200 border border-zinc-300/40 dark:bg-white/[0.05] dark:border-white/[0.04] inline-block" />
                <span title="1–2 commits" className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-[2px] sm:rounded-[3px] bg-emerald-200 border border-emerald-300/80 dark:bg-emerald-950/70 dark:border-emerald-900/60 inline-block" />
                <span title="3–5 commits" className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-[2px] sm:rounded-[3px] bg-emerald-400 border border-emerald-500/80 dark:bg-emerald-700/70 dark:border-emerald-600/60 inline-block" />
                <span title="6+ commits" className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-[2px] sm:rounded-[3px] bg-emerald-600 border border-emerald-700 dark:bg-emerald-500 dark:border-emerald-400 inline-block" />
                <span>More</span>
              </div>
              <span className="text-zinc-800 dark:text-zinc-300 font-medium">Today</span>
            </div>
          </div>
        </div>
      )}

      {/* Recent Pushes Today (if available) */}
      {data?.recentPushes && data.recentPushes.length > 0 && (
        <div className="px-0.5">
          <div className="flex items-center justify-between text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mb-2 sm:mb-2.5">
            <span className="flex items-center space-x-1.5 sm:space-x-2">
              <GitCommit size={12} className="sm:w-4 sm:h-4 text-zinc-500 dark:text-zinc-400" />
              <span className="font-medium text-zinc-800 dark:text-zinc-200">Today's Activity</span>
            </span>
            <span className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">{data.recentPushes.length} event(s)</span>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            {data.recentPushes.map((push) => (
              <div
                key={push.id}
                onClick={() => handleOpenRepo(push.repoUrl)}
                className="p-2.5 sm:p-3.5 rounded-lg sm:rounded-xl bg-white dark:bg-white/[0.02] border border-zinc-200/80 dark:border-white/[0.06] hover:bg-zinc-50 dark:hover:bg-white/[0.04] hover:border-zinc-300 dark:hover:border-white/[0.1] shadow-xs dark:shadow-none transition-all cursor-pointer group"
                title={`Open ${push.repo} on GitHub`}
              >
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-sans text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white truncate flex-1 max-w-[240px] sm:max-w-md md:max-w-lg pr-2">
                    {push.repo}
                  </span>
                  <span className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 shrink-0">
                    {push.time}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 truncate mt-1">
                  "{push.latestMessage}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

