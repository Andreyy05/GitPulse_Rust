/**
 * GitHub API service to fetch user activity, profile avatar, contribution calendar,
 * extended statistics (30/90 days, active day of week, daily average, top repo),
 * user repositories (quicklinks/pinned), and offline local cache.
 */
import { invoke } from '@tauri-apps/api/core';

function formatLocalDateKey(dateInput) {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function calculateHeatmapLevel(count) {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  return 3; // 6+ commits
}

/**
 * Fetch and parse the user's official GitHub contribution calendar HTML
 */
async function fetchContributionsCalendar(username) {
  let html = null;

  // 1. Try via Tauri Rust invoke (avoids CORS and CSP)
  try {
    html = await invoke('fetch_github_contributions', { username });
  } catch (err) {
    console.warn('[GitPulse] Tauri invoke fetch contributions error:', err);
  }

  // 2. Direct fetch fallback
  if (!html) {
    try {
      const res = await fetch(`https://github.com/users/${encodeURIComponent(username)}/contributions`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        },
      });
      if (res.ok) {
        html = await res.text();
      }
    } catch (err) {
      console.warn('[GitPulse] Direct fetch contributions error:', err);
    }
  }

  if (!html) return {};

  const tooltips = {};
  const tipRegex = /<tool-tip[^>]*for="([^"]+)"[^>]*>([^<]+)<\/tool-tip>/gi;
  let tipMatch;
  while ((tipMatch = tipRegex.exec(html)) !== null) {
    tooltips[tipMatch[1]] = tipMatch[2].trim();
  }

  const tdRegex = /<td[^>]*data-date="(\d{4}-\d{2}-\d{2})"[^>]*id="([^"]+)"[^>]*data-level="(\d+)"[^>]*>/gi;
  const daysMap = {};
  let tdMatch;
  while ((tdMatch = tdRegex.exec(html)) !== null) {
    const date = tdMatch[1];
    const id = tdMatch[2];
    const rawLevel = parseInt(tdMatch[3], 10);
    const tipText = tooltips[id] || '';

    let count = 0;
    const countMatch = tipText.match(/^(\d+)\s+contribution/i);
    if (countMatch) {
      count = parseInt(countMatch[1], 10);
    } else if (rawLevel > 0) {
      count = rawLevel === 1 ? 1 : rawLevel === 2 ? 3 : rawLevel === 3 ? 6 : 10;
    }

    daysMap[date] = {
      date,
      count,
      level: Math.min(calculateHeatmapLevel(count), 3),
      tip: tipText,
    };
  }

  // Alternative fallback regex if markup differs
  if (Object.keys(daysMap).length === 0) {
    const altRegex = /<td[^>]*data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-count="(\d+)"/gi;
    let altMatch;
    while ((altMatch = altRegex.exec(html)) !== null) {
      const date = altMatch[1];
      const count = parseInt(altMatch[2], 10);
      daysMap[date] = {
        date,
        count,
        level: calculateHeatmapLevel(count),
      };
    }
  }

  return daysMap;
}

/**
 * Fetch recent repositories for quicklinks
 */
async function fetchUserRepositories(cleanUser, token, headers) {
  try {
    const endpoint = token
      ? 'https://api.github.com/user/repos?sort=pushed&per_page=10'
      : `https://api.github.com/users/${encodeURIComponent(cleanUser)}/repos?sort=pushed&per_page=10`;

    let res = await fetch(endpoint, { headers });
    if (!res.ok && token) {
      res = await fetch(`https://api.github.com/users/${encodeURIComponent(cleanUser)}/repos?sort=pushed&per_page=10`, { headers });
    }

    if (res.ok) {
      const parsed = await res.json();
      if (Array.isArray(parsed)) {
        return parsed.map((r) => ({
          id: r.id,
          name: r.name,
          fullName: r.full_name,
          url: r.html_url,
          description: r.description || '',
          language: r.language || 'Code',
          stars: r.stargazers_count || 0,
          forks: r.forks_count || 0,
          isPrivate: !!r.private,
          updatedAt: r.pushed_at || r.updated_at,
        }));
      }
    }
  } catch (err) {
    console.warn('[GitPulse] Repositories fetch warning:', err);
  }
  return [];
}

/**
 * Main fetch function with offline cache resilience
 */
