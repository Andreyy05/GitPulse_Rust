import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { StatusCard } from './components/StatusCard';
import { CommitFuel } from './components/CommitFuel';
import { SettingsModal } from './components/SettingsModal';
import { fetchGitHubActivity } from './services/github';
import { sendDesktopNotification, sendDiscordWebhook } from './services/notifications';
import { playAlertChime, playEmergencyChime, playCelebrationChime } from './services/audio';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { isEnabled as isAutostartEnabled, enable as enableAutostart, disable as disableAutostart } from '@tauri-apps/plugin-autostart';

export function App() {
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('gitpulse_username') || 'Andreyy05';
  });

  const [refreshInterval, setRefreshInterval] = useState(() => {
    const saved = localStorage.getItem('gitpulse_interval');
    return saved ? Number(saved) : 15;
  });

  const [eveningAlert, setEveningAlert] = useState(() => {
    return localStorage.getItem('gitpulse_evening_alert') !== 'false';
  });

  const [alertTime, setAlertTime] = useState(() => {
    return localStorage.getItem('gitpulse_alert_time') || '18:00';
  });

  const [midnightAlert, setMidnightAlert] = useState(() => {
    return localStorage.getItem('gitpulse_midnight_alert') !== 'false';
  });

  const [soundAlert, setSoundAlert] = useState(() => {
    return localStorage.getItem('gitpulse_sound_alert') !== 'false';
  });

  const [soundVolume, setSoundVolumeState] = useState(() => {
    const saved = localStorage.getItem('gitpulse_sound_volume');
    return saved !== null ? Number(saved) : 0.8;
  });

  const [discordWebhook, setDiscordWebhook] = useState(() => {
    return localStorage.getItem('gitpulse_discord_webhook') || '';
  });

  const [githubToken, setGithubToken] = useState(() => {
    return localStorage.getItem('gitpulse_pat') || localStorage.getItem('gitpulse_github_token') || '';
  });

  const [launchAtStartup, setLaunchAtStartup] = useState(() => {
    return localStorage.getItem('gitpulse_launch_at_startup') === 'true';
  });

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('gitpulse_theme') || 'dark';
  });

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
    [username, githubToken]
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

      // Parse target time
      const [targetH, targetM] = (alertTime || '18:00').split(':').map(Number);
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const targetMinutes = (targetH || 18) * 60 + (targetM || 0);

      if (currentMinutes >= targetMinutes && data && !data.hasPushedToday) {
        localStorage.setItem(lastAlertKey, 'true');

        // Play audible alert chime if enabled
        if (soundAlert) {
          playAlertChime();
        }

        // 1. Desktop Notification
        await sendDesktopNotification(
          '⚠️ GitPulse Streak Alert',
          `It is past ${alertTime} and you haven't pushed any commits today! Keep your GitHub streak alive before midnight.`
        );

        // 2. Discord Webhook notification if enabled
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

    // Check every 1 minute
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
      // 23:30 threshold (1410 minutes into the day)
      const midnightThreshold = 23 * 60 + 30;

      if (currentMinutes >= midnightThreshold && data && !data.hasPushedToday) {
        localStorage.setItem(lastMidnightAlertKey, 'true');

        if (soundAlert) {
          playEmergencyChime();
        }

        // 1. High priority Desktop Notification
        await sendDesktopNotification(
          '🚨 GitPulse Emergency Reminder',
          `Only 30 minutes until midnight! You haven't pushed any commits today. Push now to protect your streak!`
        );

        // 2. Urgent Discord Webhook notification if enabled
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

  // Initial sync for Launch at Startup with Tauri plugin-autostart
  useEffect(() => {
    isAutostartEnabled()
      .then((openAtLogin) => {
        if (typeof openAtLogin === 'boolean') {
          setLaunchAtStartup(openAtLogin);
          localStorage.setItem('gitpulse_launch_at_startup', String(openAtLogin));
        }
      })
      .catch((err) => console.warn('Failed to query autostart items:', err));
  }, []);

  // Theme synchronization (dark / light / system)
  useEffect(() => {
    const updateTheme = () => {
      let isDark = true;
      if (theme === 'dark') {
        isDark = true;
      } else if (theme === 'light') {
        isDark = false;
      } else if (theme === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    updateTheme();

    if (theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => updateTheme();
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, [theme]);

  const handleSaveSettings = ({
    username: newUsername,
    pat: newPat,
    githubToken: newGithubToken,
    refreshInterval: newInterval,
    eveningAlert: newEveningAlert,
    alertTime: newAlertTime,
    midnightAlert: newMidnightAlert,
    soundAlert: newSoundAlert,
    soundVolume: newSoundVolume,
    discordWebhook: newDiscordWebhook,
    launchAtStartup: newLaunchAtStartup,
    theme: newTheme,
  }) => {
    const resolvedToken = typeof newPat === 'string' ? newPat : (newGithubToken || '');
    setUsername(newUsername);
    setGithubToken(resolvedToken);
    setRefreshInterval(newInterval);
    setEveningAlert(newEveningAlert);
    setAlertTime(newAlertTime);
    if (typeof newMidnightAlert === 'boolean') {
      setMidnightAlert(newMidnightAlert);
      localStorage.setItem('gitpulse_midnight_alert', String(newMidnightAlert));
    }
    if (typeof newSoundAlert === 'boolean') {
      setSoundAlert(newSoundAlert);
      localStorage.setItem('gitpulse_sound_alert', String(newSoundAlert));
    }
    if (typeof newSoundVolume === 'number') {
      setSoundVolumeState(newSoundVolume);
      localStorage.setItem('gitpulse_sound_volume', String(newSoundVolume));
    }
    setDiscordWebhook(newDiscordWebhook);

    localStorage.setItem('gitpulse_username', newUsername);
    localStorage.setItem('gitpulse_pat', resolvedToken);
    localStorage.setItem('gitpulse_github_token', resolvedToken);
    localStorage.setItem('gitpulse_interval', String(newInterval));
    localStorage.setItem('gitpulse_evening_alert', String(newEveningAlert));
    localStorage.setItem('gitpulse_alert_time', newAlertTime);
    localStorage.setItem('gitpulse_discord_webhook', newDiscordWebhook);

    if (newTheme) {
      setTheme(newTheme);
      localStorage.setItem('gitpulse_theme', newTheme);
    }

    if (typeof newLaunchAtStartup === 'boolean') {
      setLaunchAtStartup(newLaunchAtStartup);
      localStorage.setItem('gitpulse_launch_at_startup', String(newLaunchAtStartup));
      if (newLaunchAtStartup) {
        enableAutostart().catch(console.warn);
      } else {
        disableAutostart().catch(console.warn);
      }
    }

    hasCelebratedRef.current = false;

    // Immediately trigger a sync with the new settings
    loadActivity(true, newUsername, resolvedToken);
  };

  const currentStatus = data?.hasPushedToday ? 'green' : data ? 'red' : 'default';

  return (
    <div className="w-full h-screen bg-[#f4f5f7] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans select-none overflow-hidden transition-colors duration-200">
      {/* Draggable Frameless Header */}
      <Header
        status={currentStatus}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Area - Scrollable & Dynamically Adaptive */}
      <main className="flex-1 w-full p-3.5 sm:p-6 md:p-8 lg:p-10 overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col items-center justify-start lg:justify-center">
        <div className="w-full max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl space-y-3.5 sm:space-y-5 md:space-y-6 my-auto">
          <StatusCard
            data={data}
            loading={loading}
            error={error}
            onRefresh={() => loadActivity(true)}
          />

          <CommitFuel />
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

