import { Plugin } from '@nocobase/server';

/**
 * Public address of this instance, as a browser outside it would type it.
 *
 * The page falls back to `window.location.origin`, which is right for a plain
 * setup but wrong for the case this plugin exists for: a demo behind a tunnel or
 * a reverse proxy, where the browser may well sit on `localhost:14308` while the
 * address handed to someone else has to be the public one. Set it in the
 * container env and every generated prompt follows.
 */
const PUBLIC_BASE_URL_ENV = 'PORTAL_AGENT_PUBLIC_URL';

function readPublicBaseUrl() {
  const value = process.env[PUBLIC_BASE_URL_ENV];
  return typeof value === 'string' ? value.trim().replace(/\/+$/, '') : '';
}

export class PluginPortalAgentConnectServer extends Plugin {
  async load() {
    this.app.resourceManager.define({
      name: 'portalAgentConnect',
      actions: {
        getConfig: async (ctx: any, next: () => Promise<any>) => {
          ctx.body = { publicBaseUrl: readPublicBaseUrl() };
          await next();
        },
      },
    });

    // Read-only, and it only ever returns an address the caller already reached
    // this instance through, so every signed-in user may ask for it.
    this.app.acl.allow('portalAgentConnect', 'getConfig', 'loggedIn');
  }
}

export default PluginPortalAgentConnectServer;
