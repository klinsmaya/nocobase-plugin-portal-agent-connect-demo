import { CodeOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AgentPromptModal } from './AgentPromptModal';
import { getAppScopeFromPathname } from '../shared/agentPrompt';
import { matchPortalByHref, type PortalRecord } from './promptSettings';

const CARD_SELECTOR = '.nb-portal-card';
const MOUNT_CLASS = 'nb-agent-connect-mount';
const ACTION_CLASS = 'nb-agent-connect-action';
const INJECTED_FLAG = 'nbAgentConnect';

/**
 * Hidden until the card is hovered, but always holding its slot, so nothing on
 * the card moves the moment the pointer arrives.
 */
const CARD_ACTION_CSS = `
.${MOUNT_CLASS} {
  display: inline-flex;
  flex-shrink: 0;
}
.${ACTION_CLASS} {
  opacity: 0;
  transition: opacity 0.15s;
}
.${ACTION_CLASS}[disabled] {
  pointer-events: none;
}
${CARD_SELECTOR}:hover .${ACTION_CLASS},
.${ACTION_CLASS}:focus-visible,
.${ACTION_CLASS}.is-open {
  opacity: 1;
}
`;

type MountPoint = {
  el: HTMLElement;
  href: string;
};

type ApiLike = {
  request: (options: { url: string }) => Promise<any>;
  resource: (name: string) => { list: (params: Record<string, unknown>) => Promise<any> };
};

/**
 * Put a mount point at the end of the address line of every portal card.
 *
 * The portal manager belongs to another plugin and offers no slot, so the
 * button is hung onto the card from outside. Only an empty `<span>` is inserted
 * here; the button itself is rendered into it through a React portal, which
 * keeps it inside this plugin's tree - it gets the theme, and its clicks never
 * reach the card's own click handler.
 *
 * The address line rather than the action corner: the title sits on its own
 * line above and the switch and the "more" button keep their places, so nothing
 * gets squeezed. The line has free space to the right of a short route path.
 *
 * @param {MountPoint[]} current mount points already created
 * @returns {MountPoint[]} mount points after the scan, or the same array when nothing changed
 */
function scanCards(current: MountPoint[]): MountPoint[] {
  const alive = current.filter((item) => item.el.isConnected);
  let changed = alive.length !== current.length;
  const next = [...alive];

  document.querySelectorAll<HTMLElement>(CARD_SELECTOR).forEach((card) => {
    if (card.dataset[INJECTED_FLAG] === '1') {
      return;
    }
    const link = card.querySelector<HTMLAnchorElement>('a[href*="/x/"]');
    if (!link?.parentElement) {
      return;
    }
    const mount = document.createElement('span');
    mount.className = MOUNT_CLASS;
    link.parentElement.appendChild(mount);
    card.dataset[INJECTED_FLAG] = '1';
    next.push({ el: mount, href: link.getAttribute('href') || '' });
    changed = true;
  });

  return changed ? next : current;
}

export type PortalCardAgentActionProps = {
  api: ApiLike;
  t: (key: string) => string;
  children?: React.ReactNode;
};

export function PortalCardAgentAction(props: PortalCardAgentActionProps) {
  const { api, t, children } = props;
  const [mounts, setMounts] = useState<MountPoint[]>([]);
  const [portals, setPortals] = useState<PortalRecord[]>([]);
  const [publicBaseUrl, setPublicBaseUrl] = useState('');
  const [openPortal, setOpenPortal] = useState<PortalRecord | null>(null);

  // Watching the document is the only way in: the cards are rendered by another
  // plugin, on a route this one does not own.
  useEffect(() => {
    let frame = 0;
    const schedule = () => {
      if (frame) {
        return;
      }
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        setMounts((current) => scanCards(current));
      });
    };

    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  // Portal records are only needed once a card is actually on screen, which is
  // also the point where the settings app is known to be on that page.
  useEffect(() => {
    if (!mounts.length || portals.length) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [config, list] = await Promise.all([
          api.request({ url: 'portalAgentConnect:getConfig' }).catch(() => null),
          api.resource('multiPortals').list({ pageSize: 200, sort: ['createdAt'] }),
        ]);
        if (cancelled) {
          return;
        }
        setPublicBaseUrl(config?.data?.data?.publicBaseUrl || '');
        setPortals((list?.data?.data || []).filter((record: PortalRecord) => record.portalType === 'ai'));
      } catch (error) {
        console.error('[NocoBase] Failed to load portals for the coding agent action.', error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api, mounts.length, portals.length]);

  const appScope = useMemo(() => getAppScopeFromPathname(window.location.pathname), []);
  const detectedBaseUrl = publicBaseUrl || window.location.origin;
  const openFor = useCallback((portal: PortalRecord) => setOpenPortal(portal), []);

  return (
    <>
      {children}
      <style>{CARD_ACTION_CSS}</style>
      {mounts.map((mount) => {
        const portal = matchPortalByHref(portals, mount.href);
        // No match means a no-code portal, or the records have not arrived yet.
        if (!portal) {
          return null;
        }
        return createPortal(
          // Icon only: the address line of a 300px card has no room for a
          // label, and a labelled button pushed the address out of the card
          // entirely. The tooltip carries the wording instead.
          <Tooltip title={t('Connect coding agent')}>
            <Button
              className={`${ACTION_CLASS}${openPortal?.uid === portal.uid ? ' is-open' : ''}`}
              aria-label={t('Connect coding agent')}
              type="text"
              size="small"
              icon={<CodeOutlined />}
              onClick={() => openFor(portal)}
            />
          </Tooltip>,
          mount.el,
          portal.uid,
        );
      })}
      <AgentPromptModal
        portal={openPortal}
        detectedBaseUrl={detectedBaseUrl}
        fromEnvironment={!!publicBaseUrl}
        appScope={appScope}
        open={!!openPortal}
        onClose={() => setOpenPortal(null)}
        t={t}
      />
    </>
  );
}

export default PortalCardAgentAction;
