export const BASE_URL_STORAGE_KEY = 'nb-portal-agent-connect:base-url';
export const ENV_NAME_STORAGE_KEY = 'nb-portal-agent-connect:env-name';
export const DEFAULT_ENV_NAME = 'mydemo';

export type PortalRecord = {
  uid: string;
  title?: string;
  portalName?: string;
  routePath?: string;
  portalType?: string;
  enabled?: boolean;
};

export function readStored(key: string) {
  try {
    return window.localStorage.getItem(key) || '';
  } catch {
    // Private browsing and some embedded webviews throw on localStorage; the
    // page still works, it just forgets the value between visits.
    return '';
  }
}

export function writeStored(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Same as above - remembering is a convenience, not a requirement.
  }
}

/**
 * Find the portal a card on the portal manager page stands for.
 *
 * The card shows the address the portal answers at (`/x/crm`), which is the only
 * thing on it guaranteed to be unique - two portals may well carry the same
 * title. Matching on the tail of that address ties the DOM node back to the
 * record without the card having to hand out an id.
 *
 * @param {PortalRecord[]} portals known portals
 * @param {string} href address read off the card
 * @returns {PortalRecord | undefined} matching portal
 */
export function matchPortalByHref(portals: PortalRecord[], href: string): PortalRecord | undefined {
  const normalized = (href || '').split('?')[0].replace(/\/+$/, '');
  if (!normalized) {
    return undefined;
  }
  return portals.find((portal) => {
    const routePath = (portal.routePath || '').replace(/\/+$/, '');
    if (!routePath) {
      return false;
    }
    const suffix = `/x${routePath.startsWith('/') ? routePath : `/${routePath}`}`;
    return normalized === suffix || normalized.endsWith(suffix);
  });
}
