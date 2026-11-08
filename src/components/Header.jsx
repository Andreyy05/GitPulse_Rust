import React from 'react';
import { Minus, Square, X, Settings as SettingsIcon, Activity } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';

export function Header({ status = 'default', onOpenSettings }) {
  const handleMinimize = async () => {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.minimize();
    } catch (e) {
      console.warn('Failed to minimize window:', e);
    }
  };

  const handleToggleMaximize = async () => {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.toggleMaximize();
    } catch (e) {
      console.warn('Failed to toggle maximize:', e);
    }
  };

  const handleClose = async () => {
    try {
      const appWindow = getCurrentWindow();
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
      onDoubleClick={handleToggleMaximize}
      className="h-9 bg-white/80 dark:bg-zinc-950/70 backdrop-blur-md border-b border-zinc-200/80 dark:border-white/[0.06] px-3.5 flex items-center justify-between select-none z-50 shrink-0 transition-colors"
    >
      {/* Brand & Live Indicator */}
      <div className="flex items-center space-x-2" data-tauri-drag-region>
        <div className="flex items-center space-x-1.5" data-tauri-drag-region>
          <Activity size={13} className="text-zinc-600 dark:text-zinc-400" />
          <span className="text-xs font-semibold tracking-tight text-zinc-900 dark:text-zinc-200">
            GitPulse
          </span>
          <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
        </div>
      </div>

      {/* Window Controls */}
      <div className="flex items-center space-x-0.5">
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
    </header>
  );
}