export async function fetchGitHubActivity(username, optionalToken = '') {
  if (!username || !username.trim()) {
    throw new Error('Please configure your GitHub username.');
  }

  const cleanUser = username.trim();
  const cacheKey = `gitpulse_cached_activity_${cleanUser.toLowerCase()}`;

  const loadFromCache = (reason) => {
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const cached = JSON.parse(raw);
        return {
          ...cached,
          isOffline: true,
          offlineReason: reason || 'Working in offline mode',
          updatedAt: cached.updatedAt ? new Date(cached.updatedAt) : new Date(),
        };
      }
    } catch (e) {
      console.warn('[GitPulse] Failed reading local cache:', e);
    }
    return null;
  };

  // Immediate offline detection
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    const cached = loadFromCache('Network is disconnected (Offline)');
    if (cached) return cached;
  }

  try {
    const token =
      (optionalToken && optionalToken.trim()) ||
      (typeof localStorage !== 'undefined' && localStorage.getItem
        ? localStorage.getItem('gitpulse_pat') || localStorage.getItem('gitpulse_github_token') || ''
        : '') ||
      '';

    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'GitPulse-Desktop',
    };

    if (token && token.trim()) {
      headers['Authorization'] = `Bearer ${token.trim()}`;
    }

    let avatarUrl = `https://avatars.githubusercontent.com/${cleanUser}`;
    let rateLimitWarning = null;

    // Helper to inspect rate-limiting on responses
    const checkRateLimit = (res) => {
      const remaining = res.headers.get('x-ratelimit-remaining');
      const resetUnix = res.headers.get('x-ratelimit-reset');
      if (res.status === 403 || remaining === '0') {
        const resetDate = resetUnix ? new Date(parseInt(resetUnix, 10) * 1000) : null;
        const resetTime = resetDate ? resetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'soon';
        const warning = `GitHub API rate limit exceeded. Resets at ${resetTime}`;
        console.warn(`[GitPulse] ${warning}`);
        rateLimitWarning = warning;
        return true;
      }
      return false;
    };

    // 1. Fetch user profile
    try {
      const profileRes = await fetch(
        `https://api.github.com/users/${encodeURIComponent(cleanUser)}`,
        { headers }
      );

      if (profileRes.status === 404) {
        throw new Error(`GitHub user "@${cleanUser}" not found.`);
      }

      if (checkRateLimit(profileRes)) {
        // Handled in helper
      } else if (profileRes.ok) {
        const profile = await profileRes.json();
        if (profile?.avatar_url) {
          avatarUrl = profile.avatar_url;
        }
      }
    } catch (err) {
      if (err.message && err.message.includes('not found')) {
        throw err;
      }
      console.warn('[GitPulse] User profile fetch warning:', err);
    }

    // 2. Fetch contributions calendar, events, and repositories concurrently
    const [calendarMap, rawEventsList, repositories] = await Promise.all([
      fetchContributionsCalendar(cleanUser).catch(() => ({})),
      (async () => {
        const endpoint = token
          ? 'https://api.github.com/user/events?per_page=100'
          : `https://api.github.com/users/${encodeURIComponent(cleanUser)}/events?per_page=100`;

        let eventsRes = null;
        try {
          eventsRes = await fetch(endpoint, { headers });
          if (!eventsRes.ok && token && endpoint.includes('/user/events')) {
            eventsRes = await fetch(
              `https://api.github.com/users/${encodeURIComponent(cleanUser)}/events?per_page=100`,
              { headers }
            );
          }
        } catch (err) {
          console.warn('[GitPulse] Events fetch error:', err);
        }

        if (eventsRes && eventsRes.ok) {
          const parsed = await eventsRes.json();
          return Array.isArray(parsed) ? parsed : [];
        }
        if (eventsRes) checkRateLimit(eventsRes);
        return [];
      })(),
      fetchUserRepositories(cleanUser, token, headers),
    ]);

    // Filter for PushEvents only
    const pushEvents = rawEventsList.filter((e) => e.type === 'PushEvent');

    if (rawEventsList[0]?.actor?.avatar_url && avatarUrl.includes('avatars.githubusercontent.com/' + cleanUser)) {
      avatarUrl = rawEventsList[0].actor.avatar_url;
    }

    // 3. Parse push events for today and date breakdown
    const pushCountsByDate = {};
    const recentPushes = [];
    const todayKey = formatLocalDateKey(new Date());

    for (const event of pushEvents) {
      const commits = event.payload?.commits;
      const eventDateKey = formatLocalDateKey(event.created_at);

      if (Array.isArray(commits) && commits.length > 0) {
        for (const commit of commits) {
          const commitDateRaw = commit.timestamp || commit.author?.date || event.created_at;
          const commitDateKey = formatLocalDateKey(commitDateRaw);
          pushCountsByDate[commitDateKey] = (pushCountsByDate[commitDateKey] || 0) + 1;
        }
      } else {
        const size = event.payload?.size || event.payload?.distinct_size || 1;
        pushCountsByDate[eventDateKey] = (pushCountsByDate[eventDateKey] || 0) + size;
      }

      if (eventDateKey === todayKey) {
        const eventDate = new Date(event.created_at);
        const repoName = event.repo?.name || 'unknown/repo';
        const commitCount = Array.isArray(commits) && commits.length > 0 ? commits.length : (event.payload?.size || 1);
        const latestMessage =
          commits?.[0]?.message?.split('\n')[0] ||
          (commitCount > 1 ? `${commitCount} commits` : 'Code push');

        recentPushes.push({
          id: String(event.id),
          repo: repoName,
          repoUrl: `https://github.com/${repoName}`,
          commitCount,
          latestMessage,
          time: eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: eventDate.getTime(),
        });
      }
    }

    // 4. Generate 14-day timeline
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      const calDay = calendarMap[dateKey];
      const pushCount = pushCountsByDate[dateKey] || 0;

      let count = 0;
      if (calDay && calDay.count !== undefined) {
        count = Math.max(calDay.count, pushCount);
      } else {
        count = pushCount;
      }

      const level = calDay && calDay.level !== undefined ? calDay.level : calculateHeatmapLevel(count);

      days.push({
        date: dateKey,
        count,
        level: Math.min(Math.max(level, calculateHeatmapLevel(count)), 3),
        isToday: i === 0,
      });
    }

    const todayCommits = days[13]?.count || 0;
    const totalCommits = days.reduce((acc, curr) => acc + curr.count, 0);

    // 5. Streaks
    const { currentStreak, bestStreak } = calculateStreaks(calendarMap, pushCountsByDate, todayKey);

    // 6. Extended statistics (30d, 90d, average, best day of week, most active repo)
    const stats = calculateExtendedStats(calendarMap, pushCountsByDate, pushEvents);

    recentPushes.sort((a, b) => b.timestamp - a.timestamp);
    const lastPush = recentPushes.length > 0 ? recentPushes[0] : null;

    const result = {
      username: cleanUser,
      avatarUrl,
      hasPushedToday: todayCommits > 0,
      totalCommitsToday: todayCommits,
      totalPushEventsToday: recentPushes.length || (todayCommits > 0 ? 1 : 0),
      lastPushTime: lastPush ? lastPush.time : (todayCommits > 0 ? 'Today' : null),
      recentPushes: recentPushes.slice(0, 3),
      history14Days: days,
      total14DaysCommits: totalCommits,
      currentStreak,
      bestStreak,
      stats,
      repositories,
      isOffline: false,
      offlineReason: null,
      rateLimitWarning,
      updatedAt: new Date(),
    };

    // Save to local cache for offline resiliency
    try {
      localStorage.setItem(cacheKey, JSON.stringify({
        ...result,
        updatedAt: result.updatedAt.toISOString(),
      }));
    } catch (e) {
      console.warn('[GitPulse] Cache storage error:', e);
    }

    return result;
  } catch (err) {
    console.warn('[GitPulse] Error fetching activity, attempting offline cache:', err);
    const cached = loadFromCache(err.message || 'Unable to connect to GitHub');
    if (cached) {
      return cached;
    }
    throw err;
  }
}

