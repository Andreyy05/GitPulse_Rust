/**
 * Handles desktop toast notifications and optional Discord webhook alerts.
 */
import { sendNotification as tauriNotification, isPermissionGranted, requestPermission } from '@tauri-apps/plugin-notification';
import { invoke } from '@tauri-apps/api/core';

export async function sendDesktopNotification(title, body) {
  try {
    let permissionGranted = await isPermissionGranted();
    if (!permissionGranted) {
      const permission = await requestPermission();
      permissionGranted = permission === 'granted';
    }
    if (permissionGranted) {
      tauriNotification({ title, body });
      return true;
    }
  } catch (err) {
    console.warn('Tauri plugin-notification failed, trying invoke:', err);
    try {
      await invoke('show_notification', { title, body });
      return true;
    } catch (e) {
      console.error('All notification methods failed:', e);
    }
  }
  return false;
}

export async function sendDiscordWebhook(webhookUrl, { username, commitsToday, customMessage }) {
  if (!webhookUrl || !webhookUrl.trim().startsWith('https://discord.com/api/webhooks/')) {
    throw new Error('Invalid Discord Webhook URL. It must start with https://discord.com/api/webhooks/');
  }

  const message = customMessage || (commitsToday > 0
    ? `🎉 **GitPulse**: @${username} is on track today with **${commitsToday}** commit(s)! 🔥`
    : `⚠️ **GitPulse Streak Alert**: @${username} has not pushed any commits today! Keep your GitHub streak alive before midnight! ⏳`);

  const payload = {
    username: 'GitPulse',
    avatar_url: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
    embeds: [
      {
        title: commitsToday > 0 ? 'GitHub Streak Maintained! ✅' : 'GitHub Streak At Risk! ⚠️',
        description: message,
        color: commitsToday > 0 ? 0x10b981 : 0xef4444,
        fields: [
          { name: 'User', value: `[${username}](https://github.com/${username})`, inline: true },
          { name: 'Commits Today', value: `${commitsToday}`, inline: true },
        ],
        footer: {
          text: 'GitPulse Desktop Monitor',
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  const response = await fetch(webhookUrl.trim(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Discord Webhook failed with status ${response.status}`);
  }

  return true;
}

