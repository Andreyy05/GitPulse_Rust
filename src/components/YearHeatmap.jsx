import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

export function YearHeatmap({ yearWeeks = [], totalContributions = 0 }) {
  const [hoveredDay, setHoveredDay] = useState(null);
  const scrollRef = useRef(null);

  const scrollToRight = useCallback((behavior = 'auto') => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: scrollRef.current.scrollWidth,
        behavior,
      });
    }
  }, []);

  const scrollToLeft = useCallback((behavior = 'smooth') => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: 0,
        behavior,
      });
    }
  }, []);

  // When component mounts or yearWeeks changes, immediately position at current activity (today on the right)
  useLayoutEffect(() => {
    scrollToRight('auto');
  }, [yearWeeks, scrollToRight]);

  // Delayed safeguard for webview layout render
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToRight('auto');
    }, 60);
    return () => clearTimeout(timer);
  }, [scrollToRight]);

  // Allow horizontal scrolling with normal mouse wheel over the heatmap
  const handleWheel = (e) => {
    if (scrollRef.current && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  if (!yearWeeks || yearWeeks.length === 0) {
    return null;
  }

  return (
    <div className="pt-3 border-t border-zinc-200/60 dark:border-white/[0.06] flex flex-col space-y-2.5">
      {/* Header with Title, Counter and Navigation */}
      <div className="flex items-center justify-between text-xs sm:text-sm font-medium">
        <div className="flex items-center space-x-1.5 text-zinc-700 dark:text-zinc-300">
          <CalendarDays size={13} className="text-zinc-500 dark:text-zinc-400 shrink-0" />
          <span>Full-Year Activity</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            {hoveredDay ? (
              <span className="text-zinc-900 dark:text-zinc-200 font-semibold">
                {hoveredDay.date}: {hoveredDay.count} {hoveredDay.count === 1 ? 'contribution' : 'contributions'}
              </span>
            ) : (
              <span>{totalContributions} contributions</span>
            )}
          </span>

          {/* Quick Scroll Navigation Controls */}
          <div className="flex items-center space-x-0.5 bg-zinc-200/60 dark:bg-white/[0.04] p-0.5 rounded-md border border-zinc-200/50 dark:border-white/[0.05]">
            <button
              onClick={() => scrollToLeft('smooth')}
              title="Scroll to beginning of year"
              className="p-1 rounded text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-white/[0.06] transition-colors"
            >
              <ChevronLeft size={11} />
            </button>
            <button
              onClick={() => scrollToRight('smooth')}
              title="Jump to current week (Today)"
              className="px-1.5 py-0.5 rounded text-[10px] font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-white/[0.06] transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => scrollToRight('smooth')}
              title="Scroll to latest activity"
              className="p-1 rounded text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-white/[0.06] transition-colors"
            >
              <ChevronRight size={11} />
            </button>
          </div>
        </div>
      </div>

      {/* 52-Week Matrix Scroll Container (Anchored to today on right) */}
      <div
        ref={scrollRef}
        onWheel={handleWheel}
        className="w-full overflow-x-auto custom-scrollbar pb-1.5 pt-0.5"
      >
        <div className="inline-flex flex-col min-w-max select-none">
          {/* Months Header Row */}
          <div className="flex text-[9px] text-zinc-400 dark:text-zinc-500 font-mono mb-1 h-3.5">
            {/* Sticky spacer matching day labels width */}
            <div className="w-5 shrink-0 sticky left-0 z-10 bg-white/95 dark:bg-zinc-900/95" />
            {yearWeeks.map((week, idx) => (
              <div key={idx} className="w-[11px] sm:w-[12px] mr-[2px] text-left shrink-0">
                {week.monthLabel ? (
                  <span className="relative -left-0.5 truncate block">{week.monthLabel}</span>
                ) : null}
              </div>
            ))}
          </div>

          {/* Grid with Day of Week labels on left */}
          <div className="flex items-start">
            {/* Day Labels (Mon, Wed, Fri) - Sticky on left */}
            <div className="w-5 sticky left-0 z-10 bg-white/95 dark:bg-zinc-900/95 flex flex-col justify-between text-[8px] sm:text-[9px] text-zinc-400 dark:text-zinc-500 font-mono pr-1.5 h-[89px] sm:h-[96px] py-[2px] shrink-0">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
            </div>

            {/* Weeks Columns */}
            <div className="flex gap-[2px]">
              {yearWeeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-[2px]">
                  {week.days.map((day) => {
                    if (day.isFuture) {
                      return (
                        <div
                          key={day.date}
                          className="w-[11px] h-[11px] sm:w-[12px] sm:h-[12px] rounded-[2px] opacity-0 pointer-events-none"
                        />
                      );
                    }

                    let colorClass = 'bg-zinc-200/80 border border-zinc-300/40 dark:bg-white/[0.04] dark:border-white/[0.03]';
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
                        title={`${day.date}: ${day.count} ${day.count === 1 ? 'contribution' : 'contributions'}`}
                        className={`w-[11px] h-[11px] sm:w-[12px] sm:h-[12px] rounded-[2px] transition-transform hover:scale-125 cursor-pointer ${colorClass} ${
                          day.isToday ? 'ring-1.5 ring-emerald-500 dark:ring-white border-white' : ''
                        }`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap Legend & Scroll Hint */}
      <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 pt-0.5">
        <span className="hidden sm:inline">52 weeks ago</span>
        <span className="sm:hidden text-zinc-400 dark:text-zinc-500">← Scroll for past months</span>
        <div className="flex items-center space-x-1">
          <span>Less</span>
          <span title="0 contributions" className="w-2.5 h-2.5 rounded-[2px] bg-zinc-200/80 border border-zinc-300/40 dark:bg-white/[0.04] dark:border-white/[0.03] inline-block" />
          <span title="1–2 contributions" className="w-2.5 h-2.5 rounded-[2px] bg-emerald-200 border border-emerald-300/80 dark:bg-emerald-950/70 dark:border-emerald-900/60 inline-block" />
          <span title="3–5 contributions" className="w-2.5 h-2.5 rounded-[2px] bg-emerald-400 border border-emerald-500/80 dark:bg-emerald-700/70 dark:border-emerald-600/60 inline-block" />
          <span title="6+ contributions" className="w-2.5 h-2.5 rounded-[2px] bg-emerald-600 border border-emerald-700 dark:bg-emerald-500 dark:border-emerald-400 inline-block" />
          <span>More</span>
        </div>
        <span className="text-zinc-800 dark:text-zinc-300 font-medium">Today</span>
      </div>
    </div>
  );
}