/**
 * Calculate current streak and best streak from calendar map
 */
function calculateStreaks(calendarMap, pushCountsByDate, todayKey) {
  const getCount = (dateKey) => {
    const cal = calendarMap[dateKey];
    const push = pushCountsByDate[dateKey] || 0;
    if (cal && cal.count !== undefined) return Math.max(cal.count, push);
    return push;
  };

  let currentStreak = 0;
  const todayDate = new Date();
  const todayHasCommit = getCount(todayKey) > 0;

  for (let i = todayHasCommit ? 0 : 1; i <= 365; i++) {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - i);
    const dk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (getCount(dk) > 0) {
      currentStreak++;
    } else {
      break;
    }
  }

  const allDates = Object.keys(calendarMap).sort();
  let bestStreak = 0;
  let runningBest = 0;
  let prevDate = null;

  for (const dk of allDates) {
    const count = getCount(dk);
    if (count > 0) {
      if (prevDate) {
        const prev = new Date(prevDate);
        const curr = new Date(dk);
        const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          runningBest++;
        } else {
          runningBest = 1;
        }
      } else {
        runningBest = 1;
      }
      bestStreak = Math.max(bestStreak, runningBest);
      prevDate = dk;
    } else {
      runningBest = 0;
      prevDate = dk;
    }
  }

  bestStreak = Math.max(bestStreak, currentStreak);
  return { currentStreak, bestStreak };
}

