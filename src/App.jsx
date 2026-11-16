import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { StatusCard } from './components/StatusCard';
import { StatsCard } from './components/StatsCard';
import { RepoQuicklinks } from './components/RepoQuicklinks';
import { CommitFuel } from './components/CommitFuel';
import { SettingsModal } from './components/SettingsModal';
import { useSettings } from './hooks/useSettings';
import { fetchGitHubActivity } from './services/github';
import { sendDesktopNotification, sendDiscordWebhook } from './services/notifications';
import { playAlertChime, playEmergencyChime, playCelebrationChime } from './services/audio';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export function App() {
  const {
    username,
    refreshInterval,
    eveningAlert,
    alertTime,
    midnightAlert,
    soundAlert,
    soundVolume,
    discordWebhook,
    githubToken,
    launchAtStartup,
    theme,
    activeTab,
    setActiveTab,
    toggleTheme,
    saveSettings,
  } = useSettings();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Track if we celebrated today's streak already
  const hasCelebratedRef = useRef(false);

  const loadActivity = useCallback(
    async (isManual = false, overrideUser = null, overrideToken = null) => {
      const activeUser = overrideUser ?? username;
      const activeToken = overrideToken ?? githubToken;

      if (!activeUser || !activeUser.trim()) {
        setError('Please configure your GitHub username in Settings.');
        setData(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await fetchGitHubActivity(activeUser, activeToken);
        setData(result);

        // Update Tauri tray status
        const status = result.hasPushedToday ? 'green' : 'red';
        try {
          await invoke('update_tray_status', {
            status,
            commitsToday: result.totalCommitsToday,
            text: result.hasPushedToday ? 'Streak Safe' : 'Pending Push',
          });
        } catch (trayErr) {
          console.warn('[GitPulse] Tray update failed:', trayErr);
        }

        // Celebrate with confetti and sound chime if streak is achieved today
        if (result.hasPushedToday && !hasCelebratedRef.current) {
          hasCelebratedRef.current = true;
          if (soundAlert) {
            playCelebrationChime();
          }
          confetti({
            particleCount: 45,
            spread: 60,
            origin: { y: 0.4 },
            colors: ['#10b981', '#34d399', '#6366f1'],
          });
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch activity');
        try {
          await invoke('update_tray_status', {
            status: 'default',
            commitsToday: 0,
            text: 'Error checking GitHub',
          });
        } catch {}
      } finally {
        setLoading(false);
      }
    },
    [username, githubToken, soundAlert]
  );

  // Fetch on mount and when username changes
  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  // Periodic polling
  useEffect(() => {
    const intervalMs = refreshInterval * 60 * 1000;
    const intervalId = setInterval(() => {
      loadActivity();
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [loadActivity, refreshInterval]);

  // Auto-sync immediately when network connectivity is restored
  useEffect(() => {
    const handleOnline = () => {
      loadActivity(true);
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [loadActivity]);

  // Listen for refresh request from tray menu
  useEffect(() => {
    let unlisten = null;
    listen('tray-refresh-requested', () => {
      loadActivity(true);
    }).then((fn) => {
      unlisten = fn;
    }).catch(console.warn);

    return () => {
      if (unlisten) unlisten();
    };
  }, [loadActivity]);

  // Daily Streak Alert check based on configurable alertTime
  useEffect(() => {
    if (!eveningAlert) return;

    const checkDailyAlert = async () => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const lastAlertKey = `gitpulse_last_alert_${todayStr}`;
      const alreadyAlerted = localStorage.getItem(lastAlertKey);

      if (alreadyAlerted) return;

      const [targetH, targetM] = (alertTime || '18:00').split(':').map(Number);
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const targetMinutes = (targetH || 18) * 60 + (targetM || 0);

      if (currentMinutes >= targetMinutes && data && !data.hasPushedToday) {
        localStorage.setItem(lastAlertKey, 'true');

        if (soundAlert) {
          playAlertChime();
        }

        await sendDesktopNotification(
          '⚠️ GitPulse Streak Alert',
          `It is past ${alertTime} and you haven't pushed any commits today! Keep your GitHub streak alive before midnight.`
        );

        if (discordWebhook && discordWebhook.trim()) {
          try {
            await sendDiscordWebhook(discordWebhook, {
              username,
              commitsToday: 0,
              customMessage: `⚠️ **GitPulse Streak Alert**: It is past ${alertTime} and @${username} has not pushed any commits today! Keep your GitHub streak alive before midnight! ⏳`,
            });
          } catch (err) {
            console.error('Discord webhook alert failed:', err);
          }
        }
      }
    };

    const alertTimer = setInterval(checkDailyAlert, 60 * 1000);
    checkDailyAlert();

    return () => clearInterval(alertTimer);
  }, [data, eveningAlert, soundAlert, alertTime, username, discordWebhook]);

  // Emergency 30-Minute Midnight Streak Reminder check
  useEffect(() => {
    if (!midnightAlert) return;

    const checkMidnightAlert = async () => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const lastMidnightAlertKey = `gitpulse_last_midnight_alert_${todayStr}`;
      const alreadyAlerted = localStorage.getItem(lastMidnightAlertKey);

      if (alreadyAlerted) return;

      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const midnightThreshold = 23 * 60 + 30; // 23:30

      if (currentMinutes >= midnightThreshold && data && !data.hasPushedToday) {
        localStorage.setItem(lastMidnightAlertKey, 'true');

        if (soundAlert) {
          playEmergencyChime();
        }

        await sendDesktopNotification(
          '🚨 GitPulse Emergency Reminder',
          `Only 30 minutes until midnight! You haven't pushed any commits today. Push now to protect your streak!`
        );

        if (discordWebhook && discordWebhook.trim()) {
          try {
            await sendDiscordWebhook(discordWebhook, {
              username,
              commitsToday: 0,
              customMessage: `🚨 **GitPulse Emergency Alert**: Less than 30 minutes remaining until midnight! @${username} has not pushed any commits today. Protect your streak now! ⏳🔥`,
            });
          } catch (err) {
            console.error('Discord emergency webhook alert failed:', err);
          }
        }
      }
    };

    const midnightTimer = setInterval(checkMidnightAlert, 30 * 1000);
    checkMidnightAlert();

    return () => clearInterval(midnightTimer);
  }, [data, midnightAlert, soundAlert, username, discordWebhook]);

  const handleSaveSettings = (newSettings) => {
    const { username: newUsername, token: resolvedToken } = saveSettings(newSettings);
    hasCelebratedRef.current = false;
    loadActivity(true, newUsername, resolvedToken);
  };

  const currentStatus = data?.hasPushedToday ? 'green' : data ? 'red' : 'default';

  return (
    <div className="w-full h-screen bg-[#f4f5f7] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans select-none overflow-hidden transition-colors duration-200">
      {/* Draggable Frameless Header with Quick Theme Toggle */}
      <Header
        status={currentStatus}
        onOpenSettings={() => setIsSettingsOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area - Scrollable & Dynamically Adaptive */}
      <main className="flex-1 w-full p-3.5 sm:p-6 md:p-8 lg:p-10 overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col items-center justify-start">
        <div className="w-full max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl space-y-3.5 sm:space-y-4">
          {/* Segmented Navigation Tab Bar */}
          <div className="w-full flex items-center justify-between bg-zinc-200/70 dark:bg-white/[0.04] p-1 rounded-xl sm:rounded-2xl border border-zinc-200/60 dark:border-white/[0.06] transition-colors">
            {[
              { id: 'pulse', label: 'Pulse' },
              { id: 'stats', label: 'Stats' },
              { id: 'repos', label: 'Repos' },
              { id: 'all', label: 'All' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-1 sm:py-1.5 text-center rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium tracking-tight transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-zinc-900 shadow-xs dark:bg-white/10 dark:text-white dark:shadow-none'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Cards Display */}
          {(activeTab === 'pulse' || activeTab === 'all') && (
            <StatusCard
              data={data}
              loading={loading}
              error={error}
              onRefresh={() => loadActivity(true)}
            />
          )}

          {(activeTab === 'stats' || activeTab === 'all') && (
            <StatsCard
              stats={data?.stats}
              loading={loading}
            />
          )}

          {(activeTab === 'repos' || activeTab === 'all') && (
            <RepoQuicklinks
              repositories={data?.repositories}
              loading={loading}
            />
          )}

          {(activeTab === 'pulse' || activeTab === 'all') && (
            <CommitFuel />
          )}
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentUsername={username}
        currentPat={githubToken}
        currentGithubToken={githubToken}
        currentInterval={refreshInterval}
        currentEveningAlert={eveningAlert}
        currentAlertTime={alertTime}
        currentMidnightAlert={midnightAlert}
        currentSoundAlert={soundAlert}
        currentSoundVolume={soundVolume}
        currentDiscordWebhook={discordWebhook}
        currentLaunchAtStartup={launchAtStartup}
        currentTheme={theme}
        onSave={handleSaveSettings}
      />
    </div>
  );
}
