import { useState, useEffect, useCallback } from 'react';
import { isEnabled as isAutostartEnabled, enable as enableAutostart, disable as disableAutostart } from '@tauri-apps/plugin-autostart';
import { setSoundVolume } from '../services/audio';

export function useSettings() {
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

  const [activeTab, setActiveTabState] = useState(() => {
    return localStorage.getItem('gitpulse_active_tab') || 'pulse';
  });

  // Handle tab switching with persistence
  const setActiveTab = useCallback((tabId) => {
    setActiveTabState(tabId);
    try {
      localStorage.setItem('gitpulse_active_tab', tabId);
    } catch {}
  }, []);

  // Sync with autostart on mount
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

  // Theme application to document.documentElement
  useEffect(() => {
    const applyTheme = () => {
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

    applyTheme();

    if (theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, [theme]);

  // Quick 1-click theme toggle (Light <-> Dark)
  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => {
      const isCurrentlyDark =
        prevTheme === 'dark' ||
        (prevTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      const nextTheme = isCurrentlyDark ? 'light' : 'dark';
      try {
        localStorage.setItem('gitpulse_theme', nextTheme);
      } catch {}
      return nextTheme;
    });
  }, []);

  // Save full settings bundle from modal
  const saveSettings = useCallback((newSettings) => {
    const {
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
    } = newSettings;

    const resolvedToken = typeof newPat === 'string' ? newPat : (newGithubToken || '');

    if (newUsername !== undefined) {
      setUsername(newUsername);
      localStorage.setItem('gitpulse_username', newUsername);
    }

    setGithubToken(resolvedToken);
    localStorage.setItem('gitpulse_pat', resolvedToken);
    localStorage.setItem('gitpulse_github_token', resolvedToken);

    if (newInterval !== undefined) {
      setRefreshInterval(newInterval);
      localStorage.setItem('gitpulse_interval', String(newInterval));
    }

    if (newEveningAlert !== undefined) {
      setEveningAlert(newEveningAlert);
      localStorage.setItem('gitpulse_evening_alert', String(newEveningAlert));
    }

    if (newAlertTime !== undefined) {
      setAlertTime(newAlertTime);
      localStorage.setItem('gitpulse_alert_time', newAlertTime);
    }

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
      setSoundVolume(newSoundVolume);
      localStorage.setItem('gitpulse_sound_volume', String(newSoundVolume));
    }

    if (newDiscordWebhook !== undefined) {
      setDiscordWebhook(newDiscordWebhook);
      localStorage.setItem('gitpulse_discord_webhook', newDiscordWebhook);
    }

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

    return {
      username: newUsername ?? username,
      token: resolvedToken,
    };
  }, [username]);

  return {
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
  };
}

