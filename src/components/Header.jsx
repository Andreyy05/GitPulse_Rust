import React, { useMemo } from 'react';
import { Minus, Square, X, Settings as SettingsIcon, Activity } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';

const appWindow = getCurrentWindow();

export function Header({ status = 'default', onOpenSettings }) {
  const isMac = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return (
      /Macintosh|Mac OS X|macOS/i.test(navigator.userAgent) ||
      (navigator.platform && navigator.platform.toUpperCase().indexOf('MAC') >= 0)
    );
  }, []);

  const handleMinimize = async () => {
    try {
      await appWindow.minimize();
    } catch (e) {
      console.warn('Failed to minimize window:', e);
    }
  };

  const handleToggleMaximize = async () => {
    try {
      await appWindow.toggleMaximize();
    } catch (e) {
      console.warn('Failed to toggle maximize:', e);
    }
  };

  const handleClose = async () => {
    try {
      // Hide to tray parity with Electron behavior
      await appWindow.hide();
    } catch (e) {
      console.warn('Failed to hide window:', e);
    }
  };

  const statusDot =
    status === 'green'
      ? 'bg-emerald-500 dark:bg-emerald-400'
      : status === 'red'
      ? 'bg-rose-500 dark:bg-rose-400'
      : 'bg-zinc-400 dark:bg-zinc-500';

  return (
    <header
      data-tauri-drag-region
      onMouseDown={(e) => {
        if (e.buttons === 1 && !e.target.closest('button, input, a, select')) {
          appWindow.startDragging();
        }
      }}
      onDoubleClick={handleToggleMaximize}
      className={`h-9 bg-white/80 dark:bg-zinc-950/70 backdrop-blur-md border-b border-zinc-200/80 dark:border-white/[0.06] ${
        isMac ? 'px-3' : 'px-3.5'
      } flex items-center justify-between select-none z-50 shrink-0 transition-colors`}
    >
      {isMac ? (
        <>
          {/* macOS Window Controls (Traffic Lights on the Left) */}
          <div className="flex items-center space-x-1.5" data-tauri-drag-region="false">
            <button
              onClick={handleClose}
              title="Close (Hide to Tray)"
              aria-label="Close"
              className="group w-3 h-3 rounded-full bg-rose-500/85 hover:bg-rose-600 dark:bg-rose-500/90 flex items-center justify-center transition-colors shadow-xs"
            >
              <X size={8} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <button
              onClick={handleMinimize}
              title="Minimize to Tray"
              aria-label="Minimize"
              className="group w-3 h-3 rounded-full bg-amber-500/85 hover:bg-amber-600 dark:bg-amber-500/90 flex items-center justify-center transition-colors shadow-xs"
            >
              <Minus size={8} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <button
              onClick={handleToggleMaximize}
              title="Maximize / Restore"
              aria-label="Maximize"
              className="group w-3 h-3 rounded-full bg-emerald-500/85 hover:bg-emerald-600 dark:bg-emerald-500/90 flex items-center justify-center transition-colors shadow-xs"
            >
              <Square size={7} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>

          {/* Brand & Live Indicator (Centered on macOS) */}
          <div className="flex items-center space-x-1.5" data-tauri-drag-region>
            <Activity size={13} className="text-zinc-600 dark:text-zinc-400" data-tauri-drag-region />
            <span className="text-xs font-semibold tracking-tight text-zinc-900 dark:text-zinc-200" data-tauri-drag-region>
              GitPulse
            </span>
            <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} data-tauri-drag-region />
          </div>

          {/* macOS Right Action (Settings) */}
          <div className="flex items-center space-x-0.5" data-tauri-drag-region="false">
            <button
              onClick={onOpenSettings}
              title="Settings"
              className="p-1 rounded text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-white/[0.06] transition-colors"
            >
              <SettingsIcon size={13} />
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Brand & Live Indicator (Left-aligned on Windows/Linux) */}
          <div className="flex items-center space-x-2" data-tauri-drag-region>
            <div className="flex items-center space-x-1.5" data-tauri-drag-region>
              <Activity size={13} className="text-zinc-600 dark:text-zinc-400" data-tauri-drag-region />
              <span className="text-xs font-semibold tracking-tight text-zinc-900 dark:text-zinc-200" data-tauri-drag-region>
                GitPulse
              </span>
              <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} data-tauri-drag-region />
            </div>
          </div>

          {/* Window Controls (Right-aligned on Windows/Linux) */}
          <div className="flex items-center space-x-0.5" data-tauri-drag-region="false">
            <button
              onClick={onOpenSettings}
              title="Settings"
              className="p-1 rounded text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-white/[0.06] transition-colors"
            >
              <SettingsIcon size={13} />
            </button>

            <button
              onClick={handleMinimize}
              title="Minimize to Tray"
              className="p-1 rounded text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-white/[0.06] transition-colors"
            >
              <Minus size={13} />
            </button>

            <button
              onClick={handleToggleMaximize}
              title="Maximize / Restore"
              className="p-1 rounded text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-white/[0.06] transition-colors"
            >
              <Square size={11} />
            </button>

            <button
              onClick={handleClose}
              title="Close (Hide to Tray)"
              className="p-1 rounded text-zinc-600 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-white/[0.06] transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        </>
      )}
    </header>
  );
}
