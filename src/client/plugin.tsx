import { Plugin } from '@nocobase/client';

/**
 * The feature lives entirely in the Client V2 settings app; the legacy client
 * only needs a plugin object to load, so this one does nothing on purpose.
 */
export class PluginPortalAgentConnectClient extends Plugin {
  async load() {}
}

export default PluginPortalAgentConnectClient;
