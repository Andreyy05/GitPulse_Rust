/**
 * Commit Fuel Generator: realistic and witty commit messages.
 * Categories: conventional, witty, docs, hotfix
 */

export const COMMIT_MESSAGES = {
  conventional: [
    'feat(auth): implement refresh token rotation with secure cookie storage',
    'fix(api): handle network timeout and retry gracefully',
    'refactor(core): decouple business logic from UI controller',
    'perf(render): memoize expensive list component and avoid re-renders',
    'test(unit): add boundary condition tests for date parser',
    'chore(deps): bump dependencies to latest patched releases',
    'style(theme): enhance dark mode contrast and focus rings',
    'docs(readme): add setup guide and environment variable schema',
    'fix(db): add composite index to speed up frequent lookups',
    'feat(ui): implement smooth drag-and-drop reordering',
    'fix(types): resolve strict null check violations in api client',
    'ci(workflow): cache node_modules to accelerate pipeline',
    'refactor(state): migrate global store to lightweight context hooks',
    'feat(export): add one-click JSON backup and restore handler',
    'feat(search): implement debounced full-text search with highlight',
    'fix(auth): prevent session fixation on privilege escalation',
    'perf(query): replace N+1 queries with batch prefetch strategy',
    'refactor(router): flatten nested route config and add lazy loading',
    'feat(notifications): add web push with service worker integration',
    'fix(cache): invalidate stale entries on schema migration',
    'test(e2e): add playwright flows for checkout and payment steps',
    'chore(lint): enforce consistent import order across all modules',
    'feat(i18n): scaffold locale files and wire up i18next provider',
    'fix(ssr): hydration mismatch on locale-sensitive date rendering',
    'perf(images): switch to next-gen formats with srcset lazy loading',
    'refactor(hooks): extract reusable useAsync and usePagination hooks',
    'feat(analytics): track user funnel events with structured payload',
    'fix(websocket): reconnect on abnormal close with backoff strategy',
    'feat(accessibility): add skip-to-content link and ARIA landmark roles',
    'chore(docker): slim base image and add multi-stage build pipeline',
    'fix(validation): enforce max-length constraint on all text inputs',
    'feat(dashboard): add filterable sortable data table component',
    'refactor(api): adopt resource-oriented URL structure per REST spec',
    'perf(bundle): tree-shake unused icon sets and reduce gzip by 40%',
    'fix(timezone): normalize UTC timestamps before local display',
    'feat(dark-mode): persist theme preference and respect system setting',
    'test(integration): validate rate-limit middleware with mock clock',
    'chore(env): separate development and production config schemas',
    'feat(pagination): implement cursor-based infinite scroll',
    'fix(race-condition): serialize concurrent writes with async mutex',
  ],

  witty: [
    'fix: edge case that will definitely never happen again',
    'refactor: simplify code I wrote yesterday at 2 AM',
    'style: clean up unused imports and vibes',
    'fix: remove console.log from production',
    'chore: delete commented-out code that was haunting us',
    'fix: it was a typo. it is always a typo.',
    'perf: make the algorithm slightly less embarrassing',
    'docs: explain the workaround so future me does not panic',
    'test: write the tests I promised in the last PR',
    'fix: stop users from clicking the submit button 42 times',
    'feat: implement feature that nobody requested but looks amazing',
    'refactor: burn down tech debt before it becomes sentient',
    'chore: appease the strict linter deities',
    'fix: works on my machine, now hopefully everywhere',
    'fix: the bug was between keyboard and chair',
    'refactor: turn 8 nested if-statements into something human-readable',
    'feat: add subtle loading spinner because instant is suspicious',
    'fix: undefined is not a function (this time I mean it)',
    'chore: update changelog nobody reads but CI demands it',
    'refactor: rename variable from x to something my therapist would approve',
    'fix: add null check I should have added 3 sprints ago',
    'style: alphabetize CSS properties for peace of mind',
    'feat: add tooltip that explains what the button already says',
    'fix: prevent crash when user does exactly what docs say not to do',
    'chore: remove TODO comments older than my dev career',
    'perf: cache result of function that runs 10000 times per second',
    'refactor: extract magic number 42 into well-named constant FORTY_TWO',
    'fix: handle the one browser that always has to be different',
    'docs: add comment that apologizes to future developers',
    'test: cover the happy path and pray for the rest',
    'feat: dark mode because every app legally needs one now',
    'fix: add missing await that was ruining everyone\'s Monday',
    'chore: format file so git blame becomes more artful',
    'feat: add keyboard shortcut nobody will discover but me',
    'fix: resolve merge conflict with diplomatic whitespace',
    'refactor: replace 200-line function with something a human can read',
    'style: enforce prettier so we stop arguing about semicolons',
    'fix: prevent infinite loop that only triggers on leap years',
    'test: test the test that tests the other test',
    'feat: show error message users might actually understand',
  ],

  docs: [
    'docs: write API reference with request/response examples',
    'docs(readme): update prerequisites and system requirements section',
    'docs: add architecture decision record for event sourcing choice',
    'docs(changelog): document breaking changes in v2.0 migration guide',
    'docs: add inline JSDoc annotations to all public functions',
    'docs(api): generate OpenAPI spec from annotated route handlers',
    'docs: clarify authentication flow with sequence diagram',
    'docs(contributing): add PR checklist and code review guidelines',
    'docs: improve onboarding guide with step-by-step examples',
    'docs(env): document all environment variables with types and defaults',
    'docs: add FAQ section addressing the top support ticket questions',
    'docs(deploy): write production deployment guide for AWS ECS',
    'docs: document database schema with field descriptions and constraints',
    'docs(security): add responsible disclosure and security policy',
    'docs: add annotated examples to configuration reference',
    'docs(hooks): document lifecycle hooks and their execution order',
    'docs: update stale diagrams to reflect current architecture',
    'docs(testing): add guide for writing and running integration tests',
    'docs: add component Storybook stories with props documentation',
    'docs(glossary): define domain terms used across the codebase',
    'docs: translate README to include English and Czech sections',
    'docs: add performance benchmarks with measurement methodology',
    'docs(errors): catalog error codes with resolution steps',
    'docs: write post-mortem for the outage and document learnings',
    'docs(style-guide): codify naming conventions and folder structure',
  ],

  hotfix: [
    'hotfix: patch critical auth bypass allowing unauthenticated access',
    'hotfix: fix null pointer crash on startup affecting all users',
    'hotfix: prevent data loss on session expiry during active edit',
    'hotfix: revert breaking change introduced in last deploy',
    'hotfix: fix payment calculation rounding error causing overcharge',
    'hotfix(security): sanitize user input to prevent XSS in comment field',
    'hotfix: restore missing migration that broke new account creation',
    'hotfix: cap memory leak in event listener cleanup on unmount',
    'hotfix: patch SQL injection vector in search endpoint',
    'hotfix: fix broken webhook signature validation rejecting valid events',
    'hotfix: address race condition causing duplicate order submissions',
    'hotfix: restore backup config after corrupted deploy artifact',
    'hotfix: fix infinite redirect loop on password reset flow',
    'hotfix: patch CORS header missing on CDN-cached API responses',
    'hotfix: resolve token expiry bug logging out users every 5 minutes',
    'hotfix: fix mobile crash on swipe gesture during network request',
    'hotfix: prevent scheduler from firing duplicate background jobs',
    'hotfix: correct inverted boolean flag disabling 2FA for all accounts',
    'hotfix: fix broken SSO callback causing 500 on third-party login',
    'hotfix: re-enable rate limiter accidentally disabled in last config push',
    'hotfix: correct file permission on uploaded attachments exposing paths',
    'hotfix: patch missing authorization check on admin API endpoint',
    'hotfix: fix broken notification queue draining on high load',
    'hotfix: restore index dropped by failed migration rollback',
    'hotfix: plug memory exhaustion in log aggregator under traffic spike',
  ],
};

export const CATEGORIES = [
  { id: 'all',          label: 'Mix' },
  { id: 'conventional', label: 'Clean' },
  { id: 'witty',        label: 'Witty' },
  { id: 'docs',         label: 'Docs' },
  { id: 'hotfix',       label: 'Hotfix' },
];

export function getRandomCommit(category = 'all') {
  let pool = [];
  if (category === 'conventional') {
    pool = COMMIT_MESSAGES.conventional;
  } else if (category === 'witty') {
    pool = COMMIT_MESSAGES.witty;
  } else if (category === 'docs') {
    pool = COMMIT_MESSAGES.docs;
  } else if (category === 'hotfix') {
    pool = COMMIT_MESSAGES.hotfix;
  } else {
    pool = [
      ...COMMIT_MESSAGES.conventional,
      ...COMMIT_MESSAGES.witty,
      ...COMMIT_MESSAGES.docs,
      ...COMMIT_MESSAGES.hotfix,
    ];
  }

  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}