/**
 * Calculate extended statistics: 30d/90d commits, average, most active day of week, most active repo
 */
function calculateExtendedStats(calendarMap, pushCountsByDate, pushEvents) {
  const getCount = (dateKey) => {
    const cal = calendarMap[dateKey];
    const push = pushCountsByDate[dateKey] || 0;
    if (cal && cal.count !== undefined) return Math.max(cal.count, push);
    return push;
  };

  const today = new Date();
  let commits30Days = 0;
  let commits90Days = 0;

  for (let i = 0; i < 90; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const count = getCount(dk);
    if (i < 30) {
      commits30Days += count;
    }
    commits90Days += count;
  }

  const dailyAverage = (commits30Days / 30).toFixed(1);
  const dailyAverage90 = (commits90Days / 90).toFixed(1);

  // Day of week distribution across all available calendar dates
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayFullNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const daySums = [0, 0, 0, 0, 0, 0, 0];

  const allDates = Object.keys(calendarMap);
  for (const dk of allDates) {
    const count = getCount(dk);
    if (count > 0) {
      const [y, m, d] = dk.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const dayIdx = dateObj.getDay();
      daySums[dayIdx] += count;
    }
  }

  let maxDayIdx = 1; // default Monday
  let maxDayCount = -1;
  let totalAllDays = 0;
  for (let i = 0; i < 7; i++) {
    totalAllDays += daySums[i];
    if (daySums[i] > maxDayCount) {
      maxDayCount = daySums[i];
      maxDayIdx = i;
    }
  }

  const mostActiveDay = {
    name: dayFullNames[maxDayIdx],
    short: dayNames[maxDayIdx],
    count: Math.max(0, maxDayCount),
    percentage: totalAllDays > 0 ? Math.round((maxDayCount / totalAllDays) * 100) : 0,
  };

  // Reorder starting Monday: Mon, Tue, Wed, Thu, Fri, Sat, Sun
  const displayOrder = [1, 2, 3, 4, 5, 6, 0];
  const maxInOrder = Math.max(1, ...daySums);
  const dayDistribution = displayOrder.map((idx) => ({
    name: dayNames[idx],
    fullName: dayFullNames[idx],
    count: daySums[idx],
    percentOfMax: Math.round((daySums[idx] / maxInOrder) * 100),
    isMax: idx === maxDayIdx,
  }));

  // Most active repo from PushEvents
  const repoMap = {};
  for (const event of pushEvents) {
    const rName = event.repo?.name;
    if (!rName) continue;
    const commitCount = Array.isArray(event.payload?.commits) && event.payload.commits.length > 0
      ? event.payload.commits.length
      : (event.payload?.size || 1);

    if (!repoMap[rName]) {
      repoMap[rName] = {
        name: rName,
        commits: 0,
        pushes: 0,
        url: `https://github.com/${rName}`,
      };
    }
    repoMap[rName].commits += commitCount;
    repoMap[rName].pushes += 1;
  }

  const sortedRepos = Object.values(repoMap).sort((a, b) => b.commits - a.commits);
  const mostActiveRepo = sortedRepos[0] || null;

  return {
    commits30Days,
    commits90Days,
    dailyAverage,
    dailyAverage90,
    mostActiveDay,
    dayDistribution,
    mostActiveRepo,
  };
}
