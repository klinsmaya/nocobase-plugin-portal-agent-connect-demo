export type AgentPromptInput = {
  /** Portal title as shown in the portal manager, e.g. "Salesroom CRM". */
  appTitle: string;
  /** Address a browser outside this instance would open, e.g. "https://demo.example.com/x/crm/". */
  liveUrl: string;
  /** API root of this instance, e.g. "https://demo.example.com/api". */
  apiBaseUrl: string;
  /** Portal name the CLI addresses the portal by, e.g. "crm". */
  portalName: string;
  /** Name the agent will register this instance under in its own CLI config. */
  envName: string;
};

const AI_PORTAL_PREFIX = '/x';

function trimTrailingSlashes(value: string) {
  return value.replace(/\/+$/, '');
}

function ensureLeadingSlash(value: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '/') {
    return '';
  }
  return `/${trimmed.replace(/^\/+/, '')}`;
}

/**
 * Sub-app scope of the page currently open, or '' for the main app.
 *
 * The settings app runs under `/settings` for the main application and under
 * `/settings/apps/<name>` inside a sub-application; the portals of that
 * sub-application answer at `/x/apps/<name>/...`. Reading the scope off the
 * current path keeps the generated address pointing at the same application the
 * reader is looking at.
 *
 * @param {string} pathname current `window.location.pathname`
 * @returns {string} sub-app scope such as `/apps/demo`, or an empty string
 */
export function getAppScopeFromPathname(pathname: string): string {
  const match = /\/(apps|_app)\/([^/]+)/.exec(pathname || '');
  return match ? `/apps/${match[2]}` : '';
}

/**
 * Absolute address of an AI portal.
 *
 * @param {object} args base URL, sub-app scope and the portal's route path
 * @returns {string} absolute URL ending in a slash
 */
export function buildPortalLiveUrl(args: { baseUrl: string; appScope?: string; routePath: string }): string {
  const base = trimTrailingSlashes(args.baseUrl.trim());
  const scope = ensureLeadingSlash(args.appScope || '');
  const route = ensureLeadingSlash(args.routePath || '');
  return `${base}${scope}${AI_PORTAL_PREFIX}${route}/`;
}

/**
 * API root of this instance.
 *
 * @param {object} args base URL and sub-app scope
 * @returns {string} absolute URL of the API root, without a trailing slash
 */
export function buildApiBaseUrl(args: { baseUrl: string; appScope?: string }): string {
  const base = trimTrailingSlashes(args.baseUrl.trim());
  const scope = ensureLeadingSlash(args.appScope || '');
  return `${base}${scope}/api`;
}

/**
 * The text handed to a coding agent so it can take over an AI portal.
 *
 * Written as one paste-ready message rather than a documentation page: the
 * reader is an agent that will execute the steps, so every command is complete
 * and in order, and the closing paragraph tells it to stop once connected
 * instead of guessing at changes.
 *
 * @param {AgentPromptInput} input portal and instance details
 * @returns {string} prompt text
 */
export function buildAgentPrompt(input: AgentPromptInput): string {
  const { appTitle, liveUrl, apiBaseUrl, portalName, envName } = input;
  return `I want to customize this NocoBase AI Portal app with my own coding agent.

App: ${appTitle}
Live URL: ${liveUrl}
NocoBase API base: ${apiBaseUrl}
Portal name: ${portalName}

Setup:
1. Install the latest NocoBase CLI alpha — the 3.x line, not the default stable:
     npm i -g @nocobase/cli@alpha
   \`@alpha\` always installs the newest alpha; if you already have \`nb\`, run it again to
   upgrade (the alpha updates often). Check \`nb --version\` prints 3.x — the stable 2.x
   has no \`nb portal\` command.
2. Connect the CLI to this instance:
     nb env add ${envName} --api-base-url ${apiBaseUrl} --auth-type token --access-token <YOUR_TOKEN>
   Create the token in the NocoBase admin UI (Settings -> API keys). Or use
     nb env add ${envName} --api-base-url ${apiBaseUrl} --auth-type oauth
   and finish the browser login with \`nb env auth ${envName}\`.
3. Confirm it connected — this lists the portals on the instance:
     nb portal list -e ${envName}
4. Install the NocoBase agent skills:
     nb skills install --yes             # already installed? use \`nb skills update --yes\`
   That gives your agent the nocobase-portal-manage, nocobase-ai-builder,
   nocobase-data-modeling, nocobase-workflow-manage and nocobase-acl-manage skills.
5. Pull this portal's source (over HTTPS via the instance — no SSH key needed):
     nb portal pull ${portalName} -e ${envName} --install
6. Run it locally against this instance:
     nb portal dev ${portalName} -e ${envName}
7. Ship your changes back (only if you own this instance):
     nb portal push ${portalName} -e ${envName} -m "my changes"
     nb portal deploy ${portalName} -e ${envName}

This is an "AI Portal": the whole UI is React source code that I own, not no-code config.
Load the \`nocobase-portal-manage\` skill first — it routes to \`nocobase-ai-builder\` for source work.

Follow the setup above and confirm the portal is running locally against this instance. Don't change anything yet — once it's connected, I'll tell you what I want to change.
`;
}
