import { describe, expect, it } from 'vitest';
import {
  buildAgentPrompt,
  buildApiBaseUrl,
  buildPortalLiveUrl,
  getAppScopeFromPathname,
} from '../../shared/agentPrompt';

describe('getAppScopeFromPathname', () => {
  it('returns an empty scope for the main application', () => {
    expect(getAppScopeFromPathname('/settings/multi-portal/connect-agent')).toBe('');
  });

  it('reads the sub-application out of the settings path', () => {
    expect(getAppScopeFromPathname('/settings/apps/demo/multi-portal')).toBe('/apps/demo');
    expect(getAppScopeFromPathname('/settings/_app/demo/multi-portal')).toBe('/apps/demo');
  });
});

describe('buildPortalLiveUrl', () => {
  it('puts the AI portal prefix between the instance and the route', () => {
    expect(buildPortalLiveUrl({ baseUrl: 'http://localhost:14308', routePath: '/crm' })).toBe(
      'http://localhost:14308/x/crm/',
    );
  });

  it('tolerates a trailing slash on the base and a bare route path', () => {
    expect(buildPortalLiveUrl({ baseUrl: 'https://demo.example.com/', routePath: 'crm' })).toBe(
      'https://demo.example.com/x/crm/',
    );
  });

  it('keeps the sub-application scope', () => {
    expect(buildPortalLiveUrl({ baseUrl: 'https://demo.example.com', appScope: '/apps/demo', routePath: '/crm' })).toBe(
      'https://demo.example.com/apps/demo/x/crm/',
    );
  });
});

describe('buildApiBaseUrl', () => {
  it('appends the API root', () => {
    expect(buildApiBaseUrl({ baseUrl: 'http://localhost:14308/' })).toBe('http://localhost:14308/api');
    expect(buildApiBaseUrl({ baseUrl: 'http://localhost:14308', appScope: '/apps/demo' })).toBe(
      'http://localhost:14308/apps/demo/api',
    );
  });
});

describe('buildAgentPrompt', () => {
  const prompt = buildAgentPrompt({
    appTitle: 'Salesroom CRM',
    liveUrl: 'http://localhost:14308/x/crm/',
    apiBaseUrl: 'http://localhost:14308/api',
    portalName: 'crm',
    envName: 'mydemo',
  });

  it('states the app, both addresses and the portal name', () => {
    expect(prompt).toContain('App: Salesroom CRM');
    expect(prompt).toContain('Live URL: http://localhost:14308/x/crm/');
    expect(prompt).toContain('NocoBase API base: http://localhost:14308/api');
    expect(prompt).toContain('Portal name: crm');
  });

  it('substitutes the environment name into every command that takes one', () => {
    expect(prompt).toContain('nb env add mydemo --api-base-url http://localhost:14308/api');
    expect(prompt).toContain('nb portal list -e mydemo');
    expect(prompt).toContain('nb portal pull crm -e mydemo --install');
    expect(prompt).toContain('nb portal dev crm -e mydemo');
    expect(prompt).not.toContain('${');
  });

  it('leaves the access token for the reader to fill in', () => {
    expect(prompt).toContain('<YOUR_TOKEN>');
  });
});
