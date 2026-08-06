import { Plugin } from '@nocobase/client-v2';
import { PortalCardAgentAction } from './PortalCardAgentAction';

export class PluginPortalAgentConnectClientV2 extends Plugin {
  async load() {
    // The whole feature is one action on the portal cards, which belong to
    // another plugin's page. A provider is how this plugin gets a component
    // mounted on a route it does not own, and it sits inside the app's theme,
    // so the button and the dialog match everything around them.
    this.app.addProvider(PortalCardAgentAction, {
      api: this.app.apiClient,
      t: (key: string) => String(this.t(key)),
    });
  }
}

export default PluginPortalAgentConnectClientV2;
