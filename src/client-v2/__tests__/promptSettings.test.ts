import { describe, expect, it } from 'vitest';
import { matchPortalByHref } from '../promptSettings';

const portals = [
  { uid: 'a', routePath: '/crm', portalName: 'crm' },
  { uid: 'b', routePath: '/car-rental', portalName: 'car-rental' },
  { uid: 'c', routePath: '/sc', portalName: 'sc' },
];

describe('matchPortalByHref', () => {
  it('matches the address shown on a card', () => {
    expect(matchPortalByHref(portals, '/x/crm')?.uid).toBe('a');
    expect(matchPortalByHref(portals, '/x/car-rental')?.uid).toBe('b');
  });

  it('tolerates a trailing slash, a query string and a sub-app scope', () => {
    expect(matchPortalByHref(portals, '/x/crm/')?.uid).toBe('a');
    expect(matchPortalByHref(portals, '/x/crm?from=list')?.uid).toBe('a');
    expect(matchPortalByHref(portals, '/apps/demo/x/crm')?.uid).toBe('a');
  });

  it('does not match a no-code portal or a longer name that merely ends the same', () => {
    expect(matchPortalByHref(portals, '/v/admin')).toBeUndefined();
    expect(matchPortalByHref(portals, '/x/mysc')).toBeUndefined();
    expect(matchPortalByHref(portals, '')).toBeUndefined();
  });
});
